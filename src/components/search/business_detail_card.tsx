'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { IoTriangle } from 'react-icons/io5';
import { PiFlagPennantFill } from 'react-icons/pi';
import { BM_URL } from '@/constants/url';
import { CompanyCard as ICompanyCard } from '@/types/company';
import LineGraph from '@/components/common/line_graph';

interface IBusinessDetailCardProps {
  business: ICompanyCard;
}

const BusinessDetailCard: React.FC<IBusinessDetailCardProps> = ({ business }) => {
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
    address,
    // lineGraphData,
  } = business;

  const countOfGreenFlags = flags ? flags.green : 0;
  const countOfRedFlags = flags ? flags.red : 0;

  const stockPrice = market && market.last ? market.last : '--';
  const stockPriceChange = market && market.changePct ? market.changePct : '--';
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
    // ToDo: (20250911 - Julian) Default Logo
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

  return (
    <Link
      href={`${BM_URL.BUSINESS_MONITOR}/${business.id}`}
      className="flex w-full gap-24px rounded-radius-m border border-border-secondary bg-surface-primary px-16px py-12px hover:cursor-pointer hover:border-border-brand"
    >
      <div className="flex flex-1 gap-8px">
        {/* Info: (20250804 - Julian) Business Image */}
        <div className="size-40px shrink-0 overflow-hidden rounded-full">{isShowLogo}</div>
        {/* Info: (20250804 - Julian) Business Info */}
        <div className="flex flex-col gap-12px">
          <div className="flex flex-col items-start gap-4px">
            <p className="line-clamp-2 text-sm font-bold text-text-secondary">{isShowName}</p>
            <p className="text-xs font-medium text-text-note">{registrationNo}</p>
          </div>
          <p className="text-xs font-medium text-text-primary">{address}</p>
          <div className="flex items-center gap-8px text-xs font-normal">
            {/* Info: (20250916 - Julian) Green Flag */}
            {isShowGreenFlag}
            {/* Info: (20250916 - Julian) Red Flag */}
            {isShowRedFlag}
          </div>
        </div>
      </div>
      {/* Info: (20250804 - Julian) Chart Part */}
      <div className="flex flex-col items-end gap-12px">
        {/* Info: (20250910 - Julian) Line Graph */}
        <div className="h-full w-160px">
          {/* Info: (20250916 - Julian) During Developing */}
          <LineGraph lineColor={lineColor} graphData={graphData} graphHeight={60} />
        </div>
        <div className={`flex items-center gap-4px font-medium ${changeColor}`}>
          <p className="text-sm">{stockPrice}</p>
          <div className="flex items-center gap-4px text-xs">
            {changeSign}
            <p>{numChangePct}%</p>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default BusinessDetailCard;
