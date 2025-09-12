export type IAPIName =
  | 'LIST_NEW_BUSINESSES'
  | 'LIST_MOST_VIEWED_BUSINESSES'
  | 'RECORD_COMPANY_VIEW'
  | 'GET_MARKET_INFO_BY_COMPANY_ID'
  | 'GET_NEWS_BY_COMPANY_ID'
  | 'GET_TRADE_BY_COMPANY_ID'
  | 'GET_TENDERS_BY_COMPANY_ID'
  | 'GET_TRADEMARKS_BY_COMPANY_ID'
  | 'GET_PATENTS_BY_COMPANY_ID'
  | 'GET_POLITICAL_CONTRIBUTIONS_BY_COMPANY_ID'
  | 'GET_POLITICAL_DONATIONS_BY_COMPANY_ID'
  | 'GET_ANNOUNCEMENTS_BY_COMPANY_ID'
  | 'GET_COMMENTS_BY_COMPANY_ID'
  | 'GET_FLAGS_BY_COMPANY_ID';

export type IHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

export type IAPIInput = {
  header?: { [key: string]: string };
  body?: { [key: string]: unknown } | FormData | string;
  params?: { [key: string]: unknown };
  query?: { [key: string]: unknown };
};

export type IAPIConfig = {
  name: IAPIName;
  method: IHttpMethod;
  path: string;
};
