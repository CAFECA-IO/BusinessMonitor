import React from 'react';
import Tooltip from '@/components/common/tooltip';

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
  const tooltip = tooltipContent && <Tooltip content={tooltipContent} direction="right" />;

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
