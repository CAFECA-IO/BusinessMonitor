'use client';

import React, { useState } from 'react';
import TabBar from '@/components/business/tab_bar';
import Layout from '@/components/common/layout';
import { BM_URL } from '@/constants/url';
import { TAB_BAR_ITEMS, TabBarItem } from '@/constants/tab_bar';
import BasicInfoTab from '@/components/business/basic_info_tab';
import MarketInfoTab from '@/components/business/market_info_tab';
import OperationsTab from '@/components/business/operations_tab';
import FinancialReportTab from '@/components/business/financial_report_tab';

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

  const currentTabContent =
    currentTab === TabBarItem.BASIC_INFO ? (
      <BasicInfoTab />
    ) : currentTab === TabBarItem.MARKET_INFO ? (
      <MarketInfoTab />
    ) : currentTab === TabBarItem.OPERATIONS ? (
      <OperationsTab />
    ) : currentTab === TabBarItem.FINANCIAL_REPORT ? (
      <FinancialReportTab />
    ) : (
      <div>Coming Soon</div>
    );

  return (
    <Layout
      crumbsItems={crumbsItems}
      pageBgColor="bg-surface-background"
      className="gap-60px px-80px"
    >
      {/* Info: (20250811 - Julian) Tab Bar */}
      <TabBar currentTab={currentTab} onTabChange={onTabChange} />

      {/* Info: (20250811 - Julian) Tab Content */}
      {currentTabContent}
    </Layout>
  );
};

export default BusinessDetailPageBody;
