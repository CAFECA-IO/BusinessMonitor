import React from 'react';
import { useTranslation } from 'react-i18next';
import { timestampToString, formatNumberWithCommas } from '@/lib/common';
import Skeleton from '@/components/common/skeleton';
import InfoBlockLayout from '@/components/business/info_block_layout';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';
import { Paginated as IPaginated } from '@/types/common';
import { TenderRow as ITenderRow } from '@/types/company';

interface IGovernmentTendersBlockProps {
  businessId: string;
}

const SkeletonTenderItem: React.FC = () => {
  return (
    <>
      <div className="col-span-3">
        <Skeleton width={250} height={20} />
      </div>
      <div className="col-span-3">
        <Skeleton width={250} height={20} />
      </div>
      <Skeleton width={100} height={20} />
      <Skeleton width={100} height={20} />
      <Skeleton width={50} height={20} />
    </>
  );
};

const GovernmentTenderItem: React.FC<{ tender: ITenderRow }> = ({ tender }) => {
  const { t } = useTranslation(['business_detail']);
  const { projectTitle, agencyName, awardDate, awardAmount, awarded } = tender;

  const awardTimestamp = new Date(awardDate).getTime() / 1000;
  const awardAmountNum = Number(awardAmount ?? 0);

  const awardedStr = awarded
    ? t('business_detail:GOVERNMENT_TENDERS_BLOCK_AWARDED_YES')
    : t('business_detail:GOVERNMENT_TENDERS_BLOCK_AWARDED_NO');

  return (
    <>
      <p className="col-span-3">{projectTitle}</p>
      <p className="col-span-3">{agencyName}</p>
      <p>{timestampToString(awardTimestamp).formattedDate}</p>
      <p>$ {formatNumberWithCommas(awardAmountNum)}</p>
      <p>{awardedStr}</p>
    </>
  );
};

const GovernmentTendersBlock: React.FC<IGovernmentTendersBlockProps> = ({ businessId }) => {
  const { t } = useTranslation(['business_detail']);

  const {
    success,
    payload: tenderData,
    isLoading,
  } = useApi<IPaginated<ITenderRow>>(APIName.GET_TENDERS_BY_COMPANY_ID, {
    params: { id: businessId },
  });

  const governmentTenderRows = isLoading ? (
    <SkeletonTenderItem />
  ) : success && tenderData && tenderData.items.length > 0 ? (
    tenderData?.items.map((tender) => (
      <GovernmentTenderItem key={tender.projectTitle} tender={tender} />
    ))
  ) : (
    // ToDo: (20250916 - Julian) no data design
    <div className="col-span-9 row-span-4 flex flex-col items-center justify-center">no data</div>
  );

  return (
    <InfoBlockLayout
      title={t('business_detail:GOVERNMENT_TENDERS_BLOCK_TITLE')}
      tooltipContent={t('business_detail:TOOLTIP_GOVERNMENT_TENDERS')}
      className="flex flex-col gap-y-40px text-sm"
    >
      <div className="grid grid-cols-9 gap-40px font-medium text-text-note">
        <p className="col-span-3">{t('business_detail:GOVERNMENT_TENDERS_BLOCK_PROJECT_TITLE')}</p>
        <p className="col-span-3">{t('business_detail:GOVERNMENT_TENDERS_BLOCK_AGENCY_NAME')}</p>
        <p>{t('business_detail:GOVERNMENT_TENDERS_BLOCK_AWARD_DATE')}</p>
        <p>{t('business_detail:GOVERNMENT_TENDERS_BLOCK_AWARD_AMOUNT')}</p>
        <p>{t('business_detail:GOVERNMENT_TENDERS_BLOCK_AWARDED')}</p>
      </div>
      <div className="grid grid-cols-9 gap-40px overflow-y-auto font-normal text-text-primary">
        {governmentTenderRows}
      </div>
    </InfoBlockLayout>
  );
};

export default GovernmentTendersBlock;
