'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import SearchArea from '@/components/common/search_area';

const MainSearch: React.FC = () => {
  const { t } = useTranslation(['home_page']);

  return (
    <div className="flex w-1/2 flex-col items-stretch gap-40px">
      {/* Info: (20250904 - Julian) Main Title and Subtitle */}
      <div className="flex flex-col items-center">
        <h6 className="text-h6 font-bold uppercase text-text-primary">
          {t('home_page:SEARCH_SUBTITLE')}
        </h6>
        <h2 className="text-h2 font-bold text-text-brand">{t('home_page:MAIN_TITLE')}</h2>
      </div>

      {/* Info: (20250904 - Julian) Search Area */}
      <SearchArea />
    </div>
  );
};

export default MainSearch;
