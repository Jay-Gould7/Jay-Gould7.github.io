---
title: '一条链、两个空间：Conflux Core + eSpace 双空间 DApp 全栈实战'
description: '用Conflux双空间架构搭建AI反馈赏金系统本文以InsightMesh（一个AI原生的链上反馈赏金平台）为实战案例，完整拆解如何在同一个DApp中同时使用ConfluxCoreSpace和eSpace，实现Gas代付提交+ERC-20代币结算的跨空间协作'
pubDate: '04 19 2026'
heroImage: '../../assets/InsightMesh.png'
---

# 用 Conflux 双空间架构搭建 AI 反馈赏金系统

> 本文以 InsightMesh（一个 AI 原生的链上反馈赏金平台）为实战案例，完整拆解如何在同一个 DApp 中同时使用 Conflux Core Space 和 eSpace，实现 Gas 代付提交 + ERC-20 代币结算的跨空间协作架构。

## 一、为什么需要双空间？

Conflux 网络有两个可用的执行空间：

| 空间 | 特点 | 适合做什么 |
|------|------|-----------|
| **Core Space** | 原生 Conflux 地址（cfx 开头）、支持内置合约（如 SponsorWhitelistControl）、Gas Sponsorship 机制 | 高频交互、需要代付 gas 的场景 |
| **eSpace** | 完全兼容 EVM、标准 EIP-1559 交易、支持标准 ERC-20 | 代币结算、DeFi 交互、与 MetaMask 等主流钱包集成 |

大部分开发者只选一个空间。但实际上，双空间协作可以让你同时享受两边的优势。

InsightMesh 的核心需求可以拆成两类：

1. **高频、低价值的交互**（用户填问卷提交反馈）—— 这类操作应该对用户完全免费，Gas Sponsorship 是最自然的选择，所以放在 Core Space。
2. **低频、高价值的结算**（创建者存入奖池、最终奖励发放）—— 这类操作涉及 ERC-20 代币（USDT0）转账，放在 eSpace 可以直接利用标准 EVM 工具链（viem、ethers）和主流钱包（MetaMask）。

## 二、整体架构


