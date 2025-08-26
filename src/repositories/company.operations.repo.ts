import { Prisma } from '@prisma/client';
import type { Db } from '@/repositories/company.shared.repo';
import type { TradeRow, PoliticalRow } from '@/types/company';

/** Info: (20250826 - Tzuhan) ---------- 共用小工具 ---------- */

// Info: (20250826 - Tzuhan) 金額/數字欄位 → 字串（DecimalString）
const asText = (col: Prisma.Sql) =>
  Prisma.sql`CASE WHEN ${col} IS NULL THEN NULL ELSE (${col})::text END`;
// Info: (20250826 - Tzuhan) 日期 → YYYY-MM-DD 字串（允許 null）
const asDateText = (col: Prisma.Sql, fallback?: Prisma.Sql) =>
  fallback
    ? Prisma.sql`(COALESCE(${col}, ${fallback})::date)::text`
    : Prisma.sql`(${col}::date)::text`;

/** Info: (20250826 - Tzuhan) ---------- Government Tenders ---------- */

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
  const effDate = Prisma.sql`COALESCE(gt.award_date, gt.created_at)`;
  const sql = Prisma.sql`
    SELECT
      gt.project_title AS "projectTitle",
      gt.agency_name   AS "agencyName",
      ${asDateText(effDate)} AS "awardDate",
      ${asText(Prisma.sql`gt.award_amount`)} AS "awardAmount",
      COALESCE(gt.awarded, false) AS "awarded"
    FROM government_tender gt
    WHERE gt.company_id = ${companyId}
    ORDER BY ${effDate} DESC, gt.id DESC
    LIMIT ${limit} OFFSET ${offset};
  `;
  return db.$queryRaw<TenderRowDb[]>(sql);
}

export async function countTenders(db: Db, companyId: number): Promise<number> {
  const sql = Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM government_tender
    WHERE company_id = ${companyId};
  `;
  const rows = await db.$queryRaw<{ count: number }[]>(sql);
  return rows[0]?.count ?? 0;
}

/** Info: (20250822 - Tzuhan) ---------- Trademarks ---------- */

export type TrademarkRowDb = {
  name: string;
  imageUrl: string | null;
  description: string | null;
  applicationNo: string | null;
  status: string | null;
};

export async function findTrademarks(
  db: Db,
  companyId: number,
  limit: number,
  offset: number
): Promise<TrademarkRowDb[]> {
  const sql = Prisma.sql`
    SELECT
      t.name           AS "name",
      t.image_url      AS "imageUrl",
      t.description    AS "description",
      t.application_no AS "applicationNo",
      t.status         AS "status"
    FROM trademark t
    WHERE t.company_id = ${companyId}
    ORDER BY t.id DESC
    LIMIT ${limit} OFFSET ${offset};
  `;
  return db.$queryRaw<TrademarkRowDb[]>(sql);
}

export async function countTrademarks(db: Db, companyId: number): Promise<number> {
  const sql = Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM trademark
    WHERE company_id = ${companyId};
  `;
  const rows = await db.$queryRaw<{ count: number }[]>(sql);
  return rows[0]?.count ?? 0;
}

/** Info: (20250825 - Tzuhan) ---------- Patents（已對齊最新 schema） ---------- */

export type PatentRowDb = {
  title: string;
  date: string; // Info: (20250826 - Tzuhan) YYYY-MM-DD
  applicationNo: string | null;
  kind: string | null;
  status: string | null;
  description: string | null;
};

export async function findPatents(
  db: Db,
  companyId: number,
  limit: number,
  offset: number
): Promise<PatentRowDb[]> {
  const sql = Prisma.sql`
    SELECT
      p.title          AS "title",
      ${asDateText(Prisma.sql`p.date`)} AS "date",
      p.application_no AS "applicationNo",
      p.kind           AS "kind",
      p.status         AS "status",
      p.description    AS "description"
    FROM patent p
    WHERE p.company_id = ${companyId}
    ORDER BY p.date DESC NULLS LAST, p.id DESC
    LIMIT ${limit} OFFSET ${offset};
  `;
  return db.$queryRaw<PatentRowDb[]>(sql);
}

