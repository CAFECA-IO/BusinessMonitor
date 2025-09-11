import React from 'react';
import { cn } from '@/lib/common';

interface ISkeletonProps {
  width: number;
  height: number;
  rounded?: boolean;
  className?: string;
}

const Skeleton = ({ width, height, rounded, className }: ISkeletonProps) => {
  return (
    <div
      className={cn('relative overflow-hidden', rounded ? 'rounded-full' : 'rounded-lg')}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      <span
        className={cn(
          'animate-loading absolute left-0 top-0 w-full animate-pulse bg-grey-100',
          className
        )}
        style={{ height: `${height}px` }}
      ></span>
    </div>
  );
};

export default Skeleton;
