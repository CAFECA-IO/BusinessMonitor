import { Prisma } from '@prisma/client';
import { escapeLike } from '@/lib/utils';
import type { QueryMeta } from '@/lib/utils'; // Info: (20250813 - Tzuhan) analyzeQuery 的回傳型別
import { Db, CompanySqlRow } from '@/repositories/company.shared.repo';

/** Info: (20250813 - Tzuhan) 公司清單（含 total 與排序相關欄位） */
export async function repoFetchCompanies(
  db: Db,
  meta: QueryMeta,
  offset: number,
  limit: number
): Promise<CompanySqlRow[]> {
  const likeLiteral = `%${escapeLike(meta.normalized)}%`;

  // Info: (20251215 - Tzuhan) 統一編號前綴搜尋
  const regPrefix = meta.digitsOnly ? `${escapeLike(meta.regNoCandidate!)}%` : null;

  // Info: (20251215 - Tzuhan) 股票代號查詢 (假設使用者輸入的就是代號)
  // 因為 meta.normalized 已經是處理過的字串，我們可以用它來做 symbol 的模糊或精確比對
  const symbolQuery = meta.normalized;

  const useILIKE = meta.isShort || meta.hasChinese || meta.normalized.length > 24;

  // Info: (20251215 - Tzuhan)
  // 核心查詢邏輯擴充：
  // 1. 公司名稱 (Name) - 原有邏輯
  // 2. 統一編號 (Registration No) - 原有邏輯
  // 3. 股票代號 (Stock Symbol) - [新增] 使用 EXISTS 子查詢來檢查關聯表
  const whereClause = useILIKE
    ? Prisma.sql`
      ( 
        -- Info: (20251215 - Tzuhan) 1. 名稱模糊搜尋
        c.name ILIKE ${likeLiteral} ESCAPE '\\'
        
        -- Info: (20251215 - Tzuhan) 2. 統一編號搜尋 (僅當輸入為純數字時)
        OR ${
          meta.digitsOnly
            ? Prisma.sql`(c.registration_no LIKE ${regPrefix} ESCAPE '\\' OR c.registration_no = ${meta.regNoCandidate!})`
            : Prisma.sql`false`
        }

        -- Info: (20251215 - Tzuhan) 3. [新增] 股票代號搜尋
        -- Info: (20251215 - Tzuhan) 檢查是否存在關聯的 stock_symbol 符合查詢條件
        OR EXISTS (
          SELECT 1 FROM stock_symbol s 
          WHERE s.company_id = c.id 
          AND (
            s.symbol ILIKE ${likeLiteral} ESCAPE '\\' 
            OR s.symbol = ${symbolQuery}
          )
        )
      )`
    : Prisma.sql`
      ( 
        -- Info: (20251215 - Tzuhan) 1. 名稱 Trigram 搜尋
        c.name % ${meta.normalized}
        
        -- Info: (20251215 - Tzuhan) 2. 統一編號搜尋
        OR ${
          meta.digitsOnly
            ? Prisma.sql`(c.registration_no LIKE ${regPrefix} ESCAPE '\\' OR c.registration_no = ${meta.regNoCandidate!})`
            : Prisma.sql`false`
        }

        -- Info: (20251215 - Tzuhan) 3. [新增] 股票代號搜尋
        OR EXISTS (
          SELECT 1 FROM stock_symbol s 
          WHERE s.company_id = c.id 
          AND (
            s.symbol ILIKE ${likeLiteral} ESCAPE '\\' 
            OR s.symbol = ${symbolQuery}
          )
        )
      )`;

  // Info: (20250813 - Tzuhan) ① 先查公司清單（含 total），並帶出 address / logo_url
  const companies = await db.$queryRaw<CompanySqlRow[]>`
    WITH filtered AS (
      SELECT c.id, c.name, c.registration_no, c.status, c.foreign_company_name, c.address, c.logo_url
      FROM company c
      WHERE ${whereClause}
    ),
    scored AS (
      SELECT
        f.*,
        CASE
          -- Info: (20251215 - Tzuhan) 優先順序 1: 統一編號完全匹配 (最高分)
          WHEN ${meta.digitsOnly ? Prisma.sql`f.registration_no = ${meta.regNoCandidate!}` : Prisma.sql`false`} THEN ${meta.isLikelyRegNo ? 10 : 8}
          
          -- Info: (20251215 - Tzuhan) 優先順序 2: 股票代號完全匹配 (次高分)
          WHEN EXISTS (
            SELECT 1 FROM stock_symbol s 
            WHERE s.company_id = f.id AND s.symbol = ${symbolQuery}
          ) THEN 9
          
          -- Info: (20251215 - Tzuhan) 優先順序 3: 統一編號前綴匹配
          WHEN ${meta.digitsOnly ? Prisma.sql`f.registration_no LIKE ${regPrefix}` : Prisma.sql`false`} THEN ${meta.isLikelyRegNo ? 5 : 3}
          
          -- Info: (20251215 - Tzuhan) 優先順序 4: 股票代號部分匹配
           WHEN EXISTS (
            SELECT 1 FROM stock_symbol s 
            WHERE s.company_id = f.id AND s.symbol ILIKE ${likeLiteral} ESCAPE '\\'
          ) THEN 4

          -- Info: (20251215 - Tzuhan) 預設分數
          ELSE 1
        END AS score,
        ${useILIKE ? Prisma.sql`NULL::double precision AS sim` : Prisma.sql`similarity(f.name, ${meta.normalized}) AS sim`}
      FROM filtered f
    ),
    paged AS (
      SELECT * FROM scored
      -- Info: (20251215 - Tzuhan) 排序邏輯：先看分數(score)，再看名稱相似度(sim)，最後用 id 穩定排序
      ORDER BY score DESC, ${meta.isShort || meta.hasChinese ? Prisma.sql`name ASC` : Prisma.sql`sim DESC`}, id ASC
      LIMIT ${limit} OFFSET ${offset}
    )
    SELECT p.id, p.name, p.registration_no, p.status, p.foreign_company_name, p.address, p.logo_url,
           (SELECT COUNT(*)::int FROM filtered) AS total
    FROM paged p;
  `;
  return companies;
}
