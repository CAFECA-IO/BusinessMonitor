import React from 'react';
import Image from 'next/image';
import { IoTriangle } from 'react-icons/io5';
import { PiFlagPennantFill } from 'react-icons/pi';
import { IBusinessBrief } from '@/interfaces/business';

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
    <div className="flex w-220px flex-col gap-24px rounded-radius-m border border-transparent bg-surface-primary px-16px py-12px shadow-drop-L hover:cursor-pointer hover:border-border-brand">
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
      {/* Info: (20250804 - Julian) Candlestick Chart */}
      <div className="flex flex-col gap-12px">
        {/* ToDo: (20250804 - Julian) Candlestick Chart */}
        <div className="h-40px w-full bg-lime-600"></div>
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
              <p>{changePercentage}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessBriefCard;
