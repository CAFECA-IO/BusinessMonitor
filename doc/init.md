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

## 🗄️ 資料庫初始化 (Prisma)

### 本地開發

1. 透過 `migrate dev` 同步 schema 並建立 migration：

   ```bash
   npx prisma migrate dev --name init
   ```
2. 產生 Prisma Client：

   ```bash
   npx prisma generate
   ```

### CI / 生產環境

1. 部署現有的 migration：

   ```bash
   npx prisma migrate deploy
   ```
2. 產生 Prisma Client：

   ```bash
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
│   │   │   └─ v1/hello/
│   │   │       └─ route.ts
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

如有任何問題或建議，歡迎隨時提出～
