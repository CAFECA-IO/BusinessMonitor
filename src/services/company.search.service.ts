import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { TrendPoint, CompanyCard } from '@/types/company';
import { makePaginated } from '@/types/common';
import { analyzeQuery, isImprobableQuery } from '@/lib/utils';
import {
  CompanySqlRow,
  repoFetchCompanies,
  repoFetchFlags,
  repoFetchTrends,
} from '@/repositories/company.search.repo';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

function buildMarket(points: TrendPoint[]): {
  last: string | null;
  change: string | null;
  changePct: string | null;
  sparkline: TrendPoint[];
} {
  const n = points.length;
  if (n === 0) return { last: null, change: null, changePct: null, sparkline: [] };
  const last = Number(points[n - 1].close);
  const prev = n > 1 ? Number(points[n - 2].close) : null;
  if (prev == null) return { last: String(last), change: null, changePct: null, sparkline: points };
  const diff = last - prev;
  const pct = prev !== 0 ? (diff / prev) * 100 : 0;
  return {
    last: String(last),
    change: diff.toFixed(2),
    changePct: pct.toFixed(2),
    sparkline: points,
  };
}

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

  const items: CompanyCard[] = companies.map((c) => {
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

  const total = companies[0].total;
  return makePaginated(items, total, curPage, curPageSize);
}
