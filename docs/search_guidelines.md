# BusinessMonitor 搜尋安全與效能指引

> 角色視角：專案經理／高級全端工程師（Next.js + TypeScript + Prisma + PostgreSQL）

本文件彙整 **/api/v1/companies/search** 與後續搜尋功能的安全、效能與維運規範。目標是在不引入 Redis 的前提下，兼顧 **SQL Injection 防護**、**可預期延遲**、**易維護**。

---

## 1) 威脅模型與目標

**威脅模型**

* value 位 SQL 注入（如 `' OR 1=1 --`）
* 語法繞過：全形字、零寬字元、Null byte、大小寫混合
* DoS 式慢查（超長英數 + `%`/trigram）
* 二次注入（DB 讀出的值被再拼 SQL）

**目標**

* 所有使用者輸入只以 **參數化** 形式進 DB
* 在進 DB 前先做 **字串清理、黑名單短路**
* 針對不同輸入做 **查詢策略分流**（ILIKE vs `%`；digitsOnly 才查統編）
* 有對應 **索引**，確保 P95 延遲穩定

---

## 2) 輸入清理管線（Sanitization Pipeline）

**順序**（皆在打 DB 前執行）

1. `stripZeroWidth`：移除零寬字元（`\u200B-\u200D`、`\u2060`、`\uFEFF`）
2. `toHalfWidth`：全形轉半形（例：`ＯＲ`→`OR`、`＝`→`=`）
3. `trim + 去引號`：移除前後空白與包裹引號
4. `stripCompanySuffix`：去除公司尾綴（股份有限公司／有限公司／公司）
5. `escapeLike`：僅在需 LIKE 時轉義 `\\`、`%`、`_`
6. `analyzeQuery`：產生判斷旗標

   * `digitsOnly`（是否純數字）
   * `hasChinese`
   * `isShort`（長度 < 2）
   * `suspicious`（是否命中黑名單）
   * `isLikelyRegNo`（是否像 8 碼統編）

**黑名單（suspicious）** 任何命中 → **400**

```
/(\x00|--|\/\*|\*\/|;|=|\bOR\b|\bAND\b|\|\||&&)/i
```

**極低機率字串（improbable）** → **404**（不打 DB）

* 條件：`!hasChinese && !digitsOnly && length >= 24 && /\d{6,}/`

---

## 3) 查詢策略分流（Decision Matrix）

| 條件                      | 名稱比對策略           | 統編條件                                                        |
| ----------------------- | ---------------- | ----------------------------------------------------------- |
| 中文 或 長英數（>24） 或 isShort | `ILIKE '%...%'`  | 僅 `digitsOnly` 時使用 `registration_no LIKE 'xxx%' OR = 'xxx'` |
| 短英文（≤24）且需更好相似度         | `%`（trigram 相似度） | 同上                                                          |

> 注意：**僅在 `digitsOnly` 為真時**，才加入任何 `registration_no` 條件，避免把一般字串裡的數字誤帶入。

---

## 4) Prisma Raw SQL 撰寫規範

### ✅ 應該這樣做

* 所有動態值以 `${}` 帶入，交由 Prisma 參數綁定
* `Prisma.join([...], ' OR ')` 的分隔符用 **字串**（避免 TS 2345）
* 根據 `digitsOnly` 條件式插入子句；不成立時改為 `false`

**範例（片段）**

```ts
const likeLiteral = `%${escapeLike(meta.normalized)}%`;
const useILIKE = meta.isShort || meta.hasChinese || meta.normalized.length > 24;

const whereClause = useILIKE
  ? Prisma.sql`
    ( c.name ILIKE ${likeLiteral} ESCAPE '\\'
      OR ${meta.digitsOnly
          ? Prisma.sql`(c.registration_no LIKE ${`${escapeLike(meta.regNoCandidate!)}%`} ESCAPE '\\' OR c.registration_no = ${meta.regNoCandidate!})`
          : Prisma.sql`false`
      }
    )`
  : Prisma.sql`
    ( c.name % ${meta.normalized}
      OR ${meta.digitsOnly
          ? Prisma.sql`(c.registration_no LIKE ${`${escapeLike(meta.regNoCandidate!)}%`} ESCAPE '\\' OR c.registration_no = ${meta.regNoCandidate!})`
          : Prisma.sql`false`
      }
    )`;
```

### ❌ 不應該這樣做

* 直接字串拼接使用者輸入
* 在 **識別子位置**（欄位名/表名/排序）插入使用者輸入
* 將使用者輸入放進 `ORDER BY ${userValue}`、`SELECT ${userValue}`、`FROM ${userValue}`

若未來需要動態排序，請採 **白名單映射**：

```ts
const ORDER_COLUMNS: Record<string, Prisma.Sql> = {
  name: Prisma.sql`name`,
  regno: Prisma.sql`registration_no`,
  created: Prisma.sql`id`,
};
const orderBy = ORDER_COLUMNS[req.query.sort as string] ?? ORDER_COLUMNS.name;
```

---

## 5) 索引策略（PostgreSQL）

> 目的：讓 `ILIKE '%...%'` 與（可選的）`%` 相似度運算子、以及 `registration_no` 前綴查都能吃到索引。

