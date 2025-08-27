'use client';

import React, { useState } from 'react';
import TabBar from '@/components/business/tab_bar';
import Layout from '@/components/common/layout';
import { BM_URL } from '@/constants/url';
import { TAB_BAR_ITEMS, TabBarItem } from '@/constants/tab_bar';
import BasicInfoBlock from '@/components/business/basic_info_block';
import InvestorBlock from '@/components/business/investor_block';
import BusinessScopeBlock from '@/components/business/business_scope_block';
import HistoryBlock from '@/components/business/history_block';
import RelatedCompaniesBlock from '@/components/business/related_companies_block';

import DatePicker from '@/components/common/date_picker';

interface IBusinessDetailPageProps {
  businessId: string;
}

const BusinessDetailPageBody: React.FC<IBusinessDetailPageProps> = ({ businessId }) => {
  const [currentTab, setCurrentTab] = useState<TabBarItem>(TAB_BAR_ITEMS[0]);

  const crumbsItems = [
    { name: 'HOME', link: BM_URL.HOME },
    { name: 'SEARCHING_RESULT', link: BM_URL.BUSINESS_MONITOR },
    { name: businessId, link: '' }, // ToDo: (20250811 - Julian) 應改為 Business name
  ];

  const onTabChange = (tab: TabBarItem) => {
    setCurrentTab(tab);
  };

  const basicInfoTab = (
    <>
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
    </>
  );

  const currentTabContent = currentTab === TabBarItem.BASIC_INFO ? basicInfoTab : null;

  return (
    <Layout
      crumbsItems={crumbsItems}
      pageBgColor="bg-surface-background"
      className="gap-60px px-80px"
    >
      {/* ToDo: (20250825 - Julian) Developing */}
      <DatePicker selectedYear={2025} selectedMonth={8} label="Period" />

      {/* Info: (20250811 - Julian) Tab Bar */}
      <TabBar currentTab={currentTab} onTabChange={onTabChange} />

      {/* Info: (20250811 - Julian) Tab Content */}
      <div className="grid grid-cols-2 gap-x-60px gap-y-40px">{currentTabContent}</div>
    </Layout>
  );
};

export default BusinessDetailPageBody;
