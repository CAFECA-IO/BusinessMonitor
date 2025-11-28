'use client';

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useRouter, useSearchParams } from 'next/navigation';
import { BM_URL } from '@/constants/url';
import { TabBarItem, TAB_BAR_ITEMS } from '@/constants/tab_bar';
import TabBar from '@/components/business/tab_bar';
import Layout from '@/components/common/layout';
import BasicInfoTab from '@/components/business/basic_info_tab';
import MarketInfoTab from '@/components/business/market_info_tab';
import OperationsTab from '@/components/business/operations_tab';
import FinancialReportTab from '@/components/business/financial_report_tab';
import RedFlagsTab from '@/components/business/reg_flags_tab';
import DiscussionTab from '@/components/business/discussion_tab';
import { CompanyBasicResponse as IBasicResponse } from '@/types/company';
import useApi from '@/lib/hooks/use_api';
import { timestampToString } from '@/lib/common';
import { APIName } from '@/constants/api_connection';

interface IBusinessDetailPageProps {
  businessId: string;
}

const BusinessDetailPageBody: React.FC<IBusinessDetailPageProps> = ({ businessId }) => {
  const { t } = useTranslation(['business_detail']);
  const router = useRouter();
  const searchParams = useSearchParams();

  const queryTab: TabBarItem = (searchParams.get('tab') as TabBarItem) || '';

  const [currentTab, setCurrentTab] = useState<TabBarItem>(TabBarItem.BASIC_INFO);

  const { payload: companyData } = useApi<IBasicResponse>(APIName.GET_BASIC_INFO_BY_COMPANY_ID, {
    params: { id: businessId },
  });

  const businessName = companyData?.card.name ?? '-';

  // Info: (20250923 - Julian) 只在「基本資料」、「營業資訊」及「警示紀錄」頁籤顯示最後更新時間
  const isShowLastUpdatedTime =
    currentTab === TabBarItem.BASIC_INFO ||
    currentTab === TabBarItem.OPERATIONS ||
    currentTab === TabBarItem.FLAGS;

  // Info: (20250923 - Julian) 顯示最後更新時間
  const lastUpdatedTime = companyData?.card.lastUpdateTime ?? '-';
  const lastUpdatedTimestamp = lastUpdatedTime ? new Date(lastUpdatedTime).getTime() / 1000 : 0;
  const updatedAtString = timestampToString(lastUpdatedTimestamp);

  const crumbsItems = [
    { name: 'HOME', link: BM_URL.HOME },
    { name: 'BUSINESS_MONITOR', link: BM_URL.BUSINESS_MONITOR },
    { name: businessName, link: '' },
  ];

  useEffect(() => {
    if (queryTab && TAB_BAR_ITEMS.includes(queryTab)) {
      setCurrentTab(queryTab);
    } else {
      // Info: (20251128 - Julian) 若網址參數 tab 不存在或不正確，則預設 BASIC_INFO 並更新網址
      setCurrentTab(TabBarItem.BASIC_INFO);
      router.replace(`?tab=${TabBarItem.BASIC_INFO}`, { scroll: false });
    }
  }, [queryTab]);

  const onTabChange = (tab: TabBarItem) => {
    setCurrentTab(tab);
    // Info: (20251128 - Julian) 切換 tab 同步更新網址，但不滾動頁面
    router.replace(`?tab=${tab}`, { scroll: false });
  };

  const currentTabContent =
    currentTab === TabBarItem.BASIC_INFO ? (
      <BasicInfoTab businessId={businessId} />
    ) : currentTab === TabBarItem.MARKET_INFO ? (
      <MarketInfoTab businessId={businessId} />
    ) : currentTab === TabBarItem.OPERATIONS ? (
      <OperationsTab businessId={businessId} />
    ) : currentTab === TabBarItem.FINANCIAL_REPORT ? (
      <FinancialReportTab />
    ) : currentTab === TabBarItem.FLAGS ? (
      <RedFlagsTab businessId={businessId} />
    ) : (
      <DiscussionTab businessId={businessId} />
    );

  return (
    <Layout
      crumbsItems={crumbsItems}
      isSearchBar
      pageBgColor="bg-surface-background"
      className="gap-20px px-20px pb-120px desktop:gap-40px desktop:px-80px"
    >
      {/* Info: (20250811 - Julian) Tab Bar */}
      <TabBar currentTab={currentTab} onTabChange={onTabChange} />

      <div className="flex flex-col gap-16px">
        {/* Info: (20250923 - Julian) Last Update Time */}
        {isShowLastUpdatedTime && (
          <p className="text-right text-xs font-normal text-text-primary desktop:text-base">
            {t('business_detail:LAST_UPDATE_TIME')}: {updatedAtString.formattedDate}{' '}
            {updatedAtString.time}
          </p>
        )}
        {/* Info: (20250811 - Julian) Tab Content */}
        {currentTabContent}
      </div>
    </Layout>
  );
};

export default BusinessDetailPageBody;
