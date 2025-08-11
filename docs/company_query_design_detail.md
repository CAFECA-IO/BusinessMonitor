這套「`registration_no` 精確/前綴 + `name` trigram + 權重排序」對**單一 Postgres、無額外基礎建設**的場景，是很好的起手式與實務最佳解之一。它理由清楚、可觀測（EXPLAIN）、可滾動擴充，風險低、維運成本低。下面把**為什麼**、**邊界**、**可升級方向**一次講清楚。

# 為什麼這樣設計

1. **符合查詢習慣**

   * 使用者通常會：
     a) 直接輸入統編（精確或前綴），或
     b) 輸入公司名（含錯字/異體/多字節）。
   * 因此以「統編命中權重最高、前綴次之、名稱相似度排序」回應真實使用情境。

2. **trigram 在中文/多字節上成熟、免分詞**

   * 不需要上 tokenizer（中文分詞在 PG 要額外安裝 `zhparser`）。trigram 對中文公司名、外文縮寫、數字混排都能 work，維運成本極低。

3. **可解釋且可量測**

   * `%`/`similarity()` 是白箱，EXPLAIN 很清楚看得出是否命中 `gin_trgm_ops`，可以附前/後截圖驗證成效（你 Issue 內要求的流程）。

4. **效能/成本平衡**

   * `GIN (name gin_trgm_ops)` + `btree (registration_no)` 就能把大多數查詢壓到可接受延遲，無需外掛搜索引擎、無同步成本。

> 架構對應目前的資料表也很直觀：`Company.name`、`Company.registrationNo` 均已存在，索引與排序就貼著這兩欄做（見 schema 的 `Company` 定義）

---

# 這方法有哪些邊界？

* **極短關鍵字**（1 個字）trigram 訊雜，已用 `ILIKE '%q%'` 兜住，但相關性會下降。
* **全站計數 `COUNT(*)` 昂貴**：對巨量資料 + trigram 條件，`COUNT` 仍可能慢（雖然查詢集已縮小）。
* **中文公司尾綴影響相似度**：像「○○股份有限公司」「○○有限公司」這些尾綴會稀釋相似度。
* **排序多條件下的游標分頁**：用 `similarity()` 作排序時，要小心穩定性（tie-breakers）。

---

# 可以微調的「同路線最佳化」

> 不動技術棧，只調整 SQL/索引/常數。

1. **前綴查詢的索引命中**

   * 既然統編是數字字串，`ILIKE '123%'` 可改為 `LIKE '123%'`（不需要大小寫），並把索引建為：
     `CREATE INDEX idx_company_regno_pattern ON company (registration_no text_pattern_ops);`
     讓前綴掃描更穩定命中（不同區域性排序下更保險）。

2. **設定 trigram 門檻**

   * 在連線層設定 `SET pg_trgm.similarity_threshold = 0.3;`（或用 `SELECT set_limit(0.3)`），依你的資料分布調參，能減少不相關比對、降低排序集大小。

3. **正規化名稱欄位 + 函式索引**

   * 加一個**產生欄位** `search_name`（去尾綴、全形半形、空白/符號），索引建在 `search_name gin_trgm_ops`：

     * 例：`search_name = regexp_replace(name, '(股份有限公[司]*|有限公[司]*|公司)$', '', 'g')`
     * 中文公司名搜尋體感會再好一截（關聯度更準）。

4. **分頁策略改「hasMore」**

   * 若 `COUNT` 貴，可改「多抓一筆」的 cursor 分頁，回 `{ items, hasMore }`；或先期只在頁碼 1 回 `total`。

5. **穩定排序鍵**

   * 目前 `ORDER BY` 有 `similarity()`，再補 `, c.id ASC` 已經不錯；若走 cursor，讓前端攜帶 `(lastSimilarity, lastId)` 當游標更穩定。

---

# 何時要升級設計？（需求升級 → 方案升級）

> 有明確「更好」但成本更高的設計，對應這些情境再上。

1. **要中文分詞、同義詞、高亮、拼字容錯更多**

   * 上**專用搜尋引擎**（Meilisearch/Typesense/Elasticsearch）。
   * 優點：更好的召回/排序、同義字典、高亮。
   * 成本：資料同步、併發一致性、監控備援。

2. **只在 Postgres、但想要分詞**

   * 裝 `zhparser` + `tsvector`，把 `name`（與別名/外文名）轉 `tsvector`，`GIN` 索引，排序可用 `ts_rank_cd`。
   * 常見做法：`(trigram OR FTS)` 聯合條件，雙保險召回。
   * 成本：需安裝擴充、調詞典與字典更新流程。

3. **多欄位多來源一致性排序**

   * 建「**物化檢索表**」或「檢索 View」：把正規化後的 `search_name`、別名、ticker、產業代碼字串拼接成一個「檢索欄位」，對那個欄位建 `trgm GIN`，減少跨表 JOIN 成本（適合高 QPS）。

---

# 安全性與程式碼層面（你這版 OK，但可再收）

* Prisma `$queryRaw` 改善點：

  * 目前模板字符串的**動態值都有綁參**，SQL 注入是安全的；
  * 但若之後要拼**動態欄位/排序方向**，請用白名單組裝，不要直接插字串。
* Service 隔離好：Repository 盡量只管「查什麼、怎麼排」，分頁/輸出 shape 交給 Service。
* 設定**statement\_timeout**（例如 800ms–1500ms）避免惡意超長關鍵字拖慢 DB。
* 加入**輸入正規化**（去空白、全半形、尾綴）與**長度限制**（例如 `q` 長度 1–64）。

---

# 總結

* **現在這版 = 對齊需求的最佳實踐**：低成本、好維運、表現好。
* **馬上可做的小升級**：`text_pattern_ops`、`similarity_threshold`、`search_name` + 函式索引、cursor 分頁。
* **需求成長再演進**：PG FTS（zhparser）或專用搜索引擎。