export async function countPatents(db: Db, companyId: number): Promise<number> {
  const sql = Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM patent
    WHERE company_id = ${companyId};
  `;
  const rows = await db.$queryRaw<{ count: number }[]>(sql);
  return rows[0]?.count ?? 0;
}

/** Info: (20250826 - Tzuhan) ---------- Trade（進出口） ---------- */

export async function findTrade(
  db: Db,
  companyId: number,
  year: number | undefined,
  limit: number,
  offset: number
): Promise<TradeRow[]> {
  const sql = Prisma.sql`
    SELECT
      ied.year::int AS "year",
      CASE
        WHEN ied.month IS NULL THEN (ied.year::text || '-00')
        WHEN ied.month ~ '^\d{4}-\d{2}$' THEN ied.month
        WHEN ied.month ~ '^\d{1,2}$' THEN (ied.year::text || '-' || LPAD(ied.month, 2, '0'))
        ELSE ied.month
      END AS "month",
      COALESCE(ied.total_import, 0)::text AS "totalImportUSD",
      COALESCE(ied.total_export, 0)::text AS "totalExportUSD"
    FROM import_export_data ied
    WHERE ied.company_id = ${companyId}
      ${year ? Prisma.sql`AND ied.year = ${year}` : Prisma.empty}
    ORDER BY ied.year DESC,
             CASE
               WHEN ied.month IS NULL THEN '00'
               WHEN ied.month ~ '^\d{4}-\d{2}$' THEN RIGHT(ied.month, 2)
               WHEN ied.month ~ '^\d{1,2}$' THEN LPAD(ied.month, 2, '0')
               ELSE '00'
             END DESC
    LIMIT ${limit} OFFSET ${offset};
  `;
  return db.$queryRaw<TradeRow[]>(sql);
}

export async function countTrade(db: Db, companyId: number, year?: number): Promise<number> {
  const sql = Prisma.sql`
    SELECT COUNT(*)::int AS count
    FROM import_export_data
    WHERE company_id = ${companyId}
      ${year ? Prisma.sql`AND year = ${year}` : Prisma.empty};
  `;
  const rows = await db.$queryRaw<{ count: number }[]>(sql);
  return rows[0]?.count ?? 0;
}

/** Info: (20250826 - Tzuhan) ---------- Political Contributions（公司.contributions JSON 陣列） ---------- */

export async function findPoliticalContributions(
  db: Db,
  companyId: number,
  limit: number,
  offset: number
): Promise<PoliticalRow[]> {
  const sql = Prisma.sql`
    WITH src AS (
      SELECT (c.contributions)::jsonb AS contributions
      FROM company c
      WHERE c.id = ${companyId}
    ),
    arr AS (
      SELECT CASE
               WHEN jsonb_typeof(contributions) = 'array' THEN contributions
               ELSE '[]'::jsonb
             END AS a
      FROM src
    ),
    flat AS (
      SELECT x
      FROM arr, LATERAL jsonb_array_elements(a) AS x
    )
    SELECT
      (x->>'event')::text                              AS "event",
      COALESCE((x->>'amount')::numeric, 0)::text       AS "amount",
      COALESCE((x->>'date')::date::text, '1970-01-01') AS "date",
      NULLIF((x->>'recipient')::text, '')              AS "recipient"
    FROM flat
    ORDER BY COALESCE((x->>'date')::date, '1970-01-01'::date) DESC
    LIMIT ${limit} OFFSET ${offset};
  `;
  return db.$queryRaw<PoliticalRow[]>(sql);
}

export async function countPoliticalContributions(db: Db, companyId: number): Promise<number> {
  const sql = Prisma.sql`
    SELECT
      CASE
        WHEN jsonb_typeof((c.contributions)::jsonb) = 'array'
        THEN jsonb_array_length((c.contributions)::jsonb)
        ELSE 0
      END::int AS count
    FROM company c
    WHERE c.id = ${companyId};
  `;
  const rows = await db.$queryRaw<{ count: number }[]>(sql);
  return rows[0]?.count ?? 0;
}
