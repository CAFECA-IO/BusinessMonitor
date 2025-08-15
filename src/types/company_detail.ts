import { TrendPoint } from '@/types/trend_point';

export type CompanyBasicResponse = {
  card: {
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
  investors: Array<{
    name: string;
    position: string | null;
    sharesHeld: string | null;
    representativeOfJuridicalPerson: string | null;
  }>;
  businessScopes: Array<{ code: string; description: string | null }>;
  history: Array<{ date: string; type: string; detail: unknown }>;
  related: Array<{
    id: number;
    businessId: string | null;
    name: string;
    relationType: string | null;
    date: string;
  }>;
};

export type CompanyMarketResponse = {
  last: string | null;
  change: string | null;
  changePct: string | null;
  sparkline: Array<TrendPoint>;
};

export type CompanyCommentsResponse = {
  items: Array<{
    id: number;
    userName: string | null;
    userAvatar: string | null;
    content: string;
    createdAt: string;
    likes: number;
    comments: number;
    shares: number;
  }>;
  page: number;
  pageSize: number;
};

export type AutocompleteResponse = {
  items: Array<{ id: number; name: string; registrationNo: string }>;
};
