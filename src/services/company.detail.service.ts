import {
  findCompanyBasicById,
  countRiskFlags,
  listInvestors,
  listBusinessScopes,
  listCompanyHistory,
  listRelatedCompanies,
  listStockPoints,
  listCompanyComments,
  likeComment,
  type CompanyBasicRow,
  type InvestorItemRow,
  type BusinessScopeRow,
  type HistoryRow,
  type RelatedCompanyRow,
  type CommentRow,
} from '@/repositories/company.detail.repo';
import { AppError } from '@/lib/error';
import { ApiCode } from '@/lib/status';
import { buildMarket } from '@/lib/market';

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

export function marketLimitOf(range: '7d' | '1m' | '3m' | '6m' | '1y', override?: number): number {
  if (override) return clamp(override, 10, 365);
  switch (range) {
    case '7d':
      return 7;
    case '1m':
      return 30;
    case '3m':
      return 90;
    case '6m':
      return 180;
    case '1y':
      return 365;
    default:
      return 90;
  }
}

export async function getCompanyMarket(id: number, limit: number) {
  const points = await listStockPoints(id, limit);
  return buildMarket(points);
}

export async function getCompanyComments(id: number, page: number, pageSize: number) {
  const limit = clamp(pageSize, 1, 100);
  const offset = (clamp(page, 1, Number.MAX_SAFE_INTEGER) - 1) * limit;
  const rows: CommentRow[] = await listCompanyComments(id, limit, offset);
  return {
    items: rows.map((r) => ({
      id: r.id,
      userName: r.userName,
      userAvatar: r.userAvatar,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      likes: r.likes,
      comments: r.comments,
      shares: r.shares,
    })),
    page,
    pageSize: limit,
  };
}

export async function likeCompanyComment(commentId: number) {
  await likeComment(commentId);
}
