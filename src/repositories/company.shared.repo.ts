import { Prisma, PrismaClient } from '@prisma/client';

export type Db = PrismaClient | Prisma.TransactionClient;

/** Info: (20250815 - Tzuhan) 依公司清單抓每家公司最近 N 筆走勢（升冪回傳） */
export type TrendRow = { companyId: number; date: string; close: string };
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
export type FlagRow = { companyId: number; green: number; red: number };
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

export type CompanyCardBaseRow = {
  id: number;
  name: string;
  registration_no: string;
  status: string | null;
  foreign_company_name: string | null;
  address: string | null;
  logo_url: string | null;
};

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
