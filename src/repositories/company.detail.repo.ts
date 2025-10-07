import { prisma } from '@/lib/prisma';
import { CommentSort, CompanyMarketQuery } from '@/validators';
import { Prisma } from '@prisma/client';
import { startOfDay, endOfDay, sub, startOfYear, differenceInDays } from 'date-fns';

export type CompanyBasicRow = {
  id: number;
  name: string;
  registrationNo: string;
  representative: string | null;
  registrationCountry: string | null;
  establishedDate: Date | null;
  capitalAmount: Prisma.Decimal | null;
  paidInCapital: Prisma.Decimal | null;
  capitalRanking: number | null;
  address: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
  status: string | null;
  updatedAt: Date;
};

export async function findCompanyBasicById(id: number): Promise<CompanyBasicRow | null> {
  return prisma.company.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      registrationNo: true,
      representative: true,
      registrationCountry: true,
      establishedDate: true,
      capitalAmount: true,
      paidInCapital: true,
      capitalRanking: true,
      address: true,
      websiteUrl: true,
      logoUrl: true,
      status: true,
      updatedAt: true,
    },
  });
}

export async function countRiskFlags(id: number): Promise<{ green: number; red: number }> {
  const rows = await prisma.$queryRaw<{ green: number; red: number }[]>`
    SELECT
      COALESCE(SUM(CASE WHEN rf.flag_value > 0 THEN 1 ELSE 0 END), 0)::int AS green,
      COALESCE(SUM(CASE WHEN rf.flag_value < 0 THEN 1 ELSE 0 END), 0)::int AS red
    FROM risk_flag rf
    WHERE rf.company_id = ${id}
  `;
  return rows[0] ?? { green: 0, red: 0 };
}

export type InvestorItemRow = {
  name: string;
  position: string | null;
  shareRatio: Prisma.Decimal | null;
  representativeJuridicalPerson: string | null;
};
export async function listInvestors(
  companyId: number,
  limit: number,
  offset: number
): Promise<InvestorItemRow[]> {
  return prisma.$queryRaw<InvestorItemRow[]>`
    SELECT i.name,
           ci.position,
           ci.share_ratio AS "shareRatio",
           ci.representative_juridical_person AS "representativeJuridicalPerson"
    FROM company_investor ci
    JOIN investor i ON i.id = ci.investor_id
    WHERE ci.company_id = ${companyId}
    ORDER BY i.name ASC
    LIMIT ${limit} OFFSET ${offset}
  `;
}

export type BusinessScopeRow = { code: string; description: string | null };
export async function listBusinessScopes(
  companyId: number,
  limit: number,
  offset: number
): Promise<BusinessScopeRow[]> {
  return prisma.businessScope.findMany({
    where: { companyId },
    select: { code: true, description: true },
    orderBy: [{ code: 'asc' }],
    take: limit,
    skip: offset,
  });
}

export type HistoryRow = { changeDate: Date; changeType: string; changeDetail: unknown };
export async function listCompanyHistory(
  companyId: number,
  limit: number,
  offset: number
): Promise<HistoryRow[]> {
  return prisma.companyHistory.findMany({
    where: { companyId },
    select: { changeDate: true, changeType: true, changeDetail: true },
    orderBy: [{ changeDate: 'desc' }],
    take: limit,
    skip: offset,
  });
}

export type RelatedCompanyRow = {
  relatedCompanyId: number;
  relatedBusinessId: string | null;
  relationType: string | null;
  relatedName: string;
  createdAt: Date;
};
export async function listRelatedCompanies(
  companyId: number,
  limit: number,
  offset: number
): Promise<RelatedCompanyRow[]> {
  return prisma.$queryRaw<RelatedCompanyRow[]>`
    SELECT rc.related_company_id      AS "relatedCompanyId",
           rc.related_business_id     AS "relatedBusinessId",
           rc.relation_type           AS "relationType",
           c2.name                    AS "relatedName",
           rc.created_at              AS "createdAt"
    FROM related_company rc
    JOIN company c2 ON c2.id = rc.related_company_id
    WHERE rc.company_id = ${companyId}
    ORDER BY rc.created_at DESC
    LIMIT ${limit} OFFSET ${offset}
  `;
}