![Gemini_Generated_Image_mp27o1mp27o1mp27.png](https://img.learnblockchain.cn/attachments/2026/04/LHMh57zo69e3bb41d64cc.png)

**关键设计决策：**

- Core 上的 `BountyRegistry` 管理赏金的完整生命周期状态（`ACTIVE → ANALYZING → READY_TO_SETTLE → SETTLED`）
- Core 上的 `SubmissionRegistry` 负责接收用户代付提交，记录 `contentHash` 和 `payoutAddress`
- eSpace 上的 `RewardVault` 只关心两件事：存钱（`deposit`）和发钱（`distribute`）
- AI 分析、Anti-Sybil 过滤都在链下完成，结果通过冻结快照的方式最终落到链上结算

## 三、Core Space 合约实现

### 3.1 BountyRegistry：赏金状态机

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "../interfaces/IBountyRegistry.sol";

contract BountyRegistry is IBountyRegistry {
    struct Bounty {
        address creator;
        string title;
        string metadataHash;
        uint256 rewardAmount;
        uint256 deadline;
        uint256 submissionCount;
        BountyStatus status;
    }

    mapping(uint256 => Bounty) public bounties;
    uint256 public nextBountyId;
    address public owner;
    address public submissionRegistry;
```

状态枚举定义在接口中：

```solidity
interface IBountyRegistry {
    enum BountyStatus {
        PENDING_FUNDING,
        ACTIVE,
        ANALYZING,
        READY_TO_SETTLE,
        SETTLED,
        CANCELLED
    }
    function getSubmissionRules(uint256 bountyId) external view returns (uint256 deadline, BountyStatus status);
    function incrementSubmissionCount(uint256 bountyId) external;
}
```

`createBounty` 由创建者通过 Fluent 钱包直接调用：

```solidity
function createBounty(
    string calldata title,
    string calldata metadataHash,
    uint256 rewardAmount,
    uint256 deadline
) external returns (uint256 bountyId) {
    require(bytes(title).length > 0, "title required");
    require(bytes(metadataHash).length > 0, "metadata required");
    require(rewardAmount > 0, "reward required");
    require(deadline > block.timestamp, "deadline in past");

    bountyId = nextBountyId++;
    bounties[bountyId] = Bounty({
        creator: msg.sender,
        title: title,
        metadataHash: metadataHash,
        rewardAmount: rewardAmount,
        deadline: deadline,
        submissionCount: 0,
        status: BountyStatus.ACTIVE
    });

    emit BountyCreated(bountyId, msg.sender, rewardAmount, deadline);
}
```

`updateStatus` 用于后续的状态流转（锁定、冻结、结算），由 owner 或创建者调用：

```solidity
function updateStatus(uint256 bountyId, BountyStatus status) external onlyOwnerOrCreator(bountyId) {
    Bounty storage bounty = bounties[bountyId];
    require(bounty.creator != address(0), "unknown bounty");
    bounty.status = status;
    emit BountyStatusChanged(bountyId, status);
}
```

### 3.2 SubmissionRegistry：Gas 代付提交

这是整个系统中最能体现 Conflux Core Space 价值的合约：

```solidity
contract SubmissionRegistry {
    struct Submission {
        address submitter;
        address payoutAddress;
        bytes32 contentHash;
        uint256 timestamp;
        uint256 supportCount;
    }

    IBountyRegistry public immutable bountyRegistry;
    mapping(uint256 => mapping(uint256 => Submission)) public submissions;
    mapping(uint256 => mapping(address => bool)) public hasSubmitted;
```

`submit` 函数做了几层校验：

```solidity
function submit(uint256 bountyId, bytes32 contentHash, address payoutAddress) external {
    (uint256 deadline, IBountyRegistry.BountyStatus status) = bountyRegistry.getSubmissionRules(bountyId);
    require(block.timestamp <= deadline, "deadline passed");
    require(status == IBountyRegistry.BountyStatus.ACTIVE, "bounty inactive");
    require(!hasSubmitted[bountyId][msg.sender], "already submitted");
    require(payoutAddress != address(0), "invalid payout");

    uint256 submissionId = submissionCounts[bountyId];
    submissions[bountyId][submissionId] = Submission({
        submitter: msg.sender,
        payoutAddress: payoutAddress,
        contentHash: contentHash,
        timestamp: block.timestamp,
        supportCount: 0
    });
    hasSubmitted[bountyId][msg.sender] = true;
    submissionCounts[bountyId] = submissionId + 1;
    bountyRegistry.incrementSubmissionCount(bountyId);

    emit SubmissionRecorded(bountyId, submissionId, msg.sender, payoutAddress, contentHash);
}
```

**要点拆解：**

- `contentHash`：前端将问卷答案序列化后做 keccak256 哈希，只把哈希上链（省 gas、保隐私），原始内容存在链下数据库
- `payoutAddress`：用户填写的 eSpace 收款地址，直接写进 Core 链上记录，结算时在 eSpace 上用
- `hasSubmitted` 映射：每个 Core 地址对每个 bounty 只能提交一次（链上级别防重复）
- `bountyRegistry.incrementSubmissionCount`：跨合约调用更新 BountyRegistry 的提交计数

### 3.3 Gas Sponsorship 配置

Conflux Core Space 特有的代付机制，通过内置合约 `SponsorWhitelistControl` 配置。我们的配置脚本：

```javascript
import { Conflux } from "js-conflux-sdk";

const cfx = new Conflux({ url: rpcUrl, networkId });
const account = cfx.wallet.addPrivateKey(privateKey);
const sponsor = cfx.InternalContract("SponsorWhitelistControl");

// 1. 将零地址加入白名单 → 表示允许所有地址享受代付
await sponsor.addPrivilegeByAdmin(contractAddress, [
  "0x0000000000000000000000000000000000000000"
]).sendTransaction({ from: account.address }).executed();

// 2. 设置 Gas 代付：指定单笔上限和总额度
await sponsor.setSponsorForGas(contractAddress, upperBound)
  .sendTransaction({ from: account.address, value: gasValue }).executed();

// 3. 设置存储押金代付
await sponsor.setSponsorForCollateral(contractAddress)
  .sendTransaction({ from: account.address, value: collateralValue }).executed();
```

**三步说明：**

1. `addPrivilegeByAdmin`：将零地址（`0x000...000`）加入白名单，这是 Conflux 的约定 —— 当白名单包含零地址时，表示**所有调用者**都可以享受代付，不再需要逐个添加
2. `setSponsorForGas`：存入 Gas 代付资金池，同时设定每笔交易的 Gas 消耗上限（`upperBound`），防止单笔交易消耗过大
3. `setSponsorForCollateral`：存入存储抵押代付资金池。在 Conflux Core Space 中，合约写入存储需要抵押 CFX，这部分也可以由赞助方代付

**注意事项：** `gasValue` 必须 ≥ `upperBound × 1000`，这是 Conflux 协议层面的硬约束。如果不满足，交易会回滚。

## 四、eSpace 合约实现

### 4.1 RewardVault：奖池存入与发放

```solidity
contract RewardVault {
    IERC20 public immutable usdt0;
    address public immutable admin;

    mapping(uint256 => uint256) public depositedAmount;
    mapping(uint256 => bool) public settled;
```

创建者通过 eSpace 钱包存入 USDT0：

```solidity
function deposit(uint256 bountyId, uint256 amount) external {
    require(!settled[bountyId], "already settled");
    require(amount > 0, "amount required");
    depositedAmount[bountyId] += amount;
    require(usdt0.transferFrom(msg.sender, address(this), amount), "transfer failed");
    emit RewardDeposited(bountyId, msg.sender, amount);
}
```

结算时由后端 Relayer（admin）执行批量发放：

```solidity
function distribute(
    uint256 bountyId,
    address[] calldata recipients,
    uint256[] calldata amounts
) external onlyAdmin {
    require(!settled[bountyId], "already settled");
    require(recipients.length == amounts.length, "length mismatch");
    require(recipients.length > 0, "empty distribution");

    uint256 total;
    for (uint256 i = 0; i < amounts.length; i++) {
        total += amounts[i];
    }
    require(total <= depositedAmount[bountyId], "insufficient funding");

    settled[bountyId] = true;
    for (uint256 i = 0; i < recipients.length; i++) {
        require(usdt0.transfer(recipients[i], amounts[i]), "payout failed");
        emit RewardDistributed(bountyId, recipients[i], amounts[i]);
    }
}
```

**设计亮点：**

- `settled` 映射防止同一个 bounty 被重复结算
- 先计算总额、校验不超过已存金额，再执行逐笔转账
- 每笔转账独立 emit 事件，方便链上审计

## 五、前端双钱包集成

这可能是整个项目中最"非常规"的部分 —— 你需要在同一个页面里同时对接两个不同体系的钱包。

### 5.1 Core Space：通过 Fluent 钱包发送交易

Fluent 钱包在浏览器中注入 `window.conflux` 对象，我们通过它与 Core Space 交互：

```typescript
// 获取 Fluent 注入的 provider
function getConfluxProvider() {
  const provider = (window as Window & { conflux?: ConfluxProvider }).conflux;
  if (!provider?.request) {
    throw new Error("No Fluent wallet was found in the browser.");
  }
  return provider;
}
```

发送 Core 交易需要手动构建完整的交易对象（不像 EVM 那样有 walletClient 封装），包括 `epochHeight`、`storageLimit` 等 Conflux 特有字段：

```typescript
async function buildCoreTransaction(input: BrowserCoreInput) {
  const [status, gasPrice, nonce, epochHeight] = await Promise.all([
    callCoreRpc<RawCoreStatus>(input.rpcUrl, "cfx_getStatus"),
    callCoreRpc<string>(input.rpcUrl, "cfx_gasPrice"),
    callCoreRpc<string>(input.rpcUrl, "cfx_getNextNonce", [input.from]),
    callCoreRpc<string>(input.rpcUrl, "cfx_epochNumber"),
  ]);

  const estimate = await callCoreRpc<RawCoreEstimate>(
    input.rpcUrl, "cfx_estimateGasAndCollateral",
    [{ from: input.from, to: input.to, data: input.data }]
  );

  return {
    from: input.from,
    to: input.to,
    data: input.data,
    value: "0x0",
    gas: estimate.gasLimit,
    storageLimit: estimate.storageCollateralized,
    gasPrice,
    nonce,
    epochHeight,
    chainId: bigintToRpcHex(rpcValueToBigInt(status.chainId)),
  };
}
```

然后通过 Fluent 的 `cfx_sendTransaction` 发送：

```typescript
const tx = await buildCoreTransaction(input);
const hash = await provider.request({
  method: "cfx_sendTransaction",
  params: [tx],
});
```

ABI 编码使用 ethers 的 `Interface`：

```typescript
const bountyInterface = new Interface(bountyRegistryAbi);

// 编码 createBounty 调用数据
const data = bountyInterface.encodeFunctionData("createBounty", [
  input.title,
  input.metadataHash,
  parseUnits(input.rewardAmount, input.core.rewardDecimals),
  BigInt(Math.floor(input.deadline.getTime() / 1000)),
]);
```

### 5.2 eSpace：通过注入式 EVM 钱包发送交易

eSpace 侧使用 `viem` 对接 MetaMask 等标准 EVM 钱包：

```typescript
import { createPublicClient, createWalletClient, custom, parseUnits } from "viem";

export async function approveAndDepositRewardPool(input: BrowserFundingInput) {
  const provider = getEthereumProvider();
  // 自动检查并切换到 eSpace Testnet
  await ensureESpaceChain(provider, input.funding.chainId, input.funding.rpcUrl);

  const chain = createChainConfig(input.funding.chainId, input.funding.rpcUrl);
  const walletClient = createWalletClient({ account, chain, transport: custom(provider) });
  const publicClient = createPublicClient({ chain, transport: custom(provider) });
  const amount = parseUnits(input.rewardAmount, input.funding.decimals);

  // Step 1: approve USDT0 给 RewardVault
  const approveTxHash = await walletClient.writeContract({
    address: input.funding.usdt0Address as Address,
    abi: erc20Abi,
    functionName: "approve",
    args: [input.funding.rewardVaultAddress as Address, amount],
  });
  await publicClient.waitForTransactionReceipt({ hash: approveTxHash });

  // Step 2: deposit 到 RewardVault
  const depositTxHash = await walletClient.writeContract({
    address: input.funding.rewardVaultAddress as Address,
    abi: rewardVaultAbi,
    functionName: "deposit",
    args: [BigInt(input.bountyId), amount],
  });
  await publicClient.waitForTransactionReceipt({ hash: depositTxHash });

  return { approveTxHash, depositTxHash };
}
```

**`ensureESpaceChain` 的实现细节：**

```typescript
async function ensureESpaceChain(provider: EIP1193Provider, chainId: number, rpcUrl: string) {
  const targetChainId = `0x${chainId.toString(16)}`;
  const currentChainId = await provider.request({ method: "eth_chainId" });

  if (currentChainId === targetChainId) return;

  try {
    // 尝试切换
    await provider.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: targetChainId }],
    });
  } catch {
    // 如果网络不存在，自动添加
    await provider.request({
      method: "wallet_addEthereumChain",
      params: [{ chainId: targetChainId, chainName: "Conflux eSpace Testnet", ... }],
    });
  }
}
```

这段代码确保用户在操作前自动切到正确的 eSpace 网络。如果 MetaMask 里没有添加过 Conflux eSpace Testnet，会自动弹窗让用户添加。

## 六、AI Anti-Sybil 结算引擎

结算引擎是连接 AI 分析和链上结算的核心桥梁。完整的过滤和评分流程如下：

```
用户提交
  │
  ▼
