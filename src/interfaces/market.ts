export interface IMarketSummary {
  open: number;
  close: number;
  low: number;
  high: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  avgVolume3Month: string;
  sharesOutstanding: string;
  volume: string;
  mktCap: string | null;
  divYield: string | null;
}

export interface IMarketChartPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: string;
}

export interface IMarketInfo {
  companyId: number;
  stockSymbol: string;
  timeframe: string;
  summary: IMarketSummary;
  data: IMarketChartPoint[];
}
