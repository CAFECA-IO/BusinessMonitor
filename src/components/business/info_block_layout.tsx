import React from 'react';
import Image from 'next/image';

interface IInfoBlockLayoutProps {
  title: string;
  children: React.ReactNode;
  tooltipContent?: string;
  className?: string;
}

const InfoBlockLayout: React.FC<IInfoBlockLayoutProps> = ({
  title,
  children,
  tooltipContent = '',
  className = '',
}) => {
  /* ToDo: (20250812 - Julian) Tooltip */
  const tooltip = tooltipContent && (
    <div className="relative flex items-center">
      <Image
        src="/icons/info.svg"
        width={24}
        height={24}
        alt="info_icon"
        className="hover:cursor-pointer"
      />

      <div className=""></div>
    </div>
  );

  return (
    <div className="flex h-420px flex-col gap-40px rounded-radius-l bg-white px-60px py-40px">
      <div className="flex items-center gap-8px">
        <p className="text-h5 font-bold text-text-brand">{title}</p>

        {tooltip}
      </div>
      <hr className="border-border-secondary" />
      {/* Info: (20250812 - Julian) Content */}
      <div className={`${className} overflow-y-auto overflow-x-hidden`}>{children}</div>
    </div>
  );
};

export default InfoBlockLayout;
