import { prisma } from '@/lib/prisma';
import type { CompanyCardBaseRow, Db, TrendRow } from '@/repositories/company.shared.repo';
import { repoFetchTrends, repoFetchFlags } from '@/repositories/company.shared.repo';
import type { CompanyCard, TrendPoint } from '@/validators/company';
import { buildMarket } from '@/lib/market';

export async function hydrateCompanyCards(
  db: Db,
  baseRows: ReadonlyArray<CompanyCardBaseRow>,
  trendLimit = 30
): Promise<CompanyCard[]> {
  // Info: (20250815 - Tzuhan) ① 公司清單
  const ids = baseRows.map((r) => r.id);
  // Info: (20250815 - Tzuhan) ② 走勢 + ③ 旗幟（併發）
  const [trends, flags] = await Promise.all([
    repoFetchTrends(db, ids, trendLimit),
    repoFetchFlags(db, ids),
  ]);
  // Info: (20250815 - Tzuhan) 彙整
  const trendMap = new Map<number, TrendPoint[]>();
  trends.forEach((t: TrendRow) => {
    const arr = trendMap.get(t.companyId) ?? [];
    arr.push({ date: t.date, close: t.close });
    trendMap.set(t.companyId, arr);
  });

  const flagMap = new Map<number, { green: number; red: number }>();
  flags.forEach((f) => flagMap.set(f.companyId, { green: f.green, red: f.red }));

  return baseRows.map<CompanyCard>((c) => {
    const spark = trendMap.get(c.id) ?? [];
    const market = buildMarket(spark);
    const fr = flagMap.get(c.id) ?? { green: 0, red: 0 };
    return {
      id: c.id,
      name: c.name,
      registrationNo: c.registration_no,
      logoUrl: c.logo_url,
      status: c.status,
      foreignCompanyName: c.foreign_company_name,
      address: c.address,
      flags: fr,
      market,
    };
  });
}

/** Info: (20250819 - Tzuhan) 便利函式：直接用全域 prisma */
export async function hydrateCompanyCardsWithPrisma(
  baseRows: ReadonlyArray<CompanyCardBaseRow>,
  trendLimit = 30
) {
  return hydrateCompanyCards(prisma, baseRows, trendLimit);
}
