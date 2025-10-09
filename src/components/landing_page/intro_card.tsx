'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';

interface IIntroCardProps {
  imgSrc: string;
  title: string;
  description: string;
}

const IntroCard: React.FC<IIntroCardProps> = ({ imgSrc, title, description }) => {
  const { t } = useTranslation(['landing_page']);

  // Info: (20250801 - Julian) 將 **粗體字** 拆出來
  const titleArr = t(title).split(/(\*\*.+?\*\*)/u);
  const formattedTitle = titleArr.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const curedPart = part.slice(2, -2); // Info: (20250801 - Julian) 移除 ** 符號
      return (
        <span key={index} className="text-text-brand">
          {curedPart}
        </span>
      );
    }
    return <span key={index}>{part}</span>;
  });

  return (
    <div className="flex flex-col items-center gap-32px p-20px desktop:gap-120px desktop:px-120px desktop:py-80px desktop:odd:flex-row desktop:even:flex-row-reverse">
      {/* Info: (20250801 - Julian) Image */}
      <div className="relative h-150px w-300px desktop:h-450px desktop:w-500px">
        <Image src={imgSrc} fill objectFit="contain" alt="connecting" />
      </div>

      {/* Info: (20250801 - Julian) Text */}
      <div className="flex flex-col items-start gap-8px text-left desktop:gap-24px">
        {/* Info: (20250801 - Julian) Title */}
        <h3 className="text-lg font-bold text-text-primary desktop:text-h3">{formattedTitle}</h3>
        {/* Info: (20250801 - Julian) Description */}
        <p className="text-base font-medium text-text-secondary desktop:text-lg">
          {t(description)}
        </p>
      </div>
    </div>
  );
};

export default IntroCard;
