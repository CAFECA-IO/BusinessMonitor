'use client';

import React from 'react';
import CandlestickChart from '@/components/common/candlestick_chart';
import { ICandlestickChartNode /* IBarGraphNode */ } from '@/interfaces/chart';
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

// interface IChartData {
//   candlestickData: ICandlestickChartNode[];
//   barGraphData: IBarGraphNode[];
// }

const CandlestickChartSection: React.FC<ICandlestickChartSectionProps> = ({ chartPoints }) => {
  const chartData: ICandlestickChartNode[] =
    chartPoints.map((point) => ({
      x: new Date(point.date).getTime(),
      y: [point.open, point.high, point.low, point.close],
    })) ?? [];

  return (
    <CandlestickChart
      candlestickData={chartData}
      // volumeData={chartData.barGraphData}
    />
  );
};

export default CandlestickChartSection;