export type CommentRow = {
  id: number;
  userName: string | null;
  userAvatar: string | null;
  content: string;
  createdAt: Date;
  likes: number;
  comments: number;
  shares: number;
  parentId: number | null;
};
export async function listCompanyComments(
  companyId: number,
  limit: number,
  offset: number,
  q?: string,
  sort: CommentSort = CommentSort.newest
) {
  const orderBy =
    sort === CommentSort.oldest
      ? [{ createdAt: 'asc' as const }, { id: 'asc' as const }]
      : sort === CommentSort.most_liked
        ? [{ likes: 'desc' as const }, { createdAt: 'desc' as const }, { id: 'desc' as const }]
        : [{ createdAt: 'desc' as const }, { id: 'desc' as const }];
  return prisma.comment.findMany({
    where: {
      companyId,
      parentId: null,
      ...(q
        ? {
            OR: [
              { content: { contains: q, mode: 'insensitive' } },
              { userName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      userName: true,
      userAvatar: true,
      content: true,
      createdAt: true,
      likes: true,
      comments: true,
      shares: true,
      parentId: true,
    },
    orderBy,
    take: limit,
    skip: offset,
  });
}

export async function countCompanyComments(companyId: number, q?: string): Promise<number> {
  return prisma.comment.count({
    where: {
      companyId,
      parentId: null,
      ...(q
        ? {
            OR: [
              { content: { contains: q, mode: 'insensitive' } },
              { userName: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    },
  });
}

export async function likeComment(commentId: number): Promise<void> {
  await prisma.comment.update({
    where: { id: commentId },
    data: { likes: { increment: 1 } },
    select: { id: true },
  });
}

export async function findStockSymbolByCompanyId(companyId: number) {
  return prisma.stockSymbol.findFirst({
    where: { company_id: companyId },
    select: { id: true, symbol: true, name: true },
  });
}

type AggregatedPriceRow = {
  date: Date;
  open: Prisma.Decimal;
  high: Prisma.Decimal;
  low: Prisma.Decimal;
  close: Prisma.Decimal;
  volume: bigint;
};

/**
 * Info: (20251002 - Tzuhan)
 * 根據 API 查詢參數，從資料庫取得市場價格資料。此函式將處理所有日期計算邏輯。
 * @param stockSymbolId - 股票代碼的 ID。
 * @param query - API 查詢參數 (timeframe 或 from/to)。
 * @returns - 符合條件的市場價格資料陣列。
 */
export async function getMarketPrices(
  stockSymbol: string,
  query: CompanyMarketQuery
): Promise<AggregatedPriceRow[]> {
  // Info: (20251002 - Tzuhan) 1. 找出基準日 (最新的交易日)，這是所有相對時間計算的唯一錨點
  const latestDateEntry = await prisma.marketDailyPrice.findFirst({
    where: { symbol: stockSymbol },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  console.log(`Latest market date for stock_symbol_id ${stockSymbol}: ${latestDateEntry?.date}`);

  // Info: (20251002 - Tzuhan) 如果該股票完全沒有市場資料，直接回傳空陣列
  if (!latestDateEntry) {
    return [];
  }
  const latestDate = latestDateEntry.date; // Info: (20251002 - Tzuhan) e.g., 2025-08-07

  let startDate: Date | undefined;
  let endDate: Date | undefined;
  let granularity: 'daily' | 'weekly' | 'monthly' = 'daily';

  // Info: (20251002 - Tzuhan) 2. 根據查詢參數，計算出實際的日期範圍和資料顆粒度
  if (query.from && query.to) {
    // Info: (20251002 - Tzuhan) 情況 A: 使用者自訂 `from` 和 `to`
    startDate = startOfDay(new Date(query.from));
    endDate = endOfDay(new Date(query.to));
    const durationInDays = differenceInDays(endDate, startDate);

    // Info: (20251002 - Tzuhan) 根據時間跨度自動決定最佳的資料顆粒度
    if (durationInDays > 365 * 1.5) {
      granularity = 'monthly';
    } else if (durationInDays > 90) {
      granularity = 'weekly';
    }
  } else {
    // Info: (20251002 - Tzuhan) 情況 B: 使用預設的 `timeframe`，並以資料庫最新日期為基準回溯計算
    const timeframe = query.timeframe ?? '3m';
    endDate = endOfDay(latestDate);

    switch (timeframe) {
      case '1d':
        startDate = startOfDay(latestDate);
        break;
      case '1w':
        startDate = startOfDay(sub(latestDate, { weeks: 1 }));
        break;
      case '1m':
        startDate = startOfDay(sub(latestDate, { months: 1 }));
        break;
      case '3m':
        startDate = startOfDay(sub(latestDate, { months: 3 }));
        break;
      case '6m':
        startDate = startOfDay(sub(latestDate, { months: 6 }));
        break;
      case '1y':
        startDate = startOfDay(sub(latestDate, { years: 1 }));
        granularity = 'weekly';
        break;
      case 'ytd':
        startDate = startOfYear(latestDate);
        granularity = 'weekly';
        break;
      case 'all':
        startDate = undefined;
        granularity = 'monthly';
        break;
    }
  }

  // Info: (20251002 - Tzuhan) 3. 根據計算好的參數，執行資料庫查詢
  const whereDateFilter: Prisma.MarketDailyPriceWhereInput['date'] = {};
  if (startDate) whereDateFilter.gte = startDate;
  if (endDate) whereDateFilter.lte = endDate;

  if (granularity === 'daily') {
    const dailyPrices = await prisma.marketDailyPrice.findMany({
      where: {
        symbol: stockSymbol,
        date: Object.keys(whereDateFilter).length > 0 ? whereDateFilter : undefined,
      },
      orderBy: { date: 'asc' },
    });
    return dailyPrices.map((p) => ({
      date: p.date,
      open: p.openPrice ?? new Prisma.Decimal(0),
      high: p.highPrice ?? new Prisma.Decimal(0),
      low: p.lowPrice ?? new Prisma.Decimal(0),
      close: p.closePrice ?? new Prisma.Decimal(0),
      volume: p.tradeVolume ?? BigInt(0),
    }));
  }

  // Info: (20251002 - Tzuhan) 若需彙總 (weekly/monthly)，則使用原生 SQL
  const whereClauses = [Prisma.sql`"symbol" = ${stockSymbol}`];
  if (startDate) whereClauses.push(Prisma.sql`"date" >= ${startDate}`);
  if (endDate) whereClauses.push(Prisma.sql`"date" <= ${endDate}`);
  const whereSql = Prisma.join(whereClauses, ' AND ');

  // Info: (20251002 - Tzuhan) 根據 granularity 的值，安全地建構 SQL 查詢字串
  const dateTruncUnit = granularity === 'weekly' ? 'week' : 'month';
  const querySql = Prisma.sql`
    SELECT
      DATE_TRUNC(${dateTruncUnit}, "date")::DATE AS "date",
      (array_agg("open_price" ORDER BY "date" ASC))[1] AS "open",
      MAX("high_price") AS "high",
      MIN("low_price") AS "low",
      (array_agg("close_price" ORDER BY "date" DESC))[1] AS "close",
      SUM("trade_volume") AS "volume"
    FROM "market_daily_price"
    WHERE ${whereSql}
    GROUP BY 1 ORDER BY 1 ASC`;

  return prisma.$queryRaw<AggregatedPriceRow[]>(querySql);
}
