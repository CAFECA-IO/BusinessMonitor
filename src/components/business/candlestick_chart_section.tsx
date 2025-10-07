'use client';

import React, { useState, useEffect } from 'react';
import { IoTriangle } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { formatNumberWithCommas } from '@/lib/common';
import CandlestickChart from '@/components/common/candlestick_chart';
import { ICandlestickChartNode /* IBarGraphNode */ } from '@/interfaces/chart';
// import { MarketPayload as IMarket } from '@/types/company';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';

// interface INodeData {
//   timestamp: number;
//   open: number;
//   high: number;
//   low: number;
//   close: number;
//   volume: number;
// }

interface ICandlestickChartSectionProps {
  businessId: string;
  open: number;
  high: number;
  low: number;
  close: number;
  change: number;
  changePercent: number;
  volume: number;
}

enum ChartRange {
  '1D' = '1d',
  '1W' = '1w',
  '1M' = '1M',
}

// interface IChartData {
//   candlestickData: ICandlestickChartNode[];
//   barGraphData: IBarGraphNode[];
// }

const CandlestickChartSection: React.FC<ICandlestickChartSectionProps> = ({
  businessId,
  open,
  high,
  low,
  close,
  change,
  changePercent,
  volume,
}) => {
  const { t } = useTranslation(['business_detail']);

  const { success, payload, trigger, isLoading } = useApi<{
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
    // ToDo: (20251007 - Julian) range 之後要改成 timeframe
    query: { range: ChartRange['1D'] },
  });

  const chartData: ICandlestickChartNode[] =
    payload?.data.map((point) => ({
      x: new Date(point.date).getTime(),
      y: [point.open, point.high, point.low, point.close],
    })) ?? [];

  const [currentRange, setCurrentRange] = useState<ChartRange>(ChartRange['1D']);

  useEffect(() => {
    switch (currentRange) {
      case ChartRange['1D']:
        trigger({ params: { id: businessId }, query: { range: ChartRange['1D'] } });
        break;
      case ChartRange['1W']:
        trigger({ params: { id: businessId }, query: { range: ChartRange['1W'] } });
        break;
      case ChartRange['1M']:
        trigger({ params: { id: businessId }, query: { range: ChartRange['1M'] } });
        break;
      default:
        break;
    }
  }, [currentRange]);

  const isPosition = change >= 0;

  const rangeOption = Object.values(ChartRange);
  const changeColor = isPosition ? 'text-text-success' : 'text-text-error';

  const rangeButtons = rangeOption.map((range) => {
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
        {t(`business_detail:GRAPH_${range.toUpperCase()}_BTN`)}
      </button>
    );
  });

  if (isLoading) {
    return (
      // ToDo: (20251007 - Julian) loading design
      <div className="flex flex-col items-center justify-center p-80px">Loading...</div>
    );
  } else if (success && payload) {
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
        <div className="flex items-center justify-end gap-5px py-12px">{rangeButtons}</div>
      </div>
    );
  } else {
    // ToDo: (20251007 - Julian) no data design
    return <div className="flex flex-col items-center justify-center p-80px">no data</div>;
  }
};

export default CandlestickChartSection;
