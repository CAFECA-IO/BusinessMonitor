'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { IoTriangle } from 'react-icons/io5';
import { useTranslation } from 'react-i18next';
import { formatNumberWithCommas } from '@/lib/common';
import CandlestickChart from '@/components/common/candlestick_chart';
import { ICandlestickChartNode, IBarGraphNode } from '@/interfaces/chart';
import { MarketPayload as IMarket } from '@/types/company';
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

const dayData: INodeData[] = [
  {
    open: 451.98,
    high: 493.29,
    low: 401.59,
    close: 420.85,
    timestamp: 1675224000,
    volume: 5142342,
  },
  {
    open: 353.66,
    high: 374.99,
    low: 281.35,
    close: 320.95,
    timestamp: 1675227600,
    volume: 6523423,
  },
  {
    open: 352.96,
    high: 403.78,
    low: 351.54,
    close: 388.48,
    timestamp: 1675231200,
    volume: 5538913,
  },
  {
    open: 402.54,
    high: 462.79,
    low: 407.88,
    close: 349.24,
    timestamp: 1675234800,
    volume: 3381931,
  },
  {
    open: 449.17,
    high: 482.86,
    low: 417.7,
    close: 491.78,
    timestamp: 1675238400,
    volume: 1938421,
  },
  {
    open: 500.31,
    high: 550.35,
    low: 480.54,
    close: 530.34,
    timestamp: 1675242000,
    volume: 1534234,
  },
  {
    open: 530.25,
    high: 600.56,
    low: 520.62,
    close: 580.56,
    timestamp: 1675245600,
    volume: 1534234,
  },
  {
    open: 580.34,
    high: 620.47,
    low: 570.68,
    close: 600.23,
    timestamp: 1675249200,
    volume: 1534234,
  },
];

const weekData: INodeData[] = [
  {
    open: 451.98,
    high: 493.29,
    low: 401.59,
    close: 420.85,
    timestamp: 1672502400,
    volume: 1542342,
  },
  {
    open: 580.34,
    high: 620.47,
    low: 570.68,
    close: 600.23,
    timestamp: 1673107200,
    volume: 1534234,
  },
  {
    open: 600.12,
    high: 630.89,
    low: 590.45,
    close: 620.78,
    timestamp: 1673712000,
    volume: 1534234,
  },
  {
    open: 620.5,
    high: 650.32,
    low: 610.23,
    close: 640.12,
    timestamp: 1674316800,
    volume: 1720134,
  },
  {
    open: 640.78,
    high: 670.45,
    low: 630.56,
    close: 660.34,
    timestamp: 1674921600,
    volume: 2334234,
  },
  {
    open: 660.23,
    high: 700.12,
    low: 650.34,
    close: 680.56,
    timestamp: 1675526400,
    volume: 1634234,
  },
  {
    open: 680.45,
    high: 720.67,
    low: 670.89,
    close: 700.78,
    timestamp: 1676131200,
    volume: 2123648,
  },
];

const monthData: INodeData[] = [
  {
    open: 449.17,
    high: 482.86,
    low: 417.7,
    close: 491.78,
    timestamp: 1672502400,
    volume: 8938421,
  },
  {
    open: 281.66,
    high: 304.99,
    low: 231.35,
    close: 220.95,
    timestamp: 1675180800,
    volume: 7238423,
  },
  {
    open: 324.24,
    high: 382.25,
    low: 239.34,
    close: 318.34,
    timestamp: 1677600000,
    volume: 9193842,
  },
  {
    open: 402.54,
    high: 462.79,
    low: 407.88,
    close: 349.24,
    timestamp: 1680278400,
    volume: 7429372,
  },
  {
    open: 352.96,
    high: 403.78,
    low: 351.54,
    close: 388.48,
    timestamp: 1682870400,
    volume: 7836824,
  },
  {
    open: 434.14,
    high: 471.35,
    low: 405.48,
    close: 405.99,
    timestamp: 1685548800,
    volume: 6951421,
  },
  {
    open: 728.32,
    high: 783.42,
    low: 530.24,
    close: 623.03,
    timestamp: 1688140800,
    volume: 1938421,
  },
];

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
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
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

  const businessId = '1234';

  // Info: (20250910 - Julian) 將原始資料轉換為圖表所需格式
  function transformNodeToCandlestickData(data: INodeData[]): ICandlestickChartNode[] {
    return data.map((item) => ({
      x: item.timestamp,
      y: [item.open, item.high, item.low, item.close],
    }));
  }
  function transformNodeToBarGraphData(data: INodeData[]): IBarGraphNode[] {
    return data.map((item) => ({
      x: item.timestamp,
      y: item.volume,
      fillColor: item.close >= item.open ? '#3DD08C' : '#FF5959',
    }));
  }

  const dayChartData: IChartData = useMemo(() => {
    return {
      candlestickData: transformNodeToCandlestickData(dayData),
      barGraphData: transformNodeToBarGraphData(dayData),
    };
  }, []);
  const weekChartData: IChartData = useMemo(() => {
    return {
      candlestickData: transformNodeToCandlestickData(weekData),
      barGraphData: transformNodeToBarGraphData(weekData),
    };
  }, []);
  const monthChartData: IChartData = useMemo(() => {
    return {
      candlestickData: transformNodeToCandlestickData(monthData),
      barGraphData: transformNodeToBarGraphData(monthData),
    };
  }, []);

  const [currentRange, setCurrentRange] = useState<ChartRange>(ChartRange.DAY);
  const [chartData, setChartData] = useState<IChartData>(dayChartData);

  // ToDo: (20250912 - Julian) During development
  const {
    // success,
    // payload: marketInfo,
    // isLoading,
  } = useApi<IMarket>(APIName.GET_MARKET_INFO_BY_COMPANY_ID, {
    params: { id: businessId },
    query: { range: '1y', limit: 10 }, // ToDo: (20250912 - Julian) Make range & limit dynamic
  });

  // ToDo: (20250909 - Julian) get chart data from API
  useEffect(() => {
    switch (currentRange) {
      case ChartRange.DAY:
        setChartData(dayChartData);
        break;
      case ChartRange.WEEK:
        setChartData(weekChartData);
        break;
      case ChartRange.MONTH:
        setChartData(monthChartData);
        break;
      default:
        setChartData(dayChartData);
    }
  }, [currentRange, dayChartData, weekChartData, monthChartData]);

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
        {t(`business_detail:GRAPH_${range.toUpperCase()}_BTN`)}
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
        candlestickData={chartData.candlestickData}
        volumeData={chartData.barGraphData}
      />

      {/* Info: (20250909 - Julian) chart range button */}
      <div className="flex items-center justify-end gap-5px py-12px">{rangeBtns}</div>
    </div>
  );
};

export default CandlestickChartSection;
