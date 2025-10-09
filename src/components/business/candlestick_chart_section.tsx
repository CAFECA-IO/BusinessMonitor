'use client';

import React from 'react';
import CandlestickChart from '@/components/common/candlestick_chart';
import { ICandlestickChartNode, IBarGraphNode } from '@/interfaces/chart';
// import { MarketPayload as IMarket } from '@/types/company';
import { IMarketChartPoint } from '@/interfaces/market';

// interface INodeData {
//   timestamp: number;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   volume: number;
// }

interface ICandlestickChartSectionProps {
  chartPoints: IMarketChartPoint[];
}

const CandlestickChartSection: React.FC<ICandlestickChartSectionProps> = ({ chartPoints }) => {
  const chartData: ICandlestickChartNode[] =
    chartPoints.map((point) => ({
      x: new Date(point.date).getTime(),
      y: [point.open, point.high, point.low, point.close],
    })) ?? [];

  const barGraphData: IBarGraphNode[] = chartPoints.map((point) => ({
    x: new Date(point.date).getTime(),
    y: Number(point.volume),
    // Info: (20251009 - Julian) 根據漲跌決定顏色
    fillColor: point.open > point.close ? '#FF4D4D' : '#4CBA87',
  }));

  return <CandlestickChart candlestickData={chartData} volumeData={barGraphData} />;
};

export default CandlestickChartSection;
