'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import InfoBlockLayout from '@/components/business/info_block_layout';
import { IInvestor, mockInvestors } from '@/interfaces/investor';

const InvestorItems: React.FC<{ data: IInvestor }> = ({ data }) => {
  const { name, position, sharesHeld, representative } = data;
  const percentageSharesHeld = (sharesHeld * 100).toFixed(2);

  return (
    <>
      <p className="font-normal text-text-primary">{name}</p>
      <p className="font-normal text-text-primary">{position}</p>
      <p className="font-normal text-text-primary">{percentageSharesHeld}%</p>
      <p className="col-span-2 font-normal text-text-primary">{representative}</p>
    </>
  );
};

const InvestorBlock: React.FC = () => {
  const { t } = useTranslation(['business_detail']);

  // ToDo: (20250813 - Julian) Get investor data from API
  const investorItems = mockInvestors.map((item) => <InvestorItems key={item.id} data={item} />);

  return (
    <InfoBlockLayout
      title={t('business_detail:INVESTOR_BLOCK_TITLE')}
      tooltipContent="tooltip content"
      className="grid grid-cols-5 gap-40px text-sm"
    >
      {/* Info: (20250813 - Julian) Title */}
      <p className="font-medium text-text-note">{t('business_detail:INVESTOR_BLOCK_NAME')}</p>
      <p className="font-medium text-text-note">{t('business_detail:INVESTOR_BLOCK_POSITION')}</p>
      <p className="font-medium text-text-note">
        {t('business_detail:INVESTOR_BLOCK_SHARES_HELD')}
      </p>
      <p className="col-span-2 font-medium text-text-note">
        {t('business_detail:INVESTOR_BLOCK_REPRESENTATIVE')}
      </p>

      {investorItems}
    </InfoBlockLayout>
  );
};

export default InvestorBlock;
