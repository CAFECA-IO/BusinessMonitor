import { prisma } from '@/lib/prisma';
import { findCompanies, countCompanies } from '@/repositories/company.repository';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { CompanyCard } from '@/validators';

type TrendRow = { companyId: number; date: string; close: string };
type IndicatorRow = { companyId: number; peRatio: string | null; marketCap: string | null };

export async function buildCompanyCards(
  items: {
    id: number;
    name: string;
    registrationNo: string;
    status?: string | null;
    foreignCompanyName?: string | null;
    logoUrl?: string | null;
  }[]
): Promise<CompanyCard[]> {
  if (items.length === 0) return [];

  const ids = items.map((i) => i.id);

  // Info: (20250812 - Tzuhan) 取每家公司最近 30 筆股價（用 window function），再依日期 ASC 回前端好畫線
  const trend = await prisma.$queryRaw<TrendRow[]>`
    WITH ranked AS (
      SELECT sp.company_id AS "companyId",
             sp.date::text   AS "date",
             sp.close_price::text AS "close",
             ROW_NUMBER() OVER (PARTITION BY sp.company_id ORDER BY sp.date DESC) AS rn
      FROM stock_price sp
      WHERE sp.company_id = ANY(${ids})
    )
    SELECT "companyId","date","close"
    FROM ranked
    WHERE rn <= 30
    ORDER BY "companyId", "date" ASC;
  `;

  // Info: (20250812 - Tzuhan) 取最新指標（distinct on）
  const indicators = await prisma.$queryRaw<IndicatorRow[]>`
    SELECT DISTINCT ON (mi.company_id)
           mi.company_id AS "companyId",
           mi.pe_ratio::text AS "peRatio",
           mi.market_cap::text AS "marketCap"
    FROM market_indicator mi
    WHERE mi.company_id = ANY(${ids})
    ORDER BY mi.company_id, mi."date" DESC;
  `;

  // Info: (20250812 - Tzuhan) 映射
  const trendMap = new Map<number, { date: string; close: string }[]>();
  for (const r of trend) {
    const arr = trendMap.get(r.companyId) ?? [];
    arr.push({ date: r.date, close: r.close });
    trendMap.set(r.companyId, arr);
  }

  const indMap = new Map<number, { peRatio: string | null; marketCap: string | null }>();
  for (const r of indicators)
    indMap.set(r.companyId, { peRatio: r.peRatio, marketCap: r.marketCap });

  return items.map((i) => {
    const ind = indMap.get(i.id);
    return {
      id: i.id,
      name: i.name,
      registrationNo: i.registrationNo,
      logoUrl: i.logoUrl ?? null,
      status: i.status ?? null,
      foreignCompanyName: i.foreignCompanyName ?? null,
      trend: trendMap.get(i.id) ?? [],
      peRatio: ind?.peRatio ?? null,
      marketCap: ind?.marketCap ?? null,
    };
  });
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export async function searchCompanies(q: string, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  const keyword = (q ?? '').trim();
  if (!keyword) throw new AppError(ApiCode.VALIDATION_ERROR, 'q is required');

  const curPage = clamp(Math.floor(page), 1, Number.MAX_SAFE_INTEGER);
  const curPageSize = clamp(Math.floor(pageSize), 1, MAX_PAGE_SIZE);
  const offset = (curPage - 1) * curPageSize;

  return prisma.$transaction(async (tx) => {
    const [total, items] = await Promise.all([
      countCompanies({ q: keyword }, tx),
      findCompanies({ q: keyword, limit: curPageSize, offset }, tx),
    ]);

    if (total === 0 || items.length === 0) {
      throw new AppError(ApiCode.NOT_FOUND, 'No companies found');
    }

    return {
      items,
      pagination: {
        page: curPage,
        pageSize: curPageSize,
        total,
        pages: Math.ceil(total / curPageSize),
      },
    };
  });
}
