import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { TrendPoint, CompanyCard } from '@/types/company';
import { makePaginated } from '@/types/common';
import { analyzeQuery, isImprobableQuery } from '@/lib/utils';
import { repoFetchCompanies } from '@/repositories/company.search.repo';
import { repoFetchFlags, repoFetchTrends, CompanySqlRow } from '@/repositories/company.shared.repo';
import { hydrateCompanyCards } from '@/services/company.card.service';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export async function searchCompanies(q: string, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  if (!q?.trim()) throw new AppError(ApiCode.VALIDATION_ERROR, 'q is required');

  const curPage = clamp(page, 1, Number.MAX_SAFE_INTEGER);
  const curPageSize = clamp(pageSize, 1, MAX_PAGE_SIZE);
  const offset = (curPage - 1) * curPageSize;

  const meta = analyzeQuery(q);
  // Info: (20250815 - Tzuhan) 可疑字串 → 400
  if (meta.suspicious) {
    throw new AppError(ApiCode.VALIDATION_ERROR, 'Query contains illegal patterns');
  }
  // Info: (20250815 - Tzuhan) 極低機率字串 → 404（避免 trigram 慢查）
  if (isImprobableQuery(meta)) {
    throw new AppError(ApiCode.NOT_FOUND, 'No companies found');
  }

  // Info: (20250815 - Tzuhan) ① 公司清單（含 total）
  const companies: CompanySqlRow[] = await repoFetchCompanies(prisma, meta, offset, curPageSize);
  if (companies.length === 0) {
    throw new AppError(ApiCode.NOT_FOUND, 'No companies found');
  }
  const companyIds = companies.map((c) => c.id);

  // Info: (20250815 - Tzuhan) ② 走勢 + ③ 旗幟（併發）
  const [trends, flags] = await Promise.all([
    repoFetchTrends(prisma, companyIds, 30),
    repoFetchFlags(prisma, companyIds),
  ]);

  // Info: (20250815 - Tzuhan) 彙整
  const trendMap = new Map<number, TrendPoint[]>();
  for (const t of trends) {
    const arr = trendMap.get(t.companyId) ?? [];
    arr.push({ date: t.date, close: t.close });
    trendMap.set(t.companyId, arr);
  }

  const flagMap = new Map<number, { green: number; red: number }>();
  for (const f of flags) flagMap.set(f.companyId, { green: f.green, red: f.red });

  const items: CompanyCard[] = await hydrateCompanyCards(prisma, companies);

  const total = companies[0].total;
  return makePaginated(items, total, curPage, curPageSize);
}
