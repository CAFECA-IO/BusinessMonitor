import type { CompaniesSearchQuery, AutocompleteQuery } from '@/validators';

// ======================================================
// Info: (20250818 - Tzuhan) API prefix
// ======================================================
export const API_BASE = '/api' as const;
export const API_VERSION = 'v1' as const;
export const API_PREFIX = `${API_BASE}/${API_VERSION}` as const;

// ======================================================
// Info: (20250818 - Tzuhan) Path builder / query builder
// ======================================================

//  Info: (20250818 - Tzuhan) 取出像 '/companies/:id/basic' 中的參數名稱 union：'id'
type PathParams<T extends string> = T extends `${string}:${infer P}/${infer REST}`
  ? P | PathParams<`/${REST}`>
  : T extends `${string}:${infer P}`
    ? P
    : never;

/** Info: (20250818 - Tzuhan)  用 pattern 產生一個「帶參數」的路徑建構器 */
function buildPath<T extends string>(pattern: T) {
  return <P extends Record<PathParams<T>, string | number>>(params: P): string => {
    let out = pattern as string;
    (Object.keys(params) as Array<keyof P>).forEach((k) => {
      out = out.replace(`:${String(k)}`, encodeURIComponent(String(params[k])));
    });
    return out;
  };
}

type Primitive = string | number | boolean;
type QueryValue = Primitive | ReadonlyArray<Primitive> | undefined;
type QueryRecord = Record<string, QueryValue>;

