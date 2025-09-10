'use client';

import React, { useState, useEffect } from 'react';
import { IoTriangle } from 'react-icons/io5';
import { formatNumberWithCommas } from '@/lib/common';
import CandlestickChart from '@/components/common/candlestick_chart';
import { ICandidateChartNode } from '@/interfaces/chart';

const dayChartData: ICandidateChartNode[] = [
  // [Open, High, Low, Close]
  { x: 1675224000, y: [451.98, 493.29, 401.59, 420.85] },
  { x: 1675227600, y: [353.66, 374.99, 281.35, 320.95] },
  { x: 1675231200, y: [352.96, 403.78, 351.54, 388.48] },
  { x: 1675234800, y: [402.54, 462.79, 407.88, 349.24] },
  { x: 1675238400, y: [449.17, 482.86, 417.7, 491.78] },
  { x: 1675242000, y: [500.31, 550.35, 480.54, 530.34] },
  { x: 1675245600, y: [530.25, 600.56, 520.62, 580.56] },
  { x: 1675249200, y: [580.34, 620.47, 570.68, 600.23] },
  { x: 1675252800, y: [600.12, 630.89, 590.45, 620.78] },
  { x: 1675256400, y: [620.5, 650.32, 610.23, 640.12] },
  { x: 1675260000, y: [640.78, 670.45, 630.56, 660.34] },
  { x: 1675263600, y: [660.23, 690.12, 650.34, 680.56] },
  { x: 1675267200, y: [620.45, 720.34, 670.23, 700.12] },
  { x: 1675270800, y: [700.34, 730.56, 690.45, 710.78] },
  { x: 1675274400, y: [710.12, 740.23, 700.34, 720.45] },
  { x: 1675278000, y: [720.45, 750.12, 710.23, 730.34] },
];

const weekChartData: ICandidateChartNode[] = [
  { x: 1672502400, y: [451.98, 493.29, 401.59, 420.85] },
  { x: 1673107200, y: [580.34, 620.47, 570.68, 600.23] },
  { x: 1673712000, y: [600.12, 630.89, 590.45, 620.78] },
  { x: 1674316800, y: [620.5, 650.32, 610.23, 640.12] },
  { x: 1674921600, y: [640.78, 670.45, 630.56, 660.34] },
  { x: 1675526400, y: [660.23, 690.12, 650.34, 680.56] },
  { x: 1676131200, y: [680.45, 720.34, 670.23, 700.12] },
  { x: 1676736000, y: [700.34, 730.56, 690.45, 710.78] },
  { x: 1677340800, y: [710.12, 740.23, 700.34, 720.45] },
];

const monthChartData: ICandidateChartNode[] = [
  { x: 1672502400, y: [449.17, 482.86, 417.7, 491.78] },
  { x: 1675180800, y: [281.66, 304.99, 231.35, 220.95] },
  { x: 1677600000, y: [324.24, 382.25, 239.34, 318.34] },
  { x: 1680278400, y: [402.54, 462.79, 407.88, 349.24] },
  { x: 1682870400, y: [352.96, 403.78, 351.54, 388.48] },
  { x: 1685548800, y: [434.14, 471.35, 405.48, 405.99] },
  { x: 1688140800, y: [728.32, 783.42, 530.24, 623.03] },
  { x: 1690819200, y: [373.23, 394.22, 234.23, 312.34] },
  { x: 1693497600, y: [546.12, 560.89, 531.45, 542.47] },
  { x: 1696089600, y: [492.34, 526.39, 462.81, 500.23] },
  { x: 1698768000, y: [640.78, 670.45, 630.56, 660.34] },
  { x: 1701360000, y: [440.23, 483.29, 323.94, 342.55] },
  { x: 1704038400, y: [680.45, 720.34, 670.23, 700.12] },
];

const mockData = {
  open: 408.13,
  high: 401.32,
  low: 395.22,
  close: 398.11,
  change: -2.46,
  changePercent: -0.61,
  volume: 123456,
};

enum ChartRange {
  DAY = 'D',
  WEEK = 'W',
  MONTH = 'M',
}

const CandlestickChartSection: React.FC = () => {
  const { open, high, low, close, change, changePercent, volume } = mockData;

  const [currentRange, setCurrentRange] = useState<ChartRange>(ChartRange.DAY);
  const [chartData, setChartData] = useState<ICandidateChartNode[]>(dayChartData);

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
  }, [currentRange]);

  const rangeOption = Object.values(ChartRange);
  const changeColor = change >= 0 ? 'text-text-success' : 'text-text-error';

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
        {range}
      </button>
    );
  });

  return (
    <div className="relative flex w-full flex-col">
      {/* Info: (20250909 - Julian) chart meta data */}
      <div className="absolute left-24px top-24px z-50 flex items-center gap-16px text-sm font-medium text-text-secondary">
        <p>
          Open <span className="text-text-success">{formatNumberWithCommas(open, true)}</span>
        </p>
        <p>
          High <span className="text-text-success">{formatNumberWithCommas(high, true)}</span>
        </p>
        <p>
          Low <span className="text-text-success">{formatNumberWithCommas(low, true)}</span>
        </p>
        <p>
          Close <span className="text-text-success">{formatNumberWithCommas(close, true)}</span>
        </p>
        <div className={`flex items-center gap-4px ${changeColor}`}>
          <IoTriangle size={8} />
          <p>
            {change} ({changePercent}%)
          </p>
        </div>
        <p>
          Vol <span className="text-text-success">{formatNumberWithCommas(volume)}</span>
        </p>
      </div>

      {/* Info: (20250909 - Julian) candlestick chart */}
      <CandlestickChart chartData={chartData} />

      {/* Info: (20250909 - Julian) chart range button */}
      <div className="flex items-center justify-end gap-5px py-12px">{rangeBtns}</div>
    </div>
  );
};

export default CandlestickChartSection;
