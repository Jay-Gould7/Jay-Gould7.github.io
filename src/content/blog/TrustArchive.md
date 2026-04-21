---
title: '拒绝在链上“裸奔”：基于混合加密与 EIP-191 的隐私凭证系统实战'
description: '现存凭证难以兼顾“链上可验证”与“数据绝对隐私”。本文深度拆解 TrustArchive 协议的核心架构，解析如何通过 AES+ECIES 混合加密、Merkle Tree 批量签发与 EIP-191 签名恢复，实现数据的“加密存储，可用不可见”。并分享“双轨制数字信封”优化前端解密 UX 的实践。'
pubDate: '03 08 2026'
heroImage: '../../assets/TrustArchive.png'
---

<!--StartFragment-->
## 前言

在 Web3 时代，「数字身份」与「可验证凭证」正迅速成为基础设施层的核心命题。然而，现有大多数方案在隐私保护与链上可验证性之间难以平衡——要么凭证全文上链，隐私无从谈起；要么完全链下存储，失去了去中心化可信验证的意义。

TrustArchive 尝试给出一条新路：**将加密密文存于 IPFS，将内容寻址哈希锚定于区块链，将密钥控制权归还给用户本人。** 本文将深入拆解其核心设计与实现细节，希望对关注隐私计算、链上身份和可验证凭证赛道的开发者有所启发。

## 项目概览

**TrustArchive** 是一套隐私优先的去中心化个人数据存档与机构凭证签发协议，主要由以下模块构成：

|                             |                                |
| --------------------------- | ------------------------------ |
| **模块**                      | **功能**                         |
| **Notary（公证存证）**            | 用户加密上传文件，CID 永久锚定链上            |
| **CredentialCenter（凭证中心）**  | 机构资质管理、申请/审批流程，SBT 铸造          |
| **IssuerBatchSBT（批量签发）**    | 基于混合加密 + Merkle Tree 的隐私批量凭证签发 |
| **ArchivesRegistry（档案注册表）** | 凭证与归档文件的链上索引                   |
| **UserScoreRegistry（信用评分）** | 行为权重评分，可用于身份信誉聚合               |

* **技术栈：** Solidity（本地 Hardhat 链）+ React + Ethers.js v6 + Pinata IPFS + Web Crypto API + eth-crypto。

## 一、数据如何「真正上链」

这是许多 Web3 新手容易混淆的问题。TrustArchive 采用经典的链下存储 + 链上锚定架构。

**链上存储的内容（永久、不可篡改）：**

* IPFS CID（内容寻址哈希）
* 用户钱包地址、区块高度 / 时间戳
* 文件分类、大小等元数据（加密形式）

**IPFS 存储的内容（加密、不可读）：**

* 实际文件内容（已加密的报告文本、附件等）

以 `Notary.sol` 为例，链上写入的核心逻辑：

```
// Notary.sol — addFileRecordV2
_archiveFiles[msg.sender].push(
    ArchiveFileRecord({
        cid: _cid,           // IPFS CID 永久上链
        nameEnc: _nameEnc,   // 加密的文件名
        categoryEnc: _categoryEnc, // 加密的分类
        mime: _mime,
        size: _size,
        createdAt: _createdAt
    })
);
emit ArchiveFileRecorded(msg.sender, id, _cid, _nameEnc, _categoryEnc, _mime, _size, _createdAt);
```

**前端调用链路（`useTrustProtocol.js`）：**

```
// 1. 加密内容上传 IPFS
const cid = await encryptAndUploadWithMasterSeed(payload);

// 2. 加密元数据（文件名、分类）
const nameEnc = encryptArchiveField({ seedHex, plainText: fileName });
const categoryEnc = encryptArchiveField({ seedHex, plainText: catName });

// 3. 写入链上 → 等待确认
const tx = await contract.addFileRecordV2(cid, nameEnc, categoryEnc, mime, size, createdAt, folderId);
const receipt = await tx.wait();
// receipt.hash 即为可验证的链上交易哈希
```

每一次数据写入都会触发 `await tx.wait()`，等待链上区块确认后才返回，返回值包含 `txHash`，可在任意以太坊区块浏览器查询。

## 二、Master Seed 安全中心：用户自主密钥管理

