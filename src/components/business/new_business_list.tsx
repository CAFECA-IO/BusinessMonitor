'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import BusinessBriefCard from '@/components/business/business_brief_card';
import { IBusinessBrief } from '@/interfaces/business';

interface INewBusinessListProps {
  businessList: IBusinessBrief[];
}

const NewBusinessList: React.FC<INewBusinessListProps> = ({ businessList }) => {
  const { t } = useTranslation(['home_page']);

  return (
    <div className="flex flex-col items-start gap-16px">
      <p className="text-h6 font-bold text-text-secondary">{t('home_page:NEW_BUSINESSES_TITLE')}</p>
      <div className="grid grid-cols-3 gap-12px desktop:grid-cols-5">
        {businessList.map((business) => (
          <BusinessBriefCard key={business.id} business={business} />
        ))}
      </div>
    </div>
  );
};

export default NewBusinessList;
