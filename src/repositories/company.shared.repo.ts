import { Prisma, PrismaClient } from '@prisma/client';

export type Db = PrismaClient | Prisma.TransactionClient;

/** Info: (20250815 - Tzuhan) 依公司清單抓每家公司最近 N 筆走勢（升冪回傳） */
export type TrendRow = { companyId: number; date: string; close: string };

type TrendPriceRow = {
  stockSymbol: string;
  date: Date;
  close: Prisma.Decimal;
};

export async function repoFetchTrends(
  db: Db,
  companyIds: number[],
  perCompanyLimit: number
): Promise<TrendRow[]> {
  if (companyIds.length === 0) return [];

  // Info: (20251003 - Tzuhan) 步驟 1: 建立 companyId <-> symbol 的雙向對應 Map
  const symbols = await db.stockSymbol.findMany({
    where: { company_id: { in: companyIds } },
    select: { symbol: true, company_id: true },
  });

  const companyIdToSymbolMap = new Map<number, string>();
  const symbolToCompanyIdMap = new Map<string, number>();
  symbols.forEach((s) => {
    if (s.company_id) {
      companyIdToSymbolMap.set(s.company_id, s.symbol);
      symbolToCompanyIdMap.set(s.symbol, s.company_id);
    }
  });

  const stockSymbols = Array.from(companyIdToSymbolMap.values());
  if (stockSymbols.length === 0) return [];

  // Info: (20251007 - Tzuhan) 步驟 2: 執行 SQL 查詢
  const prices = await db.$queryRaw<TrendPriceRow[]>`
    WITH ranked AS (
      SELECT
        mdp.symbol AS "stockSymbol",
        mdp.date,
        mdp.close_price AS "close",
        ROW_NUMBER() OVER (PARTITION BY mdp.symbol ORDER BY mdp.date DESC) AS rn
      FROM market_daily_price mdp
      WHERE mdp.symbol IN (${Prisma.join(stockSymbols)}) AND mdp.close_price IS NOT NULL
    )
    SELECT "stockSymbol", "date", "close"
    FROM ranked
    WHERE rn <= ${perCompanyLimit}
    ORDER BY "stockSymbol", "date" ASC;
  `;

  // Info: (20251003 - Tzuhan) 步驟 3: 將查詢結果轉換為最終的 TrendRow[] 格式
  return prices.map((p) => ({
    // Info: (20251003 - Tzuhan) 使用 symbolToCompanyIdMap 將 symbol 轉換回 companyId
    companyId: symbolToCompanyIdMap.get(p.stockSymbol)!,
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

/** Info: (20250820 - Tzuhan) Company Card 所需的基本欄位 */
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
