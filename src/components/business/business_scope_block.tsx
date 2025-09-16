'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import InfoBlockLayout from '@/components/business/info_block_layout';
import { BusinessScopeItem as IBusinessScope } from '@/types/company';

interface IBusinessScopeBlockProps {
  scopes: IBusinessScope[];
}

const BusinessScopeItem: React.FC<{ data: IBusinessScope }> = ({ data }) => {
  const { code, description } = data;
  return (
    <>
      <p className="font-medium text-text-secondary">{code}</p>
      <p className="font-normal text-text-primary">{description}</p>
    </>
  );
};

const BusinessScopeBlock: React.FC<IBusinessScopeBlockProps> = ({ scopes }) => {
  const { t } = useTranslation(['business_detail']);

  const businessScopes =
    scopes.length > 0 ? (
      scopes.map((scope) => <BusinessScopeItem key={scope.code} data={scope} />)
    ) : (
      // ToDo: (20250915 - Julian) No data design
      <div className="col-span-2 row-span-4 flex flex-col items-center justify-center">no data</div>
    );

  return (
    <InfoBlockLayout
      title={t('business_detail:BUSINESS_SCOPE_BLOCK_TITLE')}
      tooltipContent={t('business_detail:TOOLTIP_BUSINESS_SCOPE')}
      className="grid grid-cols-2 gap-y-40px overflow-y-auto text-sm"
    >
      {businessScopes}
    </InfoBlockLayout>
  );
};

export default BusinessScopeBlock;
