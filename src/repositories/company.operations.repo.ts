import type { Db } from '@/repositories/company.shared.repo';

/** Info: (20250822 - Tzuhan) ---- Government Tenders ---- */
export type TenderRowDb = {
  projectTitle: string;
  agencyName: string | null;
  awardDate: string; // Info: (20250822 - Tzuhan) 已在 SQL 端轉成 YYYY-MM-DD
  awardAmount: string | null; // Info: (20250822 - Tzuhan) Decimal -> text
  awarded: boolean;
};

export async function findTenders(
  db: Db,
  companyId: number,
  limit: number,
  offset: number
): Promise<TenderRowDb[]> {
  // Info: (20250822 - Tzuhan) award_date 允許為 NULL，AC 要字串 → 用 created_at 回退，保證有 date 字串
  return db.$queryRaw<TenderRowDb[]>`
    SELECT
      gt.project_title AS "projectTitle",
      gt.agency_name   AS "agencyName",
      (COALESCE(gt.award_date, gt.created_at)::date)::text AS "awardDate",
      CASE WHEN gt.award_amount IS NULL THEN NULL ELSE gt.award_amount::text END AS "awardAmount",
      COALESCE(gt.awarded, false) AS "awarded"
    FROM government_tender gt
    WHERE gt.company_id = ${companyId}
    ORDER BY gt.award_date DESC NULLS LAST, gt.id DESC
    LIMIT ${limit} OFFSET ${offset};
  `;
}

export async function countTenders(db: Db, companyId: number): Promise<number> {
  const rows = await db.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM government_tender
    WHERE company_id = ${companyId};
  `;
  return rows[0]?.count ?? 0;
}

/** Info: (20250822 - Tzuhan) ---- Trademarks ---- */
export type TrademarkRowDb = {
  name: string;
  imageUrl: string | null;
  description: string | null;
};

export async function findTrademarks(
  db: Db,
  companyId: number,
  limit: number,
  offset: number
): Promise<TrademarkRowDb[]> {
  return db.$queryRaw<TrademarkRowDb[]>`
    SELECT
      t.name        AS "name",
      t.image_url   AS "imageUrl",
      t.description AS "description"
    FROM trademark t
    WHERE t.company_id = ${companyId}
    ORDER BY t.id DESC
    LIMIT ${limit} OFFSET ${offset};
  `;
}

export async function countTrademarks(db: Db, companyId: number): Promise<number> {
  const rows = await db.$queryRaw<{ count: number }[]>`
    SELECT COUNT(*)::int AS count
    FROM trademark
    WHERE company_id = ${companyId};
  `;
  return rows[0]?.count ?? 0;
}
