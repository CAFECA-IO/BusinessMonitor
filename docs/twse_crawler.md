## 爬蟲設定與使用指南

本專案提供了一套自動化爬蟲腳本，用於從台灣證券交易所 (TWSE) 下載每日市場行情資料，並將其匯入資料庫。腳本設計旨在同時滿足**本地開發測試**與**遠端伺服器自動化執行**的需求。

### 核心功能

  * **智慧續傳**：腳本會自動查詢資料庫中的最新資料日期，並從隔天開始下載，無需手動指定。
  * **按年歸檔**：下載的 CSV 檔案會自動儲存在以年份命名的資料夾中 (例如 `private/data/twse_data/2025/`)。
  * **跨平台相容**：腳本可在 macOS (開發環境) 和 Ubuntu (部署環境) 上無縫運行。
  * **參數化執行**：支援指定資料夾路徑及按年、月、日等特定時間範圍進行匯入。

### 主要指令

| 指令                       | 說明                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `npm run start:crawl`      | **(主要指令)** 執行完整的自動化流程：先**下載**所有最新資料，然後**匯入**資料到資料庫。可接受路徑與日期參數。                        |
| `npm run import:market-data` | **(手動指令)** 僅執行**匯入**操作，可用於手動補跑或處理特定時間範圍的資料。                                                          |

-----

### Part 1：本地開發與測試指南 (macOS)

此部分說明如何在 Mac 電腦上進行開發與測試。由於 TWSE 可能有 IP 白名單限制，本地開發時，**下載資料**也需要透過跳板機。

#### A) 對本地資料庫進行測試

此情境下，資料的**下載**透過 SSH Tunnel，但資料的**寫入**在您本機的 Docker 資料庫。

1.  **啟動 SSH SOCKS Tunnel (用於下載)**
    為了讓下載請求看起來像是從白名單 IP (`211.22.***.***`) 發出的，需要建立一個 SOCKS 代理通道。

      * 打開一個**新的終端機視窗**，執行以下指令：
        ```bash
        # -D 8080: 在本機 8080 埠建立一個 SOCKS 代理
        # -f -N: 讓通道在背景執行，不佔用終端機
        ssh -f -N -D 8080 users@211.22..***.***
        ```
      * 執行後，系統會提示輸入跳板機密碼。**請勿在任何地方洩漏此密碼**。
      * 此通道會在背景持續運行。

2.  **確認環境變數 (`.env`)**
    確保您的 `.env` 檔案指向本地 Docker 資料庫：

    ```dotenv
    # .env
    DATABASE_URL="postgresql://myuser:mypassword@localhost:55432/business_monitor?schema=public"
    ```

3.  **啟動本地資料庫**

    ```bash
    npm run db:up
    ```

4.  **執行爬蟲腳本 (透過 SOCKS 代理)**
    在執行 `start:crawl` 指令前，加上 `https_proxy` 環境變數，讓下載工具 (`curl`) 使用我們建立的 Tunnel。

    ```bash
    # 讓 https 請求走 SOCKS5 代理
    https_proxy=socks5h://localhost:8080 npm run start:crawl
    ```

    > 腳本會透過 Tunnel 下載資料到 `twse_data` 資料夾，並將資料匯入到您的**本地 Docker 資料庫**。

5.  **關閉 Tunnel**
    測試完畢後，執行以下指令找到並關閉背景的 SSH 程序：

    ```bash
    # 找到 SSH 程序的 PID
    pgrep -f "ssh -f -N -D 8080"
    # 終止該程序 (將 [PID] 替換為上一個指令回傳的數字)
    kill [PID]
    ```

#### B) (可選) 透過 SSH Tunnel 對遠端資料庫進行測試

此情境模擬最完整的遠端連線：**下載**和**資料庫寫入**都透過 SSH Tunnel。

1.  **啟動兩個 SSH Tunnels**

      * **Tunnel 1: SOCKS 代理 (用於下載)**
        打開一個新終端機，執行：
        ```bash
        ssh -f -N -D 8080 users@211.22..***.***
        ```
      * **Tunnel 2: 埠號轉發 (用於資料庫)**
        再打開一個新終端機，執行 (**請將 `[遠端DB內網IP]` 替換為真實位址**)：
        ```bash
        ssh -f -N -L 6543:[遠端DB內網IP]:5432 users@211.22..***.***
        ```
      * 這兩個通道都需要輸入密碼，並會在背景執行。

