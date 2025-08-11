import { prisma } from '@/lib/prisma';
import type { Company } from '@prisma/client';

export type CompanySearchInput = {
  q: string;
  limit?: number;
  offset?: number;
};

type CountRow = { count: bigint };

function normQ(q: string): string {
  return q.trim();
}

function isShort(q: string): boolean {
  return q.length < 2;
}

/**
 * Info: (20250811 - Tzuhan)
 * 公司搜尋：優先比對 registration_no (全等 / 前綴)；其次 name trigram 相似度
 * 排序權重：
 *  1) registration_no 全等 -> weight 2
 *  2) registration_no 前綴 -> weight 1
 *  3) name similarity   -> weight sim
 */
export async function findCompanies(params: CompanySearchInput): Promise<Company[]> {
  const q = normQ(params.q);
  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;

  if (!q) return [];

  if (isShort(q)) {
    // Info: (20250811 - Tzuhan) 極短查詢改用 ILIKE，避免 trigram 太鬆散
    const like = `%${q}%`;
    const rows = await prisma.$queryRaw<Company[]>`
      SELECT c.*
      FROM company c
      WHERE c.name ILIKE ${like}
         OR c.registration_no ILIKE ${q + '%'}
      ORDER BY
        CASE
          WHEN c.registration_no = ${q} THEN 2
          WHEN c.registration_no ILIKE ${q + '%'} THEN 1
          ELSE 0
        END DESC,
        c.name ASC
      LIMIT ${limit} OFFSET ${offset};
    `;
    return rows;
  }

  // Info: (20250811 - Tzuhan) 一般情況：trigram + 代號加權
  const rows = await prisma.$queryRaw<Company[]>`
    SELECT c.*
    FROM company c
    WHERE
      c.name % ${q}                         -- trigram operator
      OR c.registration_no ILIKE ${q + '%'} -- 前綴比對（代號）
      OR c.registration_no = ${q}           -- 全等
    ORDER BY
      CASE
        WHEN c.registration_no = ${q} THEN 2
        WHEN c.registration_no ILIKE ${q + '%'} THEN 1
        ELSE 0
      END DESC,
      similarity(c.name, ${q}) DESC,
      c.id ASC
    LIMIT ${limit} OFFSET ${offset};
  `;
  return rows;
}

export async function countCompanies(params: CompanySearchInput): Promise<number> {
  const q = normQ(params.q);
  if (!q) return 0;

  if (isShort(q)) {
    const like = `%${q}%`;
    const result = await prisma.$queryRaw<CountRow[]>`
      SELECT COUNT(*)::bigint AS count
      FROM company c
      WHERE c.name ILIKE ${like}
         OR c.registration_no ILIKE ${q + '%'};
    `;
    return Number(result[0]?.count ?? 0);
  }

  const result = await prisma.$queryRaw<CountRow[]>`
    SELECT COUNT(*)::bigint AS count
    FROM company c
    WHERE
      c.name % ${q}
      OR c.registration_no ILIKE ${q + '%'}
      OR c.registration_no = ${q};
  `;
  return Number(result[0]?.count ?? 0);
}
