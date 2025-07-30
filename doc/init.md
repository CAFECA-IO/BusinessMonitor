# BusinessMonitor 專案使用說明

本文件說明如何在本專案中快速啟動、開發、部署與測試。

---

## 🚀 專案概覽

* **框架**：Next.js 15 (App Router)
* **語言**：TypeScript
* **樣式**：Tailwind CSS
* **資料庫**：PostgreSQL + Prisma ORM
* **測試**：Jest
* **Git Hook**：Husky + lint-staged
* **版號管理**：metadata+遞增 (0.1.0 → 0.1.0+1)

---

## 📦 環境安裝

1. 克隆專案並切換到目錄：

   ```bash
   git clone <repo-url>
   cd BusinessMonitor
   ```
2. 安裝相依套件：

   ```bash
   npm install
   ```
3. 複製環境變數範本並設定：

   ```bash
   cp .env.example .env
   # 編輯 .env，填入你的 DATABASE_URL
   ```
4. 設定 Node 版本（可選）：

   * 建議在專案根目錄新增 `.nvmrc`，內容填寫：

     ```text
     20
     ```

     或使用 LTS：

     ```text
     lts/*
     ```
   * 本地執行：

     ```bash
     nvm install
     nvm use
     ```
   * 推薦使用 Node.js v20（Next.js LTS）

---

## 🗄️ 本地資料庫準備
1. **安裝 PostgreSQL**（依作業系統）：

   * macOS（Homebrew）：

     ```bash
     brew install postgresql
     brew services start postgresql
     ```
   * Ubuntu：

     ```bash
     sudo apt update
     sudo apt install postgresql
     sudo systemctl start postgresql
     ```

2. **建立使用者與資料庫**：將 `myuser`、`mypassword`、`business_monitor` 改成你想要的名稱

   ```bash
   export PGUSER=postgres
   export PGPASSWORD=       # 如果 postgres 無密碼，可留空
   psql -h localhost -p 5432 -U $PGUSER <<EOF
   CREATE ROLE myuser WITH LOGIN PASSWORD 'mypassword';
   CREATE DATABASE business_monitor OWNER myuser;
   EOF
   ```

3. **更新 .env**：填入你剛剛建立的資訊

   ```env
   DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/business_monitor?schema=public"
   ```
---

## 🗄️ 資料庫操作 (Prisma)

### 資料庫初始化

在你拉取 (clone) 下來、且 `prisma/migrations` 已經含有所有版本檔後，只需 **套用現有 migration** 並產生 Client：

```bash
npx prisma migrate deploy      # 執行尚未套用的 migration
npx prisma generate         # 產生 Prisma Client
```

### 資料庫更新

當你修改了 `schema.prisma` 並需要**新增一個 migration** 時：

```bash
npx prisma migrate dev --name <migration_name>
npx prisma generate
```

---

## 📂 檔案結構

```
BusinessMonitor/
├─ .husky/                  # Git hook
├─ prisma/
│   ├─ schema.prisma       # Prisma schema
│   ├─ ERD.svg             # 資料表 ER 圖檔
│   └─ migrations/         # 資料庫 migration
├─ scripts/
│   └─ update_version.ts   # 版號遞增腳本
├─ src/
│   ├─ app/
│   │   ├─ api/            # App Router API Route Handlers
│   │   │   └─ v1/company/
│   │   │       ├─ route.ts
│   │   │       └─ [id]/route.ts
│   │   ├─ landing/        # Landing Page
│   │   │   └─ page.tsx
│   │   ├─ search/         # Search Page
│   │   │   └─ page.tsx
│   │   ├─ layout.tsx      # 根 Layout
│   │   └─ page.tsx        # 首頁
│   ├─ components/         # 共用元件
│   │   └─ Button.tsx      # 範例按鈕
│   ├─ lib/                # 工具函式
│   └─ styles/
│       └─ globals.css
├─ __tests__/              # 測試檔案
│   └─ api/hello.test.ts   # API 範例測試
├─ jest.config.ts          # Jest 設定
├─ tsconfig.json           # TypeScript 設定
├─ package.json            # 專案設定
└─ next.config.js          # Next.js 設定
```

---

## 🏃‍♂️ 啟動專案

* 開發伺服器

  ```bash
  npm run dev
  ```
* production build

  ```bash
  npm run build
  npm run start
  ```
* code lint

  ```bash
  npm run lint
  ```
* code format

  ```bash
  npm run format
  ```
* 測試

  ```bash
  npm run test
  ```

---

## 🔧 Git Hook (Husky) (Husky)

每次 commit 前會自動：

1. `npx lint-staged` → 只檢查 staged 檔案的格式與 lint
2. `npm test` → 跑所有 Jest 測試，失敗則阻擋 commit
3. `npm run update-version` → 自動遞增 metadata，並 `git add package.json`

```bash
# .husky/pre-commit
#!/usr/bin/env sh
set -euo pipefail
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
npm test
npm run update-version
```

---

## 📖 文件連結

* Next.js App Router doc: [https://nextjs.org/docs/app](https://nextjs.org/docs/app)
* Prisma: [https://www.prisma.io/docs](https://www.prisma.io/docs)
* Jest: [https://jestjs.io/docs/getting-started](https://jestjs.io/docs/getting-started)
* Tailwind CSS: [https://tailwindcss.com/docs](https://tailwindcss.com/docs)

---

如有任何問題或建議，歡迎隨時提出！
