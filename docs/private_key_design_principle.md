# **技術設計文件：FIDO2 鏈上身份金鑰架構**

## 1\. 設計背景與必要性

**目標**：為了實現專案最終將用戶身份與行為上鏈的去中心化願景，我們必須為每位用戶生成一把由其自主控制的區塊鏈私鑰。

**必要性**：傳統的私鑰管理方案（如助記詞、Keystore + 密碼）與本專案 FIDO2/Passkey 的無密碼核心理念相悖。因此，我們需要設計一套能利用 FIDO2 硬體級安全性，同時又能安全管理鏈上私鑰的架構。本設計旨在為 Phase 1 建立一個安全、非託管的金鑰基礎，並為 Phase 2 的智慧合約錢包演進鋪路。

## 2\. Phase 1 金鑰設計：動態解密模型 (Dynamic Decryption)

此為當前階段的實作核心。

### 2.1 設計原則

本設計的基石是**分離**「金鑰生成」與「金鑰存取」兩個環節。FIDO2 在此架構中扮演的是**解鎖工具**，而非生成工具。

  * **金鑰生成**: 私鑰是**一次性、由高熵隨機源生成**的，確保其不可預測性。
  * **金鑰保護**: 我們不直接派生金鑰，而是派生一個**一次性的對稱加密金鑰**，用於對稱加密（AES-GCM）一個已存在的私鑰。
  * **後端零知識**: 後端僅儲存加密後的密文 (`encryptedBlockchainKey`) 及用於解密的鹽 (`derivationNonce`)，無法存取或還原明文私鑰。
  * **防禦重放攻擊**: 所有 FIDO2 簽章請求的 `challenge` 都必須包含一個**隨機的、一次性的 `nonce`**。這是本設計安全性的關鍵，它確保了即使單次 `signature` 被截獲也無法被重用。
  * **意圖明確化**: 所有 `challenge` 均包含 `cafeca-` 品牌前綴及操作意圖 (e.g., `key_encryption`)，以區分不同目的的簽章請求。

### 2.2 架構流程

```mermaid
sequenceDiagram
    participant C as Client
    participant F as FIDO2 Authenticator
    participant S as Server

     critical Phase 1: Key Generation & Encryption (Once)
        C->>C: 1. `ethers.Wallet.createRandom()` -> privateKey
        C->>C: 2. Generate random `nonce`
        C->>F: 3. Sign Challenge ("cafeca-key_encryption-[userId]-[nonce]")
        F-->>C: 4. Return `signature`
        C->>C: 5. Derive `symmetricKey` from `signature` (KDF)
        C->>C: 6. Encrypt `privateKey` with `symmetricKey` -> `encryptedKey`
        C->>S: 7. Store `{encryptedKey, nonce}`
    
     critical Phase 1: Key Decryption & Usage (Each Time)
        C->>S: 1. Request `{encryptedKey, nonce}`
        S-->>C: 2. Return `{encryptedKey, nonce}`
        C->>F: 3. Sign same Challenge (reconstructed with same `nonce`)
        F-->>C: 4. Return same `signature`
        C->>C: 5. Derive same `symmetricKey`
        C->>C: 6. Decrypt `encryptedKey` -> `privateKey` (in-memory)
        C->>C: 7. Use `privateKey` to sign transaction
        Note right of C: `privateKey` is immediately discarded after use.
```

## 3\. Phase 2 演進目標：鏈上主權身份

Phase 1 的設計是為了 Phase 2 的宏大目標服務。Phase 1 中生成的 `IdentityAccount` EOA 私鑰，是未來用戶鏈上主權身份的**所有權根 (Root of Trust)**。

### 3.1 目標闡述

Phase 2 的目標是將每個 `IdentityAccount` 從一個由後端管理的 EOA，升級為一個**鏈上的智慧合約錢包** (例如，遵循 ERC-4337 的帳戶抽象，或 Gnosis Safe 類型的多簽錢包)。

### 3.2 實現簽名者模型 (Signer Model)：從 EOA 到鏈上多裝置主權

#### 3.2.1 概念闡述

在 Phase 1，用戶的鏈上身份由一個**單一的 EOA 私鑰**（我們稱之為「主鑰匙」）代表。這個主鑰匙雖然透過 FIDO2 進行了安全保護，但在鏈上層面，它仍然是一個單點故障：只有這把鑰匙能控制帳戶。

