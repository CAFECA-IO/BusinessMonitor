import { prisma } from '@/lib/prisma';
import { upsertCompanyView } from '@/repositories/company.view.repo';
import { utcDay } from '@/lib/time';

export async function recordCompanyView(id: number, ipHash: string, sessionId?: string) {
  return upsertCompanyView(prisma, id, utcDay(), ipHash, sessionId);
}
