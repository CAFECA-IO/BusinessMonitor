import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { CompanyCard } from '@/types/company';
import { TrendPoint } from '@/types/trend_point';
import { makePaginated } from '@/types/pagination';

// Info: (20250813 - Tzuhan)---------- 查詢前處理 ----------
const toHalfWidth = (s: string) =>
  s.replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
const stripCompanySuffix = (s: string) => s.replace(/(股份有限公?司|有限公?司|公司)$/g, '');
const escapeLike = (s: string) =>
  s.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');

function analyzeQuery(raw: string) {
  const clean = stripCompanySuffix(toHalfWidth(raw.trim().replace(/^["']+|["']+$/g, '')));
  const digits = clean.replace(/\D/g, '');
  const suspicious = /(--|\/\*|\*\/|;|=|\bOR\b|\bAND\b|\|\||&&)/i.test(clean);
  return {
    normalized: clean,
    regNoCandidate: digits.length > 0 ? digits : undefined,
    isLikelyRegNo: /^\d{8}$/.test(digits),
    isShort: clean.length < 2,
    hasChinese: /[\u4e00-\u9fa5]/.test(clean),
    suspicious,
  };
}

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

// Info: (20250813 - Tzuhan)---------- 主搜尋 ----------
type CompanySqlRow = {
  id: number;
  name: string;
  registration_no: string;
  status: string | null;
  foreign_company_name: string | null;
  address: string | null;
  logo_url: string | null;
  total: number;
};

export async function searchCompanies(q: string, page = 1, pageSize = DEFAULT_PAGE_SIZE) {
  if (!q?.trim()) throw new AppError(ApiCode.VALIDATION_ERROR, 'q is required');

  const curPage = clamp(page, 1, Number.MAX_SAFE_INTEGER);
  const curPageSize = clamp(pageSize, 1, MAX_PAGE_SIZE);
  const offset = (curPage - 1) * curPageSize;

  const meta = analyzeQuery(q);
  const likeLiteral = `%${escapeLike(meta.normalized)}%`;
  const regPrefix = `${escapeLike(meta.regNoCandidate ?? meta.normalized)}%`;
  const useILIKE = meta.isShort || meta.hasChinese || meta.suspicious;

  const whereClause = useILIKE
    ? Prisma.sql`
      (c.name ILIKE ${likeLiteral} ESCAPE '\\'
       OR c.registration_no LIKE ${regPrefix} ESCAPE '\\'
       OR c.registration_no = ${meta.regNoCandidate ?? meta.normalized})
    `
    : Prisma.sql`
      (c.name % ${meta.normalized}
       OR c.registration_no LIKE ${regPrefix} ESCAPE '\\'
       OR c.registration_no = ${meta.regNoCandidate ?? meta.normalized})
    `;

  // Info: (20250813 - Tzuhan) ① 先查公司清單（含 total），並帶出 address / logo_url
  const companies = await prisma.$queryRaw<CompanySqlRow[]>`
    WITH filtered AS (
      SELECT c.id, c.name, c.registration_no, c.status, c.foreign_company_name, c.address, c.logo_url
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
            ? Prisma.sql`NULL::double precision AS sim`
            : Prisma.sql`similarity(f.name, ${meta.normalized}) AS sim`
        }
      FROM filtered f
    ),
    paged AS (
      SELECT * FROM scored
      ORDER BY score DESC, ${meta.isShort || meta.hasChinese ? Prisma.sql`name ASC` : Prisma.sql`sim DESC`}, id ASC
      LIMIT ${curPageSize} OFFSET ${offset}
    )
    SELECT p.id, p.name, p.registration_no, p.status, p.foreign_company_name, p.address, p.logo_url,
           (SELECT COUNT(*)::int FROM filtered) AS total
    FROM paged p;
  `;

  if (companies.length === 0) {
    throw new AppError(ApiCode.NOT_FOUND, 'No companies found');
  }

  const companyIds = companies.map((c) => c.id);

  // Info: (20250813 - Tzuhan) ② 走勢（每家公司取最近 30 筆，避免 payload 過大）
  const trends = await prisma.$queryRaw<{ companyId: number; date: string; close: string }[]>`
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
    WHERE rn <= 30
    ORDER BY "companyId","date" ASC;
  `;

  // Info: (20250813 - Tzuhan)③ 旗幟統計（綠/紅）
  const flags = await prisma.$queryRaw<{ companyId: number; green: number; red: number }[]>`
    SELECT rf.company_id AS "companyId",
           SUM(CASE WHEN rf.flag_value > 0 THEN 1 ELSE 0 END)::int AS "green",
           SUM(CASE WHEN rf.flag_value < 0 THEN 1 ELSE 0 END)::int AS "red"
    FROM risk_flag rf
    WHERE rf.company_id IN (${Prisma.join(companyIds)}) 
    GROUP BY rf.company_id;
  `;

  // Info: (20250813 - Tzuhan)④ 彙整成卡片
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