Phase 2 的核心目標，是將這個單點控制的 EOA，升級為一個**由多個「簽名者 (Signers)」共同管理的智慧合約錢包** (Smart Contract Wallet)。這完美地實現了您在 `prisma.schema` 註解中的設想。

  * **主鑰匙 (Owner)**：Phase 1 的 EOA 私鑰，其角色從「日常操作者」轉變為合約的最高權限**擁有者 (Owner)**。它的主要職責是管理合約本身，例如新增或移除合約的合法簽名者。
  * **簽名者 (Signers)**：用戶註冊在 `Authenticator` 表中的**每一個 FIDO2 裝置**（iPhone, Android 手機, YubiKey 等），其公鑰都可以被 Owner 授權，成為智慧合約錢包的**合法簽名者**。

這個模型的轉變，意味著用戶的鏈上身份不再依賴於單一一把（被加密的）私鑰，而是由一組他們自己擁有的、物理的 FIDO2 裝置來共同保障。

#### 3.2.2 技術實作路徑

要實現這個模型，需要開發一個「裝置管理」功能，其流程如下：

1.  **讀取裝置列表**：

      * 前端需要一個 API，能從後端的 `Authenticator` 資料表中，讀取當前用戶所有已註冊的 FIDO2 裝置。API 應回傳每台裝置的 `credentialPublicKey`。

2.  **構造授權交易 (Management Transaction)**：

      * 前端提供一個「授權裝置為簽名者」的介面。
      * 當用戶選擇要授權的裝置時，前端會構造一筆指向**用戶智慧合約錢包地址**的交易。
      * 這筆交易的 `data` 欄位會包含一個函式呼叫，例如 `addSigner(newSignerPublicKey)`，其中 `newSignerPublicKey` 就是從 `Authenticator` 表中讀取到的 FIDO2 裝置公鑰。

3.  **使用主鑰匙進行授權簽署**:

      * 為了執行這筆管理交易，用戶必須證明他們是合約的 Owner。
      * 此時，我們會觸發 Phase 1 的「**動態解密**」流程：
        a. 提示用戶使用任一已註冊的 FIDO2 裝置進行驗證。
        b. 在前端記憶體中臨時解密出 EOA **主鑰匙**。
        c. 使用這把主鑰匙，對上一步構造的管理交易進行簽署。
      * 將簽署後的交易發送到區塊鏈。

4.  **鏈上驗證與執行**:

      * 智慧合約錢包接收到這筆交易。
      * 它會驗證交易的簽名者是否為合約的 `Owner`（即 EOA 主鑰匙的地址）。
      * 驗證通過後，合約執行 `addSigner` 函式，將新的 FIDO2 裝置公鑰加入到合約內部儲存的「合法簽名者列表」中。

#### 3.2.3 演進後的日常操作

一旦裝置被新增為 Signer，日常的交易簽署流程將變得極為流暢：

  * **無須解密主鑰匙**：用戶不再需要執行 Phase 1 的「解密」流程來獲取 EOA 主鑰匙。
  * **直接簽署**：當需要簽署一筆普通交易時（例如發表評論、投資），前端可以直接呼叫 `fido2ClientService.startLogin`，並用一個特定於**交易內容**的 `challenge` 來請求 FIDO2 裝置簽名。
  * **鏈上驗證簽名者**：智慧合約錢包在收到交易時，會直接驗證 `signature` 是否來自其內部「合法簽名者列表」中的某一個公鑰。驗證通過即可執行。

#### 3.2.4 演進架構圖

```mermaid
graph TD
    subgraph "Phase 2: 鏈上智慧合約錢包"
        SCW[智慧合約錢包<br/>(用戶的鏈上身份)]

        subgraph "簽名者 (Signers)"
            F2[FIDO2 裝置 B (iPhone)]
            F3[FIDO2 裝置 C (YubiKey)]
        end

        subgraph "擁有者 (Owner)"
            PK1[EOA 私鑰 (主鑰匙)<br/>(由 FIDO2 裝置 A 解鎖)]
        end

        PK1 -- "管理操作<br/>(例如: addSigner)" --> SCW
        F2 -- "日常操作<br/>(例如: 簽署交易)" --> SCW
        F3 -- "日常操作<br/>(例如: 簽署交易)" --> SCW
    end
```

**總結**: 透過這個演進，我們將 `Authenticator` 資料表從一個僅用於「鏈下解密」的裝置列表，轉變為一個**鏈上智慧合約錢包的多重簽名者**的管理來源，真正實現了用戶對其鏈上身份的多裝置主權控制。