# BusinessMonitor

企業觀測站是一個專注於企業監測與風險評估的資料平台，透過串聯證交所、商業司、法務部、智慧財產局、地政局、中選會、勞動部、環境部等政府開放資料，全面建構企業的多維度公開資訊輪廓。

平台整合企業登記、負責人異動、土地資產、訴訟紀錄、環境違規、選舉捐贈、智慧財產等核心資訊，並導入智慧分析模型，自動識別潛在風險、揭露營運透明度，進一步推估企業的相對價值與市場信評。

企業觀測站致力於提升資料透明度與決策效率，協助投資人、媒體、研究機構及公民社會快速掌握企業真實樣貌，建立一個更負責任、可信賴的商業環境。

-----

## 📌 專案概覽

|          | 技術棧                                          |
| -------- | -------------------------------------------- |
| 前端 / SSR | **Next.js 15**（App Router, Turbopack）        |
| 後端 / ORM | **Prisma 6** + PostgreSQL                    |
| 語言       | TypeScript                                   |
| UI / CSS | Tailwind CSS 3                               |
| 測試       | Jest 30 + Testing Library                    |
| 程式碼品質    | ESLint 9 · Prettier 3 · Husky + lint‑staged  |
| 版號管理     | `0.1.0+build`（`npm run update-version` 自動遞增） |

-----

## ⚡ 快速開始 (Development)

> **前置需求**：Node ≥ 20 (推薦 v22)、Docker Desktop。

```bash
# 1. 取得原始碼
git clone <repo-url>
cd BusinessMonitor

# 2. 安裝依賴
npm install

# 3. 初始化環境變數 (自動產生 UUID 與金鑰)
npm run gen:env
# ⚠️ 注意：執行後請檢查 .env，確保 DATABASE_URL 與 docker-compose 設定一致

# 4. 啟動資料庫 (Docker Compose)
npm run db:up                  # 背景啟動 PostgreSQL (Port: 55432)

# 5. 套用 migration 並產生 Prisma Client
npx prisma migrate dev --name init

# 6. (選擇性) 初始化市場資料
# 若為全新環境，建議先匯入一個月的市場資料以供開發測試
# 詳見下方「📊 資料初始化」章節

# 7. 進入開發模式 (Turbopack)
npm run dev                    # http://localhost:3000
```

> **資源釋放**：
> 停止開發後可執行 `npm run db:down` 釋放資源 (⚠️ 會刪除資料 volume)；如僅暫停可使用 `docker compose stop`。

-----

## 📊 資料初始化 (Data Initialization)

本專案包含自動化爬蟲與匯入腳本，可從證交所 (TWSE) 與公開資訊觀測站 (MOPS) 獲取資料。

細節可以參考 `docs/deployment.md`

**1. 下載市場行情資料 (Crawler)**

```bash
# 下載指定日期之後的 CSV 檔案 (預設下載至 private/data/twse_data)
# 建議修改 shell/run_twse_crawler_task_download.sh 的 default_start 變數以縮短範圍
bash shell/run_twse_crawler_task_download.sh
```

**2. 匯入資料庫 (Importer)**

```bash
# 將下載的 CSV 寫入資料庫，並自動補全公司基本資料
npm run import:market-data -- private/data/twse_data
```

-----

## 🗄️ 資料庫管理

| 指令                                     | 功能                                              |
| -------------------------------------- | ----------------------------------------------- |
| `npm run db:up`                        | **啟動** Docker PostgreSQL（背景）                    |
| `npm run db:down`                      | 停止並 **刪除 volume**（⚠ 會清空資料）                      |
| `npm run db:logs`                      | 追蹤 Postgres log                                 |
| `npm run smoke:db_health`              | TypeScript Smoke Test（需 `-r dotenv/config` 已整合） |
| `npx prisma migrate dev --name <name>` | 建立新 migration                                   |
| `npm run generate:erd`                 | 產生 ERD.svg（需 Graphviz）                          |

-----

## 📂 專案目錄結構

```text
BusinessMonitor/
├─ .github/                # CI / ISSUE_TEMPLATE
├─ .husky/                 # Git hooks
├─ docs/                   # 專案文件
│  ├─ deployment.md        # ★ 部署指南
│  ├─ import_company_market_data.md # 資料匯入說明
│  └─ ...
├─ prisma/                 # ★ Schema & Migrations
│  ├─ migrations/
│  └─ schema.prisma
├─ private/                # 存放爬蟲數據與 Log (gitignored)
├─ scripts/                # Node/TS CLI 工具
│  ├─ 001_import_company_data.ts  # 公司基本資料匯入
│  ├─ 002_seed_stock_symbols.ts   # 股票代號種子
│  ├─ 003_backfill_company_ids.ts # 關聯回填
│  ├─ 004_import_market_data.ts   # ★ 市場行情匯入 (核心)
│  ├─ initial_env.ts              # 環境變數生成
│  └─ ...
├─ shell/                  # Shell Scripts
│  ├─ run_twse_crawler_task.sh    # 整合排程任務
│  └─ ...
├─ src/                    # Next.js 15 App Router
│  ├─ app/
│  ├─ components/
│  ├─ lib/
│  └─ ...
├─ .env / .env.example
└─ package.json
```

-----

## 🔨 NPM Scripts（節錄）

| 指令                       | 說明                                     |
| ------------------------ | -------------------------------------- |
| `npm run dev`            | Next 開發模式（Turbopack）                   |
| `npm run build`          | Production build（自動 `prisma generate`） |
| `npm run test`           | Jest + coverage                        |
| `npm run lint`           | ESLint + Next.js plugin                |
| `npm run gen:env`        | 自動產生 .env 與安全金鑰                     |
| `npm run import:market-data` | 執行市場資料匯入腳本 (004)                   |
| `npm run start:crawl`    | 執行完整爬蟲任務 (下載 + 匯入)                  |
| `npm run update-version` | `package.json` build metadata +1       |

-----

## ✅ Commit 檢查流程（Husky）

1.  **lint-staged**：格式化 + Lint（僅 stage 檔案）
2.  **jest**：單元/整合測試
3.  **update-version**：自動 bump build number

全部綠燈後才允許 commit。

-----

## 🚀 部署

詳細的伺服器部署流程、Crontab 排程設定與自動化腳本說明，請參閱：

👉 ** docs/deployment.md
-----

## ✏️ 貢獻

1.  Fork → Feature Branch → PR
2.  PR 必須通過 `npm run validate`
3.  Commit 訊息建議遵循 Conventional Commits

如有建議或疑問，歡迎提 Issue 或於 Slack 聯絡 @Tzuhan 🙌

-----

## 📚 參考

  * Next.js  [https://nextjs.org/docs/app](https://nextjs.org/docs/app)
  * Prisma  [https://www.prisma.io/docs](https://www.prisma.io/docs)
  * Tailwind CSS [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
  * Jest   [https://jestjs.io](https://jestjs.io)

-----

© 2025 BusinessMonitor – MIT License