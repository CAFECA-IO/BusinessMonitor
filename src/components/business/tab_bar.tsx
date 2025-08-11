'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

const TabBar: React.FC = () => {
  const { t } = useTranslation(['business_detail']);

  const tabItems = [
    'BASIC_INFO',
    'MARKET_INFO',
    'OPERATIONS',
    'FINANCIAL_REPORT',
    'FLAGS',
    'DISCUSSION',
  ];

  const [activeTab, setActiveTab] = useState(tabItems[0]);

  const displayTabContent = tabItems.map((item) => {
    const isActive = activeTab === item;
    const clickHandler = () => setActiveTab(item);

    return (
      <button
        key={item}
        type="button"
        onClick={clickHandler}
        className={`rounded-full px-48px py-16px text-base font-medium ${isActive ? 'bg-button-primary text-text-invert' : 'bg-transparent text-text-secondary'}`}
      >
        {t(`DETAIL_TAB_${item}`)}
      </button>
    );
  });

  return (
    <div className="grid grid-cols-6 items-center rounded-full bg-tab-bar-bg p-8px">
      {displayTabContent}
    </div>
  );
};

export default TabBar;