export function withQuery<T extends QueryRecord>(url: string, query?: T): string {
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) {
      for (const item of v) params.append(k, String(item));
    } else {
      params.set(k, String(v));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

// ======================================================
/** Info: (20250818 - Tzuhan) 🔎 這裡定義所有會用到的 Query 型別（保持簡潔、無外部依賴） */
// ======================================================

export type LimitQuery = { limit?: number };
export type PageQuery = { page?: number; pageSize?: number };

export type MarketQuery = { range?: '7d' | '1m' | '3m' | '6m' | '1y'; limit?: number };

export type NewsQuery = {
  from?: string;
  to?: string;
  source?: Array<string>;
} & PageQuery;

export type CommentsQuery = {
  q?: string;
  sort?: 'newest' | 'oldest' | 'most_liked';
} & PageQuery;

export type AnnouncementsQuery = LimitQuery;

export type FlagsQuery = { type?: 'red' | 'green' } & PageQuery;

export type TradeQuery = { year?: number } & PageQuery;

// Info: (20250818 - Tzuhan) 各 Operations 通用（標案/商標/專利/政治獻金/捐贈）
export type OpsListQuery = PageQuery;

// ======================================================
// Info: (20250818 - Tzuhan) Info: (20250818 - Tzuhan) Routes
// ======================================================

export const Routes = {
  // Info: (20250818 - Tzuhan) -------- Autocomplete --------
  // Info: (20250818 - Tzuhan) GET /api/v1/autocomplete?q=...&limit=...
  autocomplete: (q: AutocompleteQuery) => withQuery(`${API_PREFIX}/autocomplete`, q),

  companies: {
    // Info: (20250818 - Tzuhan) -------- Search/List --------
    // Info: (20250818 - Tzuhan) GET /api/v1/companies/search?q=...&page=...&pageSize=...
    search: (q: CompaniesSearchQuery) => withQuery(`${API_PREFIX}/companies/search`, q),

    // Info: (20250818 - Tzuhan) -------- Basic --------
    // Info: (20250818 - Tzuhan) GET /api/v1/companies/:id/basic
    basic: buildPath(`${API_PREFIX}/companies/:id/basic`),

    // Info: (20250818 - Tzuhan) -------- Market --------
    // Info: (20250818 - Tzuhan) GET /api/v1/companies/:id/market
    market: buildPath(`${API_PREFIX}/companies/:id/market`),
    // Info: (20250818 - Tzuhan) GET /api/v1/companies/:id/market?range=...&limit=...
    marketQ: (p: { id: string | number }, q?: MarketQuery) =>
      withQuery(Routes.companies.market(p), q),

    // Info: (20250820 - Tzuhan) GET /api/v1/companies/:id/news
    news: buildPath(`${API_PREFIX}/companies/:id/news`),
    newsQ: (p: { id: string | number }, q?: NewsQuery) => withQuery(Routes.companies.news(p), q),

    // Info: (20250818 - Tzuhan) -------- Discussion (Comments) --------
    // Info: (20250818 - Tzuhan) GET /api/v1/companies/:id/comments
    comments: buildPath(`${API_PREFIX}/companies/:id/comments`),
    // Info: (20250818 - Tzuhan) GET /api/v1/companies/:id/comments?q=...&sort=...&page=...&pageSize=...
    commentsQ: (p: { id: string | number }, q?: CommentsQuery) =>
      withQuery(Routes.companies.comments(p), q),
    // Info: (20250818 - Tzuhan) POST /api/v1/companies/:id/comments  （同一路徑，改用 POST）
    createComment: buildPath(`${API_PREFIX}/companies/:id/comments`),

    // Info: (20250818 - Tzuhan) 左側公告
    // Info: (20250818 - Tzuhan) GET /api/v1/companies/:id/announcements?limit=...
    announcements: buildPath(`${API_PREFIX}/companies/:id/announcements`),
    announcementsQ: (p: { id: string | number }, q?: AnnouncementsQuery) =>
      withQuery(Routes.companies.announcements(p), q),

    // Info: (20250818 - Tzuhan) -------- Flags --------
    // Info: (20250818 - Tzuhan) GET /api/v1/companies/:id/flags?type=red|green&page=...&pageSize=...
    flags: buildPath(`${API_PREFIX}/companies/:id/flags`),
    flagsQ: (p: { id: string | number }, q?: FlagsQuery) => withQuery(Routes.companies.flags(p), q),

    // Info: (20250818 - Tzuhan) -------- Operations --------
    operations: {
      // Info: (20250818 - Tzuhan) 進出口
      // Info: (20250818 - Tzuhan) GET /api/v1/companies/:id/operations/trade?year=&page=&pageSize=
      trade: buildPath(`${API_PREFIX}/companies/:id/operations/trade`),
      tradeQ: (p: { id: string | number }, q?: TradeQuery) =>
        withQuery(Routes.companies.operations.trade(p), q),

      // Info: (20250818 - Tzuhan) 標案
      tenders: buildPath(`${API_PREFIX}/companies/:id/operations/tenders`),
      tendersQ: (p: { id: string | number }, q?: OpsListQuery) =>
        withQuery(Routes.companies.operations.tenders(p), q),

      // Info: (20250818 - Tzuhan) 商標
      trademarks: buildPath(`${API_PREFIX}/companies/:id/operations/trademarks`),
      trademarksQ: (p: { id: string | number }, q?: OpsListQuery) =>
        withQuery(Routes.companies.operations.trademarks(p), q),

      // Info: (20250818 - Tzuhan) 專利
      patents: buildPath(`${API_PREFIX}/companies/:id/operations/patents`),
      patentsQ: (p: { id: string | number }, q?: OpsListQuery) =>
        withQuery(Routes.companies.operations.patents(p), q),

      // Info: (20250818 - Tzuhan) 政治獻金
      politicalContributions: buildPath(
        `${API_PREFIX}/companies/:id/operations/political-contributions`
      ),
      politicalContributionsQ: (p: { id: string | number }, q?: OpsListQuery) =>
        withQuery(Routes.companies.operations.politicalContributions(p), q),

      // Info: (20250818 - Tzuhan) 政治捐贈
      politicalDonations: buildPath(`${API_PREFIX}/companies/:id/operations/political-donations`),
      politicalDonationsQ: (p: { id: string | number }, q?: OpsListQuery) =>
        withQuery(Routes.companies.operations.politicalDonations(p), q),
    },

    // Info: (20250818 - Tzuhan) -------- Reports (iframe 簽名) --------
    // Info: (20250818 - Tzuhan) POST /api/v1/companies/:id/reports/iframe
    reportIframe: buildPath(`${API_PREFIX}/companies/:id/reports/iframe`),

    // Info: (20250818 - Tzuhan) -------- New / Most Viewed --------
    // Info: (20250818 - Tzuhan) GET /api/v1/companies/new?limit=...
    newest: (q?: LimitQuery) => withQuery(`${API_PREFIX}/companies/new`, q),
    // Info: (20250818 - Tzuhan) GET /api/v1/companies/most-viewed?limit=...
    mostViewed: (q?: LimitQuery) => withQuery(`${API_PREFIX}/companies/most-viewed`, q),

    // Info: (20250818 - Tzuhan) -------- View 計數 --------
    // Info: (20250818 - Tzuhan) POST /api/v1/companies/:id/view
    view: buildPath(`${API_PREFIX}/companies/:id/view`),
  },

  comments: {
    // Info: (20250818 - Tzuhan) POST /api/v1/comments/:id/like
    like: buildPath(`${API_PREFIX}/comments/:id/like`),
    // Info: (20250818 - Tzuhan) POST /api/v1/comments/:id/share
    share: buildPath(`${API_PREFIX}/comments/:id/share`),
  },
} as const;
