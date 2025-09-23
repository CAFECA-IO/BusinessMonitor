'use client';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumberWithCommas } from '@/lib/common';
import InfoBlockLayout from '@/components/business/info_block_layout';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';
import { Paginated as IPaginated } from '@/types/common';
import { TradeRow as ITradeRow } from '@/types/company';
import Skeleton from '@/components/common/skeleton';

interface ITradeBlockProps {
  businessId: string;
}

const SkeletonTradeItem: React.FC = () => {
  return (
    <>
      <Skeleton width={100} height={20} />
      <Skeleton width={100} height={20} />
      <Skeleton width={200} height={20} />
      <Skeleton width={200} height={20} />
    </>
  );
};

const TradeItem: React.FC<{ trade: ITradeRow }> = ({ trade }) => {
  const { year, month, totalImportUSD, totalExportUSD } = trade;

  return (
    <>
      <p>{year}</p>
      <p>{month}</p>
      <p>$ {formatNumberWithCommas(totalImportUSD, true)}</p>
      <p>$ {formatNumberWithCommas(totalExportUSD, true)}</p>
    </>
  );
};

const TradeBlock: React.FC<ITradeBlockProps> = ({ businessId }) => {
  const { t } = useTranslation(['business_detail']);

  const {
    success,
    payload: tradeData,
    isLoading,
  } = useApi<IPaginated<ITradeRow>>(APIName.GET_TRADE_BY_COMPANY_ID, {
    params: { id: businessId },
  });

  const importAndExportRows = isLoading ? (
    <SkeletonTradeItem />
  ) : success && tradeData && tradeData.items.length > 0 ? (
    tradeData.items.map((data) => <TradeItem key={`${data.year}-${data.month}`} trade={data} />)
  ) : (
    // ToDo: (20250915 - Julian) No Data design
    <div className="col-span-4 row-span-4 flex flex-col items-center justify-center">no data</div>
  );

  return (
    <div className="col-span-2 flex flex-col gap-16px">
      <InfoBlockLayout
        title={t('business_detail:IMPORT_AND_EXPORT_BLOCK_TITLE')}
        tooltipContent={t('business_detail:TOOLTIP_IMPORT_AND_EXPORT')}
        className="flex flex-col gap-y-40px text-sm"
      >
        {/* Info: (20250901 - Julian) Title */}
        <div className="grid grid-cols-4 font-medium text-text-note">
          <p>{t('business_detail:IMPORT_AND_EXPORT_BLOCK_TITLE_YEAR')}</p>
          <p>{t('business_detail:IMPORT_AND_EXPORT_BLOCK_TITLE_MONTH')}</p>
          <p>{t('business_detail:IMPORT_AND_EXPORT_BLOCK_TITLE_TOTAL_IMPORT')} (USD)</p>
          <p>{t('business_detail:IMPORT_AND_EXPORT_BLOCK_TITLE_TOTAL_EXPORT')} (USD)</p>
        </div>

        {/* Info: (20250901 - Julian) Content */}
        <div className="grid grid-cols-4 gap-y-40px overflow-y-auto font-normal text-text-primary">
          {importAndExportRows}
        </div>
      </InfoBlockLayout>
    </div>
  );
};

export default TradeBlock;
