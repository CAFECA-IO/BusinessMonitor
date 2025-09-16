'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import InfoBlockLayout from '@/components/business/info_block_layout';
import { timestampToString } from '@/lib/common';
import { HistoryItem as IHistory } from '@/types/company';

interface IHistoryBlockProps {
  history: IHistory[];
}

const HistoryItem: React.FC<{ data: IHistory }> = ({ data }) => {
  const { date, detail } = data;

  const timestamp = new Date(date).getTime() / 1000;

  // ToDo: (20250915 - Julian) detail 有可能是 string 或 string[]，需要確認 API 回傳格式
  const displayDetail = Array.isArray(detail) ? detail : [detail];

  return (
    <>
      <p className="font-medium text-text-secondary">
        {timestampToString(timestamp).formattedDate}
      </p>
      <p className="col-span-4 font-normal text-text-primary">{displayDetail}</p>
    </>
  );
};

const HistoryBlock: React.FC<IHistoryBlockProps> = ({ history }) => {
  const { t } = useTranslation(['business_detail']);

  const historyItems =
    history.length > 0 ? (
      history.map((history) => <HistoryItem key={history.date} data={history} />)
    ) : (
      // ToDo: (20250915 - Julian) No data design
      <div className="col-span-5 row-span-4 flex flex-col items-center justify-center">no data</div>
    );

  return (
    <InfoBlockLayout
      title={t('business_detail:HISTORY_BLOCK_TITLE')}
      tooltipContent={t('business_detail:TOOLTIP_HISTORY')}
      className="grid grid-cols-5 gap-x-24px gap-y-40px overflow-y-auto text-sm"
    >
      {historyItems}
    </InfoBlockLayout>
  );
};

export default HistoryBlock;
