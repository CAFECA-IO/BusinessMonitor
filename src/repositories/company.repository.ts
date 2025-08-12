import { prisma } from '@/lib/prisma';
import type { Company, Prisma } from '@prisma/client';

export type QueryMeta = {
  normalized: string; // Info: (20250812 - Tzuhan) 去空白、全形→半形後的查詢字串
  regNoCandidate?: string; // Info: (20250812 - Tzuhan)  只取出數字（若存在）
  isLikelyRegNo: boolean; // Info: (20250812 - Tzuhan)  8 碼數字 → 高機率是統編
  isShort: boolean; // Info: (20250812 - Tzuhan)  < 2 的短關鍵字
};

// Info: (20250812 - Tzuhan)  將全形數字/字母轉半形
const toHalfWidth = (s: string) =>
  s.replace(/[！-～]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));

const stripCompanySuffix = (s: string) => s.replace(/(股份有限公?司|有限公?司|公司)$/g, ''); // Info: (20250812 - Tzuhan)  簡單去尾綴，可再擴充

export function analyzeQuery(raw: string): QueryMeta {
  const t = stripCompanySuffix(toHalfWidth(raw.trim()));
  const digits = t.replace(/\D/g, ''); // Info: (20250812 - Tzuhan)  取純數字
  const isLikelyRegNo = /^\d{8}$/.test(digits); // Info: (20250812 - Tzuhan)  台灣統編常見為 8 碼
  return {
    normalized: t,
    regNoCandidate: digits.length > 0 ? digits : undefined,
    isLikelyRegNo,
    isShort: t.length < 2,
  };
}

export type CompanySearchInput = { q: string; limit?: number; offset?: number };
export type CompanyListRow = Pick<
  Company,
  'id' | 'name' | 'registrationNo' | 'status' | 'foreignCompanyName'
>;
type CountRow = { count: bigint };
type Tx = Prisma.TransactionClient;
const getClient = (tx?: Tx) => tx ?? prisma;

export async function findCompanies(
  params: CompanySearchInput,
  tx?: Tx
): Promise<CompanyListRow[]> {
  const { q, limit = 20, offset = 0 } = params;
  const db = getClient(tx);
  if (!q.trim()) return [];

  const meta = analyzeQuery(q);
  const likeName = `%${meta.normalized}%`;
  const regPrefix = (meta.regNoCandidate ?? meta.normalized) + '%';

  // Info: (20250812 - Tzuhan)  極短關鍵字：避免 trigram 噪音，僅用 ILIKE/LIKE
  if (meta.isShort) {
    return db.$queryRaw<CompanyListRow[]>`
      SELECT c.id, c.name, c.registration_no AS "registrationNo", c.status, c.foreign_company_name AS "foreignCompanyName"
      FROM company c
      WHERE c.name ILIKE ${likeName}
         OR c.registration_no LIKE ${regPrefix}
      ORDER BY
        CASE
          WHEN c.registration_no = ${meta.regNoCandidate ?? meta.normalized} THEN 3
          WHEN c.registration_no LIKE ${regPrefix} THEN 2
          ELSE 1
        END DESC,
        c.name ASC, c.id ASC
      LIMIT ${limit} OFFSET ${offset};
    `;
  }

  // Info: (20250812 - Tzuhan)  一般情況：名稱 trigram + 統編前綴/全等，並對「看起來像統編」給更高權重
  return db.$queryRaw<CompanyListRow[]>`
    SELECT c.id, c.name, c.registration_no AS "registrationNo", c.status, c.foreign_company_name AS "foreignCompanyName"
    FROM company c
    WHERE
      c.name % ${meta.normalized}
      OR c.registration_no LIKE ${regPrefix}
      OR c.registration_no = ${meta.regNoCandidate ?? meta.normalized}
    ORDER BY
      -- 若輸入像統編，則統編命中權重大一點
      CASE
        WHEN c.registration_no = ${meta.regNoCandidate ?? meta.normalized} THEN ${meta.isLikelyRegNo ? 4 : 3}
        WHEN c.registration_no LIKE ${regPrefix} THEN ${meta.isLikelyRegNo ? 3 : 2}
        ELSE 1
      END DESC,
      similarity(c.name, ${meta.normalized}) DESC,
      c.id ASC
    LIMIT ${limit} OFFSET ${offset};
  `;
}

export async function countCompanies(params: CompanySearchInput, tx?: Tx): Promise<number> {
  const { q } = params;
  if (!q.trim()) return 0;
  const db = getClient(tx);

  const meta = analyzeQuery(q);
  const likeName = `%${meta.normalized}%`;
  const regPrefix = (meta.regNoCandidate ?? meta.normalized) + '%';

  if (meta.isShort) {
    const r = await db.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::bigint AS count
      FROM company c
      WHERE c.name ILIKE ${likeName}
         OR c.registration_no LIKE ${regPrefix};
    `;
    return Number(r[0]?.count ?? 0);
  }

  const r = await db.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::bigint AS count
    FROM company c
    WHERE
      c.name % ${meta.normalized}
      OR c.registration_no LIKE ${regPrefix}
      OR c.registration_no = ${meta.regNoCandidate ?? meta.normalized};
  `;
  return Number(r[0]?.count ?? 0);
}
