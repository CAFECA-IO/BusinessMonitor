import { CompaniesSearchQuery, AutocompleteQuery } from '@/validators';

export const API_BASE = '/api' as const;
export const API_VERSION = 'v1' as const;
export const API_PREFIX = `${API_BASE}/${API_VERSION}` as const;

// Info: (20250814 - Tzuhan) 取出像 '/companies/:id/basic' 中的參數名稱 union：'id'
type PathParams<T extends string> = T extends `${string}:${infer P}/${infer REST}`
  ? P | PathParams<`/${REST}`>
  : T extends `${string}:${infer P}`
    ? P
    : never;

/** Info: (20250814 - Tzuhan) 用 pattern 產生一個「帶參數」的路徑建構器 */
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

export const Routes = {
  companies: {
    // Info: (20250814 - Tzuhan) GET /api/v1/companies/search?q=...&page=...&pageSize=...
    search: (q: CompaniesSearchQuery) => withQuery(`${API_PREFIX}/companies/search`, q),

    // Info: (20250814 - Tzuhan) GET /api/v1/companies/:id/basic
    basic: buildPath(`${API_PREFIX}/companies/:id/basic`),

    // Info: (20250814 - Tzuhan) GET /api/v1/companies/:id/market
    market: buildPath(`${API_PREFIX}/companies/:id/market`),

    // Info: (20250814 - Tzuhan) GET /api/v1/companies/:id/comments
    comments: buildPath(`${API_PREFIX}/companies/:id/comments`),
  },

  comments: {
    // Info: (20250814 - Tzuhan) POST /api/v1/comments/:id/like
    like: buildPath(`${API_PREFIX}/comments/:id/like`),
  },

  // Info: (20250814 - Tzuhan) GET /api/v1/autocomplete?q=...&limit=...
  autocomplete: (q: AutocompleteQuery) => withQuery(`${API_PREFIX}/autocomplete`, q),
} as const;
