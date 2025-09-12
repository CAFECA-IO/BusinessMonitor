import { IAPIConfig, IAPIName, IHttpMethod } from '@/interfaces/api_connection';

const apiVersion = 'v1';
const apiPrefix = `/api/${apiVersion}`;

export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
}

export enum APIName {
  LIST_NEW_BUSINESSES = 'LIST_NEW_BUSINESSES',
  LIST_MOST_VIEWED_BUSINESSES = 'LIST_MOST_VIEWED_BUSINESSES',
  RECORD_COMPANY_VIEW = 'RECORD_COMPANY_VIEW',
  GET_MARKET_INFO_BY_COMPANY_ID = 'GET_MARKET_INFO_BY_COMPANY_ID',
  LIST_BUSINESS_NEWS = 'LIST_BUSINESS_NEWS',
  GET_TRADE_BY_COMPANY_ID = 'GET_TRADE_BY_COMPANY_ID',
  GET_TENDERS_BY_COMPANY_ID = 'GET_TENDERS_BY_COMPANY_ID',
  GET_TRADEMARKS_BY_COMPANY_ID = 'GET_TRADEMARKS_BY_COMPANY_ID',
  GET_PATENTS_BY_COMPANY_ID = 'GET_PATENTS_BY_COMPANY_ID',
  GET_POLITICAL_CONTRIBUTIONS_BY_COMPANY_ID = 'GET_POLITICAL_CONTRIBUTIONS_BY_COMPANY_ID',
  GET_POLITICAL_DONATIONS_BY_COMPANY_ID = 'GET_POLITICAL_DONATIONS_BY_COMPANY_ID',
  GET_ANNOUNCEMENTS_BY_COMPANY_ID = 'GET_ANNOUNCEMENTS_BY_COMPANY_ID',
  GET_COMMENTS_BY_COMPANY_ID = 'GET_COMMENTS_BY_COMPANY_ID',
  GET_FLAGS_BY_COMPANY_ID = 'GET_FLAGS_BY_COMPANY_ID',
}

export enum APIPath {
  LIST_NEW_BUSINESSES = `${apiPrefix}/companies/new`,
  LIST_MOST_VIEWED_BUSINESSES = `${apiPrefix}/companies/most-viewed`,
  RECORD_COMPANY_VIEW = `${apiPrefix}/companies/:id/view`,
  GET_MARKET_INFO_BY_COMPANY_ID = `${apiPrefix}/companies/:id/market`,
  LIST_BUSINESS_NEWS = `${apiPrefix}/companies/:id/news`,
  GET_TRADE_BY_COMPANY_ID = `${apiPrefix}/companies/:id/operations/trade`,
  GET_TENDERS_BY_COMPANY_ID = `${apiPrefix}/companies/:id/operations/tenders`,
  GET_TRADEMARKS_BY_COMPANY_ID = `${apiPrefix}/companies/:id/operations/trademarks`,
  GET_PATENTS_BY_COMPANY_ID = `${apiPrefix}/companies/:id/operations/patents`,
  GET_POLITICAL_CONTRIBUTIONS_BY_COMPANY_ID = `${apiPrefix}/companies/:id/operations/political-contributions`,
  GET_POLITICAL_DONATIONS_BY_COMPANY_ID = `${apiPrefix}/companies/:id/operations/political-donations`,
  GET_ANNOUNCEMENTS_BY_COMPANY_ID = `${apiPrefix}/companies/:id/announcements`,
  GET_COMMENTS_BY_COMPANY_ID = `${apiPrefix}/companies/:id/comments`,
  GET_FLAGS_BY_COMPANY_ID = `${apiPrefix}/companies/:id/flags`,
}

const createAPIConfig = ({
  name,
  method,
  path,
}: {
  name: IAPIName;
  method: IHttpMethod;
  path: string;
}): IAPIConfig => ({
  name,
  method,
  path,
});

