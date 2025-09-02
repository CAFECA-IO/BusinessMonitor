import { prisma } from '@/lib/prisma';
import type { AnnouncementItem } from '@/validators';
import { findCompanyAnnouncements } from '@/repositories/company.announcements.repo';

export async function listCompanyAnnouncements(
  companyId: number,
  limit: number
): Promise<AnnouncementItem[]> {
  const rows = await findCompanyAnnouncements(prisma, companyId, limit);
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    date: r.date,
    content: r.content,
    imageUrl: r.imageUrl,
    views: r.views,
    shares: r.shares,
    isPinned: r.isPinned,
  }));
}
