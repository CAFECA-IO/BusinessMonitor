// Info: (20250813 - Tzuhan) src/services/company.service.ts
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';

export type CompanyCard = {
  id: number;
  name: string;
  registrationNo: string;
  logoUrl: string | null;
  status: string | null;
  foreignCompanyName: string | null;
  trend: { date: string; close: string }[];
  peRatio: string | null;
  marketCap: string | null;
};

// Info: (20250813 - Tzuhan) 工具：全形→半形、去尾綴
const toHalfWidth = (s: string) =>
  s.replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
const stripCompanySuffix = (s: string) => s.replace(/(股份有限公?司|有限公?司|公司)$/g, '');

function analyzeQuery(raw: string) {
  const clean = stripCompanySuffix(toHalfWidth(raw.trim().replace(/^["']+|["']+$/g, '')));
  const digits = clean.replace(/\D/g, '');
  return {
    normalized: clean,
    regNoCandidate: digits.length > 0 ? digits : undefined,
    isLikelyRegNo: /^\d{8}$/.test(digits),
    isShort: clean.length < 2,
    hasChinese: /[\u4e00-\u9fa5]/.test(clean),
  };
}

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;
const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export async function searchCompanies(q: string, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  if (!q?.trim()) throw new AppError(ApiCode.VALIDATION_ERROR, 'q is required');

  const curPage = clamp(page, 1, Number.MAX_SAFE_INTEGER);
  const curPageSize = clamp(pageSize, 1, MAX_PAGE_SIZE);
  const offset = (curPage - 1) * curPageSize;

  const meta = analyzeQuery(q);
  const likeName = `%${meta.normalized}%`;
  const regPrefix = (meta.regNoCandidate ?? meta.normalized) + '%';

  // Info: (20250813 - Tzuhan) --- ① 公司列表（不使用視窗函式；用 filtered + paged + 子查詢 total）---
  const whereClause =
    meta.isShort || meta.hasChinese
      ? Prisma.sql`
          (c.name ILIKE ${likeName}
           OR c.registration_no LIKE ${regPrefix}
           OR c.registration_no = ${meta.regNoCandidate ?? meta.normalized})
        `
      : Prisma.sql`
          (c.name % ${meta.normalized}
           OR c.registration_no LIKE ${regPrefix}
           OR c.registration_no = ${meta.regNoCandidate ?? meta.normalized})
        `;

  const companies = await prisma.$queryRaw<
    {
      id: number;
      name: string;
      registration_no: string;
      status: string | null;
      foreign_company_name: string | null;
      total: number;
    }[]
  >`
    WITH filtered AS (
      SELECT c.id, c.name, c.registration_no, c.status, c.foreign_company_name
      FROM company c
      WHERE ${whereClause}
    ),
    scored AS (
      SELECT
        f.*,
        CASE
          WHEN f.registration_no = ${meta.regNoCandidate ?? meta.normalized} THEN ${meta.isLikelyRegNo ? 4 : 3}
          WHEN f.registration_no LIKE ${regPrefix} THEN ${meta.isLikelyRegNo ? 3 : 2}
          ELSE 1
        END AS score,
        ${
          meta.isShort || meta.hasChinese
            ? Prisma.sql`NULL::double precision AS sim` // Info: (20250813 - Tzuhan) ILIKE 路徑不算相似度
            : Prisma.sql`similarity(f.name, ${meta.normalized}) AS sim`
        }
      FROM filtered f
    ),
    paged AS (
      SELECT * FROM scored
      ORDER BY score DESC, ${meta.isShort || meta.hasChinese ? Prisma.sql`name ASC` : Prisma.sql`sim DESC`}, id ASC
      LIMIT ${curPageSize} OFFSET ${offset}
    )
    SELECT p.id, p.name, p.registration_no, p.status, p.foreign_company_name,
           (SELECT COUNT(*)::int FROM filtered) AS total  -- 這裡用子查詢，避開 42803
    FROM paged p;
  `;

  if (companies.length === 0) {
    throw new AppError(ApiCode.NOT_FOUND, 'No companies found');
  }

  // Info: (20250813 - Tzuhan) const companyIds = companies.map((c) => c.id);
  console.debug('[searchCompanies] meta=', meta);
  console.debug('[searchCompanies] likeName=', likeName, 'regPrefix=', regPrefix);

  // Info: (20250813 - Tzuhan) --- ② 趨勢 ---
  const companyIds = companies.map((c) => c.id);
  const trends = await prisma.$queryRaw<{ company_id: number; date: string; close: string }[]>`
  SELECT sp.company_id, sp.date::text AS date, sp.close_price::text AS close
  FROM stock_price sp
  WHERE sp.company_id IN (${Prisma.join(companyIds)})
  ORDER BY sp.company_id, sp.date ASC;
`;

  // Info: (20250813 - Tzuhan) --- ③ 指標（取最新一筆） ---
  const indicators = await prisma.$queryRaw<
    { company_id: number; pe_ratio: string | null; market_cap: string | null }[]
  >`
  SELECT DISTINCT ON (mi.company_id)
    mi.company_id, mi.pe_ratio::text, mi.market_cap::text
  FROM market_indicator mi
  WHERE mi.company_id IN (${Prisma.join(companyIds)})
  ORDER BY mi.company_id, mi.date DESC;
`;

  // Info: (20250813 - Tzuhan) --- ④ 組裝 ---
  const map = new Map<number, CompanyCard>();
  for (const c of companies) {
    map.set(c.id, {
      id: c.id,
      name: c.name,
      registrationNo: c.registration_no,
      logoUrl: null,
      status: c.status,
      foreignCompanyName: c.foreign_company_name,
      trend: [],
      peRatio: null,
      marketCap: null,
    });
  }
  for (const t of trends) map.get(t.company_id)?.trend.push({ date: t.date, close: t.close });
  for (const i of indicators) {
    const card = map.get(i.company_id);
    if (card) {
      card.peRatio = i.pe_ratio;
      card.marketCap = i.market_cap;
    }
  }

  const total = companies[0].total;
  return {
    items: Array.from(map.values()),
    pagination: {
      page: curPage,
      pageSize: curPageSize,
      total,
      pages: Math.ceil(total / curPageSize),
    },
  };
}
