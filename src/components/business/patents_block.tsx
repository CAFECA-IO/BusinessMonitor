import React from 'react';
import { useTranslation } from 'react-i18next';
import InfoBlockLayout from '@/components/business/info_block_layout';
import Skeleton from '@/components/common/skeleton';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';
import { Paginated as IPaginated } from '@/types/common';
import { PatentRow as IPatentRow } from '@/types/company';

interface IPatentsBlockProps {
  businessId: string;
}

const PatentItem: React.FC<{ patent: IPatentRow }> = ({ patent }) => {
  const { description } = patent;
  return <p className="text-text-primary">{description}</p>;
};

const PatentsBlock: React.FC<IPatentsBlockProps> = ({ businessId }) => {
  const { t } = useTranslation(['business_detail']);

  const {
    success,
    payload: patentsData,
    isLoading,
  } = useApi<IPaginated<IPatentRow>>(APIName.GET_PATENTS_BY_COMPANY_ID, {
    params: { id: businessId },
  });

  const patentRows = isLoading ? (
    <Skeleton width={200} height={20} />
  ) : success && patentsData && patentsData.items.length > 0 ? (
    patentsData.items.map((patent) => <PatentItem key={patent.title} patent={patent} />)
  ) : (
    // ToDo: (20250916 - Julian) no data design
    <div>no data</div>
  );

  return (
    <InfoBlockLayout
      title={t('business_detail:PATENTS_BLOCK_TITLE')}
      tooltipContent={t('business_detail:TOOLTIP_PATENTS')}
      className="flex flex-col gap-40px overflow-y-auto text-sm font-medium"
    >
      {patentRows}
    </InfoBlockLayout>
  );
};

export default PatentsBlock;
