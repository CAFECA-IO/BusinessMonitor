import React from 'react';
import Skeleton from '@/components/common/skeleton';

const SkeletonCard: React.FC = () => {
  return (
    <div className="flex h-150px w-220px flex-col justify-between gap-24px rounded-radius-m border border-transparent bg-surface-primary px-16px py-12px">
      <div className="flex gap-8px">
        <Skeleton width={40} height={40} rounded />
        <div className="flex flex-col items-start gap-4px">
          <Skeleton width={120} height={20} />
          <Skeleton width={80} height={10} />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Skeleton width={30} height={20} />
        <Skeleton width={80} height={20} />
      </div>
    </div>
  );
};

export default SkeletonCard;
