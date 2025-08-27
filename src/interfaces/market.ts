export interface IMarketInfo {
  businessId: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  low: number;
  high: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  avgVolume3Month: number;
  sharesOutstanding: number;
  mktCap: number;
  divYield: number;
  volume: number;
  sellersPercent: number;
  buyersPercent: number;
}

export const mockMarketInfo: IMarketInfo = {
  businessId: '1',
  price: 150.25,
  change: -1.34,
  changePercent: -0.89,
  open: 151.0,
  low: 149.5,
  high: 152.0,
  fiftyTwoWeekHigh: 180.0,
  fiftyTwoWeekLow: 120.0,
  avgVolume3Month: 2320000,
  sharesOutstanding: 53454500000,
  mktCap: 7545345000000,
  divYield: 1.2,
  volume: 1800000,
  sellersPercent: 58,
  buyersPercent: 42,
};
