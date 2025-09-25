import { prisma } from '@/lib/prisma';
import { CommentSort, Timeframe } from '@/validators';
import { Prisma } from '@prisma/client';
import { startOfYear, sub } from 'date-fns';

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

export type StockPointRow = { date: string; close: string };

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

/**
 * Info: (20250922 - Tzuhan) 透過 Company ID 尋找對應的 StockSymbol
 * @param companyId 公司 ID
 */
export async function findStockSymbolByCompanyId(companyId: number) {
  return prisma.stockSymbol.findFirst({
    where: { company_id: companyId },
    select: { id: true, symbol: true },
  });
}

// Info: (20250922 - Tzuhan) 定義從 $queryRaw 回傳的聚合數據型別
type AggregatedPriceRow = {
  date: Date;
  open: Prisma.Decimal;
  high: Prisma.Decimal;
  low: Prisma.Decimal;
  close: Prisma.Decimal;
  volume: bigint;
};

/**
 * Info: (20250922 - Tzuhan) 根據股票代碼 ID 和時間維度獲取市場價格
 * @param stockSymbolId StockSymbol 的主鍵 ID
 * @param timeframe 時間維度
 */
export async function getMarketPrices(
  stockSymbolId: number,
  timeframe: Timeframe,
  startDate?: string,
  endDate?: string,
  period?: string
): Promise<AggregatedPriceRow[]> {
  const now = new Date();
  let whereDateFilter: Prisma.MarketDailyPriceWhereInput['date'] = {};
  let take: number | undefined;

  // Info: (20250924 - Tzuhan) 根據參數決定日期過濾條件
  if (startDate && endDate) {
    whereDateFilter = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  } else if (period) {
    if (period !== 'max') {
      let startDateFromPeriod: Date;
      switch (period) {
        case '1m':
          startDateFromPeriod = sub(now, { months: 1 });
          break;
        case '3m':
          startDateFromPeriod = sub(now, { months: 3 });
          break;
        case '6m':
          startDateFromPeriod = sub(now, { months: 6 });
          break;
        case '1y':
          startDateFromPeriod = sub(now, { years: 1 });
          break;
        case 'ytd':
          startDateFromPeriod = startOfYear(now);
          break;
        default:
          startDateFromPeriod = sub(now, { months: 3 });
      }
      whereDateFilter = { gte: startDateFromPeriod };
    }
  } else {
    take = timeframe === 'daily' ? 90 : 12;
  }

  // Info: (20250924 - Tzuhan) 2. Daily 查詢邏輯 (維持不變)
  if (timeframe === 'daily') {
    const dailyPrices = await prisma.marketDailyPrice.findMany({
      where: {
        stock_symbol_id: stockSymbolId,
        date: Object.keys(whereDateFilter).length > 0 ? whereDateFilter : undefined,
      },
      orderBy: { date: 'asc' },
      take: !startDate && !endDate && !period ? take : undefined,
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

  // Info: (20250924 - Tzuhan) 3. Weekly/Monthly 查詢邏輯
  const whereClauses = [Prisma.sql`"stock_symbol_id" = ${stockSymbolId}`];
  if (whereDateFilter.gte) {
    whereClauses.push(Prisma.sql`"date" >= ${whereDateFilter.gte}`);
  }
  if (whereDateFilter.lte) {
    whereClauses.push(Prisma.sql`"date" <= ${whereDateFilter.lte}`);
  }
  const whereSql = Prisma.join(whereClauses, ' AND ');

  // Info: (20250924 - Tzuhan) 根據 timeframe 選擇完整的 SQL 查詢字串
  const query =
    timeframe === 'weekly'
      ? Prisma.sql`
        SELECT
          DATE_TRUNC('week', "date")::DATE AS "date",
          (array_agg("open_price" ORDER BY "date" ASC))[1] AS "open",
          MAX("high_price") AS "high",
          MIN("low_price") AS "low",
          (array_agg("close_price" ORDER BY "date" DESC))[1] AS "close",
          SUM("trade_volume") AS "volume"
        FROM "market_daily_price"
        WHERE ${whereSql}
        GROUP BY 1
        ORDER BY 1 ASC`
      : Prisma.sql`
        SELECT
          DATE_TRUNC('month', "date")::DATE AS "date",
          (array_agg("open_price" ORDER BY "date" ASC))[1] AS "open",
          MAX("high_price") AS "high",
          MIN("low_price") AS "low",
          (array_agg("close_price" ORDER BY "date" DESC))[1] AS "close",
          SUM("trade_volume") AS "volume"
        FROM "market_daily_price"
        WHERE ${whereSql}
        GROUP BY 1
        ORDER BY 1 ASC`;

  let result: AggregatedPriceRow[] = await prisma.$queryRaw(query);

  if (take) {
    result = result.slice(-take);
  }

  return result;
}
