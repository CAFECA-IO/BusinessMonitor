import type { Db } from '@/repositories/company.shared.repo';

export async function upsertCompanyView(
  db: Db,
  companyId: number,
  day: string,
  ipHash: string,
  sessionId?: string
) {
  const rows = await db.$queryRaw<{ inserted: number }[]>`
    INSERT INTO company_view (company_id, day, ip_hash, session_id)
    VALUES (${companyId}, ${day}::date, ${ipHash}, ${sessionId ?? null})
    ON CONFLICT (company_id, day, ip_hash) DO NOTHING
    RETURNING 1::int AS inserted;
  `;
  return { created: rows.length > 0 };
}
