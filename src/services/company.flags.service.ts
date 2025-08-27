import { prisma } from '@/lib/prisma';
import { makePaginated } from '@/types/common';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { findFlags, countFlags } from '@/repositories/company.flags.repo';

export async function listFlags(
  companyId: number,
  color: 'red' | 'green',
  page: number,
  pageSize: number
) {
  if (!Number.isFinite(companyId) || companyId <= 0) {
    throw new AppError(ApiCode.VALIDATION_ERROR, 'Invalid company id');
  }
  const offset = (page - 1) * pageSize;

  const [items, total] = await Promise.all([
    findFlags(prisma, companyId, color, pageSize, offset),
    countFlags(prisma, companyId, color),
  ]);

  return makePaginated(items, total, page, pageSize);
}
