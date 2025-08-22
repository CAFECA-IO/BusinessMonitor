import { prisma } from '@/lib/prisma';
import type {
  TenderRow,
  PaginatedTender,
  TrademarkRow,
  PaginatedTrademark,
} from '@/validators/company.operations';
import {
  findTenders,
  countTenders,
  findTrademarks,
  countTrademarks,
} from '@/repositories/company.operations.repo';
import { makePaginated } from '@/types/common';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));
const MAX_PAGE_SIZE = 100;

export async function listTenders(
  companyId: number,
  page: number,
  pageSize: number
): Promise<PaginatedTender> {
  const curPage = clamp(page, 1, Number.MAX_SAFE_INTEGER);
  const curSize = clamp(pageSize, 1, MAX_PAGE_SIZE);
  const offset = (curPage - 1) * curSize;

  const [rows, total] = await Promise.all([
    findTenders(prisma, companyId, curSize, offset),
    countTenders(prisma, companyId),
  ]);

  const items: TenderRow[] = rows.map((r) => ({
    projectTitle: r.projectTitle,
    agencyName: r.agencyName,
    awardDate: r.awardDate,
    awardAmount: r.awardAmount,
    awarded: r.awarded,
  }));

  return makePaginated(items, total, curPage, curSize);
}

export async function listTrademarks(
  companyId: number,
  page: number,
  pageSize: number
): Promise<PaginatedTrademark> {
  const curPage = clamp(page, 1, Number.MAX_SAFE_INTEGER);
  const curSize = clamp(pageSize, 1, MAX_PAGE_SIZE);
  const offset = (curPage - 1) * curSize;

  const [rows, total] = await Promise.all([
    findTrademarks(prisma, companyId, curSize, offset),
    countTrademarks(prisma, companyId),
  ]);

  const items: TrademarkRow[] = rows.map((r) => ({
    name: r.name,
    imageUrl: r.imageUrl, // Info: (20250822 - Tzuhan) 可為 null
    description: r.description ?? null,
  }));

  return makePaginated(items, total, curPage, curSize);
}
