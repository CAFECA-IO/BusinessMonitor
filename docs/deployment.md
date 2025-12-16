# Business Monitor｜本地專案部署與資料初始化指南 (v2025.12)

## 1\. 前置準備 (Prerequisites)

請確保您的開發機已安裝以下工具：

  * **Node.js**: v22.x
  * **Docker Desktop**: 必須安裝並啟動
  * **Git**: 用於版本控制

-----

## 2\. 環境建置 (Environment Setup)

### 步驟 2.1：安裝依賴

```bash
npm install
```

### 步驟 2.2：設定環境變數

請直接在專案根目錄建立 `.env` 檔案，並填入您提供的內容。
接著執行初始化腳本，它會自動補上 `UUID`、`ENCRYPTION_KEY` 與 `DEWT_PRIVATE_KEY_PEM` 等缺失的安全金鑰，但**不會破壞**您原本的資料庫設定。

1.  **建立 `.env`** (貼上您的內容)：

    ```bash
    # 確保您的 .env 包含以下 DB 設定 (與 docker-compose 對應)
    POSTGRES_USER=myuser
    POSTGRES_PASSWORD=mypassword
    POSTGRES_DB=business_monitor
    POSTGRES_HOST=localhost
    POSTGRES_PORT=55432
    DATABASE_URL="postgresql://${POSTGRES_USER}:${POSTGRES_PASSWORD}@${POSTGRES_HOST}:${POSTGRES_PORT}/${POSTGRES_DB}?schema=public"
    ```

2.  **補全金鑰**：

    ```bash
    npm run gen:env
    ```

    *(腳本會自動偵測並填入 UUID 與加密金鑰)*

### 步驟 2.3：啟動資料庫與建立 Schema

1.  啟動 Docker 容器：

    ```bash
    npm run db:up
    ```

    > **驗證**：Docker 會讀取 `.env` 中的 `myuser` / `mypassword` 來建立資料庫使用者。

2.  寫入資料庫結構 (Migration)：

    ```bash
    npx prisma migrate dev --name init
    ```

    > **驗證**：Prisma 會自動解析 `.env` 中的變數，連線至 `localhost:55432`。看到 `All migrations have been successfully applied` 即代表成功。

-----

## 3\. 取得市場資料 (Data Acquisition)

為了快速啟動，我們將下載腳本的預設範圍縮小至**最近一個月**。

### 步驟 3.1：調整下載範圍

編輯 `shell/run_twse_crawler_task_download.sh`：

```bash
# shell/run_twse_crawler_task_download.sh (約第 34 行)
# 修改為「最近一個月」的日期 (例如現在是 2025/12/12，則設為 20251201)
default_start="20251201" 
```

### 步驟 3.2：執行下載

```bash
# 建立目錄並下載
mkdir -p private/data/twse_data
bash shell/run_twse_crawler_task_download.sh private/data/twse_data
```

-----

## 4\. 匯入資料與冷啟動 (Data Import & Cold Start)

我們使用已修正（含 Batching 分批機制）的 `004` 腳本，同時匯入股價並自動建立公司基本資料。

### 步驟 4.1：執行匯入

```bash
npm run import:market-data -- private/data/twse_data
```

> **⏳ 執行狀況說明**：
>
>   * 由於是第一次執行 (Cold Start)，系統會遇到大量「新代號」並嘗試去 MOPS 查詢。
>   * **這是正常的**：若看到 `查無公司資料 (可能為 ETF 或權證)`，代表系統正在建立快取。
>   * 請耐心等待程式跑完 (約需 30\~60 分鐘，視電腦效能而定)。

-----

## 5\. 驗證與啟動 (Verification)

### 步驟 5.1：啟動開發伺服器

```bash
npm run dev
```

前往 [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)。

### 步驟 5.2：功能驗證

  * 在搜尋框輸入 **`台灣大哥大`**。
  * 應能看到台積電的 K 線圖與股價資訊。

前往 [http://localhost:3000](https://www.google.com/search?q=http://localhost:3000)。


## 6\. 關於自動化測試 (Testing)

若需執行 `npm run test` 或提交代碼 (Git Commit)，請注意以下事項：

### 狀況說明

專案目前的測試案例（如 `companies.search.server.test.ts`）依賴特定的**種子資料 (Seed Data)**（例如特定的公司名稱或固定 ID），而本地爬蟲建立的資料 ID 是動態生成的，且可能缺乏部分測試所需的詳細欄位。

### 解決辦法

1.  **調整測試參數**：修改測試檔案中的目標 ID 或關鍵字，使其匹配本地資料庫中實際存在的資料。

-----

## 7\. 常見問題排除 (Troubleshooting)

| 問題現象 | 原因 | 解決方案 |
| :--- | :--- | :--- |
| `P1001: Can't reach database server` | Docker 沒開或 .env 設定錯誤 | 檢查 `docker ps`，確認 `.env` 的 Port 為 `55432`。 |
| `EADDRNOTAVAIL` / Network Error | 瞬間發起太多爬蟲請求 | 確保 `004` 腳本已加入 Batching (分批) 機制。 |
| 測試失敗 `404 Not Found` | 本地資料庫與測試案例預期資料不符 | 調整測試案例中的 ID/關鍵字，或暫時忽略測試。 |