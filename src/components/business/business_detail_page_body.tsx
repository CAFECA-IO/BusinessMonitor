'use client';

import React, { useState } from 'react';
import TabBar from '@/components/business/tab_bar';
import Layout from '@/components/common/layout';
import { BM_URL } from '@/constants/url';
import { TAB_BAR_ITEMS, TabBarItem } from '@/constants/tab_bar';
import BasicInfoBlock from '@/components/business/basic_info_block';
import InfoBlockLayout from '@/components/business/info_block_layout';

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
      {/* Info: (20250812 - Julian) Basic Info Block */}
      <BasicInfoBlock />

      {/* ToDo: (20250812 - Julian) Investor Block */}
      <InfoBlockLayout
        title="Investor"
        tooltipContent="tooltip content"
        className="flex justify-between text-sm"
      >
        <div className="flex flex-col gap-40px">
          <p className="font-medium text-text-note">Name</p>
          <p>Joyce Chen</p>
        </div>
        <div className="flex flex-col gap-40px">
          <p className="font-medium text-text-note">Position</p>
          <p>Chairman</p>
        </div>
        <div className="flex flex-col gap-40px">
          <p className="font-medium text-text-note">Shares Held</p>
          <p>0.03%</p>
        </div>
        <div className="flex flex-col gap-40px">
          <p className="font-medium text-text-note">Representative of a Juridical Person</p>
          <p>InfoTech Software Services</p>
        </div>
      </InfoBlockLayout>

      {/* ToDo: (20250812 - Julian) Business Scope Block */}
      <InfoBlockLayout
        title="Business Scope"
        tooltipContent="tooltip content"
        className="grid grid-cols-2 gap-y-40px text-sm"
      >
        <>
          <p className="font-medium text-text-secondary">I301010</p>
          <p className="font-normal text-text-primary">Information Software Services</p>
        </>
        <>
          <p className="font-medium text-text-secondary">I301011</p>
          <p className="font-normal text-text-primary">Data Processing Services</p>
        </>
      </InfoBlockLayout>
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
