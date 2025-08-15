import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

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
export async function listStockPoints(companyId: number, limit: number): Promise<StockPointRow[]> {
  return prisma.$queryRaw<StockPointRow[]>`
    WITH ranked AS (
      SELECT sp.date::text AS date,
             sp.close_price::text AS close,
             ROW_NUMBER() OVER (ORDER BY sp.date DESC) AS rn
      FROM stock_price sp
      WHERE sp.company_id = ${companyId}
    )
    SELECT date, close
    FROM ranked
    WHERE rn <= ${limit}
    ORDER BY date ASC
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
  offset: number
): Promise<CommentRow[]> {
  return prisma.comment.findMany({
    where: { companyId, parentId: null },
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
    orderBy: [{ createdAt: 'desc' }],
    take: limit,
    skip: offset,
  });
}

export async function likeComment(commentId: number): Promise<void> {
  await prisma.comment.update({
    where: { id: commentId },
    data: { likes: { increment: 1 } },
    select: { id: true },
  });
}