```sql
-- 啟用 trigram
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- name：GIN + trigram（大小寫敏感／不轉 lower 也可）
CREATE INDEX IF NOT EXISTS idx_company_name_trgm
  ON company USING gin (name gin_trgm_ops);

-- registration_no：前綴/等值快速查
CREATE INDEX IF NOT EXISTS idx_company_registration_no_like
  ON company (registration_no text_pattern_ops);
```

> 生產環境上線建議用 `CREATE INDEX CONCURRENTLY`，不要放在 Prisma Migrate 的交易中；改為 DBA 變更腳本或維運流程。

---

## 6) 錯誤映射

| 情境                                    | 例外                 | HTTP                      |
| ------------------------------------- | ------------------ | ------------------------- |
| 缺少必要參數 / 命中黑名單（含 Null byte/全形還原/零寬還原） | `VALIDATION_ERROR` | **400**                   |
| 極低機率字串（不打 DB）或查無資料                    | `NOT_FOUND`        | **404**                   |
| DB 逾時（若 DB 有全域 timeout）               | 轉為 `NOT_FOUND`     | **404**                   |
| 其他非預期錯誤                               | 保留                 | **500**（由全域 handler 統一處理） |

---

## 7) 觀測與風險控制

* **Rate Limit**：以 IP/User 為 key 的速率限制（API Gateway 或中介層）
* **審計 Log**：對 `suspicious=true` 的請求記錄 IP、userId、UA、原字串、時間
* **查詢品質**：定期以 `EXPLAIN (ANALYZE, BUFFERS)` 檢視是否命中索引
* **索引維運**：觀察索引膨脹與命中率；必要時 REINDEX / 調整策略

---

## 8) 測試清單（Integration, Black-box）

**正常路徑**

* 400：缺少必要參數 `q`（空字串）
* 200：中文關鍵字（`台積電`）
* 200：統編全等排第一（以 `IT_SAMPLE_REGNO` 驗證）

**攻擊變體**（預期 400）

* 分號與註解：`"'; DROP TABLE company; --"`
* 邏輯短路：`"' OR 1=1 --"`
* 大小寫混合 + 塊註解：`") oR 1=1 /* hack */"`
* 雙管道與 AND：`"a || true AND 'b'='b'"`
* Null byte：`"abc\x00def"`
* **全形關鍵字**：`" ＯＲ 1＝1 --"`（toHalfWidth 攔截）
* **零寬繞過**：`"o\u200Br 1=1"`（stripZeroWidth 攔截）

**邊界**

* 長英數非中文（非極低機率）不應 5xx 或超時：`enterprise_monitor_search_keyword`（200 或 404 皆可）

> 以上測試樣本已在 `src/__tests__/api/companies.server.test.ts` 落地，可作為新增搜尋 API 的範本。

---

## 9) 可複用的工具函式（片段）

```ts
// 去零寬：\u200B-\u200D, \u2060, \uFEFF
export const stripZeroWidth = (s: string) => s.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '');
export const toHalfWidth = (s: string) => s.replace(/[！-～]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xFEE0));
export const stripCompanySuffix = (s: string) => s.replace(/(股份有限公?司|有限公?司|公司)$/g, '');
export const escapeLike = (s: string) => s.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');

export type QueryMeta = {
  normalized: string; digitsOnly: boolean; hasChinese: boolean; isShort: boolean; isLikelyRegNo: boolean; suspicious: boolean;
};

export function analyzeQuery(raw: string): QueryMeta {
  const clean0 = stripZeroWidth(raw);
  const clean = stripCompanySuffix(toHalfWidth(clean0.trim().replace(/^["']+|["']+$/g, '')));
  const digitsOnly = /^\d+$/.test(clean);
  const meta: QueryMeta = {
    normalized: clean,
    digitsOnly,
    hasChinese: /[\u4e00-\u9fa5]/.test(clean),
    isShort: clean.length < 2,
    isLikelyRegNo: /^\d{8}$/.test(clean),
    suspicious: /(\x00|--|\/\*|\*\/|;|=|\bOR\b|\bAND\b|\|\||&&)/i.test(clean),
  };
  return meta;
}

export function isImprobableQuery(meta: QueryMeta): boolean {
  const s = meta.normalized;
  return !meta.hasChinese && !meta.digitsOnly && s.length >= 24 && /\d{6,}/.test(s);
}
```

---

## 10) 變更紀錄（Changelog）

* 2025-08-15：新增零寬字元清理與全形關鍵字測試；補齊索引建議；完善黑名單；完成整合測試覆蓋。

---

## 11) 維護者 Checklist（速查）

* [ ] 使用者輸入只在 `${...}` 參數位置
* [ ] 先 `stripZeroWidth` → `toHalfWidth` → `escapeLike` → `analyzeQuery`
* [ ] 命中黑名單 → 400；極低機率 → 404
* [ ] `digitsOnly` 才加入 `registration_no` 條件
* [ ] 中文/長英數 → `ILIKE`；短英文可用 `%`（需索引）
* [ ] 已建：`GIN(name gin_trgm_ops)`、`BTREE(registration_no text_pattern_ops)`
* [ ] 排序/欄位動態化走白名單
* [ ] 可疑請求寫審計 log；API 做 rate limit
* [ ] EXPLAIN 觀察是否命中索引；調整必要索引
