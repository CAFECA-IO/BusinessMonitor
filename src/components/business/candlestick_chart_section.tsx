'use client';

import React, { useState, useEffect } from 'react';
import { IoTriangle } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { formatNumberWithCommas } from '@/lib/common';
import CandlestickChart from '@/components/common/candlestick_chart';
import { ICandlestickChartNode, IBarGraphNode } from '@/interfaces/chart';
// import { MarketPayload as IMarket } from '@/types/company';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';

interface INodeData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface ICandlestickChartSectionProps {
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
}

enum ChartRange {
  '1M' = '1m',
  '3M' = '3m',
  '6M' = '6m',
  '1Y' = '1y',
}

interface IChartData {
  candlestickData: ICandlestickChartNode[];
  barGraphData: IBarGraphNode[];
}

const CandlestickChartSection: React.FC<ICandlestickChartSectionProps> = ({
  open,
  high,
  low,
  close,
  change,
  changePercent,
  volume,
}) => {
  const { t } = useTranslation(['business_detail']);

  const businessId = '291652';

  const { payload, refetch } = useApi<{
    companyId: number;
    stockSymbol: string;
    timeframe: string;
    data: {
      date: string;
      open: number;
      high: number;
      low: number;
      close: number;
      volume: string;
    }[];
  }>(APIName.GET_MARKET_INFO_BY_COMPANY_ID, {
    params: { id: businessId },
    query: { range: ChartRange['1M'], limit: 10 }, // ToDo: (20250912 - Julian) Make range & limit dynamic
  });

  const chartData: ICandlestickChartNode[] =
    payload?.data.map((point) => ({
      x: new Date(point.date).getTime(),
      y: [point.open, point.high, point.low, point.close],
    })) ?? [];

  const [currentRange, setCurrentRange] = useState<ChartRange>(ChartRange['1M']);
  // const [chartData, setChartData] = useState<ICandlestickChartNode[]>(firstData);

  // ToDo: (20250909 - Julian) get chart data from API
  useEffect(() => {
    switch (currentRange) {
      case ChartRange['1M']:
        refetch({ params: { id: businessId }, query: { range: ChartRange['1M'], limit: 10 } });
        break;
      case ChartRange['3M']:
        refetch({ params: { id: businessId }, query: { range: ChartRange['3M'], limit: 10 } });
        break;
      case ChartRange['6M']:
        refetch({ params: { id: businessId }, query: { range: ChartRange['6M'], limit: 10 } });
        break;
      case ChartRange['1Y']:
        refetch({ params: { id: businessId }, query: { range: ChartRange['1Y'], limit: 10 } });
        break;
      default:
        break;
    }
  }, [currentRange]);

  const isPosition = change >= 0;

  const rangeOption = Object.values(ChartRange);
  const changeColor = isPosition ? 'text-text-success' : 'text-text-error';

  const rangeBtns = rangeOption.map((range) => {
    const isActive = currentRange === range;
    const clickHandler = () => setCurrentRange(range);

    return (
      <button
        type="button"
        key={range}
        onClick={clickHandler}
        className={`${
          isActive
            ? 'bg-surface-brand text-text-invert'
            : 'bg-transparent text-text-primary hover:bg-grey-100'
        } w-60px rounded-full px-12px py-2px text-sm`}
      >
        {/* {t(`business_detail:GRAPH_${range.toUpperCase()}_BTN`)} */}
        {range.toUpperCase()}
      </button>
    );
  });

  return (
    <div className="relative flex w-full flex-col">
      {/* Info: (20250909 - Julian) chart meta data */}
      <div className="absolute left-24px top-24px z-50 flex items-center gap-16px bg-surface-background px-4px text-sm font-medium text-text-secondary">
        <p>
          {t('business_detail:GRAPH_OPEN')}{' '}
          <span className={changeColor}>{formatNumberWithCommas(open, true)}</span>
        </p>
        <p>
          {t('business_detail:GRAPH_HIGH')}{' '}
          <span className="text-text-success">{formatNumberWithCommas(high, true)}</span>
        </p>
        <p>
          {t('business_detail:GRAPH_LOW')}{' '}
          <span className="text-text-error">{formatNumberWithCommas(low, true)}</span>
        </p>
        <p>
          {t('business_detail:GRAPH_CLOSE')}{' '}
          <span className="text-text-success">{formatNumberWithCommas(close, true)}</span>
        </p>
        <div className={`flex items-center gap-4px ${changeColor}`}>
          <IoTriangle size={8} className={isPosition ? '' : 'rotate-180'} />
          <p>
            {change} ({changePercent}%)
          </p>
        </div>
        <p>
          {t('business_detail:GRAPH_VOLUME')}{' '}
          <span className="text-text-success">{formatNumberWithCommas(volume)}</span>
        </p>
      </div>

      {/* Info: (20250909 - Julian) candlestick chart */}
      <CandlestickChart
        candlestickData={chartData}
        // volumeData={chartData.barGraphData}
      />

      {/* Info: (20250909 - Julian) chart range button */}
      <div className="flex items-center justify-end gap-5px py-12px">{rangeBtns}</div>
    </div>
  );
};

export default CandlestickChartSection;
