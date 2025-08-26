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

import Image from 'next/image';
import { IoTriangle } from 'react-icons/io5';

interface IBusinessDetailPageProps {
  businessId: string;
}

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

const mockStockData = {
  price: 150.25,
  change: -1.34,
  changePercent: -0.89,
  open: 151.0,
  low: 149.5,
  high: 152.0,
  fiftyTwoWeekHigh: 180.0,
  fiftyTwoWeekLow: 120.0,
  avgVolume3Month: 2320000,
  sharesOutstanding: 53454500000,
  mktCap: 7545345000000,
  divYield: 1.2,
  volume: 1800000,
  sellersPercent: 58,
  buyersPercent: 42,
};

const MarketInfoTab: React.FC = () => {
  const {
    price,
    change,
    changePercent,
    open,
    low,
    high,
    fiftyTwoWeekHigh,
    fiftyTwoWeekLow,
    avgVolume3Month,
    sharesOutstanding,
    mktCap,
    divYield,
    // volume,
    sellersPercent,
    buyersPercent,
  } = mockStockData;

  const formatNumber = (num: number) => {
    const numAbs = Math.abs(num);

    if (numAbs >= 1e12) return (numAbs / 1e12).toFixed(2) + 'T';
    if (numAbs >= 1e9) return (numAbs / 1e9).toFixed(2) + 'B';
    if (numAbs >= 1e6) return (numAbs / 1e6).toFixed(2) + 'M';

    return numAbs.toFixed(2);
  };

  const stockColor =
    change > 0 ? 'text-text-success' : change < 0 ? 'text-text-error' : 'text-text-secondary';
  const stockSymbol =
    change > 0 ? (
      <IoTriangle size={10} />
    ) : change < 0 ? (
      <IoTriangle size={10} className="rotate-180" />
    ) : (
      ''
    );

  return (
    <div className="flex flex-col">
      {/* Info: (20250826 - Julian) Chart Part */}
      <div className="flex flex-col gap-24px">
        {/* Info: (20250826 - Julian) Business Name */}
        <div className="flex items-center gap-4px whitespace-nowrap text-h3 font-bold text-text-primary">
          <Image src="/icons/verified.svg" width={32} height={32} alt="verified_icon" />
          <h3>Im Business Name</h3>
        </div>
        {/* Info: (20250826 - Julian) Stock Info */}
        <div className="flex items-center justify-between gap-60px px-24px py-12px">
          {/* Info: (20250826 - Julian) Left Part: Price, Change */}
          <div className={`flex flex-col gap-8px ${stockColor}`}>
            <p className="text-h3 font-bold">{formatNumber(price)}</p>
            <div className="flex items-center gap-4px font-medium">
              {stockSymbol}
              <p className="text-lg">
                {formatNumber(change)} ({formatNumber(changePercent)}%)
              </p>
            </div>
          </div>
          {/* Info: (20250826 - Julian) Right Part: Other Stock Info */}
          <div className="grid flex-1 grid-cols-2 gap-40px text-sm">
            <div className="flex flex-col gap-4px">
              <div className="flex items-center justify-between">
                <p className="font-normal text-text-secondary">Open</p>
                <p className={`${stockColor} font-medium`}>{formatNumber(open)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-normal text-text-secondary">Low</p>
                <p className="font-medium text-text-error">{formatNumber(low)}</p>
              </div>
              <div className="flex items-center justify-between">
                <p className="font-normal text-text-secondary">High</p>
                <p className="font-medium text-text-success">{formatNumber(high)}</p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">52 wk high</p>
                <p className="font-medium">{formatNumber(fiftyTwoWeekHigh)}</p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">52 wk low</p>
                <p className="font-medium">{formatNumber(fiftyTwoWeekLow)}</p>
              </div>
            </div>
            <div className="flex flex-col gap-4px">
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">Avg Vol (3M)</p>
                <p className="font-medium">{formatNumber(avgVolume3Month)}</p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">Shares Outstanding</p>
                <p className="font-medium">{formatNumber(sharesOutstanding)}</p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">Mkt Cap</p>
                <p className="font-medium">{formatNumber(mktCap)}</p>
              </div>
              <div className="flex items-center justify-between text-text-secondary">
                <p className="font-normal">Div Yield</p>
                <p className="font-medium">{formatNumber(divYield)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* ToDo: (20250826 - Julian) Stock Chart */}
        <div className="h-500px w-full bg-purple-400"></div>

        {/* Info: (20250826 - Julian) Traders’ Sentiment */}
        <div className="flex flex-col gap-24px">
          <p className="font-medium text-text-secondary">Traders’ Sentiment</p>
          <div className="flex flex-col gap-8px">
            <div className="flex items-center justify-between text-base font-medium">
              <p className="text-text-success">{sellersPercent}% Sellers</p>
              <p className="text-text-error">{buyersPercent}% Buyers</p>
            </div>
            <div className="relative h-10px w-full overflow-hidden rounded-full bg-text-error py-4px">
              <span
                className="absolute left-0 top-0 h-full bg-text-success"
                style={{ width: `${sellersPercent}%` }} // Info: (20250826 - Julian) 動態設定 sellers 長度
              ></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

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
    ) : null;

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
      {currentTabContent}
    </Layout>
  );
};

export default BusinessDetailPageBody;
