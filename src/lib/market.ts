import { TrendPoint, MarketPayload } from '@/types/company';

export function buildMarket(points: TrendPoint[]): MarketPayload {
  const n = points.length;
  if (n === 0) return { last: null, change: null, changePct: null, sparkline: [] };
  const last = Number(points[n - 1].close);
  const prev = n > 1 ? Number(points[n - 2].close) : null;
  if (prev == null) return { last: String(last), change: null, changePct: null, sparkline: points };
  const diff = last - prev;
  const pct = prev !== 0 ? (diff / prev) * 100 : 0;
  return {
    last: String(last),
    change: diff.toFixed(2),
    changePct: pct.toFixed(2),
    sparkline: points,
  };
}
