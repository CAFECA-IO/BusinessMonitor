'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import InfoBlockLayout from '@/components/business/info_block_layout';
import { RelatedCompanyItem as IRelatedCompany } from '@/types/company';
import { BM_URL } from '@/constants/url';

interface IRelatedCompaniesBlockProps {
  relatedCompanies: IRelatedCompany[];
}

const RelatedCompaniesItem: React.FC<{ data: IRelatedCompany }> = ({ data }) => {
  const { name, businessId } = data;
  const targetUrl = `${BM_URL.BUSINESS_MONITOR}/${data.id}`;

  return (
    <>
      <p className="text-text-secondary">{businessId}</p>
      <Link href={targetUrl} className="text-button-link hover:underline">
        {name}
      </Link>
    </>
  );
};

const RelatedCompaniesBlock: React.FC<IRelatedCompaniesBlockProps> = ({ relatedCompanies }) => {
  const { t } = useTranslation(['business_detail']);

  const displayedRelated =
    relatedCompanies.length > 0 ? (
      relatedCompanies.map((company) => <RelatedCompaniesItem key={company.id} data={company} />) // ToDo: (20250915 - Julian) No data design
    ) : (
      <div className="col-span-5 row-span-4 flex flex-col items-center justify-center">no data</div>
    );

  return (
    <InfoBlockLayout
      title={t('business_detail:RELATED_COMPANIES_BLOCK_TITLE')}
      tooltipContent={t('business_detail:TOOLTIP_RELATED_COMPANIES')}
      className="flex flex-col gap-y-40px text-sm font-medium"
    >
      {/* Info: (20250813 - Julian) Title */}
      <div className="grid grid-cols-2 gap-y-40px">
        <p className="text-text-note">{t('business_detail:RELATED_COMPANIES_BLOCK_ID')}</p>
        <p className="text-text-note">{t('business_detail:RELATED_COMPANIES_BLOCK_NAME')}</p>
      </div>

      {/* Info: (20250901 - Julian) Content */}
      <div className="grid grid-cols-2 gap-y-40px overflow-y-auto">{displayedRelated}</div>
    </InfoBlockLayout>
  );
};

export default RelatedCompaniesBlock;
