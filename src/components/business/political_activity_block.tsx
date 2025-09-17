import React from 'react';
import { useTranslation } from 'react-i18next';
import { formatNumberWithCommas } from '@/lib/common';
import { PoliticalEventType } from '@/constants/operation';
import InfoBlockLayout from '@/components/business/info_block_layout';
import Skeleton from '@/components/common/skeleton';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';
import { Paginated as IPaginated } from '@/types/common';
import { PoliticalRow as IPoliticalRow } from '@/types/company';

interface IPoliticalActivityBlockProps {
  businessId: string;
}

const SkeletonItem: React.FC = () => {
  return (
    <div className="flex h-200px w-full flex-col gap-40px">
      <Skeleton width={300} height={20} />
      <Skeleton width={250} height={20} />
      <Skeleton width={200} height={20} />
      <Skeleton width={150} height={20} />
    </div>
  );
};

const PoliticalActivityItem: React.FC<{ activity: IPoliticalRow }> = ({ activity }) => {
  const { event, amount } = activity;

  return (
    <>
      <p className="col-span-3 font-normal text-text-primary">{event}</p>
      <p className="font-normal text-text-primary">$ {formatNumberWithCommas(amount)}</p>
    </>
  );
};

const PoliticalActivity: React.FC<{
  eventType: PoliticalEventType;
  politicalActivities: readonly IPoliticalRow[];
}> = ({ eventType, politicalActivities }) => {
  const { t } = useTranslation(['business_detail']);

  // Info: (20250905 - Julian) Contribution | Donation
  const eventTitle = t(`business_detail:POLITICAL_ACTIVITIES_BLOCK_${eventType.toUpperCase()}`);

  const politicalActivityRows = politicalActivities.map((event) => (
    <PoliticalActivityItem key={event.event} activity={event} />
  ));

  const totalAmount = 1000; //ToDo: (20250916 - Julian) Replace with real total amount

  return (
    <div className="flex w-full flex-col gap-24px py-24px">
      <h6 className="text-h6 font-bold text-black">{eventTitle}</h6>
      <div className="flex h-200px flex-col gap-40px">
        {/* Info: (20250901 - Julian) Header */}
        <div className="grid grid-cols-4 font-medium text-text-note">
          <p className="col-span-3">{t('business_detail:POLITICAL_ACTIVITIES_BLOCK_EVENT')}</p>
          <p>{t('business_detail:POLITICAL_ACTIVITIES_BLOCK_AMOUNT')}</p>
        </div>

        {/* Info: (20250901 - Julian) Content */}
        <div className="grid grid-cols-4 gap-y-40px overflow-y-auto">
          {politicalActivityRows}

          <p className="col-span-3 font-medium text-text-primary">Total</p>
          <p className="font-medium text-text-primary">$ {formatNumberWithCommas(totalAmount)}</p>
        </div>

        {/* Info: (20250901 - Julian) Footer */}
        <div className="grid grid-cols-4"></div>
      </div>
    </div>
  );
};

const PoliticalActivityBlock: React.FC<IPoliticalActivityBlockProps> = ({ businessId }) => {
  const { t } = useTranslation(['business_detail']);

  const {
    success: contributionSuccess,
    payload: contributionData,
    isLoading: contributionLoading,
  } = useApi<IPaginated<IPoliticalRow>>(APIName.GET_POLITICAL_CONTRIBUTIONS_BY_COMPANY_ID, {
    params: { id: businessId },
  });

  const {
    success: donationSuccess,
    payload: donationData,
    isLoading: donationLoading,
  } = useApi<IPaginated<IPoliticalRow>>(APIName.GET_POLITICAL_DONATIONS_BY_COMPANY_ID, {
    params: { id: businessId },
  });

  const contributionActivity = contributionLoading ? (
    <SkeletonItem />
  ) : contributionSuccess && contributionData && contributionData.items.length > 0 ? (
    <PoliticalActivity
      eventType={PoliticalEventType.CONTRIBUTION}
      politicalActivities={contributionData.items}
    />
  ) : (
    // ToDo: (20250916 - Julian) No Data design
    <div className="flex h-200px w-full flex-col items-center justify-center">no data</div>
  );

  const donationActivity = donationLoading ? (
    <SkeletonItem />
  ) : donationSuccess && donationData && donationData.items.length > 0 ? (
    <PoliticalActivity
      eventType={PoliticalEventType.DONATION}
      politicalActivities={donationData.items}
    />
  ) : (
    // ToDo: (20250916 - Julian) No Data design
    <div className="flex h-200px w-full flex-col items-center justify-center">no data</div>
  );

  return (
    <InfoBlockLayout
      title={t('business_detail:POLITICAL_ACTIVITIES_BLOCK_TITLE')}
      tooltipContent={t('business_detail:TOOLTIP_POLITICAL_ACTIVITIES')}
      className="flex gap-80px"
    >
      {/* Info: (20250916 - Julian) Contribution */}
      {contributionActivity}
      <hr className="h-full w-px bg-border-secondary" />
      {/* Info: (20250916 - Julian) Donation */}
      {donationActivity}
    </InfoBlockLayout>
  );
};

export default PoliticalActivityBlock;
