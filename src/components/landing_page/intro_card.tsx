import React from 'react';
import Image from 'next/image';

interface IIntroCardProps {
  imgSrc: string;
  title: string;
  description: string;
}

const IntroCard: React.FC<IIntroCardProps> = ({ imgSrc, title, description }) => {
  // Info: (20250801 - Julian) 將 **粗體字** 拆出來
  const titleArr = title.split(/(\*\*\w+\*\*)/);
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
    <div className="flex flex-col items-center gap-120px px-120px py-80px desktop:odd:flex-row desktop:even:flex-row-reverse">
      {/* Info: (20250801 - Julian) Image */}
      <Image src={imgSrc} width={500} height={400} alt="connecting" />

      {/* Info: (20250801 - Julian) Text */}
      <div className="flex flex-col items-start gap-24px text-left">
        {/* Info: (20250801 - Julian) Title */}
        <h3 className="text-h3 font-bold text-text-primary">{formattedTitle}</h3>
        {/* Info: (20250801 - Julian) Description */}
        <p className="text-lg font-medium text-text-secondary">{description}</p>
      </div>
    </div>
  );
};

export default IntroCard;
