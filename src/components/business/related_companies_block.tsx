'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import InfoBlockLayout from '@/components/business/info_block_layout';
import { IRelatedCompany, mockBusinesses } from '@/interfaces/business';
import { BM_URL } from '@/constants/url';

const RelatedCompaniesItem: React.FC<{ data: IRelatedCompany }> = ({ data }) => {
  const { name, businessTaxId } = data;
  const targetUrl = `${BM_URL.BUSINESS_MONITOR}/${data.id}`;

  return (
    <>
      <p className="text-text-secondary">{businessTaxId}</p>
      <Link href={targetUrl} className="text-button-link hover:underline">
        {name}
      </Link>
    </>
  );
};

const RelatedCompaniesBlock: React.FC = () => {
  const { t } = useTranslation(['business_detail']);
  const businessData = mockBusinesses; // ToDo: (20250901 - Julian) Fetch real data

  const relatedCompanies = businessData.map((company) => (
    <RelatedCompaniesItem key={company.id} data={company} />
  ));

  return (
    <InfoBlockLayout
      title={t('business_detail:RELATED_COMPANIES_BLOCK_TITLE')}
      tooltipContent="tooltip content"
      className="flex flex-col gap-y-40px text-sm font-medium"
    >
      {/* Info: (20250813 - Julian) Title */}
      <div className="grid grid-cols-2 gap-y-40px">
        <p className="text-text-note">{t('business_detail:RELATED_COMPANIES_BLOCK_ID')}</p>
        <p className="text-text-note">{t('business_detail:RELATED_COMPANIES_BLOCK_NAME')}</p>
      </div>

      {/* Info: (20250901 - Julian) Content */}
      <div className="grid grid-cols-2 gap-y-40px overflow-y-auto">{relatedCompanies}</div>
    </InfoBlockLayout>
  );
};

export default RelatedCompaniesBlock;
