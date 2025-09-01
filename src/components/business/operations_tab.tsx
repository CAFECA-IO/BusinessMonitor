import React from 'react';
import InfoBlockLayout from '@/components/business/info_block_layout';

const OperationsTab: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-x-60px gap-y-40px">
      <div className="col-span-2">
        <InfoBlockLayout
          title="Import & Export Data"
          tooltipContent="tooltip content"
          className="grid grid-cols-2 gap-y-40px text-sm"
        >
          <div className=""></div>
        </InfoBlockLayout>
      </div>
    </div>
  );
};

export default OperationsTab;
