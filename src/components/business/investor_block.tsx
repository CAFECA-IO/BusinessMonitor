'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import InfoBlockLayout from '@/components/business/info_block_layout';
import { InvestorItem as IInvestor } from '@/types/company';

interface IInvestorBlockProps {
  investors: IInvestor[];
}

const InvestorItems: React.FC<{ data: IInvestor }> = ({ data }) => {
  const { name, position, sharesHeld, representativeOfJuridicalPerson } = data;

  const sharesHeldNum = Number(sharesHeld) ?? 0;
  const percentageSharesHeld = (sharesHeldNum * 100).toFixed(2);

  return (
    <>
      <p className="font-normal text-text-primary">{name}</p>
      <p className="font-normal text-text-primary">{position}</p>
      <p className="font-normal text-text-primary">{percentageSharesHeld}%</p>
      <p className="col-span-2 font-normal text-text-primary">{representativeOfJuridicalPerson}</p>
    </>
  );
};

const InvestorBlock: React.FC<IInvestorBlockProps> = ({ investors }) => {
  const { t } = useTranslation(['business_detail']);

  const investorItems =
    investors.length > 0 ? (
      investors.map((item) => <InvestorItems key={item.name} data={item} />)
    ) : (
      // ToDo: (20250915 - Julian) No data design
      <div className="col-span-5 row-span-4 flex flex-col items-center justify-center">no data</div>
    );

  return (
    <InfoBlockLayout
      title={t('business_detail:INVESTOR_BLOCK_TITLE')}
      tooltipContent={t('business_detail:TOOLTIP_INVESTOR')}
      className="flex flex-col gap-y-16px text-sm"
    >
      {/* Info: (20250813 - Julian) Title */}
      <div className="grid grid-cols-5 gap-x-8px gap-y-40px font-medium">
        <p className="font-medium text-text-note">{t('business_detail:INVESTOR_BLOCK_NAME')}</p>
        <p className="font-medium text-text-note">{t('business_detail:INVESTOR_BLOCK_POSITION')}</p>
        <p className="font-medium text-text-note">
          {t('business_detail:INVESTOR_BLOCK_SHARES_HELD')}
        </p>
        <p className="col-span-2 font-medium text-text-note">
          {t('business_detail:INVESTOR_BLOCK_REPRESENTATIVE')}
        </p>
      </div>

      {/* Info: (20250901 - Julian) Content */}
      <div className="grid grid-cols-5 gap-x-8px gap-y-40px overflow-y-auto font-normal">
        {investorItems}
      </div>
    </InfoBlockLayout>
  );
};

export default InvestorBlock;
