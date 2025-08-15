-- 啟用 pg_trgm extension（trigram 模糊搜尋）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- name 欄位用 GIN + trigram
DROP INDEX IF EXISTS idx_company_name;
CREATE INDEX idx_company_name_trgm
  ON company USING gin (name gin_trgm_ops);

-- representative 欄位用 GIN + trigram
DROP INDEX IF EXISTS idx_company_representative;
CREATE INDEX idx_company_representative_trgm
  ON company USING gin (representative gin_trgm_ops);

-- 讓 registration_no 的前綴查與等值更快
DROP INDEX IF EXISTS idx_company_registration_no_like;
CREATE INDEX idx_company_registration_no_like
  ON company (registration_no text_pattern_ops);

-- parent_reg_no 用 B-Tree（精確查詢）
DROP INDEX IF EXISTS idx_company_parent_reg_no;
CREATE INDEX idx_company_parent_reg_no
  ON company (parent_reg_no);

-- business_items 用 GIN + jsonb_path_ops（JSON 快速查 key/value）
DROP INDEX IF EXISTS idx_company_business_items;
CREATE INDEX idx_company_business_items_gin
  ON company USING gin (business_items jsonb_path_ops);
