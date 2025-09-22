import { Prisma, PrismaClient } from '@prisma/client';

export type Db = PrismaClient | Prisma.TransactionClient;

/** Info: (20250815 - Tzuhan) 依公司清單抓每家公司最近 N 筆走勢（升冪回傳） */
export type TrendRow = { companyId: number; date: string; close: string };

type TrendPriceRow = {
  stockSymbolId: number;
  date: Date;
  close: Prisma.Decimal;
};

export async function repoFetchTrends(
  db: Db,
  companyIds: number[],
  perCompanyLimit: number
): Promise<TrendRow[]> {
  if (companyIds.length === 0) return [];

  // Info: (20250922 - Tzuhan) 1. 建立 companyId -> symbolId 的對應
  const symbols = await db.stockSymbol.findMany({
    where: { company_id: { in: companyIds } },
    select: { id: true, company_id: true },
  });

  const companyIdToSymbolIdMap = new Map<number, number>();
  symbols.forEach((s) => {
    if (s.company_id) {
      companyIdToSymbolIdMap.set(s.company_id, s.id);
    }
  });

  const stockSymbolIds = Array.from(companyIdToSymbolIdMap.values());
  if (stockSymbolIds.length === 0) return [];

  // Info: (20250922 - Tzuhan) 2. 查詢價格
  const prices = await db.$queryRaw<TrendPriceRow[]>`
    WITH ranked AS (
      SELECT
        mdp.stock_symbol_id AS "stockSymbolId",
        mdp.date,
        mdp.close_price AS "close",
        ROW_NUMBER() OVER (PARTITION BY mdp.stock_symbol_id ORDER BY mdp.date DESC) AS rn
      FROM market_daily_price mdp
      WHERE mdp.stock_symbol_id IN (${Prisma.join(stockSymbolIds)}) AND mdp.close_price IS NOT NULL
    )
    SELECT "stockSymbolId", "date", "close"
    FROM ranked
    WHERE rn <= ${perCompanyLimit}
    ORDER BY "stockSymbolId", "date" ASC;
  `;

  // Info: (20250922 - Tzuhan) 3. [修正處] 建立反向的 symbolId -> companyId 對應
  const symbolIdToCompanyIdMap = new Map<number, number>();
  companyIdToSymbolIdMap.forEach((symbolId, companyId) => {
    symbolIdToCompanyIdMap.set(symbolId, companyId);
  });

  // Info: (20250922 - Tzuhan) 4. 轉換為最終的 TrendRow[] 格式
  return prices.map((p) => ({
    companyId: symbolIdToCompanyIdMap.get(p.stockSymbolId)!,
    date: p.date.toISOString(),
    close: p.close.toString(),
  }));
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
