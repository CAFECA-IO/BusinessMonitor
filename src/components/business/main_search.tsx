'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import SearchArea from '@/components/common/search_area';

const MainSearch: React.FC = () => {
  const { t } = useTranslation(['home_page']);

  return (
    <div className="flex w-full flex-col items-stretch gap-20px px-20px desktop:w-1/2 desktop:gap-40px">
      {/* Info: (20250904 - Julian) Main Title and Subtitle */}
      <div className="flex flex-col items-center">
        <h6 className="text-sm font-bold uppercase text-text-primary desktop:text-h6">
          {t('home_page:SEARCH_SUBTITLE')}
        </h6>
        <h2 className="text-2xl font-bold text-text-brand desktop:text-h2">
          {t('home_page:MAIN_TITLE')}
        </h2>
      </div>

      {/* Info: (20250904 - Julian) Search Area */}
      <SearchArea isShowTags />
    </div>
  );
};

export default MainSearch;
