'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoTriangle } from 'react-icons/io5';
import { PiFlagPennantFill } from 'react-icons/pi';
import { IBusinessBrief } from '@/interfaces/business';
import { BM_URL } from '@/constants/url';

import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';

// Info: (20250908 - Julian) 動態載入，避免 SSR 錯誤
const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

const LineChart: React.FC = () => {
  const options: ApexOptions = {
    chart: {
      type: 'area',
      height: 100,
      toolbar: { show: false },
      zoom: { enabled: false },
    },
    stroke: { width: 2 },
    grid: { show: false },
    xaxis: {
      type: 'datetime',
      labels: { show: false },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: { show: false },
    },
    tooltip: { enabled: false },
    colors: ['#3DD08C'], // ToDo: (20250908 - Julian) Line Color
  };

  const series = [
    {
      name: 'Price',
      data: [
        { x: new Date(2023, 0, 1).getTime(), y: 420.85 },
        { x: new Date(2023, 0, 2).getTime(), y: 320.95 },
        { x: new Date(2023, 0, 3).getTime(), y: 388.48 },
        { x: new Date(2023, 0, 4).getTime(), y: 450.23 },
        { x: new Date(2023, 0, 5).getTime(), y: 470.12 },
        { x: new Date(2023, 0, 6).getTime(), y: 430.56 },
        { x: new Date(2023, 0, 7).getTime(), y: 480.34 },
      ],
    },
  ];

  return <Chart options={options} series={series} type="line" height={100} />;
};

interface IBusinessBriefCardProps {
  business: IBusinessBrief;
}

const BusinessBriefCard: React.FC<IBusinessBriefCardProps> = ({ business }) => {
  const {
    name,
    imgSrc,
    businessTaxId,
    countOfGreenFlags,
    countOfRedFlags,
    stockPrice,
    stockPriceChange,
  } = business;

  const isPositive = stockPriceChange >= 0;
  const isShowGreenFlag = countOfGreenFlags > 0;
  const isShowRedFlag = countOfRedFlags > 0;

  const changePercentage = (stockPriceChange * 100).toFixed(2);

  const changeColor = isPositive ? 'text-text-success' : 'text-text-error';
  const changeSign = isPositive ? (
    <IoTriangle size={8} />
  ) : (
    <IoTriangle size={8} className="rotate-180" />
  );

  return (
    <Link
      href={`${BM_URL.BUSINESS_MONITOR}/${business.id}`}
      className="flex w-220px flex-col gap-24px rounded-radius-m border border-transparent bg-surface-primary px-16px py-12px shadow-drop-L hover:cursor-pointer hover:border-border-brand"
    >
      {/* Info: (20250804 - Julian) Business Info */}
      <div className="flex gap-8px">
        <div className="h-40px w-40px shrink-0 overflow-hidden rounded-full">
          <Image src={imgSrc} width={40} height={40} alt="business_avatar" />
        </div>
        <div className="flex flex-col items-start gap-4px">
          <p className="text-sm font-bold text-text-secondary">{name}</p>
          <p className="text-xs font-medium text-text-note">{businessTaxId}</p>
        </div>
      </div>
      {/* Info: (20250804 - Julian) Chart Part */}
      <div className="flex flex-col gap-12px">
        {/* ToDo: (20250804 - Julian) Line Chart */}
        <div className="w-full">
          <LineChart />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8px text-xs font-normal">
            {/* Info: (20250804 - Julian) Green Flag */}
            {isShowGreenFlag && (
              <div className="flex items-center gap-2px text-text-success">
                <PiFlagPennantFill size={12} />
                {countOfGreenFlags}
              </div>
            )}
            {/* Info: (20250804 - Julian) Red Flag */}
            {isShowRedFlag && (
              <div className="flex items-center gap-2px text-text-error">
                <PiFlagPennantFill size={12} />
                {countOfRedFlags}
              </div>
            )}
          </div>
          <div className={`flex items-center gap-4px font-medium ${changeColor}`}>
            <p className="text-sm">{stockPrice}</p>
            <div className="flex items-center gap-4px text-xs">
              {changeSign}
              <p>{changePercentage}%</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BusinessBriefCard;
