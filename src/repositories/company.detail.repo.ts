import { prisma } from '@/lib/prisma';
import { CommentSort, CompanyMarketQuery } from '@/validators';
import { Prisma } from '@prisma/client';
import {
  startOfDay,
  endOfDay,
  sub,
  startOfYear,
  subMonths,
  subYears,
  differenceInDays,
} from 'date-fns';

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
  const rows = await prisma.$queryRaw<
    { green: number; red: number }[]
  >`SELECT COALESCE(SUM(CASE WHEN rf.flag_value > 0 THEN 1 ELSE 0 END), 0)::int AS green, COALESCE(SUM(CASE WHEN rf.flag_value < 0 THEN 1 ELSE 0 END), 0)::int AS red FROM risk_flag rf WHERE rf.company_id = ${id}`;
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
  symbol: string,
  query: CompanyMarketQuery
): Promise<AggregatedPriceRow[]> {
  // ... The logic for this function remains the same as the last correct version ...
  // It correctly fetches candlestick data based on timeframe or from/to dates.
  // The function is long, so it is omitted here for brevity, but its logic is unchanged.
  const { timeframe, from, to } = query;

  const latestEntry = await prisma.marketDailyPrice.findFirst({
    where: { symbol },
    orderBy: { date: 'desc' },
    select: { date: true },
  });

  if (!latestEntry) return [];
  const latestDate = latestEntry.date;

  let startDate: Date;
  let endDate: Date = latestDate;
  let granularity: 'daily' | 'weekly' | 'monthly' = 'daily';

  if (from && to) {
    startDate = startOfDay(new Date(from));
    endDate = endOfDay(new Date(to));
    const diffDays = differenceInDays(endDate, startDate);
    if (diffDays > 365) granularity = 'monthly';
    else if (diffDays > 90) granularity = 'weekly';
    else granularity = 'daily';
  } else {
    const tf = timeframe ?? '3m';
    switch (tf) {
      case '1d':
        startDate = startOfDay(latestDate);
        granularity = 'daily';
        break;
      case '1w':
        startDate = startOfDay(sub(latestDate, { weeks: 1 }));
        granularity = 'daily';
        break;
      case '1m':
        startDate = startOfDay(sub(latestDate, { months: 1 }));
        granularity = 'daily';
        break;
      case '3m':
        startDate = startOfDay(sub(latestDate, { months: 3 }));
        granularity = 'daily';
        break;
      case '6m':
        startDate = startOfDay(sub(latestDate, { months: 6 }));
        granularity = 'daily';
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
        startDate = new Date(0);
        granularity = 'monthly';
        break;
      default:
        startDate = startOfDay(sub(latestDate, { months: 3 }));
        granularity = 'daily';
    }
  }

  if (granularity === 'daily') {
    const prices = await prisma.marketDailyPrice.findMany({
      where: { symbol, date: { gte: startDate, lte: endDate } },
      orderBy: { date: 'asc' },
    });
    return prices.map((p) => ({
      date: p.date,
      open: p.openPrice!,
      high: p.highPrice!,
      low: p.lowPrice!,
      close: p.closePrice!,
      volume: p.tradeVolume!,
    }));
  }

  const dateTruncUnit = granularity === 'weekly' ? 'week' : 'month';
  const querySql = Prisma.sql`
        SELECT
            DATE_TRUNC(${Prisma.raw(`'${dateTruncUnit}'`)}, "date")::DATE AS "date",
            (array_agg("open_price" ORDER BY "date" ASC))[1] AS "open",
            MAX("high_price") AS "high",
            MIN("low_price") AS "low",
            (array_agg("close_price" ORDER BY "date" DESC))[1] AS "close",
            SUM("trade_volume") AS "volume"
        FROM "market_daily_price"
        WHERE "symbol" = ${symbol} AND "date" >= ${startDate} AND "date" <= ${endDate}
        GROUP BY 1 ORDER BY 1 ASC`;

  return prisma.$queryRaw<AggregatedPriceRow[]>(querySql);
}

// Info: (20251007 - Tzuhan) 【新增】用於獲取彙總統計數據的 Repo 函式
export type MarketSummaryRow = {
  fiftyTwoWeekHigh: Prisma.Decimal | null;
  fiftyTwoWeekLow: Prisma.Decimal | null;
  avgVolume3Month: Prisma.Decimal | null; // Prisma's _avg returns Decimal
};

export async function getCompanyMarketSummary(symbol: string): Promise<MarketSummaryRow> {
  const latestEntry = await prisma.marketDailyPrice.findFirst({
    where: { symbol },
    orderBy: { date: 'desc' },
  });

  if (!latestEntry) {
    return { fiftyTwoWeekHigh: null, fiftyTwoWeekLow: null, avgVolume3Month: null };
  }

  const latestDate = latestEntry.date;
  const oneYearAgo = subYears(latestDate, 1);
  const threeMonthsAgo = subMonths(latestDate, 3);

  const [yearStats, monthStats] = await Promise.all([
    // 52-week high/low
    prisma.marketDailyPrice.aggregate({
      where: {
        symbol,
        date: { gte: oneYearAgo, lte: latestDate },
      },
      _max: { highPrice: true },
      _min: { lowPrice: true },
    }),
    // 3-month average volume
    prisma.marketDailyPrice.aggregate({
      where: {
        symbol,
        date: { gte: threeMonthsAgo, lte: latestDate },
      },
      _avg: { tradeVolume: true },
    }),
  ]);

  return {
    fiftyTwoWeekHigh: yearStats._max.highPrice,
    fiftyTwoWeekLow: yearStats._min.lowPrice,
    avgVolume3Month:
      monthStats._avg.tradeVolume !== null ? new Prisma.Decimal(monthStats._avg.tradeVolume) : null,
  };
}

// Info: (20251007 - Tzuhan) 【新增】用於獲取公司財務數據的 Repo 函式
export type CompanyFinancialsRow = {
  sharesOutstanding: bigint | null;
  mktCap: Prisma.Decimal | null;
  divYield: Prisma.Decimal | null;
};

export async function getCompanyFinancials(companyId: number): Promise<CompanyFinancialsRow> {
  const [company, marketIndicator] = await Promise.all([
    prisma.company.findUnique({
      where: { id: companyId },
      select: { totalIssuedShares: true },
    }),
    prisma.marketIndicator.findFirst({
      where: { companyId },
      orderBy: { date: 'desc' },
      select: { marketCap: true, dividendYield: true },
    }),
  ]);

  return {
    sharesOutstanding: company?.totalIssuedShares ?? null,
    mktCap: marketIndicator?.marketCap ?? null,
    divYield: marketIndicator?.dividendYield ?? null,
  };
}
