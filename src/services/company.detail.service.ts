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
} from '@/repositories/company.detail.repo';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { CommentSort, MarketDataPayload, Timeframe } from '@/validators';
import { makePaginated } from '@/types/common';

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

  // Info: (20250819 - Tzuhan) 預設各卡片 10 筆
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
 * Info: (20250922 - Tzuhan)  獲取公司的市場行情數據（重構後版本）
 * @param companyId 公司 ID
 * @param timeframe 時間維度 ('daily', 'weekly', 'monthly')
 * @returns 格式化後的市場數據
 */
export async function getCompanyMarketData(
  companyId: number,
  timeframe: Timeframe
): Promise<MarketDataPayload> {
  // Info: (20250922 - Tzuhan) 1. 查詢公司對應的股票代碼
  const stockSymbol = await findStockSymbolByCompanyId(companyId);
  if (!stockSymbol) {
    throw new AppError(ApiCode.NOT_FOUND, `找不到 ID 為 ${companyId} 的公司或其對應的股票代碼`);
  }

  // Info: (20250922 - Tzuhan) 2. 取得市場價格數據
  const prices = await getMarketPrices(stockSymbol.id, timeframe);

  // Info: (20250922 - Tzuhan) 3. 格式化為 API Response
  const formattedData = prices.map((p) => ({
    date: p.date.toISOString(),
    open: p.open.toNumber(),
    high: p.high.toNumber(),
    low: p.low.toNumber(),
    close: p.close.toNumber(),
    volume: p.volume.toString(),
  }));

  return {
    companyId,
    stockSymbol: stockSymbol.symbol,
    timeframe,
    data: formattedData,
  };
}
