'use client';

import React, { useState } from 'react';
import TabBar from '@/components/business/tab_bar';
import Layout from '@/components/common/layout';
import { BM_URL } from '@/constants/url';
import { TAB_BAR_ITEMS, TabBarItem } from '@/constants/tab_bar';
import BasicInfoBlock from '@/components/business/basic_info_block';

interface IBusinessDetailPageProps {
  businessId: string;
}

const BusinessDetailPageBody: React.FC<IBusinessDetailPageProps> = ({ businessId }) => {
  const [currentTab, setCurrentTab] = useState<TabBarItem>(TAB_BAR_ITEMS[0]);

  const crumbsItems = [
    { name: 'Home', link: BM_URL.HOME },
    { name: 'Searching Result', link: BM_URL.SEARCH },
    { name: businessId, link: '' }, // ToDo: (20250811 - Julian) 應改為 Business name
  ];

  const onTabChange = (tab: TabBarItem) => {
    setCurrentTab(tab);
  };

  const basicInfoTab = (
    <>
      {/* Info: (20250811 - Julian) Basic Info Block */}
      <BasicInfoBlock />
    </>
  );

  const currentTabContent = currentTab === TabBarItem.BASIC_INFO ? basicInfoTab : null;

  return (
    <Layout
      crumbsItems={crumbsItems}
      pageBgColor="bg-surface-background"
      className="gap-60px px-80px"
    >
      {/* Info: (20250811 - Julian) Tab Bar */}
      <TabBar currentTab={currentTab} onTabChange={onTabChange} />

      {/* Info: (20250811 - Julian) Tab Content */}
      <div className="grid grid-cols-2 gap-x-60px gap-y-40px">{currentTabContent}</div>
    </Layout>
  );
};

export default BusinessDetailPageBody;
