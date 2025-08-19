import { Prisma } from '@prisma/client';
import { escapeLike } from '@/lib/utils';
import type { QueryMeta } from '@/lib/utils'; // Info: (20250813 - Tzuhan) analyzeQuery 的回傳型別
import { Db, CompanySqlRow } from '@/repositories/company.shared.repo';

/** Info: (20250813 - Tzuhan) 公司清單（含 total 與排序相關欄位） */
export async function repoFetchCompanies(
  db: Db,
  meta: QueryMeta,
  offset: number,
  limit: number
): Promise<CompanySqlRow[]> {
  const likeLiteral = `%${escapeLike(meta.normalized)}%`;
  const regPrefix = meta.digitsOnly ? `${escapeLike(meta.regNoCandidate!)}%` : null;
  const useILIKE = meta.isShort || meta.hasChinese || meta.normalized.length > 24;

  const whereClause = useILIKE
    ? Prisma.sql`
      ( c.name ILIKE ${likeLiteral} ESCAPE '\\'
        OR ${
          meta.digitsOnly
            ? Prisma.sql`(c.registration_no LIKE ${regPrefix} ESCAPE '\\' OR c.registration_no = ${meta.regNoCandidate!})`
            : Prisma.sql`false`
        }
      )`
    : Prisma.sql`
      ( c.name % ${meta.normalized}
        OR ${
          meta.digitsOnly
            ? Prisma.sql`(c.registration_no LIKE ${regPrefix} ESCAPE '\\' OR c.registration_no = ${meta.regNoCandidate!})`
            : Prisma.sql`false`
        }
      )`;

  // Info: (20250813 - Tzuhan) ① 先查公司清單（含 total），並帶出 address / logo_url
  const companies = await db.$queryRaw<CompanySqlRow[]>`
    WITH filtered AS (
      SELECT c.id, c.name, c.registration_no, c.status, c.foreign_company_name, c.address, c.logo_url
      FROM company c
      WHERE ${whereClause}
    ),
    scored AS (
      SELECT
        f.*,
        CASE
          WHEN ${meta.digitsOnly ? Prisma.sql`f.registration_no = ${meta.regNoCandidate!}` : Prisma.sql`false`} THEN ${meta.isLikelyRegNo ? 4 : 3}
          WHEN ${meta.digitsOnly ? Prisma.sql`f.registration_no LIKE ${regPrefix}` : Prisma.sql`false`} THEN ${meta.isLikelyRegNo ? 3 : 2}
          ELSE 1
        END AS score,
        ${useILIKE ? Prisma.sql`NULL::double precision AS sim` : Prisma.sql`similarity(f.name, ${meta.normalized}) AS sim`}
      FROM filtered f
    ),
    paged AS (
      SELECT * FROM scored
      ORDER BY score DESC, ${meta.isShort || meta.hasChinese ? Prisma.sql`name ASC` : Prisma.sql`sim DESC`}, id ASC
      LIMIT ${limit} OFFSET ${offset}
    )
    SELECT p.id, p.name, p.registration_no, p.status, p.foreign_company_name, p.address, p.logo_url,
           (SELECT COUNT(*)::int FROM filtered) AS total
    FROM paged p;
  `;
  return companies;
}
