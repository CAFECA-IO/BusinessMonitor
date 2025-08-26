'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { TAB_BAR_ITEMS, TabBarItem } from '@/constants/tab_bar';

interface ITabBarProps {
  currentTab: TabBarItem;
  onTabChange: (tab: TabBarItem) => void;
}

const TabBar: React.FC<ITabBarProps> = ({ currentTab, onTabChange }) => {
  const { t } = useTranslation(['business_detail']);

  const displayTabContent = TAB_BAR_ITEMS.map((item) => {
    const isActive = currentTab === item;
    const clickHandler = () => onTabChange(item);

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
