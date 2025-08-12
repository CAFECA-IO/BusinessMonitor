import React from 'react';
import Image from 'next/image';

interface ITooltipProps {
  content: string;
  direction: 'top' | 'bottom' | 'left' | 'right';
}

const Tooltip: React.FC<ITooltipProps> = ({ content, direction }) => {
  // ToDo: (20250812 - Julian) add Top and Bottom directions
  const bubbleStyle = direction === 'right' ? 'left-full ml-16px' : 'right-full mr-16px';
  const triangleStyle =
    direction === 'right'
      ? '-left-16px border-r-surface-primary'
      : '-right-16px border-l-surface-primary';

  return (
    <div className="relative flex items-center">
      <Image
        src="/icons/info.svg"
        width={24}
        height={24}
        alt="info_icon"
        className="hover:cursor-pointer"
      />

      <div className={`${bubbleStyle} absolute`}>
        {/* Info: (20250812 - Julian) Message Box */}
        <div className="max-w-300px relative flex w-max items-center rounded-lg bg-surface-primary px-24px py-12px text-xs font-normal shadow-drop-L">
          <p>{content}</p>
          {/* Info: (20250812 - Julian) Triangle */}
          <div className={`${triangleStyle} absolute border-8 border-transparent`}></div>
        </div>
      </div>
    </div>
  );
};

export default Tooltip;
