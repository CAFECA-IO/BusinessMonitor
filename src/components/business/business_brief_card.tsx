'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoTriangle } from 'react-icons/io5';
import { PiFlagPennantFill } from 'react-icons/pi';
// import { IBusinessBrief } from '@/interfaces/business';
import { CompanyCard as ICompanyCard } from '@/types/company';
import { BM_URL } from '@/constants/url';
import LineGraph from '@/components/common/line_graph';
import { formatNumberWithCommas } from '@/lib/common';

interface IBusinessBriefCardProps {
  business: ICompanyCard;
}

const BusinessBriefCard: React.FC<IBusinessBriefCardProps> = ({ business }) => {
  const {
    name,
    logoUrl, // imgSrc,
    registrationNo, // businessTaxId,
    flags,
    // countOfGreenFlags,
    // countOfRedFlags,
    market,
    // stockPrice,
    // stockPriceChange,
    // lineGraphData,
  } = business;

  const countOfGreenFlags = flags ? flags.green : 0;
  const countOfRedFlags = flags ? flags.red : 0;

  const stockPrice = market && market.last ? formatNumberWithCommas(market.last, true) : '--';
  const stockPriceChange =
    market && market.changePct ? formatNumberWithCommas(market.changePct, true) : '--';
  const numChangePct = parseFloat(stockPriceChange);

  const graphData = market && market.sparkline ? market.sparkline : [];

  const isPositive = numChangePct >= 0;
  const lineColor = isPositive ? '#3DD08C' : '#FF5959';
  const changeColor =
    graphData.length === 0
      ? 'text-text-secondary'
      : isPositive
        ? 'text-text-success'
        : 'text-text-error';

  const changeSign = isPositive ? (
    <IoTriangle size={8} />
  ) : (
    <IoTriangle size={8} className="rotate-180" />
  );

  const isShowLogo = logoUrl ? (
    <Image src={logoUrl} width={40} height={40} alt="business_avatar" />
  ) : (
    <div className="size-40px animate-pulse rounded-full bg-grey-100"></div>
  );

  const isShowName = name ? name : 'N/A';

  const isShowGreenFlag = countOfGreenFlags > 0 && (
    <div className="flex items-center gap-2px text-text-success">
      <PiFlagPennantFill size={12} />
      {countOfGreenFlags}
    </div>
  );

  const isShowRedFlag = countOfRedFlags > 0 && (
    <div className="flex items-center gap-2px text-text-error">
      <PiFlagPennantFill size={12} />
      {countOfRedFlags}
    </div>
  );

  const lineChart =
    graphData.length > 0 ? (
      <LineGraph lineColor={lineColor} graphData={graphData} graphHeight={40} />
    ) : (
      <div className="h-60px w-160px opacity-0">-</div>
    );

  return (
    <Link
      href={`${BM_URL.BUSINESS_MONITOR}/${business.id}`}
      className="flex w-220px flex-col gap-24px rounded-radius-m border border-transparent bg-surface-primary px-16px py-12px shadow-drop-L hover:cursor-pointer hover:border-border-brand"
    >
      {/* Info: (20250804 - Julian) Business Info */}
      <div className="flex flex-1 gap-8px">
        <div className="size-40px shrink-0 overflow-hidden rounded-full">{isShowLogo}</div>
        <div className="flex flex-col items-start gap-4px">
          <p className="text-sm font-bold text-text-secondary">{isShowName}</p>
          <p className="text-xs font-medium text-text-note">{registrationNo}</p>
        </div>
      </div>
      {/* Info: (20250804 - Julian) Chart Part */}
      <div className="flex flex-col gap-12px">
        {/* Info: (20250804 - Julian) Line Chart */}
        {lineChart}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8px text-xs font-normal">
            {/* Info: (20250804 - Julian) Green Flag */}
            {isShowGreenFlag}
            {/* Info: (20250804 - Julian) Red Flag */}
            {isShowRedFlag}
          </div>
          <div className={`flex items-center gap-4px font-medium ${changeColor}`}>
            <p className="text-sm">{stockPrice}</p>
            <div className="flex items-center gap-4px text-xs">
              {changeSign}
              <p>{numChangePct}%</p>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BusinessBriefCard;
