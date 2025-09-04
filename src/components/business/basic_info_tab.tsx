import React from 'react';
import BasicInfoBlock from '@/components/business/basic_info_block';
import InvestorBlock from '@/components/business/investor_block';
import BusinessScopeBlock from '@/components/business/business_scope_block';
import HistoryBlock from '@/components/business/history_block';
import RelatedCompaniesBlock from '@/components/business/related_companies_block';

const BasicInfoTab: React.FC = () => {
  return (
    <div className="grid grid-cols-2 gap-x-60px gap-y-40px">
      {/* Info: (20250812 - Julian) Basic Info Block */}
      <BasicInfoBlock />

      {/* Info: (20250813 - Julian) Investor Block */}
      <InvestorBlock />

      {/* Info: (20250813 - Julian) Business Scope Block */}
      <BusinessScopeBlock />

      {/* Info: (20250813 - Julian) History Block */}
      <HistoryBlock />

      {/* Info: (20250813 - Julian) Related Companies Block */}
      <RelatedCompaniesBlock />
    </div>
  );
};

export default BasicInfoTab;
