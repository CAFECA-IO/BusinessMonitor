import {
  findCompanyBasicById,
  countRiskFlags,
  listInvestors,
  listBusinessScopes,
  listCompanyHistory,
  listRelatedCompanies,
  listCompanyComments,
  likeComment,
  type CompanyBasicRow,
  type InvestorItemRow,
  type BusinessScopeRow,
  type HistoryRow,
  type RelatedCompanyRow,
  type CommentRow,
  countCompanyComments,
  findStockSymbolByCompanyId,
  getMarketPrices,
  getCompanyMarketSummary, // Info: (20251007 - Tzuhan) 新增
  getCompanyFinancials, // Info: (20251007 - Tzuhan) 新增
} from '@/repositories/company.detail.repo';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import {
  CommentSort,
  CompanyMarketQuery,
  MarketDataPayload,
  type MarketSummaryPayload, // Info: (20251007 - Tzuhan) 新增
} from '@/validators';
import { makePaginated } from '@/types/common';
import {
  isNil,
  parseToBigInt,
  safeSubtract,
  safePercentageChange,
  formatBigInt,
} from '@/lib/decimal_utils';

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

export type BasicCard = {
  id: number;
  name: string;
  registrationNo: string;
  logoUrl: string | null;
  representative: string | null;
  registrationCountry: string | null;
  establishedDate: string | null;
  capitalAmount: string | null;
  paidInCapital: string | null;
  capitalRanking: number | null;
  address: string | null;
  websiteUrl: string | null;
  status: string | null;
  lastUpdateTime: string;
  flags: { green: number; red: number };
};

export type InvestorItem = {
  name: string;
  position: string | null;
  sharesHeld: string | null;
  representativeOfJuridicalPerson: string | null;
};

export type BusinessScopeItem = { code: string; description: string | null };
export type HistoryItem = { date: string; type: string; detail: unknown };
export type RelatedCompanyItem = {
  id: number;
  businessId: string | null;
  name: string;
  relationType: string | null;
  date: string;
};

export async function getCompanyBasic(id: number) {
  const row: CompanyBasicRow | null = await findCompanyBasicById(id);
  if (!row) throw new AppError(ApiCode.NOT_FOUND, 'Company not found');

  const flags = await countRiskFlags(id);

  const card: BasicCard = {
    id: row.id,
    name: row.name,
    registrationNo: row.registrationNo,
    logoUrl: row.logoUrl,
    representative: row.representative,
    registrationCountry: row.registrationCountry,
    establishedDate: row.establishedDate ? row.establishedDate.toISOString().slice(0, 10) : null,
    capitalAmount: row.capitalAmount ? row.capitalAmount.toString() : null,
    paidInCapital: row.paidInCapital ? row.paidInCapital.toString() : null,
    capitalRanking: row.capitalRanking ?? null,
    address: row.address,
    websiteUrl: row.websiteUrl,
    status: row.status,
    lastUpdateTime: row.updatedAt.toISOString(),
    flags,
  };

  const limit = 10;
  const [inv, scopes, hist, rel] = await Promise.all([
    listInvestors(id, limit, 0),
    listBusinessScopes(id, limit, 0),
    listCompanyHistory(id, limit, 0),
    listRelatedCompanies(id, limit, 0),
  ]);

  const investors: InvestorItem[] = inv.map((i: InvestorItemRow) => ({
    name: i.name,
    position: i.position,
    sharesHeld: i.shareRatio ? i.shareRatio.toString() : null,
    representativeOfJuridicalPerson: i.representativeJuridicalPerson,
  }));

  const businessScopes: BusinessScopeItem[] = scopes.map((s: BusinessScopeRow) => ({
    code: s.code,
    description: s.description ?? null,
  }));

  const history: HistoryItem[] = hist.map((h: HistoryRow) => ({
    date: h.changeDate.toISOString().slice(0, 10),
    type: h.changeType,
    detail: h.changeDetail,
  }));

  const related: RelatedCompanyItem[] = rel.map((r: RelatedCompanyRow) => ({
    id: r.relatedCompanyId,
    businessId: r.relatedBusinessId,
    name: r.relatedName,
    relationType: r.relationType,
    date: r.createdAt.toISOString().slice(0, 10),
  }));

  return { card, investors, businessScopes, history, related };
}

export async function getCompanyComments(
  id: number,
  page: number,
  pageSize: number,
  q?: string,
  sort: CommentSort = CommentSort.newest
) {
  const size = clamp(pageSize, 1, 100);
  const curPage = clamp(page, 1, Number.MAX_SAFE_INTEGER);
  const offset = (curPage - 1) * size;

  const [rows, total]: [CommentRow[], number] = await Promise.all([
    listCompanyComments(id, size, offset, q, sort),
    countCompanyComments(id, q),
  ]);

  const items = rows.map((r) => ({
    id: r.id,
    userName: r.userName,
    userAvatar: r.userAvatar,
    content: r.content,
    createdAt: r.createdAt.toISOString().slice(0, 10),
    comments: r.comments,
    shares: r.shares,
  }));

  return makePaginated(items, total, curPage, size);
}

