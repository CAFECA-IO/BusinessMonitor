# BusinessMonitor

企業觀測站是一個專注於企業監測與風險評估的資料平台，透過串聯證交所、商業司、法務部、智慧財產局、地政局、中選會、勞動部、環境部等政府開放資料，全面建構企業的多維度公開資訊輪廓。

平台整合企業登記、負責人異動、土地資產、訴訟紀錄、環境違規、選舉捐贈、智慧財產等核心資訊，並導入智慧分析模型，自動識別潛在風險、揭露營運透明度，進一步推估企業的相對價值與市場信評。

企業觀測站致力於提升資料透明度與決策效率，協助投資人、媒體、研究機構及公民社會快速掌握企業真實樣貌，建立一個更負責任、可信賴的商業環境。

---

## 📌 專案概覽
|                       | 技術棧 |
|-----------------------|---------------------------------------------------------------|
| 前端 / SSR             | **Next.js 15**（App Router, Turbopack） |
| 後端 / ORM             | **Prisma** 6 + PostgreSQL |
| 語言                   | TypeScript |
| UI  &nbsp; / CSS      | Tailwind CSS 3 |
| 測試                   | Jest 30 + Testing Library |
| 程式碼品質              | ESLint 9 · Prettier 3 · Husky + lint-staged |
| 版號管理                | `0.1.0+build`（`npm run update-version` 自動遞增） |

---

## ⚡ 快速開始

