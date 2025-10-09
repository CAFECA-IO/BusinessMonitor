'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import BusinessBriefCard from '@/components/business/business_brief_card';
import SkeletonCard from '@/components/common/skeleton_card';
// import { IBusinessBrief } from '@/interfaces/business';
import { CompanyCard as ICompanyCard } from '@/types/company';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';

const MostViewedList: React.FC = () => {
  const { t } = useTranslation(['home_page']);
  const {
    success,
    payload: businessList,
    isLoading,
  } = useApi<ICompanyCard[]>(APIName.LIST_MOST_VIEWED_BUSINESSES);

  const isShowList = isLoading ? (
    <SkeletonCard cardStyle="briefed" />
  ) : success && businessList && businessList.length > 0 ? (
    businessList.map((business) => <BusinessBriefCard key={business.id} business={business} />)
  ) : (
    // ToDo: (20250911 - Julian) 設計 no data 畫面
    <div className="">no data</div>
  );

  return (
    <div className="flex flex-col items-start gap-16px">
      <p className="text-base font-bold text-text-secondary desktop:text-h6">
        {t('home_page:MOST_VIEWED_TITLE')}
      </p>
      <div className="grid grid-cols-1 gap-12px tablet:grid-cols-3 desktop:grid-cols-5">
        {isShowList}
      </div>
    </div>
  );
};

export default MostViewedList;
