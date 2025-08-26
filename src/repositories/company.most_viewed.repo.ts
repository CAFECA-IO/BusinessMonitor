import type { CompanyCardBaseRow, Db } from '@/repositories/company.shared.repo';

/**
 * Info: (20250820 - Tzuhan)
 * 以累計瀏覽數排序（company_view），也可改成近 30 天視需要：
 * WHERE cv.day >= (CURRENT_DATE - INTERVAL '30 days')
 */
export async function findMostViewedCompanies(
  db: Db,
  limit: number
): Promise<CompanyCardBaseRow[]> {
  return db.$queryRaw<CompanyCardBaseRow[]>`
    WITH agg AS (
      SELECT company_id, COUNT(*)::bigint AS views
      FROM company_view cv
      GROUP BY company_id
    )
    SELECT c.id, c.name, c.registration_no, c.status, c.foreign_company_name, c.address, c.logo_url
    FROM agg a
    JOIN company c ON c.id = a.company_id
    ORDER BY a.views DESC, c.id DESC
    LIMIT ${limit};
  `;
}