2.  **建立本地專用環境變數檔 (`.env.local`)**
    在專案根目錄建立 `.env.local` 檔案，**並將 `[...]` 替換成遠端資料庫的真實帳號密碼**。

    ```dotenv
    # .env.local - 本機連線遠端 DB 專用
    DATABASE_URL="postgresql://[遠端DB使用者]:[遠端DB密碼]@localhost:6543/business_monitor?schema=public"
    ```

3.  **執行爬蟲腳本 (透過 SOCKS 代理)**

    ```bash
    https_proxy=socks5h://localhost:8080 npm run start:crawl
    ```

    > 現在，下載流量會走 SOCKS Tunnel，而資料庫流量會走埠號轉發 Tunnel。

4.  **關閉 Tunnels**
    測試完畢後，分別找到並 `kill` 掉兩個 SSH 程序的 PID。

-----

### Part 2：遠端伺服器部署指南 (Ubuntu)

在伺服器上，由於 IP 已在白名單內，**不需要任何 SSH Tunnel**。

#### 1\. 設定伺服器環境變數

在伺服器上，透過系統級的環境變數來設定資料庫連線。

1.  登入您的 Ubuntu 伺服器。
2.  編輯 `~/.bashrc` 檔案：`nano ~/.bashrc`
3.  在檔案的最下方，加入以下這行，**請務必將 `[...]` 中的內容替換成正式資料庫的真實資訊**：
    ```bash
    # ~/.bashrc - 遠端伺服器專用
    export DATABASE_URL="postgresql://[正式DB使用者]:[正式DB密碼]@[正式DB內網IP]:5432/business_monitor?schema=public"
    ```
4.  儲存檔案並讓設定生效：`source ~/.bashrc`

#### 2\. 設定 Cron Job (定時任務)

1.  執行 `crontab -e` 來編輯定時任務列表。
2.  在檔案的最下方，加入以下這行，設定腳本在**每天凌晨 4:00** 自動執行：
    ```crontab
    # 每天凌晨 4:00，執行 BusinessMonitor 的爬蟲任務
    0 4 * * * cd /path/to/your/BusinessMonitor && /usr/bin/npm run start:crawl >> /var/log/crawler.log 2>&1
    ```
    **請務必修改** `/path/to/your/BusinessMonitor` 為專案在伺服器上的絕對路徑。

-----

### 附錄：指令參數說明

#### `npm run start:crawl`

**用法：**

```bash
npm run start:crawl -- [資料夾路徑] [日期參數]
```

**參數說明：**

  * **`[資料夾路徑]`** (可選):
      * 指定資料的下載與讀取根目錄。
      * **預設值**：若不提供，則使用專案根目錄下的 `twse_data` 資料夾。
  * **`[日期參數]`** (可選):
      * 用於**篩選匯入步驟**的資料範圍，例如 `--from-year=2025`。
      * **注意**：此參數**不影響下載步驟**，下載總是會獲取所有需要更新的檔案。
      * **預設行為**：若不提供，匯入步驟會處理所有新下載的檔案。

**範例：**

```bash
# 預設用法：下載到 twse_data 並匯入所有新資料
npm run start:crawl

# 指定路徑，但匯入時只處理 2025 年的資料
npm run start:crawl -- /path/to/data --from-year=2025
```

#### `npm run import:market-data`

**用法：**

```bash
npm run import:market-data -- <資料夾路徑> [日期參數]
```

**參數說明：**

  * **`<資料夾路徑>`** (必填)：存放 `YYYY/` 年份資料夾的根目錄。
  * **`[日期參數]`** (可選)：
      * `--from-year=YYYY`：只處理指定年份的資料。
      * `--from-month=YYYYMM`：只處理指定月份的資料。
      * `--from-date=YYYYMMDD`：只處理特定一天的資料。
      * 若不提供日期參數，腳本預設會處理**最近 90 天**的資料。

**範例：**

```bash
# 匯入 2025 年的全部資料
npm run import:market-data -- twse_data --from-year=2025

# 匯入 2025 年 10 月的資料
npm run import:market-data -- twse_data --from-month=202510
```