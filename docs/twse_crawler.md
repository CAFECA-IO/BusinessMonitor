## TWSE 每日行情爬蟲設定與使用指南

本專案提供了一套自動化爬蟲腳本，用於從台灣證券交易所 (TWSE) 下載每日市場行情資料，並將其匯入資料庫。腳本設計旨在簡化伺服器上的自動化排程，同時也支援本地手動執行。

### 核心功能

  * **智慧續傳**：腳本會自動查詢資料庫中的最新資料日期，並從隔天開始下載，無需手動指定。
  * **按年歸檔**：下載的 CSV 檔案會自動儲存在以年份命名的資料夾中 (例如 `private/data/twse_data/2025/`)。
  * **跨平台相容**：腳本可在 macOS (開發環境) 和 Ubuntu (部署環境) 上無縫運行。
  * **參數化執行**：支援指定資料夾路徑及按年、月、日等特定時間範圍進行匯入。

是的，你的理解完全正確。

這四個指令的層級和用途區分得很清楚。你提供的 `shell` 和 `scripts` 檔案正是這樣設計的。

這是一份關於「TWSE 每日行情爬蟲任務」的指令說明文件，用於整理你的理解：

-----

### 指令說明

用於下載和匯入 TWSE（台灣證券交易所）每日行情資料的相關指令，及其各自的用途。

#### 1\. 僅執行「下載」：`run_twse_crawler_task_download.sh`

  * **指令**：
    ```bash
    bash shell/run_twse_crawler_task_download.sh [資料夾路徑]
    ```
  * **用途**：
    此腳本**只負責下載**。它會智慧地判斷需要補齊的日期（優先檢查資料庫，其次檢查本地檔案），然後從 TWSE 網站 `curl` 下載缺失日期的 CSV 檔案，並儲存到指定的資料夾路徑（預設為 `private/data/twse_data`）。
  * **不會**：此腳本不會將資料寫入資料庫。

#### 2\. 僅執行「寫入」：`004_import_market_data.ts`

  * **指令**：
    ```bash
    npx tsx scripts/004_import_market_data.ts <資料夾路徑> [--from-date=YYYYMMDD]
    ```
  * **用途**：
    此腳本**只負責寫入**。它會讀取指定資料夾路徑下的 CSV 檔案，解析其內容，然後將資料（包含每日價格、每日總結、以及新發現的股票代號）寫入 PostgreSQL 資料庫。
  * **不會**：此腳本不會執行任何網路下載。

#### 3\. 整合任務：「下載」後「寫入」：`run_twse_crawler_task.sh`

  * **指令**：
    ```bash
    bash shell/run_twse_crawler_task.sh [資料夾路徑] [--from-date=...]
    ```
  * **用途**：
    這是一個**整合腳本**，它會依序執行上述兩個步驟：
    1.  **下載**：首先，它會呼叫 `run_twse_crawler_task_download.sh` 腳本來下載最新的 CSV 檔案。
    2.  **寫入**：下載成功後，它會接著呼叫 `npm run import:market-data`（即 `scripts/004_import_market_data.ts`），將資料夾中的資料寫入資料庫。
  * **備註**：`package.json` 中定義了 `import:market-data` 指令。

#### 4\. 設定自動排程 (Cronjob)：`setup_daily_crawler_cron.sh`

  * **指令**：
    ```bash
    bash shell/setup_daily_crawler_cron.sh [HH:MM]
    ```
  * **用途**：
    這是一個**設定腳本**。它會將「步驟 3」的整合任務（`run_twse_crawler_task.sh`） 添加到你系統的 `crontab` 排程中，使其在每天指定的 `HH:MM` 時間自動執行（預設為 02:00）。
  * **結果**：自動化每日的「下載」與「寫入」流程。

-----

### Part 1：遠端伺服器部署指南 (Ubuntu)

在伺服器上，由於 IP 已在白名單內，**不需要任何 SSH Tunnel**。

#### 步驟一：設定伺服器環境變數

1.  登入 Ubuntu 伺服器。
2.  編輯 `~/.bashrc` 檔案：`nano ~/.bashrc`
3.  在檔案的最下方，加入以下這行，**請務必將 `[...]` 中的內容替換成正式資料庫的真實資訊**：
    ```bash
    # ~/.bashrc - 遠端伺服器專用
    export DATABASE_URL="postgresql://[正式DB使用者]:[正式DB密碼]@[正式DB內網IP]:5432/business_monitor?schema=public"
    ```
4.  儲存檔案並讓設定生效：`source ~/.bashrc`

#### 步驟二：設定 Cron Job (定時任務)

我們使用 `setup_daily_crawler_cron.sh` 腳本來自動設定排程，避免手動編輯 `crontab`。

1.  **（僅需執行一次）** 登入伺服器，`cd` 到本專案的根目錄。

