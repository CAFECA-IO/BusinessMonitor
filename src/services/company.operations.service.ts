import { prisma } from '@/lib/prisma';
import type {
  TenderRow,
  PaginatedTender,
  TrademarkRow,
  PaginatedTrademark,
  PaginatedPatent,
  PaginatedTrade,
  PaginatedPolitical,
} from '@/validators/company.operations';
import {
  findTenders,
  countTenders,
  findTrademarks,
  countTrademarks,
  findPatents,
  countPatents,
  findTrade,
  countTrade,
  findPoliticalContributions,
  countPoliticalContributions,
} from '@/repositories/company.operations.repo';
import { makePaginated } from '@/types/common';
import { PatentRow, PoliticalRow, TradeRow } from '@/types/company';

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

export async function listPatents(
  companyId: number,
  page: number,
  pageSize: number
): Promise<PaginatedPatent> {
  const curPage = clamp(page, 1, Number.MAX_SAFE_INTEGER);
  const curSize = clamp(pageSize, 1, MAX_PAGE_SIZE);
  const offset = (curPage - 1) * curSize;

  const [rows, total] = await Promise.all([
    findPatents(prisma, companyId, curSize, offset),
    countPatents(prisma, companyId),
  ]);

  const items: PatentRow[] = rows.map((r) => ({
    title: r.title,
    date: r.date,
    applicationNo: r.applicationNo ?? null,
    kind: r.kind ?? null,
    status: r.status ?? null,
    description: r.description ?? null,
  }));

  return makePaginated(items, total, curPage, curSize);
}

export async function listTrade(
  companyId: number,
  year: number | undefined,
  page: number,
  pageSize: number
): Promise<PaginatedTrade> {
  const curPage = clamp(page, 1, Number.MAX_SAFE_INTEGER);
  const curSize = clamp(pageSize, 1, MAX_PAGE_SIZE);
  const offset = (curPage - 1) * curSize;

  const [rows, total] = await Promise.all([
    findTrade(prisma, companyId, year, curSize, offset),
    countTrade(prisma, companyId, year),
  ]);

  const items: TradeRow[] = rows.map((r) => ({
    year: r.year,
    month: r.month, // 已正規化 YYYY-MM
    totalImportUSD: r.totalImportUSD,
    totalExportUSD: r.totalExportUSD,
  }));

  return makePaginated(items, total, curPage, curSize);
}

export async function listPoliticalContributions(
  companyId: number,
  page: number,
  pageSize: number
): Promise<PaginatedPolitical> {
  const curPage = clamp(page, 1, Number.MAX_SAFE_INTEGER);
  const curSize = clamp(pageSize, 1, MAX_PAGE_SIZE);
  const offset = (curPage - 1) * curSize;

  const [rows, total] = await Promise.all([
    findPoliticalContributions(prisma, companyId, curSize, offset),
    countPoliticalContributions(prisma, companyId),
  ]);

  const items: PoliticalRow[] = rows.map((r) => ({
    event: r.event,
    amount: r.amount,
    date: r.date, // 已為 YYYY-MM-DD
    recipient: r.recipient ?? undefined,
  }));

  return makePaginated(items, total, curPage, curSize);
}
