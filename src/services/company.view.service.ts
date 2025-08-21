import { prisma } from '@/lib/prisma';
import { upsertCompanyView } from '@/repositories/company.view.repo';
import { utcDay } from '@/lib/time';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';

export async function recordCompanyView(id: number, ipHash: string, sessionId?: string) {
  const { hasCompany, created } = await upsertCompanyView(prisma, id, utcDay(), ipHash, sessionId);
  if (!hasCompany) throw new AppError(ApiCode.NOT_FOUND, 'Company not found');
  return { created };
}
