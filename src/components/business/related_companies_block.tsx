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

  const relatedCompanies = mockBusinesses.map((company) => (
    <RelatedCompaniesItem key={company.id} data={company} />
  ));

  return (
    <InfoBlockLayout
      title={t('business_detail:RELATED_COMPANIES_BLOCK_TITLE')}
      tooltipContent="tooltip content"
      className="grid grid-cols-2 gap-y-40px text-sm font-medium"
    >
      {/* Info: (20250813 - Julian) Title */}
      <p className="text-text-note">{t('business_detail:RELATED_COMPANIES_BLOCK_ID')}</p>
      <p className="text-text-note">{t('business_detail:RELATED_COMPANIES_BLOCK_NAME')}</p>

      {relatedCompanies}
    </InfoBlockLayout>
  );
};

export default RelatedCompaniesBlock;
