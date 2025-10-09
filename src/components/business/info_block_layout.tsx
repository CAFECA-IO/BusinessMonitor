import React from 'react';
import Tooltip, { TooltipDirection } from '@/components/common/tooltip';

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
  const tooltip = tooltipContent && (
    <Tooltip content={tooltipContent} direction={TooltipDirection.RIGHT} />
  );

  return (
    <div className="flex h-420px flex-col gap-24px rounded-radius-l bg-white p-20px desktop:px-60px desktop:py-36px">
      <div className="flex items-center gap-8px">
        <p className="text-base font-bold text-text-brand desktop:text-h5">{title}</p>

        {tooltip}
      </div>
      <hr className="bg-border-secondary" />
      {/* Info: (20250812 - Julian) Content */}
      <div className={`${className} overflow-hidden`}>{children}</div>
    </div>
  );
};

export default InfoBlockLayout;