1. 内容去重（normalizeText 后比对）
  │
  ▼
2. Gemini AI 评估（质量评分 1-5 + isBotFarm 标记 + 聚类分配）
  │
  ▼
3. 钱包资格校验
   ├── 重复 payoutAddress → 只保留最早的提交
   ├── 无效地址格式 → 直接淘汰
   └── eSpace nonce == 0（新地址）→ 标记为不合格
  │
  ▼
4. Bot Farm 处理
   ├── AI 标记 isBotFarm + 创建者手动排除 → 直接淘汰
   └── AI 标记 isBotFarm 但未被手动排除 → 质量分 ×0.25 + 禁用发现/共识奖励
  │
  ▼
5. 聚类叙述生成（Gemini 二次调用）
  │
  ▼
6. 最终评分 + 奖励分配
```

AI 评估的 System Prompt：

```typescript
const GEMINI_SYSTEM_INSTRUCTION = `
You are the anti-Sybil settlement evaluator for a Web3 bounty system.
You will receive a bounty title, prompt, and a list of submissions.

Return a top-level JSON array.
Each object in the array must include:
- submissionId: number
- qualityRating: integer from 1 to 5
- isBotFarm: boolean
- clusterId: short kebab-case string grouping similar ideas

Mark isBotFarm=true when the submission looks like mass-generated spam,
templated farming, meaningless filler, obvious copy-paste abuse,
or low-signal synthetic content.
`;
```

钱包资格校验通过 eSpace RPC 检查 nonce：

```typescript
async function checkWalletEligibility(submissions: NormalizedSubmission[]) {
  const publicClient = getESpacePublicClient();
  // ...
  let nonce = await publicClient.getTransactionCount({
    address: canonicalAddress as Address,
  });

  walletStatuses.set(key, {
    canonicalAddress,
    isEligible: nonce > 0,  // nonce 为 0 说明是全新地址，视为高风险
    reason: nonce === 0 ? "new_wallet_nonce_zero" : undefined,
  });
}
```

**Anti-Sybil 淘汰原因一览：**

| 原因 | 说明 |
|------|------|
| `duplicate_wallet_address` | 同一个 payoutAddress 出现多次，只保留最早提交 |
| `invalid_wallet_address` | 地址格式不合法 |
| `new_wallet_nonce_zero` | eSpace 上 nonce 为 0 的全新地址 |
| `bot_farm` | AI 标记为机器人刷量内容 |
| `creator_manual_block` | 创建者在冻结快照前手动排除 |

## 七、双空间开发的踩坑与心得

### 7.1 双钱包 UX 挑战

用户需要同时连接 Fluent（Core）和 MetaMask（eSpace），这两个钱包各自独立，互不感知。在实际开发中遇到的问题：

- **网络切换冲突：** Fluent 同时支持 Core 和 eSpace 模式。如果用户在 Fluent 里切到了 eSpace 模式，然后又尝试发 Core 交易，会收到 `Method cfx_getStatus not supported by network` 错误。我们通过 `ensureCoreNetwork` 在发交易前主动检测。
- **地址体系不同：** Core 地址是 `cfxtest:` 前缀的 Base32 格式，eSpace 地址是标准的 `0x` 前缀。用户在填写 payoutAddress 时经常搞混。前端需要做格式校验和明确的 UI 提示。

### 7.2 Gas Sponsorship 的运维成本

Gas 代付不是"设置一次就完事"的功能。赞助资金有余额，一旦余额不足，用户提交会突然从"免费"变成"要自己付 gas"，体验会断崖式下降。

**建议：** 对于生产环境，应该建立赞助余额监控和自动补充机制。

### 7.3 跨空间同步

目前的 MVP 设计中，Core 和 eSpace 之间的状态同步通过后端 Relayer 完成（而非原生的 `CrossSpaceCall`）。这是一个有意识的 trade-off：

- **优势：** 实现简单，开发速度快
- **代价：** 用户需要信任后端 Relayer 会诚实地执行结算

未来可以通过 Conflux 原生的 `CrossSpaceCall` 实现完全去信任的跨空间调用。

### 7.4 ABI 编码的复用

Conflux Core Space 的合约 ABI 和 EVM 的完全一样（都是 Solidity 编译出来的）。所以你可以用 ethers 的 `Interface.encodeFunctionData` 来编码 Core 交易的 calldata，再通过 Fluent 的 `cfx_sendTransaction` 发出去。这意味着一套 ABI 定义可以同时服务 Core 和 eSpace 的前端交互。

## 八、总结

InsightMesh 的双空间架构可以概括为一句话：**让 Core 做交互、让 eSpace 做交易**。

| 维度 | Core Space | eSpace |
|------|-----------|--------|
| 合约 | BountyRegistry + SubmissionRegistry | RewardVault |
| 钱包 | Fluent | MetaMask 等注入式钱包 |
| Gas | 代付（参与者 0 成本） | 用户自付（创建者承担） |
| 数据 | 赏金状态、提交证明 | USDT0 存入和发放 |

这种分工让每个空间都做了它最擅长的事。如果你正在 Conflux 上开发需要同时处理"频繁用户交互"和"代币结算"的 DApp，这种双空间模式值得参考。

**项目地址：** [GitHub - InsightMesh](https://github.com/Jay-Gould7/InsightMesh)

---

*作者：Jay Gould，区块链方向大三在校生。InsightMesh 是为 Conflux Global Hackfest 2026 开发的参赛项目。*
