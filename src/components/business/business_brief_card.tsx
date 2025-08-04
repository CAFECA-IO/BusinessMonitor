import React from 'react';

const BusinessBriefCard: React.FC = () => {
  return (
    <div className="flex h-150px w-200px flex-col gap-24px rounded-radius-m bg-surface-primary px-16px py-12px shadow-drop-L">
      {/* Info: (20250804 - Julian) Business Name */}
      <div className="flex items-center"></div>
      {/* Info: (20250804 - Julian) Candlestick Chart */}
      <div className="flex items-center"></div>
    </div>
  );
};

export default BusinessBriefCard;
