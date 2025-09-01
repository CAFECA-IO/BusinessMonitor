'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import InfoBlockLayout from '@/components/business/info_block_layout';
import { timestampToString } from '@/lib/common';
import { IBusinessHistory, mockBusinessHistory } from '@/interfaces/business_history';

const HistoryItem: React.FC<{ data: IBusinessHistory }> = ({ data }) => {
  const { date, description } = data;
  return (
    <>
      <p className="font-medium text-text-secondary">{timestampToString(date).formattedDate}</p>
      <p className="col-span-4 font-normal text-text-primary">{description}</p>
    </>
  );
};

const HistoryBlock: React.FC = () => {
  const { t } = useTranslation(['business_detail']);

  // ToDo: (20250813 - Julian) Replace mock data with real API data
  const historyItems = mockBusinessHistory.map((history) => (
    <HistoryItem key={history.id} data={history} />
  ));

  return (
    <InfoBlockLayout
      title={t('business_detail:HISTORY_BLOCK_TITLE')}
      tooltipContent="tooltip content"
      className="grid grid-cols-5 gap-x-24px gap-y-40px overflow-y-auto text-sm"
    >
      {historyItems}
    </InfoBlockLayout>
  );
};

export default HistoryBlock;
