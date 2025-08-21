import type { Db } from '@/repositories/company.shared.repo';

export async function upsertCompanyView(
  db: Db,
  companyId: number,
  day: string,
  ipHash: string,
  sessionId?: string
): Promise<{ created: boolean; hasCompany: boolean }> {
  const rows = await db.$queryRaw<{ hasCompany: boolean; inserted: number | null }[]>`
    WITH got_company AS (
      SELECT c.id FROM company c WHERE c.id = ${companyId}
    ),
    ins AS (
      INSERT INTO company_view (company_id, day, ip_hash, session_id)
      SELECT gc.id, ${day}::date, ${ipHash}, ${sessionId ?? null}
      FROM got_company gc
      ON CONFLICT (company_id, day, ip_hash) DO NOTHING
      RETURNING 1 AS inserted
    )
    SELECT
      EXISTS(SELECT 1 FROM got_company) AS "hasCompany",
      (SELECT inserted FROM ins LIMIT 1) AS inserted;
  `;
  const r = rows[0] ?? { hasCompany: false, inserted: null };
  return { hasCompany: r.hasCompany, created: r.inserted === 1 };
}