```bash
git clone <repo-url>
cd BusinessMonitor
npm install

# 建立環境變數
cp .env.example .env  # 編輯 DATABASE_URL

# 套用資料庫 migration 並產生 Prisma Client
npx prisma migrate deploy
npx prisma generate

npm run dev           # http://localhost:3000
````

> **Node 版本**：建議 v20 LTS，在專案根目錄建立 `.nvmrc` 可自動切換。

---

## 📂 專案目錄結構

```
BusinessMonitor/
├─ .github/                # CI / ISSUE_TEMPLATE / PR_TEMPLATE
├─ .husky/                 # Git hooks（pre-commit 觸發 lint-staged + Jest + 版號遞增）
│  └─ pre-commit
├─ .vscode/                # 編輯器建議設定（工作區層級）
│  └─ settings.json
├─ coverage/               # Jest coverage 輸出
├─ docs/                   # 架構圖、流程圖、API 規格…(markdown / mermaid)
├─ exports/                # CLI 匯出資料 (e.g. CSV、JSON)
├─ node_modules/
├─ prisma/                 # ★ 資料庫 Schema 與 Migration
│  ├─ migrations/
│  │   └─ 000_init/        # 首次 migration
│  ├─ ERD.svg              # prisma-erd-generator 產生的 ER 圖
│  ├─ migration_lock.toml  # Migrate deploy 鎖
│  └─ schema.prisma
├─ public/                 # 靜態資源 (Next.js 自動對應 /)
│  ├─ elements/            # UI icon/svgs
│  ├─ fake_avatar/         # 假頭像範例
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ next.svg
│  ├─ vercel.svg
│  └─ window.svg
├─ scripts/                # Node / TS CLI 工具
│  ├─ logs/                # 系統排程或 CLI log 輸出
│  ├─ export_companies.ts  # 企業資料匯出 → exports/
│  ├─ import_data.ts       # 擷取 & 匯入政府開放資料 (ETL)
│  └─ update_version.ts    # 版號 build metadata 自動 +1
├─ src/                    # 應用程式核心
│  ├─ __tests__/api/       # Jest + RTL 測試
│  │   └─ hello.test.ts
│  ├─ app/                 # Next.js 15 App Router
│  │   ├─ api/
│  │   │   └─ v1/hello/route.ts
│  │   ├─ landing/page.tsx
│  │   ├─ search/          # (路由夾)
│  │   ├─ layout.tsx       # Root layout
│  │   └─ page.tsx         # Home
│  ├─ components/          # 共用 React 元件
│  ├─ constants/           # 枚舉、常量
│  ├─ interfaces/          # TypeScript 型別定義
│  ├─ lib/                 # util / service（ex: prisma client wrapper）
│  └─ styles/
│      └─ globals.css
├─ .env                    # 本機環境變數
├─ .env.example            # 範例環境變數
├─ .eslintrc.js            # ESLint rule 入口（延伸 eslint.config.mjs）
├─ .lintstagedrc.json      # lint-staged 設定
├─ .nvmrc                  # 建議 Node 版本 (v20)
├─ eslint.config.mjs       # 使用 Flat Config
├─ jest.config.ts
├─ jest.setup.ts           # RTL / jest-extended 全域設定
├─ LICENSE
├─ next-env.d.ts           # Next.js 自動生成，型別輔助
├─ next.config.ts
├─ package.json
├─ package-lock.json
├─ postcss.config.mjs
├─ README.md
├─ tailwind.config.js
└─ tsconfig.json
```

---

## 🗄️ 資料庫流程

### 初始化（僅第一次）

```bash
# 已有 migrations：直接套用
npx prisma migrate deploy
npx prisma generate
```

### 建立新 migration

```bash
# 修改 schema.prisma 後
npx prisma migrate dev --name <feat_or_fix>
npx prisma generate
```

> **ERD 更新**：`npm run generate:erd` 會額外輸出 `prisma/ERD.svg`（需安裝 Graphviz）。

---

## 🔨 NPM Scripts

| 指令                       | 說明                                          |
| ------------------------ | ------------------------------------------- |
| `npm run dev`            | 本機開發（Turbopack）                             |
| `npm run build`          | 產出 Production Build；自動先執行 `prisma generate` |
| `npm start`              | 以 Node 啟動 production server                 |
| `npm run generate`       | **僅生成** Prisma Client                       |
| `npm run generate:erd`   | 生成 Client + ERD.svg                         |
| `npm test`               | Jest + coverage                             |
| `npm run lint`           | ESLint + Next.js ESLint                     |
| `npm run format`         | Prettier 全專案格式化                             |
| `npm run validate`       | format → lint → test（CI 本地完整驗證）             |
| `npm run import-data`    | 以 TypeScript 執行 `scripts/import_data.ts`    |
| `npm run update-version` | `scripts/update_version.ts`：metadata 自動遞增   |

---

## ✅ 品質檢查（Husky）

`pre-commit` 流程 ⬇️

1. **lint-staged**：只檢查已 staged 檔案格式 + Lint
2. **jest**：單元/整合測試，若失敗阻擋 commit
3. **update-version**：`package.json` build 版號 `+1`

---

## 🧪 測試範例

```ts
// __tests__/api/hello.test.ts
import { render, screen } from '@testing-library/react';
import Hello from '@/app/api/v1/hello/route';

describe('GET /api/v1/hello', () => {
  it('returns 200 & message', () => {
    const res = Hello();
    expect(res.status).toBe(200);
    expect(res.body).toMatch(/Hello BusinessMonitor/);
  });
});
```

```bash
npm test                    # 執行全部
npm test -- <pattern>       # 只跑部分測試
```

---

## 🚀 部署

> 本專案可直接部署至 **Vercel**；或以 Docker / PM2 自管。

```bash
# Docker 範例
docker build -t business-monitor .
docker run -d -p 3000:3000 --env-file .env business-monitor
```

---

## ✏️ 貢獻 & Issue

1. Fork → 新分支 → PR
2. PR 需通過 `npm run validate`
3. Commit 訊息建議遵循 **Conventional Commits** (`feat:`, `fix:`…)

如有任何問題或改進建議，請開 Issue 或直接在 Slack/@Tzuhan 提醒 🙌

---

## 📚 參考資源

* Next.js   [https://nextjs.org/docs/app](https://nextjs.org/docs/app)
* Prisma   [https://www.prisma.io/docs](https://www.prisma.io/docs)
* Tailwind CSS [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
* Jest    [https://jestjs.io](https://jestjs.io)

---

> © 2025 BusinessMonitor. MIT License.