import { Prisma, PrismaClient } from '@prisma/client';
import { escapeLike } from '@/lib/utils';
import type { QueryMeta } from '@/lib/utils'; // Info: (20250813 - Tzuhan) analyzeQuery 的回傳型別

export type CompanySqlRow = {
  id: number;
  name: string;
  registration_no: string;
  status: string | null;
  foreign_company_name: string | null;
  address: string | null;
  logo_url: string | null;
  total: number;
};

export type TrendRow = { companyId: number; date: string; close: string };
export type FlagRow = { companyId: number; green: number; red: number };

type Db = PrismaClient | Prisma.TransactionClient;

/** Info: (20250813 - Tzuhan) 公司清單（含 total 與排序相關欄位） */
export async function repoFetchCompanies(
  db: Db,
  meta: QueryMeta,
  offset: number,
  limit: number
): Promise<CompanySqlRow[]> {
  const likeLiteral = `%${escapeLike(meta.normalized)}%`;
  const regPrefix = meta.digitsOnly ? `${escapeLike(meta.regNoCandidate!)}%` : null;
  const useILIKE = meta.isShort || meta.hasChinese || meta.normalized.length > 24;

  const whereClause = useILIKE
    ? Prisma.sql`
      ( c.name ILIKE ${likeLiteral} ESCAPE '\\'
        OR ${
          meta.digitsOnly
            ? Prisma.sql`(c.registration_no LIKE ${regPrefix} ESCAPE '\\' OR c.registration_no = ${meta.regNoCandidate!})`
            : Prisma.sql`false`
        }
      )`
    : Prisma.sql`
      ( c.name % ${meta.normalized}
        OR ${
          meta.digitsOnly
            ? Prisma.sql`(c.registration_no LIKE ${regPrefix} ESCAPE '\\' OR c.registration_no = ${meta.regNoCandidate!})`
            : Prisma.sql`false`
        }
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
          WHEN ${meta.digitsOnly ? Prisma.sql`f.registration_no = ${meta.regNoCandidate!}` : Prisma.sql`false`} THEN ${meta.isLikelyRegNo ? 4 : 3}
          WHEN ${meta.digitsOnly ? Prisma.sql`f.registration_no LIKE ${regPrefix}` : Prisma.sql`false`} THEN ${meta.isLikelyRegNo ? 3 : 2}
          ELSE 1
        END AS score,
        ${useILIKE ? Prisma.sql`NULL::double precision AS sim` : Prisma.sql`similarity(f.name, ${meta.normalized}) AS sim`}
      FROM filtered f
    ),
    paged AS (
      SELECT * FROM scored
      ORDER BY score DESC, ${meta.isShort || meta.hasChinese ? Prisma.sql`name ASC` : Prisma.sql`sim DESC`}, id ASC
      LIMIT ${limit} OFFSET ${offset}
    )
    SELECT p.id, p.name, p.registration_no, p.status, p.foreign_company_name, p.address, p.logo_url,
           (SELECT COUNT(*)::int FROM filtered) AS total
    FROM paged p;
  `;
  return companies;
}

/** Info: (20250815 - Tzuhan) 依公司清單抓每家公司最近 N 筆走勢（升冪回傳） */
export async function repoFetchTrends(
  db: Db,
  companyIds: number[],
  perCompanyLimit: number
): Promise<TrendRow[]> {
  if (companyIds.length === 0) return [];
  return db.$queryRaw<TrendRow[]>`
    WITH ranked AS (
      SELECT sp.company_id AS "companyId",
             sp.date::text AS "date",
             sp.close_price::text AS "close",
             ROW_NUMBER() OVER (PARTITION BY sp.company_id ORDER BY sp.date DESC) AS rn
      FROM stock_price sp
      WHERE sp.company_id IN (${Prisma.join(companyIds)})
    )
    SELECT "companyId","date","close"
    FROM ranked
    WHERE rn <= ${perCompanyLimit}
    ORDER BY "companyId","date" ASC;
  `;
}

/** Info: (20250815 - Tzuhan) 依公司清單抓紅綠旗幟統計 */
export async function repoFetchFlags(db: Db, companyIds: number[]): Promise<FlagRow[]> {
  if (companyIds.length === 0) return [];
  return db.$queryRaw<FlagRow[]>`
    SELECT rf.company_id AS "companyId",
           SUM(CASE WHEN rf.flag_value > 0 THEN 1 ELSE 0 END)::int AS "green",
           SUM(CASE WHEN rf.flag_value < 0 THEN 1 ELSE 0 END)::int AS "red"
    FROM risk_flag rf
    WHERE rf.company_id IN (${Prisma.join(companyIds)})
    GROUP BY rf.company_id;
  `;
}
