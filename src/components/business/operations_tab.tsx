import React from 'react';
import TradeBlock from '@/components/business/trade_block';
import GovernmentTendersBlock from '@/components/business/government_tenders_block';
import TrademarksBlock from '@/components/business/trademarks_block';
import PatentsBlock from '@/components/business/patents_block';
import PoliticalActivityBlock from '@/components/business/political_activity_block';

interface IOperationsTabProps {
  businessId: string;
}

const OperationsTab: React.FC<IOperationsTabProps> = ({ businessId }) => {
  return (
    <div className="grid grid-cols-2 gap-x-60px gap-y-40px">
      {/* Info: (20250915 - Julian) Trade Block */}
      <TradeBlock businessId={businessId} />

      {/* Info: (20250916 - Julian) Government Tenders Block */}
      <div className="col-span-2">
        <GovernmentTendersBlock businessId={businessId} />
      </div>

      {/* Info: (20250901 - Julian) Trademarks Block */}
      <TrademarksBlock businessId={businessId} />

      {/* Info: (20250901 - Julian) Patents Block */}
      <div>
        <PatentsBlock businessId={businessId} />
      </div>

      {/* Info: (20250901 - Julian) Political Activities Block */}
      <div className="col-span-2">
        <PoliticalActivityBlock businessId={businessId} />
      </div>
    </div>
  );
};

export default OperationsTab;
