import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import InfoBlockLayout from '@/components/business/info_block_layout';
import Skeleton from '@/components/common/skeleton';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';
import { Paginated as IPaginated } from '@/types/common';
import { TrademarkRow as ITrademarkRow } from '@/types/company';

interface ITrademarksBlockProps {
  businessId: string;
}

const SkeletonTrademarkItem: React.FC = () => {
  return (
    <div className="flex items-center gap-24px">
      <Skeleton width={60} height={60} />
      <Skeleton width={200} height={20} />
    </div>
  );
};

const TrademarkItem: React.FC<{ trademark: ITrademarkRow }> = ({ trademark }) => {
  const { name, imageUrl } = trademark;
  const isShowImage = imageUrl ? (
    <Image src={imageUrl} alt={`${name}_img`} width={60} height={60} className="shrink-0" />
  ) : (
    <div className="size-60px overflow-hidden rounded-full"></div>
  );

  return (
    <div className="flex items-center gap-24px">
      {isShowImage}
      <p>{name}</p>
    </div>
  );
};

const TrademarksBlock: React.FC<ITrademarksBlockProps> = ({ businessId }) => {
  const { t } = useTranslation(['business_detail']);

  const {
    success,
    payload: trademarkData,
    isLoading,
  } = useApi<IPaginated<ITrademarkRow>>(APIName.GET_TRADE_BY_COMPANY_ID, {
    params: { id: businessId },
  });

  const trademarkRows = isLoading ? (
    <SkeletonTrademarkItem />
  ) : success && trademarkData && trademarkData.items.length > 0 ? (
    trademarkData.items.map((trademark) => (
      <TrademarkItem key={trademark.name} trademark={trademark} />
    ))
  ) : (
    // ToDo: (20250916 - Julian) No Data design
    <div className="flex flex-col items-center justify-center">no data</div>
  );

  return (
    <InfoBlockLayout
      title={t('business_detail:TRADEMARKS_BLOCK_TITLE')}
      tooltipContent={t('business_detail:TOOLTIP_TRADEMARKS')}
      className="flex flex-col gap-24px overflow-y-auto text-sm font-medium"
    >
      {trademarkRows}
    </InfoBlockLayout>
  );
};

export default TrademarksBlock;