export async function likeCompanyComment(commentId: number) {
  await likeComment(commentId);
}

/**
 * Info: (20251007 - Tzuhan)  獲取公司的市場行情數據（擴充版）
 * @param companyId 公司 ID
 * @param query 查詢參數
 * @returns 包含 K 線圖和彙總數據的完整 Payload
 */
export async function getCompanyMarketData(
  companyId: number,
  query: CompanyMarketQuery
): Promise<MarketDataPayload> {
  // Info: (20251007 - Tzuhan) 1. 查詢公司對應的股票代碼
  const stockSymbol = await findStockSymbolByCompanyId(companyId);
  if (!stockSymbol?.symbol) {
    throw new AppError(ApiCode.NOT_FOUND, `找不到 ID 為 ${companyId} 的公司或其對應的股票代碼`);
  }

  // Info: (20251007 - Tzuhan) 2. 平行發出所有資料請求
  const [prices, summaryStats, financials] = await Promise.all([
    getMarketPrices(stockSymbol.symbol, query),
    getCompanyMarketSummary(stockSymbol.symbol),
    getCompanyFinancials(companyId),
  ]);

  // Info: (20251007 - Tzuhan) 3. 從 K 線圖資料中計算當前區間的統計數據
  let periodOpen: bigint | null = null;
  let periodLow: bigint | null = null;
  let periodHigh: bigint | null = null;
  let periodClose: bigint | null = null;
  let periodVolume: string | null = null;
  let periodChange: bigint | null = null;
  let periodChangePct: bigint | null = null;

  if (prices.length > 0) {
    // Info: (20251111 - Tzuhan) 1. 獲取原始字串值
    const openStr = prices[0].open.toString();
    const closeStr = prices[prices.length - 1].close.toString();

    // Info: (20251111 - Tzuhan) 2. 解析為 BigInt 供後續 Low/High/Summary 使用
    periodOpen = parseToBigInt(openStr);
    periodClose = parseToBigInt(closeStr);

    // Info: (20251111 - Tzuhan) 3. 計算 Low / High (這部分您寫的是對的)
    periodLow = prices.reduce(
      (min, p) => {
        const current = parseToBigInt(p.low.toString());
        if (isNil(current)) return min;
        return isNil(min) || current < min ? current : min;
      },
      null as bigint | null
    );

    periodHigh = prices.reduce(
      (max, p) => {
        const current = parseToBigInt(p.high.toString());
        if (isNil(current)) return max;
        return isNil(max) || current > max ? current : max;
      },
      null as bigint | null
    );

    // Info: (20251111 - Tzuhan) 4. 將「原始字串」傳遞給 helper 函式
    periodChange = safeSubtract(closeStr, openStr);
    periodChangePct = safePercentageChange(closeStr, openStr);

    // Info: (20251111 - Tzuhan) 5. 計算 Volume (BigInt 保持不變)
    periodVolume = prices
      .reduce((sum, p) => sum + BigInt(p.volume.toString()), BigInt(0))
      .toString();
  }

  // Info: (20251007 - Tzuhan) 4. 組合 Summary 物件
  const summary: MarketSummaryPayload = {
    open: Number(formatBigInt(periodOpen, 2)) || null,
    low: Number(formatBigInt(periodLow, 2)) || null,
    high: Number(formatBigInt(periodHigh, 2)) || null,
    close: Number(formatBigInt(periodClose, 2)) || null,

    // Info: (20251111 - Tzuhan) 這裡將得到精確的 -0.55
    change: Number(formatBigInt(periodChange, 2)) || null,
    // Info: (20251111 - Tzuhan) 這裡將得到精確的百分比，例如 -1.32
    changePct: Number(formatBigInt(periodChangePct, 2)) || null,
    volume: periodVolume,
    fiftyTwoWeekHigh: summaryStats.fiftyTwoWeekHigh?.toNumber() ?? null,
    fiftyTwoWeekLow: summaryStats.fiftyTwoWeekLow?.toNumber() ?? null,
    avgVolume3Month: summaryStats.avgVolume3Month
      ? BigInt(summaryStats.avgVolume3Month.toFixed(0)).toString()
      : null,
    sharesOutstanding: financials.sharesOutstanding?.toString() ?? null,
    mktCap: financials.mktCap?.toString() ?? null,
    divYield: financials.divYield?.toString() ?? null,
  };

  // Info: (20251007 - Tzuhan) 5. 組合最終的 Payload
  const timeframe = query.from && query.to ? 'custom' : (query.timeframe ?? '3m');

  return {
    companyId,
    stockSymbol: stockSymbol.symbol,
    timeframe,
    summary, // Info: (20251007 - Tzuhan) <-- 新增的 summary 物件
    data: prices.map((p) => ({
      date: p.date.toISOString(),
      open: p.open.toNumber(),
      high: p.high.toNumber(),
      low: p.low.toNumber(),
      close: p.close.toNumber(),
      volume: p.volume.toString(),
    })),
  };
}
