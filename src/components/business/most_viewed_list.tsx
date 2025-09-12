'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import BusinessBriefCard from '@/components/business/business_brief_card';
import Skeleton from '@/components/common/skeleton';
// import { IBusinessBrief } from '@/interfaces/business';
import { CompanyCard } from '@/types/company';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/interfaces/api_connection';

const MostViewedList: React.FC = () => {
  const { t } = useTranslation(['home_page']);
  const {
    success,
    data: businessList,
    isLoading,
  } = useApi<CompanyCard[]>(APIName.LIST_MOST_VIEWED_BUSINESSES);

  const isShowList = isLoading ? (
    <Skeleton width={220} height={130} />
  ) : success && businessList && businessList.length > 0 ? (
    businessList.map((business) => <BusinessBriefCard key={business.id} business={business} />)
  ) : (
    // ToDo: (20250911 - Julian) 設計 no data 畫面
    <div className="">no data</div>
  );

  return (
    <div className="flex flex-col items-start gap-16px">
      <p className="text-h6 font-bold text-text-secondary">{t('home_page:MOST_VIEWED_TITLE')}</p>
      <div className="grid grid-cols-3 gap-12px desktop:grid-cols-5">{isShowList}</div>
    </div>
  );
};

export default MostViewedList;
