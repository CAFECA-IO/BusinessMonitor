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
        disabled={isActive}
        className={`rounded-full p-8px text-xs font-medium enabled:hover:bg-tab-active enabled:hover:text-text-note desktop:px-48px desktop:py-12px desktop:text-base ${isActive ? 'bg-button-primary text-text-invert' : 'bg-transparent text-text-secondary'}`}
      >
        {t(`DETAIL_TAB_${item}`)}
      </button>
    );
  });

  return (
    <div className="grid grid-cols-3 items-center rounded-radius-m bg-tab-bar-bg p-8px desktop:grid-cols-6 desktop:rounded-full">
      {displayTabContent}
    </div>
  );
};

export default TabBar;
