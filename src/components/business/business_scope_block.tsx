'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import InfoBlockLayout from '@/components/business/info_block_layout';
import { IBusinessScope, mockBusinessScopes } from '@/interfaces/business_scope';

const BusinessScopeItem: React.FC<{ data: IBusinessScope }> = ({ data }) => {
  const { code, description } = data;

  return (
    <>
      <p className="font-medium text-text-secondary">{code}</p>
      <p className="font-normal text-text-primary">{description}</p>
    </>
  );
};

const BusinessScopeBlock: React.FC = () => {
  const { t } = useTranslation(['business_detail']);

  // ToDo: (20250813 - Julian) Replace mock data with real API data
  const businessScopes = mockBusinessScopes.map((scope) => (
    <BusinessScopeItem key={scope.id} data={scope} />
  ));

  return (
    <InfoBlockLayout
      title={t('business_detail:BUSINESS_SCOPE_BLOCK_TITLE')}
      tooltipContent="tooltip content"
      className="grid grid-cols-2 gap-y-40px text-sm"
    >
      {businessScopes}
    </InfoBlockLayout>
  );
};

export default BusinessScopeBlock;
