import { Prisma, PrismaClient } from '@prisma/client';
import type { QueryMeta } from '@/lib/utils'; // Info: (20250818 - Tzuhan) analyzeQuery 的型別
import { escapeLike } from '@/lib/utils';

export type AutocompleteRow = {
  id: number;
  name: string;
  registration_no: string;
};

type Db = PrismaClient | Prisma.TransactionClient;

/** Info: (20250818 - Tzuhan) 依 meta 規則做名稱/統編的最佳化查詢（僅回前 N 筆） */
export async function repoAutocompleteCompanies(
  db: Db,
  meta: QueryMeta,
  limit: number
): Promise<AutocompleteRow[]> {
  const likeLiteral = `%${escapeLike(meta.normalized)}%`;
  const regPrefix = meta.digitsOnly ? `${escapeLike(meta.normalized)}%` : null;
  const useILIKE = meta.isShort || meta.hasChinese || meta.normalized.length > 24;

  const whereClause = useILIKE
    ? Prisma.sql`
        ( c.name ILIKE ${likeLiteral} ESCAPE '\\'
          OR ${
            meta.digitsOnly
              ? Prisma.sql`(c.registration_no LIKE ${regPrefix} ESCAPE '\\' OR c.registration_no = ${meta.normalized})`
              : Prisma.sql`false`
          }
        )`
    : Prisma.sql`
        ( c.name % ${meta.normalized}
          OR ${
            meta.digitsOnly
              ? Prisma.sql`(c.registration_no LIKE ${regPrefix} ESCAPE '\\' OR c.registration_no = ${meta.normalized})`
              : Prisma.sql`false`
          }
        )`;

  const rows = await db.$queryRaw<AutocompleteRow[]>`
    WITH filtered AS (
      SELECT c.id, c.name, c.registration_no
      FROM company c
      WHERE ${whereClause}
    ),
    scored AS (
      SELECT
        f.*,
        CASE
          WHEN ${meta.digitsOnly ? Prisma.sql`f.registration_no = ${meta.normalized}` : Prisma.sql`false`} THEN 3
          WHEN ${meta.digitsOnly ? Prisma.sql`f.registration_no LIKE ${regPrefix}` : Prisma.sql`false`} THEN 2
          ELSE 1
        END AS score,
        ${useILIKE ? Prisma.sql`NULL::double precision AS sim` : Prisma.sql`similarity(f.name, ${meta.normalized}) AS sim`}
      FROM filtered f
    )
    SELECT id, name, registration_no
    FROM scored
    ORDER BY score DESC, ${useILIKE ? Prisma.sql`name ASC` : Prisma.sql`sim DESC`}, id ASC
    LIMIT ${limit};
  `;
  return rows;
}
