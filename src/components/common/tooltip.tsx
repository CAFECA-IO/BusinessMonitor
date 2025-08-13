'use client';

import React, { useState } from 'react';
import Image from 'next/image';

export enum TooltipDirection {
  TOP = 'top',
  BOTTOM = 'bottom',
  LEFT = 'left',
  RIGHT = 'right',
}

interface ITooltipProps {
  content: string;
  direction: TooltipDirection;
}

const Tooltip: React.FC<ITooltipProps> = ({ content, direction }) => {
  const [isShowing, setIsShowing] = useState<boolean>(false);

  // Info: (20250813 - Julian) 判斷方向是否為垂直
  const isVertical = direction === TooltipDirection.TOP || direction === TooltipDirection.BOTTOM;

  // Info: (20250813 - Julian) 框框對齊方式
  const alignmentStyle = isVertical ? 'flex-col' : 'flex-row';

  // Info: (20250813 - Julian) 框框顯示樣式
  const showingStyle = isShowing ? 'visible opacity-100' : 'invisible opacity-0';

  // Info: (20250813 - Julian) 框框方向
  const bubbleStyle =
    direction === TooltipDirection.RIGHT
      ? 'left-full ml-16px' // Info: (20250813 - Julian) 左邊
      : direction === TooltipDirection.LEFT
        ? 'right-full mr-16px' // Info: (20250813 - Julian) 右邊
        : direction === TooltipDirection.TOP
          ? 'bottom-full mb-16px' // Info: (20250813 - Julian) 上面
          : 'top-full mt-16px'; // Info: (20250813 - Julian) 下面

  // // Info: (20250813 - Julian) 三角形方向
  const triangleStyle =
    direction === TooltipDirection.RIGHT
      ? '-left-16px border-r-surface-primary' // Info: (20250813 - Julian) 左邊
      : direction === TooltipDirection.LEFT
        ? '-right-16px border-l-surface-primary' // Info: (20250813 - Julian) 右邊
        : direction === TooltipDirection.TOP
          ? '-bottom-16px border-t-surface-primary' // Info: (20250813 - Julian) 上面
          : '-top-16px border-b-surface-primary'; // Info: (20250813 - Julian) 下面

  // // Info: (20250813 - Julian) 鼠標移入時顯示
  const onMouseEnter = () => setIsShowing(true);
  // // Info: (20250813 - Julian) 鼠標移出時隱藏
  const onMouseLeave = () => setIsShowing(false);

  return (
    <div
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={`${alignmentStyle} relative flex items-center`}
    >
      <div className="relative hover:cursor-pointer">
        <Image src="/icons/info.svg" width={24} height={24} alt="info_icon" />
      </div>

      <div
        className={`${bubbleStyle} ${showingStyle} absolute transition-all duration-300 ease-in-out`}
      >
        {/* Info: (20250812 - Julian) Message Box */}
        <div
          className={`${alignmentStyle} max-w-300px relative flex w-max items-center rounded-lg bg-surface-primary px-24px py-12px text-xs font-normal shadow-drop-L`}
        >
          <p>{content}</p>
          {/* Info: (20250812 - Julian) Triangle */}
          <div className={`${triangleStyle} absolute border-8 border-transparent`}></div>
        </div>
      </div>
    </div>
  );
};

export default Tooltip;