TrustArchive 的隐私核心是 **Master Seed**——一个 256 位随机主密钥，由用户在首次使用时在本地生成，通过个人密码加密后形成「种子信封」（Seed Envelope）存储于链上（Notary 合约）。链上存储的是密文，任何人包括合约 owner 都无法读取明文。

为了平衡安全性与极速的 UX 体验，我们设计了以下**双轨制存取工作流**：

![image.png](https://img.learnblockchain.cn/attachments/2026/04/dZwa9dKh69e745be6cc82.png)

文件加密时，每个文件都用 `masterSeed + fileId` 派生一个独立的子密钥加密：

```
// securityService.js
export function deriveFileKey({ masterSeedHex, fileId }) {
    // HKDF 派生，不同 fileId 产生不同密钥
    // 即使一个密钥泄露，其他文件仍然安全
}

export function encryptWithDerivedKey({ plainText, key }) {
    // AES-256-GCM 加密，附带认证标签
}
```

## 三、批量签发凭证：混合加密 + Merkle Tree

这是 TrustArchive 技术含量最高的部分，完整实现了工业级隐私保护的凭证签发方案。

### 3.1 设计目标

机构需要向 **N 个用户**同时签发凭证，且每个用户的附件文件只有该用户本人能解密，同时要通过链上 Merkle 验证防止凭证伪造。

### 3.2 混合加密（数字信封）工作流与代码实现

为了解决这个问题，TrustArchive 设计了\*\*“公钥交换信封 + 接收后重加密”\*\*的精妙流转机制。我们先来看整体架构：

![image.png](https://img.learnblockchain.cn/attachments/2026/04/48XpKXy669e7465fc9726.png)

**核心代码拆解（`frontend/src/services/cryptoEnvelope.js`）：**

**Phase 1 — 对称加密附件文件：**

附件文件只需加密一次，用随机生成的 AES-256-GCM 密钥：

```
// 生成随机 AES-256-GCM 密钥 + 12 字节 IV
export async function generateAES256GCMKey() {
    const key = await crypto.subtle.generateKey(
        { name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]
    );
    const rawKey = await crypto.subtle.exportKey("raw", key);
    const iv = crypto.getRandomValues(new Uint8Array(12));
    return { rawKey, iv };
}

// AES-256-GCM 加密文件
export async function encryptFileAESGCM({ data, rawKey, iv }) {
    const importedKey = await crypto.subtle.importKey(
        "raw", rawKey, { name: "AES-GCM" }, false, ["encrypt"]
    );
    const ciphertextBuf = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv }, importedKey, data // 这里修正了 data 变量
    );
    return toBase64(ciphertextBuf); // Base64 编码密文
}
```

**Phase 2 — 非对称密钥封装（ECIES 数字信封）：**

AES 密钥对每个用户分别用其\*\*以太坊公钥（secp256k1）\*\*加密，这正是「数字信封」的精髓——同一份密文，每个人有自己专属的密钥封装：

```
// 用用户的以太坊公钥（ECIES）加密 AES 密钥
export async function encryptAESKeyWithECIES({ recipientPublicKey, rawKey }) {
    const keyHex = toHex(rawKey);
    // eth-crypto 实现 ECIES — secp256k1 + AES-256-CBC + HMAC-SHA256
    const encrypted = await EthCrypto.encryptWithPublicKey(recipientPublicKey, keyHex);
    return EthCrypto.cipher.stringify(encrypted);
}
```

*注：用户公钥来源为用户首次连接钱包时签署一条欢迎消息，系统通过 `ethers.SigningKey.recoverPublicKey()` 恢复其未压缩公钥，注册到后端密钥仓库。*

**Phase 3 — 构建 Merkle Tree 用于链上防伪验证：**

```
// JS端：叶子节点与智能合约 claim() 验证逻辑精确对应
export function buildMerkleLeaf({ recipientAddress, tokenURI, attachmentCID }) {
    const packed = ethers.solidityPacked(
        ["address", "string", "string"],
        [recipientAddress, tokenURI, attachmentCID || ""]
    );
    return ethers.keccak256(packed);
}
```

```
// IssuerBatchSBT.sol — claim() 内部验证
bytes32 leaf = keccak256(abi.encodePacked(msg.sender, tokenURI_, attachmentCID));
require(verifyProof(b.merkleRoot, proof, leaf), "INVALID_PROOF");
```

**Phase 4 — 整体打包上传 IPFS，Merkle Root 锚定上链：**

```
const ipfsPayload = {
    kind: "encrypted-batch-distribution-v2",
    encryption: {
        algorithm: "AES-256-GCM",
        ivBase64,
        keyWrapping: "ECIES-secp256k1"
    },
    encryptedFile: encryptedFileCiphertext, // 所有人共享的密文（AES 加密）
    entries: entriesWithProof.map((e) => ({
        address: e.address,
        tokenURI: e.tokenURI,
        encryptedAESKey: e.encryptedAESKey, // 每人独立的 ECIES 封装密钥
        salt: e.salt,
        proof: e.proof                      // Merkle 证明
    }))
};

const distributionCID = await uploadJsonToIpfs(ipfsPayload);

// Merkle Root 永久锚定链上
await createBatchIssuance({ merkleRoot, templateId, distributionCID, total });
```

### 3.3 用户侧 Claim 与二次重加密

用户 claim 凭证分为两个阶段：

**① 链上 claim（Merkle Proof 验证 + SBT 铸造）**

```
// useTrustProtocol.js
const tx = await contract.claim(root, uri, cid, proof, { gasLimit: 1_800_000 });
const receipt = await tx.wait();
```

**② 本地解密 + Master Seed 重加密归档（如 session 已解锁）**

```
// CredentialCenter.jsx — doBatchClaim()
if (account && hasSessionSeed(account)) {
    // 下载 IPFS 上的附件（原始 ECIES 加密版本）
    const blob = await (await fetch(gatewayUrlForCid(claimedAttachmentCid))).blob();
    const dataUrl = await blobToDataUrl(blob);
    
    // 用自己的 Master Seed 重新加密并归档
    const archived = await archiveFileToCategory({
        categoryName: "Original Documents",
        name, type, size, dataUrl
    });
    // 保存 tokenId → 新 CID 的映射，脱离对原始机构密钥的依赖
}
```

```
// useTrustProtocol.js — archiveFileToCategory()
const cid = await encryptAndUploadWithMasterSeed(payload); // Master Seed 加密上传 IPFS
const nameEnc = encryptArchiveField({ seedHex, plainText: fileName });
const categoryEnc = encryptArchiveField({ seedHex, plainText: catName });
await addFileRecord({ cid, nameEnc, categoryEnc, ... }); // 写入 Notary 合约上链
```

**二次重加密的意义：**

* **摆脱依赖：** 彻底摆脱对原始一次性 AES 密钥的依赖。
* **体系统一：** 归档后凭证与用户其他私人文件采用统一加密体系（Master Seed），查看时只需输入本地密码，大幅提升体验。
* **数据永存：** 即使最初的分发包从 IPFS 删除，用户的本地加密副本仍永久可访问。

### 3.4 批量签发完整生命周期

为了更直观地展示整个链路，我们可以通过以下生命周期树来梳理数据流：

```
机构侧
  ├─ 生成 AES-256-GCM 密钥 + IV
  ├─ AES 加密附件文件 → encryptedFile
  ├─ 对每个用户：ECIES(用户公钥, AES密钥) → encryptedAESKey
  ├─ 构建元数据 tokenURI → 上传 IPFS
  ├─ 构建 Merkle Tree → 生成每人的 proof
  ├─ 打包 ipfsPayload 上传 IPFS → distributionCID
  └─ 调用合约 createBatchIssuance(merkleRoot, distributionCID) → 上链

用户侧
  ├─ 扫描全量 distributionCID，按地址匹配自己的 entry
  ├─ 调用合约 claim(merkleRoot, proof) → Merkle 验证 → 铸造 SBT
  └─ 用以太坊私钥 ECIES 解密 → 获得 AES key → 解密文件
     └─ Master Seed 重加密 → 归档到 Notary 合约（可选）
```

## 四、智能合约架构设计

### 4.1 全局链上结构

五个核心合约各司其职，通过地址注册互相调用：

```
CredentialCenter ←──── ArchivesRegistry ←──── IssuerBatchSBT
      │                       ↑
      │                       └── claim() 时自动调用 recordForUser()
      │
      └── owner 管理机构资质，approveIssuer / revokeInstitution
```

### 4.2 SBT 灵魂绑定实现

`IssuerBatchSBT` 实现了 ERC-721 接口，但禁用了所有转移函数（ERC-5192 灵魂绑定标准）：

```
function transferFrom(address, address, uint256) external pure override {
    revert("SOULBOUND");
}

function locked(uint256 tokenId) external view override returns (bool) {
    return _owners[tokenId] != address(0); // 一旦铸造，永久锁定
}
```

## 五、值得关注的实现细节（工程踩坑）

### 1. 用公钥恢复替代独立注册流程（极致 UX）

机构发证时必须知道用户的公钥，但 EVM 地址只是公钥的 Hash。为了优雅获取公钥，我们引入了 EIP-191 签名恢复机制：

```
---
config:
  theme: dark
  themeVariables:
    background: '#000000'
    noteBkgColor: '#0f172a'
    noteBorderColor: '#38bdf8'
    noteTextColor: '#e2e8f0'
---
sequenceDiagram
    autonumber
    participant User as 用户 (EVM钱包)
    participant Backend as 后端注册中心
    
    User->>Backend: 首次登录，签署标准欢迎消息 (EIP-191)
    
    rect rgb(45, 27, 78)
    Note over Backend: 🔐 核心处理阶段
    Backend->>Backend: ethers.utils.recoverPublicKey <br/> 从签名中反推完整 secp256k1 公钥
    Backend->>Backend: ethers.computeAddress 验证归属防伪
    end
    
    Backend->>Backend: 绑定 [地址 : 公钥] 存库，供机构随时拉取
```

**代码实现：**

```
const signature = await signer.signMessage(message);
const digest = ethers.hashMessage(message);
const uncompressedPubKey = ethers.SigningKey.recoverPublicKey(digest, signature);
// 验证归属
const derived = ethers.computeAddress(uncompressedPubKey);
// derived === account → 公钥确属该钱包
```

### 2. 纯 Web Crypto API，无 Node.js 依赖

所有对称加密均使用浏览器原生 `crypto.subtle` （Web Crypto API），避免了 `Buffer`、`keccak256`、`merkletreejs` 等 CommonJS 包在 Vite ESM 环境中的前端兼容性地雷。

### 3. Merkle Tree 排序一致性

前端与 Solidity 均采用**排序 Merkle 树（Sorted Merkle Tree）**——兄弟节点哈希前先按字节序排序——保证前端生成的 proof 与合约验证逻辑完全吻合：

```
// JS 端
function hashPair(a, b) {
    const [lo, hi] = a.toLowerCase() < b.toLowerCase() ? [a, b] : [b, a];
    return ethers.keccak256(ethers.concat([lo, hi]));
}
```

```
// Solidity 端
function verifyProof(bytes32 root, bytes32[] calldata proof, bytes32 leaf) internal pure returns (bool) {
    bytes32 hash = leaf;
    for (uint256 i = 0; i < proof.length; i++) {
        bytes32 p = proof[i];
        hash = hash < p
            ? keccak256(abi.encodePacked(hash, p))
            : keccak256(abi.encodePacked(p, hash));
    }
    return hash == root;
}
```

## 结语与展望

TrustArchive 的核心命题是：**区块链不应该是明文数据的容器，而应该是数据完整性的公证人。**

通过将加密密文托管于 IPFS、将内容哈希锚定于链上、将密钥控制权完全交给用户，我们实现了一个在不牺牲隐私的前提下可公开审计的凭证体系。其批量签发中的混合加密方案（AES-256-GCM + ECIES-secp256k1）可以直接用于任何需要「向多个用户分发私密数据」的 Web3 场景。还能延展到 RWA（真实世界资产）上链的隐私交易记录保护中。

**👋 关于作者**

我是一名专注于区块链系统开发的 **2027 届在校生**。TrustArchive 源于我在清迈 线下黑客松时对去中心化身份与数据隐私的思考与实践。

目前我正在积极寻找 **Web3 暑期实习机会**。如果你所在的团队正在构建有趣的产品，或者对这套隐私协议的具体实现感兴趣，非常欢迎来找我交流探讨！

* **GitHub :** https://github.com/Jay-Gould7
* **X (Twitter):** https://x.com/Gould777

* **联系方式:** gold.xxtxx\@gmail.com

<!--EndFragment-->