export const APIConfig: Record<IAPIName, IAPIConfig> = {
  [APIName.LIST_NEW_BUSINESSES]: createAPIConfig({
    name: APIName.LIST_NEW_BUSINESSES,
    method: HttpMethod.GET,
    path: APIPath.LIST_NEW_BUSINESSES,
  }),
  [APIName.LIST_MOST_VIEWED_BUSINESSES]: createAPIConfig({
    name: APIName.LIST_MOST_VIEWED_BUSINESSES,
    method: HttpMethod.GET,
    path: APIPath.LIST_MOST_VIEWED_BUSINESSES,
  }),
  [APIName.RECORD_COMPANY_VIEW]: createAPIConfig({
    name: APIName.RECORD_COMPANY_VIEW,
    method: HttpMethod.POST,
    path: APIPath.RECORD_COMPANY_VIEW,
  }),
  [APIName.GET_MARKET_INFO_BY_COMPANY_ID]: createAPIConfig({
    name: APIName.GET_MARKET_INFO_BY_COMPANY_ID,
    method: HttpMethod.GET,
    path: APIPath.GET_MARKET_INFO_BY_COMPANY_ID,
  }),
  [APIName.LIST_BUSINESS_NEWS]: createAPIConfig({
    name: APIName.LIST_BUSINESS_NEWS,
    method: HttpMethod.GET,
    path: APIPath.LIST_BUSINESS_NEWS,
  }),
  [APIName.GET_TRADE_BY_COMPANY_ID]: createAPIConfig({
    name: APIName.GET_TRADE_BY_COMPANY_ID,
    method: HttpMethod.GET,
    path: APIPath.GET_TRADE_BY_COMPANY_ID,
  }),
  [APIName.GET_TENDERS_BY_COMPANY_ID]: createAPIConfig({
    name: APIName.GET_TENDERS_BY_COMPANY_ID,
    method: HttpMethod.GET,
    path: APIPath.GET_TENDERS_BY_COMPANY_ID,
  }),
  [APIName.GET_TRADEMARKS_BY_COMPANY_ID]: createAPIConfig({
    name: APIName.GET_TRADEMARKS_BY_COMPANY_ID,
    method: HttpMethod.GET,
    path: APIPath.GET_TRADEMARKS_BY_COMPANY_ID,
  }),
  [APIName.GET_PATENTS_BY_COMPANY_ID]: createAPIConfig({
    name: APIName.GET_PATENTS_BY_COMPANY_ID,
    method: HttpMethod.GET,
    path: APIPath.GET_PATENTS_BY_COMPANY_ID,
  }),
  [APIName.GET_POLITICAL_CONTRIBUTIONS_BY_COMPANY_ID]: createAPIConfig({
    name: APIName.GET_POLITICAL_CONTRIBUTIONS_BY_COMPANY_ID,
    method: HttpMethod.GET,
    path: APIPath.GET_POLITICAL_CONTRIBUTIONS_BY_COMPANY_ID,
  }),
  [APIName.GET_POLITICAL_DONATIONS_BY_COMPANY_ID]: createAPIConfig({
    name: APIName.GET_POLITICAL_DONATIONS_BY_COMPANY_ID,
    method: HttpMethod.GET,
    path: APIPath.GET_POLITICAL_DONATIONS_BY_COMPANY_ID,
  }),
  [APIName.GET_ANNOUNCEMENTS_BY_COMPANY_ID]: createAPIConfig({
    name: APIName.GET_ANNOUNCEMENTS_BY_COMPANY_ID,
    method: HttpMethod.GET,
    path: APIPath.GET_ANNOUNCEMENTS_BY_COMPANY_ID,
  }),
  [APIName.GET_COMMENTS_BY_COMPANY_ID]: createAPIConfig({
    name: APIName.GET_COMMENTS_BY_COMPANY_ID,
    method: HttpMethod.GET,
    path: APIPath.GET_COMMENTS_BY_COMPANY_ID,
  }),
  [APIName.GET_FLAGS_BY_COMPANY_ID]: createAPIConfig({
    name: APIName.GET_FLAGS_BY_COMPANY_ID,
    method: HttpMethod.GET,
    path: APIPath.GET_FLAGS_BY_COMPANY_ID,
  }),
};
