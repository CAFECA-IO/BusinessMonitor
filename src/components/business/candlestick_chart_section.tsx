'use client';

import React from 'react';
import CandlestickChart from '@/components/common/candlestick_chart';
import { ICandlestickChartNode /* IBarGraphNode */ } from '@/interfaces/chart';
// import { MarketPayload as IMarket } from '@/types/company';
import { IMarketInfo } from '@/interfaces/market';

// interface INodeData {
//   timestamp: number;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   volume: number;
// }

interface ICandlestickChartSectionProps {
  marketInfo: IMarketInfo;
}

// interface IChartData {
//   candlestickData: ICandlestickChartNode[];
//   barGraphData: IBarGraphNode[];
// }

const CandlestickChartSection: React.FC<ICandlestickChartSectionProps> = ({ marketInfo }) => {
  const marketData = marketInfo.data;

  const chartData: ICandlestickChartNode[] =
    marketData.map((point) => ({
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
