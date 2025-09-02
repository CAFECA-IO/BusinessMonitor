import type { Db } from '@/repositories/company.shared.repo';

export type AnnouncementRowDb = {
  id: number;
  title: string;
  date: string;
  content: string | undefined;
  imageUrl: string | undefined;
  views: number | undefined;
  shares: number | undefined;
  isPinned: boolean | undefined;
};

export async function findCompanyAnnouncements(db: Db, companyId: number, limit: number) {
  const rows = await db.$queryRaw<AnnouncementRowDb[]>`
    SELECT
      a.id,
      a.title,
      (a.date::date)::text AS "date",
      a.content
    FROM announcement a
    WHERE a.company_id = ${companyId}
    ORDER BY a.date DESC, a.id DESC
    LIMIT ${limit};
  `;
  return rows;
}