2.  執行設定腳本，並指定你希望的每日執行時間（24小時制）。

    **範例：設定在每天凌晨 4:00 執行**

    ```bash
    bash shell/setup_daily_crawler_cron.sh 04:00
    ```

    *（如果省略時間，預設為 `02:00`）*

3.  腳本會自動將 `npm run start:crawl` 任務加入排程，並將日誌（log）導向到 `private/data/crawler.log`。

-----

### Part 2：手動執行與參數說明

#### 1\. 執行完整流程 (下載 + 匯入)

**用法：**

```bash
npm run start:crawl -- [資料夾路徑] [日期參數]
```

  * **`[資料夾路徑]`** (可選):
      * 指定資料的下載與讀取根目錄。
      * **預設值**：`private/data/twse_data`
  * **`[日期參數]`** (可選):
      * 用於**篩選匯入步驟**的資料範圍，例如 `--from-year=2025`。
      * **注意**：此參數**不影響下載步驟**，下載總是會獲取所有需要更新的檔案。

**範例：**

```bash
# 預設用法：下載到 private/data/twse_data 並匯入所有新資料
npm run start:crawl

# 指定路徑，但匯入時只處理 2025 年的資料
npm run start:crawl -- /data/my_crawler_data --from-year=2025
```

#### 2\. 僅執行匯入 (不下載)

**用法：**

```bash
npm run import:market-data -- <資料夾路徑> [日期參數]
```

  * **`<資料夾路徑>`** (必填)：存放 `YYYY/` 年份資料夾的根目錄。
  * **`[日期參數]`** (可選)：
      * `--from-year=YYYY`：只處理指定年份的資料。
      * `--from-month=YYYYMM`：只處理指定月份的資料。
      * `--from-date=YYYYMMDD`：只處理特定一天的資料。
      * 若不提供日期參數，腳本預設會查詢資料庫最新日期，並從**隔天**開始處理。

**範例：**

```bash
# 匯入 2025 年的全部資料
npm run import:market-data -- private/data/twse_data --from-year=2025

# 匯入 2025 年 10 月的資料
npm run import:market-data -- private/data/twse_data --from-month=202510
```

-----

### 附錄：本地開發 (macOS) - IP 白名單連線

若你的本地開發機 IP **不在** TWSE 的白名單中，你需要透過 SSH Tunnel 經由一台在白名單中的跳板機（例如 `211.22.***.***`）來下載資料。

#### A) 對本地資料庫進行測試

1.  **啟動 SSH SOCKS Tunnel (用於下載)**

      * 打開一個**新的終端機視窗**，執行以下指令：
        ```bash
        # -D 8080: 在本機 8080 埠建立一個 SOCKS 代理
        # -f -N: 讓通道在背景執行
        ssh -f -N -D 8080 users@211.22..***.***
        ```
      * 輸入跳板機密碼。

2.  **確認環境變數 (`.env`)**
    確保 `.env` 檔案指向本地 Docker 資料庫：

    ```dotenv
    # .env
    DATABASE_URL="postgresql://myuser:mypassword@localhost:55432/business_monitor?schema=public"
    ```

3.  **啟動本地資料庫**

    ```bash
    npm run db:up
    ```

4.  **執行爬蟲腳本 (透過 SOCKS 代理)**

    ```bash
    # 讓 https 請求走 SOCKS5 代理
    https_proxy=socks5h://localhost:8080 npm run start:crawl
    ```

    > 腳本會透過 Tunnel 下載資料，並將資料匯入到**本地 Docker 資料庫**。

5.  **關閉 Tunnel**
    測試完畢後，執行 `pgrep -f "ssh -f -N -D 8080"` 找到 PID，並使用 `kill [PID]` 終止它。

#### B) 透過 SSH Tunnel 對遠端資料庫進行測試

此情境模擬最完整的遠端連線：**下載**和**資料庫寫入**都透過 SSH Tunnel。

1.  **啟動兩個 SSH Tunnels**

      * **Tunnel 1: SOCKS 代理 (用於下載)**
        ```bash
        ssh -f -N -D 8080 users@211.22..***.***
        ```
      * **Tunnel 2: 埠號轉發 (用於資料庫)**
        ```bash
        ssh -f -N -L 6543:[遠端DB內網IP]:5432 users@211.22..***.***
        ```

2.  **建立本地專用環境變數檔 (`.env.local`)**

    ```dotenv
    # .env.local - 本機連線遠端 DB 專用
    DATABASE_URL="postgresql://[遠端DB使用者]:[遠端DB密碼]@localhost:6543/business_monitor?schema=public"
    ```

3.  **執行爬蟲腳本 (透過 SOCKS 代理)**

    ```bash
    httpsH_proxy=socks5h://localhost:8080 npm run start:crawl
    ```