'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import BusinessBriefCard from '@/components/business/business_brief_card';
import SkeletonCard from '@/components/common/skeleton_card';
import { CompanyCard as ICompanyCard } from '@/types/company';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';

const NewBusinessList: React.FC = () => {
  const { t } = useTranslation(['home_page']);
  const {
    success,
    payload: businessList,
    isLoading,
  } = useApi<ICompanyCard[]>(APIName.LIST_NEW_BUSINESSES);

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
      <p className="text-h6 font-bold text-text-secondary">{t('home_page:NEW_BUSINESSES_TITLE')}</p>
      <div className="grid grid-cols-3 gap-12px desktop:grid-cols-5">{isShowList}</div>
    </div>
  );
};

export default NewBusinessList;
