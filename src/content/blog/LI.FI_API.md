---
title: '当你调用一行 LI.FI API 时，你到底信任了谁？—— 跨链交易设计与模式深度解析'
description: '当你调用一行 LI.FI API 完成跨链时，你其实已经在不知情的情况下，把资产的安全交给了多个不同的信任模型。跨链交易设计与模式深度解析从原理、流程到信任模型，全面剖析主流跨链技术方案。'
pubDate: '04 24 2026'
heroImage: '../../assets/LIFIAPI.png'
---
> 从原理、流程到信任模型，全面剖析主流跨链技术方案

---

## 引言


你可能只写过这样一行代码：

```
const quote = await getQuote()
```

通过 LI.FI，一笔跨链交易就完成了。

但问题是——**这一行 API，实际上帮你做了什么决策？**

它可能调用的是：

* 多签桥
* 锁铸桥
* 流动性桥

👉 也就是说，你在不知情的情况下，把资产安全交给了完全不同的信任模型。


跨链不是简单的"把钱从 A 搬到 B"。两条独立的链没有共享状态，无法原子地协调——这才是问题的本质。

之前在研究 [LI.FI](https://li.fi) 的跨链聚合器 API 时，我发现调用一行 API 就能完成跨链转账——但这背后到底发生了什么？最近翻出课堂上关于跨链交易的课件，结合自己的实践经验，决定系统梳理一下。**作为开发者，如果你不理解跨链背后的信任模型，你就无法知道你的产品到底承担了什么风险。**

<!--EndFragment-->
** 这篇文章正是由此引发的系统性思考。

本文将从核心挑战出发，深入解析四种主流跨链模式 + 聚合器模式的原理、交易流程、数据结构与信任模型，最后给出我个人的趋势判断和开发者选型决策树。


---
## TL;DR

- **HTLC：** 最安全，但速度慢，只适合简单原子交换
- **轻节点验证：** 最理想的去中心化方案，但实现难、验证贵
- **多签 / MPC：** 最容易落地、速度快，但核心风险在节点与私钥管理
- **锁铸模式：** 最主流、最通用，但风险集中在验证逻辑与铸造权限
- **聚合器：** 最适合 DApp 快速集成，但它优化的是路由，不是底层安全

## 一、跨链交易核心挑战

跨链交易的设计需要同时满足四个核心目标：**安全、原子、互通、终局**。

### 1. 原子性 (Atomicity)

交易必须是原子的——要么双方都成功完成，要么都回滚到初始状态，杜绝单边到账风险。这是跨链交易与普通转账的根本区别：涉及两条独立的链，任何一方的失败都不应导致另一方资产的损失。

### 2. 安全性 (Security)

确保资产在跨链过程中不丢失、不被盗、不被双花。这是跨链技术最基本的底线要求。历史上多次跨链桥被攻击事件都警示我们：安全性是不可妥协的。

### 3. 互操作性 (Interoperability)

支持不同类型的区块链（公链、联盟链、异构链）之间进行无缝的资产和数据互通。理想的跨链方案应具备通用性，而非仅服务于同构链之间的通信。

### 4. 最终性 (Finality)

交易一旦完成确认，结果必须是不可逆转的，不能被随意回滚或篡改，保证确定性。不同链的最终性机制（概率最终性 vs 即时最终性）是跨链设计中必须考虑的关键因素。

---

## 二、主流跨链模式详解

### 模式一：哈希时间锁定合约 (HTLC)
>最纯粹、最安全，但不适合复杂跨链业务。
#### 核心原理：哈希与时间双重锁定

交易双方约定哈希值与超时时间（事先约定交互资产）。一方锁定资产后，另一方需在时限内提供原始密钥 (Secret) 才能解锁；若超时未解锁，资产将自动退回锁定方，确保交易原子性。

> "HTLC 的本质只有一句话：不相信任何人，只相信密码学。"

#### HTLC 交易流程

```
两人约定 --> 锁钱进合约 + 设超时 --> 不公布密钥谁都取不了 --> 公布密钥后，时间内两边都能取钱
```


![HTLC 交易流程.png](https://img.learnblockchain.cn/attachments/2026/04/VpZKcUWw69eb36b9ca878.png)
1. **发起交易** —— 约定秘密值 s，计算哈希 H(s)，设置超时
2. **Alice 锁定资产** —— 链 A 创建 HTLC，存入资产，解锁需 s，超时 T1
3. **Bob 锁定资产** —— 链 B 创建 HTLC，存入资产，解锁需 s，超时 T2（T2 < T1）
4. **提供密钥 s** —— Alice 在链 B 超时前提供 s，解锁 Bob 的资产
5. **解锁资产** —— Bob 获取 s 后，在链 A 超时前解锁 Alice 资产
6. **交易完成** —— 双方成功获得对方资产，交易原子性完成


#### 数据结构与信任模型

**核心数据结构机制：**

- **哈希锁 (Hash Lock)：** 利用 Hash(secret) 锁定资产，只有提供正确的 secret 才能解锁
- **时间锁 (Time Lock)：** 设置 lockTime 阈值，超时后资产自动退回原账户
- **双向触发条件：** 解锁（提供 Secret）或退款（超时未提供）

**去中心化信任模型：**

无需依赖第三方中介，交易双方直接交互。信任基础建立在不可篡改的**密码学算法**与链上智能合约的自动执行之上。

**优缺点分析：**

| 维度 | 说明 |
|------|------|
| 优点 | 资产始终在用户地址，无托管风险；纯链上逻辑执行，安全性极高，难以被外部攻击 |
| 缺点 | 用户体验受限于时间锁机制，等待期较长；仅支持简单原子交换，难以承载复杂业务逻辑 |

**核心价值：以牺牲部分效率为代价，换取了极致的安全性和去中介化的信任机制。**

**安全启示：** HTLC 是所有跨链模式中被攻击案例最少的，因为它从设计上就消除了第三方信任。但这并非没有风险——2020 年研究者发现，在比特币-以太坊的原子交换中，由于两条链的出块速度差异，存在"免费期权"问题 (Free Option Problem)：一方可以在 timelock 窗口内观察市场波动，选择性地完成或放弃交易。这不是资产安全问题，但破坏了交易的公平性。

**典型应用场景：**

- **闪电网络 (Lightning Network)：** 比特币二层扩容方案，实现秒级微支付
- **原子交换 (Atomic Swap)：** 不同链间资产的无需信任直接交换

---

### 模式二：中继/轻节点验证模式
>理论上最理想的去中心化方案，但实现难、验证贵。
#### 核心原理

在目标链部署轻节点合约，用于验证源链区块头和交易的默克尔证明。中继节点监听源链交易，收集证明并提交至目标链合约验证，通过后目标链执行相应操作。

**机制优势：** 无需信任第三方中介，通过密码学默克尔证明验证区块头与交易真实性，实现高度去中心化的跨链互信。

#### 中继/轻节点模式流程

```
源链交易 --> 中继监听 --> 提交证明 --> 目标链验证 --> 执行交易
```

![Gemini_Generated_Image_mjyexjmjyexjmjye.png](https://img.learnblockchain.cn/attachments/2026/04/nOQZQ3Pc69eb3d4fc4150.png)

1. **源链交易** —— 用户在源链 A 上发起一笔锁定或销毁资产的交易
2. **中继监听** —— 中继节点持续监听源链事件，获取交易的默克尔证明和区块头信息
3. **提交证明** —— 中继节点将区块头和默克尔证明提交给目标链 B 上的轻节点合约
4. **目标链验证** —— 轻节点合约验证区块头的有效性及默克尔证明的正确性
5. **执行交易** —— 验证通过后，合约执行相应操作，如铸造映射资产或解锁资产

#### 数据结构与信任模型

**核心数据结构：**

- **区块头 (Block Header)：** 包含 blockHash、prevHash、stateRoot，用于验证区块有效性
- **默克尔证明 (Merkle Proof)：** 通过 merkleProof 证明某笔交易确实包含在特定区块中
- **交易证明 (Transaction Proof)：** txProof + receiptProof，提供交易存在和执行结果的双重证明

**信任模型与特性分析：**

- **双重信任基石：** 1) 信任密码学验证（无需信任中心化机构）2) 信任源链共识机制的安全性
- **核心优势：** 高度去中心化与安全，支持异构链跨链，灵活性强
- **面临挑战：** 智能合约开发复杂，链上验证消耗 Gas 成本较高

**适用于对安全性要求极高、愿意承担一定成本的跨链场景，是最理想的去中心化跨链方案之一。**

**真实案例 - BNB Bridge 攻击 (2022.10, 损失 5.66 亿美元)：** 攻击者利用 BNB Beacon Chain 上 IAVL Merkle Proof 验证逻辑的漏洞，伪造了不存在的存款证明，骗过轻节点合约验证，凭空铸造了 200 万枚 BNB。这个案例完美说明：**中继/轻节点模式的安全性天花板很高，但其实现复杂度同样很高——验证合约中的任何一个逻辑漏洞都可能导致灾难性后果。**

**代表项目：**

- Cosmos IBC (Inter-Blockchain Communication)
- 以太坊轻客户端跨链方案

---

### 模式三：多签/MPC 托管模式
>最容易落地、速度快，但核心风险在节点与私钥管理。
#### 核心原理：多方共管与映射

由一组可信节点共同管理多签地址或通过 MPC 技术控制私钥。用户将资产转入托管地址，节点验证跨链请求后，在目标链发行对应映射资产；赎回时执行反向操作。

#### 多签/MPC 托管模式流程
![Gemini_Generated_Image_35jlpx35jlpx35jl.png](https://img.learnblockchain.cn/attachments/2026/04/0plQch3869eb3e5db15d9.png)
1. **用户存入资产** —— 用户将资产发送到由多签节点控制的源链托管地址，完成初始锁定
2. **节点验证与签名** —— 多签节点监听存款事件，验证跨链请求，并按预设阈值（如 2/3）完成多方签名
3. **目标链发行资产** —— 收集足够签名后，在目标链铸造并发送对应映射资产至用户指定地址
4. **赎回资产** —— 用户销毁目标链映射资产，多签节点验证后，从源链托管地址释放原始资产

#### 数据结构与信任模型

**数据结构核心要素：**

- **多签合约阈值 (m/n)：** 例如 2/3，需至少 m 个节点签名才能执行关键操作
- **签名集合 (signatures[])：** 实时收集并验证节点签名列表，确保合法性
- **提案 (Proposal)：** 包含用户地址、金额、目标链等信息的跨链请求载体

**信任模型分析：**

- **信任节点集合：** 多签桥的本质其实很简单：你不是在跨链，而是在把资产交给一群人保管，需假设节点不会合谋作恶
- **半中心化属性：** 虽引入多节点冗余，但本质仍依赖第三方托管信任

**模式优劣势对比：**

| 维度 | 说明 |
|------|------|
| 优点 | 实现简单，速度快；支持复杂业务与多资产类型 |
| 缺点 | 存在托管风险，节点易被攻击；违背去中心化精神 |

**核心洞察：多签/MPC 模式以牺牲一定的去中心化安全性为代价，换取了高性能与易用性，适合对效率要求极高但风险可控的场景。**

**血的教训 - Ronin Bridge 攻击 (2022.3, 损失 6.25 亿美元)：** Axie Infinity 的 Ronin Bridge 采用 9 个验证节点的多签方案，阈值为 5/9。攻击者（后确认为朝鲜 Lazarus 组织）通过社会工程攻击获取了 5 个私钥（4 个属于 Sky Mavis + 1 个第三方 Axie DAO 节点），轻松达到签名阈值，直接提走了 17.36 万枚 ETH 和 2550 万 USDC。**更可怕的是：这笔盗窃发生后整整 6 天才被发现。** 这个案例是多签模式最经典的反面教材——当节点数量有限且管理不善时，多签等于没签。

**典型应用场景：**

- 中心化交易所 (CEX) 的跨链充提服务
- 部分去中心化钱包集成的跨链桥功能

---

### 模式四：锁铸模式 (Lock-Mint / Burn-Mint)
>最主流、最通用，但风险集中在验证逻辑与铸造权限。
#### 核心运作流程

用户在源链将资产**锁定 (Lock)** 或**销毁 (Burn)**，中继节点监听事件后，在目标链按 1:1 比例**铸造 (Mint)** 映射资产（如 wBTC）。赎回时则反向操作：销毁映射资产，解锁原始资产，形成闭环。

#### 锁铸模式流程

![Gemini_Generated_Image_slgy1vslgy1vslgy.png](https://img.learnblockchain.cn/attachments/2026/04/GB7JkU2I69eb3f18b6b59.png)
**跨链过程 (Lock -> Mint)：**

1. **锁定资产** —— 用户在源链调用合约锁定原始资产（如 ETH）
2. **中继监听** —— 中继节点实时捕获并验证锁定事件
3. **铸造资产** —— 在目标链触发合约，铸造等量映射资产（如 wETH）

**赎回过程 (Burn -> Unlock)：**

1. **销毁资产** —— 用户在目标链销毁映射资产（wETH）
2. **中继监听** —— 中继节点监听到销毁事件并进行共识验证
3. **解锁资产** —— 在源链解锁原始资产（ETH）并发送给用户

> 核心机制：通过中继节点的**多签验证与事件监听**，确保跨链资产的锁定与铸造、销毁与解锁严格对应，形成资产流转闭环。

#### 数据结构与信任模型

**锁铸模式数据结构：**

- **锁定事件 (Lock Event)：** 记录资产锁定的用户地址、数量、源链 ID 及目标地址，形成跨链凭证基础
- **有效性证明：** 中继节点通过提交默克尔根或多重签名，向目标链证明锁定事件的真实性
- **铸造权限 (Mint Control)：** 通过合约限制仅特定的中继节点拥有铸造映射资产的权限，防止滥发

**信任模型与特性分析：**

- **半中心化信任模型：** 依赖中继节点诚实执行，通常结合多签机制降低单点风险
- **优势：通用与高效** —— 适配性极强，支持各类资产；跨链速度快，用户体验流畅
- **风险：托管与安全** —— 存在映射资产信用风险；跨链桥合约逻辑复杂，易成攻击目标

**真实案例 - Wormhole 攻击 (2022.2, 损失 3.2 亿美元)：** Wormhole 是 Solana 和以太坊之间的主要跨链桥，采用 Lock-Mint 模式。攻击者利用 Solana 端验证合约中 `verify_signatures` 函数的漏洞，绕过了 Guardian 签名验证，直接在 Solana 上铸造了 12 万枚没有任何 ETH 抵押的 wETH。这意味着凭空创造了 3.2 亿美元的"资产"。**教训：锁铸模式中铸造权限的验证逻辑是整个系统最脆弱的环节。**

**另一个案例 - Nomad Bridge (2022.8, 损失 1.9 亿美元)：** 更为离谱——一次合约升级中错误地将 Merkle Root 初始化为 `0x00`，导致任何人都可以构造有效的证明来提取资产。一旦第一个攻击者发现漏洞，数百人开始复制交易进行"群体抢劫"。**这是 DeFi 历史上第一次"去中心化的黑客攻击"。**

**主流代表项目：**

- Polygon Bridge、Avalanche Bridge 以及大部分 Layer2 跨链桥均采用此模式

---

### 模式五：跨链聚合器模式 (Bridge Aggregation)
>最适合 DApp 快速接入，但它提升的是路由效率，不是底层安全。
> 这是在四种基础模式之上衍生的**元层模式**，也是我在研究 LI.FI API 后重点思考的方向。

#### 核心原理

跨链聚合器本身不实现跨链逻辑，而是**集成多个底层跨链桥**，通过统一的 API 接口和智能路由算法，自动为用户选择最优的跨链路径（综合考虑费用、速度、流动性深度和安全性）。

类比：如果各种跨链桥是"航空公司"，那跨链聚合器就是"携程/Skyscanner"——帮你比价、选路、一键出票。

#### 以 LI.FI 为例

[LI.FI](https://li.fi) 是典型的跨链聚合器，集成了 Stargate、Hop Protocol、Across、Connext、Celer cBridge 等数十个底层桥。当你调用 LI.FI API 发起跨链时：

```
用户请求 --> LI.FI 路由引擎 --> 评估所有可用桥 --> 选择最优路径 --> 调用底层桥执行
```

**LI.FI 的底层桥可能使用的模式：**

| 底层桥 | 采用模式 |
|--------|----------|
| Stargate | 流动性池 + 消息传递（基于 LayerZero 的中继验证） |
| Hop Protocol | Lock-Mint + 流动性池 |
| Across | 乐观验证 + 流动性池 |
| Connext | HTLC 演进版 + 流动性网络 |
| Celer cBridge | 多签/MPC + 流动性池 |

**所以通过 LI.FI API 做跨链，严格来说不属于上述四种基础模式中的任何一种，而是"聚合器模式"——它是对基础跨链模式的上层封装与智能路由。**

#### 聚合器模式的优劣势

| 维度 | 说明 |
|------|------|
| 优点 | 自动最优路由，用户无需了解底层桥差异；统一 API 降低开发集成成本；分散单一桥风险 |
| 缺点 | 你不仅要信任桥，还要信任“帮你选桥的人；路由决策的正确性依赖聚合器算法；调试复杂度增加 |

#### 安全提醒

2024 年 7 月，LI.FI 本身也遭受了一次安全事件——其合约中的 `depositToGasZipERC20` 函数因缺少适当的输入验证，导致攻击者利用任意调用漏洞提取了约 1150 万美元的用户已授权资产。**这提醒我们：即便是聚合层，也需要严格的合约安全审计。聚合器的安全性 = min(自身安全, 路由到的底层桥安全)。**

---

## 三、统一跨链消息结构

无论采用哪种跨链模式，底层的跨链消息都可以抽象为统一的数据结构：

```solidity
struct CrossChainTx {
    uint256 srcChainId;     // Source chain ID
    uint256 dstChainId;     // Destination chain ID
    address sender;         // Sender address
    address receiver;       // Receiver address
    uint256 amount;         // Transaction amount
    uint256 nonce;          // Anti-replay nonce
    uint256 deadline;       // Timeout timestamp
    bytes32 txId;           // Unique transaction ID
    bytes proof;            // Verification proof data
}
```

**结构解析与核心价值：**

- **链与账户标识：** 通过 srcChainId/dstChainId 定义交易路由，sender/receiver 确定交易方向，确保跨链消息路由准确
- **唯一性与时效性：** txId 作为全局唯一标识，结合 timestamp/nonce，有效防止消息重放攻击或过期交易
- **可验证性凭证：** proof 字段承载默克尔证明、签名数据等验证材料，是目标链验证交易合法性的关键凭证

> 这种统一结构定义了跨链交易的核心要素，不依赖于具体模式，覆盖了多类型的数据校验，连接了不同跨链模式之间消息传递的一致性、安全性与可验证性。

---

## 四、信任模型分类

从信任维度来看，所有跨链方案可归入三大信任模型：

![Gemini_Generated_Image_8aasyf8aasyf8aas.png](https://img.learnblockchain.cn/attachments/2026/04/FDALhpv069eb3fea1b5d9.png)
### 1. 密码学信任

- **风险等级：** 极低
- **代表模式：** HTLC、轻节点验证、ZK 跨链
- **信任基础：** 基于数学算法（哈希函数、默克尔证明、零知识证明）保障安全。无需信任任何第三方实体，安全性依赖于密码学假设，信任最高

### 2. 共识信任

- **风险等级：** 中等
- **代表模式：** MPC 多方计算、多签节点共识、PoA 权威节点
- **信任基础：** 依赖一组节点的共识，需要多数节点诚实。引入了对"验证者集合"的信任，无需信任任何单一实体，但需要相信节点集合不会合谋

### 3. 中心化信任

- **风险等级：** 较高
- **代表模式：** 单一机构托管、中心化跨链桥
- **信任基础：** 完全依赖于单一中心化实体的诚信和安全运营能力，存在单点故障风险

> 在跨链方案选型中，信任模型是衡量安全性与去中心化程度的核心维度。

---

## 五、总结与实战方案建议

### 跨链模式核心总结

| 模式 | 信任模型 | 安全性 | 速度 | 复杂度 | 适用场景 |
|------|---------|--------|------|--------|---------|
| HTLC | 密码学信任 | 极高 | 较慢 | 中等 | 点对点原子交换 |
| 轻节点验证 | 密码学+共识信任 | 极高 | 较慢 | 很高 | 高安全要求场景 |
| 多签/MPC | 共识信任 | 中等 | 快 | 较低 | 效率优先场景 |
| 锁铸模式 | 半中心化信任 | 中等 | 快 | 中等 | 通用跨链桥 |
| 聚合器 | 取决于底层桥 | 取决于路由 | 快 | 低(用户侧) | DApp 集成跨链 |

### 开发者选型决策树

如果你是开发者，只需要记住下面这件事：

![Gemini_Generated_Image_lbi86hlbi86hlbi8.png](https://img.learnblockchain.cn/attachments/2026/04/qn4plomP69eb4119e8378.png)
```
你需要跨链能力吗?
  |
  +-- 仅点对点资产交换，双方都是技术用户?
  |     --> HTLC / Atomic Swap（最安全，无第三方依赖）
  |
  +-- 需要为 DApp 集成跨链功能?
  |     |
  |     +-- 希望快速上线，支持多链多桥?
  |     |     --> 跨链聚合器 API（LI.FI / Socket）
  |     |
  |     +-- 对安全性要求极高，愿意投入开发成本?
  |     |     --> 轻节点验证（Cosmos IBC 模式）
  |     |
  |     +-- 需要简单快速实现，风险可控?
  |           --> 锁铸模式 / 多签桥
  |
  +-- 在搭建自己的跨链基础设施?
        |
        +-- 同构链生态（如 Cosmos SDK 链）?
        |     --> IBC 协议（轻节点验证）
        |
        +-- 异构链，追求最高安全?
        |     --> ZK 轻客户端验证（如 zkBridge）
        |
        +-- 异构链，追求速度和灵活性?
              --> 锁铸 + 多签验证节点
```

### 实战场景方案建议

- **高价值资产跨链：** 优先选择 HTLC 或轻节点验证，追求最高安全性
- **公链生态互通：** 优先选用**锁铸模式**的成熟跨链桥，适用于大多数公链生态和 Layer2 间的资产流转
- **高频安全场景：** 联盟链环境、高安全商业场景，**轻节点验证**是最佳选择
- **DApp 快速集成：** 通过 LI.FI 等**跨链聚合器** API 接入，一套代码对接多个桥，降低开发和维护成本

---

## 六、我的趋势判断


### 1. ZK + 轻客户端验证，会取代绝大多数跨链桥。


当前大部分跨链桥仍依赖多签/MPC 或乐观验证，但这是过渡方案。随着 ZK 证明生成速度的提升和成本下降，**ZK-based 轻客户端验证**将逐步取代多签成为主流——它兼具轻节点验证的安全性和可接受的成本。Succinct Labs 的 zkBridge、Polymer 等项目正在这个方向发力。

### 2. 聚合器层会越来越重要

单一桥有单点风险，聚合器通过多桥路由天然分散了这个风险。对于 DApp 开发者来说，直接对接 LI.FI/Socket 这样的聚合器，比自己集成 5 个桥要经济得多。未来的跨链体验可能对用户完全透明——就像你发微信不需要知道底层走的是 TCP 还是 UDP。

### 3. Intent-Based 跨链是下一个范式

传统跨链是"我告诉桥怎么做"，Intent-Based 是"我告诉系统我想要什么结果"。用户只需表达意图（"我想用 ETH 上的 USDC 换 Arbitrum 上的 ARB"），Solver 网络竞争性地完成执行。Across V3、UniswapX 跨链版本都在探索这个方向。这可能是跨链用户体验的终极形态。

### 4. 跨链安全审计应成为标配

看看那些触目惊心的攻击案例——**大部分不是密码学被破解，而是工程实现有 bug。** 合约升级时的初始化错误（Nomad）、验证逻辑的绕过（Wormhole）、私钥管理的松懈（Ronin）。跨链桥项目应该把安全预算提到总预算的 15-20%，而不是上线后才补审计。

---

## 七、附录：LI.FI API 跨链完整实操

以下是使用 LI.FI API 进行跨链的完整流程：

### Step 1: 获取跨链报价

```javascript
// Get cross-chain quote from LI.FI
const getQuote = async () => {
  const params = new URLSearchParams({
    fromChain: 'ETH',
    toChain: 'ARB',
    fromToken: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
    toToken: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // USDC on Arbitrum
    fromAmount: '1000000000', // 1000 USDC (6 decimals)
    fromAddress: '0xYourWalletAddress',
  });

  const response = await fetch(`https://li.quest/v1/quote?${params}`);
  const quote = await response.json();

  console.log('Selected bridge:', quote.tool);        // e.g. "stargate"
  console.log('Estimated output:', quote.estimate.toAmount);
  console.log('Estimated time:', quote.estimate.executionDuration, 'seconds');
  console.log('Gas cost:', quote.estimate.gasCosts);

  return quote;
};
```

### Step 2: 授权代币 (ERC-20 Approval)

```javascript
import { ethers } from 'ethers';

const approveToken = async (quote, signer) => {
  const approvalAddress = quote.estimate.approvalAddress;
  const tokenAddress = quote.action.fromToken.address;
  const amount = quote.action.fromAmount;

  const erc20 = new ethers.Contract(tokenAddress, [
    'function approve(address spender, uint256 amount) returns (bool)'
  ], signer);

  const tx = await erc20.approve(approvalAddress, amount);
  await tx.wait();
  console.log('Approval confirmed:', tx.hash);
};
```

### Step 3: 执行跨链交易

```javascript
const executeCrossChain = async (quote, signer) => {
  const tx = await signer.sendTransaction({
    to: quote.transactionRequest.to,
    data: quote.transactionRequest.data,
    value: quote.transactionRequest.value,
    gasLimit: quote.transactionRequest.gasLimit,
  });

  console.log('Cross-chain tx sent:', tx.hash);
  await tx.wait();
  console.log('Source chain confirmed!');

  // Track status until destination chain confirms
  let status;
  do {
    const statusResponse = await fetch(
      `https://li.quest/v1/status?txHash=${tx.hash}&bridge=${quote.tool}&fromChain=${quote.action.fromChainId}&toChain=${quote.action.toChainId}`
    );
    status = await statusResponse.json();
    console.log('Status:', status.status); // PENDING -> DONE
    await new Promise(r => setTimeout(r, 10000)); // Poll every 10s
  } while (status.status !== 'DONE' && status.status !== 'FAILED');

  return status;
};
```

### 完整调用

```javascript
const main = async () => {
  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();

  // 1. Get quote
  const quote = await getQuote();

  // 2. Approve tokens
  await approveToken(quote, signer);

  // 3. Execute cross-chain transfer
  const result = await executeCrossChain(quote, signer);
  console.log('Cross-chain transfer complete!', result);
};
```

> LI.FI 会在返回结果中告诉你它选择了哪个底层桥（如 Stargate、Hop 等），以及预估的手续费和到账时间。作为开发者，你无需关心底层桥的具体实现细节——**但你应该理解它们的信任模型，这正是本文存在的意义。**

---

## 最后

这篇文章源于我研究 LI.FI 跨链聚合器 API 时的一次思考。当调用一行 API 就完成了跨链转账时，感受到的不是"好简单"，而是"这背后到底发生了什么？如果出了问题，用户会怎样？"

带着这个问题，我从 HTLC 的密码学原语一路梳理到聚合器的路由逻辑，从信任模型的分类到真实攻击案例的复盘。最终我更确信一件事：

**跨链不是在选“最先进”的方案，而是在选“最适合自己信任边界和业务场景”的方案。**
你可以选择忽略跨链的底层实现，**但攻击者不会。** 只有理解每种模式的信任假设、风险边界和工程成本，才能在"安全 vs 效率 vs 去中心化"的不可能三角中，为产品找到真正可落地的最优解。

根据实际需求选择技术路径，并持续尊重安全边界，才是构建健康跨链生态的关键。

---

*你现在用的桥，真的值得信任吗？*
