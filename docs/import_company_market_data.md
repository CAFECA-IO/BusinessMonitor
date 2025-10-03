# Business Monitor｜資料匯入完整流程與操作指南

> 本文件整理了 **一次性資料庫初始化** 與 **常態化市場行情匯入** 的完整作業手冊，並附上實用的輔助診斷腳本說明與常見注意事項。建議照本文順序逐步執行。

---

## 總覽

* **一次性資料庫初始化**（只需執行一次）

  1. 匯入公司基本資料（`001_import_company_data.ts`）
  2. 建立股票代號總表（`002_seed_stock_symbols.ts`）
  3. 回填公司與股票代號關聯（`003_backfill_company_ids.ts`）
* **常態化市場行情匯入**（每日／定期）

  * 匯入 TWSE 每日行情（`004_import_market_data.ts`）
* **輔助診斷腳本**（非核心、供稽核與問題排查）

  * 稽核原始 CSV 日期完整性（`verify_twse_daily_files_completeness.ts`）
  * 診斷公司覆蓋率（`diagnose-company-coverage.ts`）

> **執行原則**：請嚴格依照 **1 → 2 → 3** 的順序完成初始化，之後再啟用市場行情的常態化匯入。

---

## 1) 一次性資料庫初始化流程

> **目的**：為全新、空白的資料庫建立基礎主檔與權威代號資料，並完成核心關聯。

### 步驟 1：匯入公司基本資料 — `001_import_company_data.ts`

**作用**：

* 讀取包含「公司／商業／分公司」等登記資料的 **JSONL** 檔，寫入 `Company` 資料表。
* 處理分公司資料時，於 `CompanyRelation` 建立與母公司的關聯；若母公司尚未存在，會建立暫存記錄。

**邏輯校驗**：

* **冪等性**：使用 `upsert`，可安全重複執行，不產生重複資料。
* **關聯性**：自動補齊分公司 ↔ 母公司關係，流程邏輯完整。

**執行指令**：

```bash
npx tsx scripts/001_import_company_data.ts <path/to/company_data_folder>
```

---

### 步驟 2：建立股票代號總表 — `002_seed_stock_symbols.ts`

**作用**：

* 建立權威且完整的 `StockSymbol` 清單。
* 讀取「公司代號對照表 CSV」（含公司代號、名稱、統一編號等），一次性建立所有已知股票代號。

**邏輯校驗**：

* **效率**：以 `Map` 於記憶體去重，確保每個 `symbol` 僅處理一次。
* **冪等性**：使用 `createMany({ skipDuplicates: true })`，即使重跑也不因 `symbol` 的 unique 限制而報錯。

**執行指令**：

```bash
npx tsx scripts/002_seed_stock_symbols.ts <path/to/mapping_data_folder>
```

---

### 步驟 3：回填公司 ↔ 股票代號關聯 — `003_backfill_company_ids.ts`

**作用**：

* 以「公司代號對照表 CSV」為橋樑，將 `StockSymbol`（透過 **股票代號**）與 `Company`（透過 **統一編號**）正確連結，回填 `StockSymbol.company_id`。

**邏輯校驗**：

* **效率**：使用 `Map`（`symbolToRegNoMap`、`regNoToCompanyIdMap`）批次匹配，避免 N+1 查詢。
* **可追蹤性**：輸出清晰日誌，統計成功更新數、以及因缺少對應統編而無法關聯的筆數，便於排查。

**執行指令**：

```bash
npx tsx scripts/003_backfill_company_ids.ts <path/to/mapping_data_folder>
```

---

## 2) 常態化市場行情匯入 — `004_import_market_data.ts`

> **前提**：請先完成上述「一次性初始化」三步驟。

**核心功能**：

* **整合與優化**：已將舊版 `import_twse_daily.ts` 的解析邏輯完整整合，無需外部依賴。
* **高效續傳**：匯入前一次性載入「已存在日期」至記憶體 `Set`，處理時以快速比對跳過已匯入檔案。
* **精準過濾**：自檔案系統層級即過濾早於 `--from-date` 的檔案，避免不必要 I/O。
* **資料稽核**：匯入完成後自動稽核新資料；若發現 `StockSymbol` 總表中不存在的新代號，會在終端印出 **警告**，提醒上游資料有變動需處理。

