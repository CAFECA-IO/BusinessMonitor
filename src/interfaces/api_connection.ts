const apiVersion = 'v1';
const apiPrefix = `/api/${apiVersion}`;

export enum APIName {
  LIST_NEW_BUSINESSES = 'LIST_NEW_BUSINESSES',
  LIST_MOST_VIEWED_BUSINESSES = 'LIST_MOST_VIEWED_BUSINESSES',
}

export const APIMap: Record<APIName, string> = {
  [APIName.LIST_NEW_BUSINESSES]: `${apiPrefix}/companies/new`,
  [APIName.LIST_MOST_VIEWED_BUSINESSES]: `${apiPrefix}/companies/most-viewed`,
};
