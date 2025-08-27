import { Prisma } from '@prisma/client';
import type { Db } from '@/repositories/company.shared.repo';
import type { FlagRow } from '@/validators/company.flags';

export async function findFlags(
  db: Db,
  companyId: number,
  color: 'red' | 'green',
  limit: number,
  offset: number
): Promise<FlagRow[]> {
  const sql = Prisma.sql`
    SELECT
      (rf.flagged_date::date)::text                AS "date",
      ABS(rf.flag_value)::int                      AS "level",
      rf.flag_type                                 AS "event"
    FROM risk_flag rf
    WHERE rf.company_id = ${companyId}
      AND (CASE WHEN rf.flag_value >= 0 THEN 'green' ELSE 'red' END) = ${color}
    ORDER BY rf.flagged_date DESC, rf.id DESC
    LIMIT ${limit} OFFSET ${offset};
  `;
  return db.$queryRaw<FlagRow[]>(sql);
}

export async function countFlags(
  db: Db,
  companyId: number,
  color: 'red' | 'green'
): Promise<number> {
  const rows = await db.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM risk_flag rf
    WHERE rf.company_id = ${companyId}
      AND (CASE WHEN rf.flag_value >= 0 THEN 'green' ELSE 'red' END) = ${color};
  `;
  return rows[0]?.count ?? 0;
}