**使用方式**：

1. 於 `package.json` 新增 script：

   ```json
   {
     "scripts": {
       "import:market-data": "tsx scripts/004_import_market_data.ts"
     }
   }
   ```

2. 立即執行：

   * **預設（匯入昨天及之後）**：

     ```bash
     npm run import:market-data -- <path/to/twse_daily_data>
     ```
   * **指定起始日期**：

     ```bash
     npm run import:market-data -- <path/to/twse_daily_data> --from-date=20250901
     ```
   * **指定起始月份**：

     ```bash
     npm run import:market-data -- <path/to/twse_daily_data> --from-month=202509
     ```
   * **指定起始年份（大量補全歷史）**：

     ```bash
     npm run import:market-data -- <path/to/twse_daily_data> --from-year=2024
     ```

> **注意**：`npm run` 後的 `--` **必填**，用以確保 `--from-date` 等參數正確傳遞至 `tsx` 腳本。

---

## 3) 輔助診斷腳本（建議保留）

### `verify_twse_daily_files_completeness.ts`（原 `audit_files.ts`）

* **作用**：稽核原始 TWSE CSV 檔案是否存在 **日期缺口**。
* **使用時機**：懷疑資料來源不完整、或批次補料前先行檢查。

### `diagnose-company-coverage.ts`（原 `diagnose_missing_companies.ts`）

* **作用**：診斷 `Company` 資料庫相較官方上市櫃名單的 **覆蓋缺漏**。
* **使用時機**：當 `003_backfill_company_ids.ts` 報告大量無法關聯的公司時，用於快速定位問題根源。

---

## 常見 QA 與最佳實務

* **Q：初始化腳本可以重跑嗎？**
  **A**：可以。所有初始化腳本皆具備 **冪等性**（`upsert` / `skipDuplicates`）。

* **Q：為什麼 004 會跳過部分檔案？**
  **A**：腳本會在記憶體載入「已匯入日期清單」，並在檔案處理前比對；若已存在，將 **直接略過**，用以支援 **中斷續傳** 與 **重複執行**。

* **Q：如何處理匯入後出現的「新代號」警告？**
  **A**：代表上游資料出現新的股票代號，請回頭更新 `StockSymbol` 總表（可再跑一次 `002`，或補入特定代號）並重新執行匯入。

* **Q：大量歷史回補建議怎麼做？**
  **A**：使用 `--from-year` 自較早年份開始；先以 **輔助診斷腳本** 稽核檔案完整性，確認無日期缺口再一次性回補。

---

## 版本與變更紀錄

* 2025-10-03 (v1.1.0)
    * [重構] 將原本分散的 import_twse_daily.ts, seed_symbols_from_prices.ts, backfill_company_ids.ts 等腳本，整合成清晰的「一次性初始化」與「常態化更新」流程。
    * [新增] 建立全新的 004_import_market_data.ts 整合腳本，具備高效續傳、精準日期過濾與資料稽核功能。
    * [文件] 撰寫完整的資料匯入流程與操作指南。
    * [刪除] retry_failed.ts、import_twse_daily
    * [重命名] import_data.ts -> 001_import_company_data.ts、seed_symbols_from_prices -> 002_seed_stock_symbols.ts、backfill_company_ids.ts -> 003_backfill_company_ids.ts、audit_files.ts -> diagnose_missing_companies.ts

* 2025-09-24 (v1.0.2)
    * [新增] seed_symbols_from_prices.ts、seed_symbols_from_prices.ts, backfill_company_ids.ts 等
* 2025-09-04 (v1.0.1)
    * [新增] import_twse_daily.ts
* 2025-07-31 (v1.0.0)
    * [新增] import_data.ts （現已改名爲 001_import_company_data.ts)

---
