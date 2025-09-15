'use client';

import React from 'react';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { timestampToString, formatNumberWithCommas } from '@/lib/common';
import {
  // IImportAndExportData,
  IGovernmentTender,
  ITrademark,
  IPatent,
  mockData,
  IPoliticalEvent,
} from '@/interfaces/operation';
import InfoBlockLayout from '@/components/business/info_block_layout';
import { PoliticalEventType } from '@/constants/operation';
// import useApi from '@/lib/hooks/use_api';
// import { APIName } from '@/constants/api_connection';
// import { Paginated as IPaginated } from '@/types/common';
import TradeBlock from '@/components/business/trade_block';

interface IOperationsTabProps {
  businessId: string;
}

const GovernmentTenderItem: React.FC<IGovernmentTender> = ({
  projectTitle,
  agencyName,
  awardDate,
  awardAmount,
  awarded,
}) => {
  const { t } = useTranslation(['business_detail']);

  const awardedStr = awarded
    ? t('business_detail:GOVERNMENT_TENDERS_BLOCK_AWARDED_YES')
    : t('business_detail:GOVERNMENT_TENDERS_BLOCK_AWARDED_NO');

  return (
    <>
      <p className="col-span-3">{projectTitle}</p>
      <p className="col-span-3">{agencyName}</p>
      <p>{timestampToString(awardDate).formattedDate}</p>
      <p>$ {formatNumberWithCommas(awardAmount)}</p>
      <p>{awardedStr}</p>
    </>
  );
};

const TrademarkItem: React.FC<ITrademark> = ({ trademarkTitle, imageUrl }) => {
  return (
    <div className="flex items-center gap-24px">
      <Image
        src={imageUrl}
        alt={`${trademarkTitle}_img`}
        width={60}
        height={60}
        className="shrink-0"
      />
      <p>{trademarkTitle}</p>
    </div>
  );
};

const PatentItem: React.FC<IPatent> = ({ patentTitle }) => {
  return <p className="text-text-primary">{patentTitle}</p>;
};

const PoliticalActivityItem: React.FC<IPoliticalEvent> = ({ eventTitle, amount }) => {
  return (
    <>
      <p className="col-span-3 font-normal text-text-primary">{eventTitle}</p>
      <p className="font-normal text-text-primary">$ {formatNumberWithCommas(amount)}</p>
    </>
  );
};

const PoliticalActivityBlock: React.FC<{
  eventType: PoliticalEventType;
  politicalActivity: {
    events: IPoliticalEvent[];
    totalAmount: number;
  };
}> = ({ eventType, politicalActivity }) => {
  const { t } = useTranslation(['business_detail']);

  // Info: (20250905 - Julian) Contribution | Donation
  const eventTitle = t(`business_detail:POLITICAL_ACTIVITIES_BLOCK_${eventType.toUpperCase()}`);

  const { events, totalAmount } = politicalActivity;
  const politicalActivityRows = events.map((event) => (
    <PoliticalActivityItem key={event.id} {...event} />
  ));

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

const OperationsTab: React.FC<IOperationsTabProps> = ({ businessId }) => {
  const { t } = useTranslation(['business_detail']);

  // ToDo: (20250901 - Julian) Replace mock data with real API data
  const {
    // lastUpdateTime,
    // importAndExportData,
    governmentTenders,
    trademarks,
    patents,
    politicalActivities,
  } = mockData;

  const governmentTenderRows = governmentTenders.map((tender) => (
    <GovernmentTenderItem key={tender.id} {...tender} />
  ));

  const trademarkRows = trademarks.map((trademark) => (
    <TrademarkItem key={trademark.id} {...trademark} />
  ));

  const patentRows = patents.map((patent) => <PatentItem key={patent.id} {...patent} />);

  return (
    <div className="grid grid-cols-2 gap-x-60px gap-y-40px">
      {/* Info: (20250915 - Julian) Trade Block */}
      <TradeBlock businessId={businessId} />

      {/* Info: (20250901 - Julian) Government Tenders Block */}
      <div className="col-span-2">
        <InfoBlockLayout
          title={t('business_detail:GOVERNMENT_TENDERS_BLOCK_TITLE')}
          tooltipContent={t('business_detail:TOOLTIP_GOVERNMENT_TENDERS')}
          className="flex flex-col gap-y-40px text-sm"
        >
          <div className="grid grid-cols-9 gap-40px font-medium text-text-note">
            <p className="col-span-3">
              {t('business_detail:GOVERNMENT_TENDERS_BLOCK_PROJECT_TITLE')}
            </p>
            <p className="col-span-3">
              {t('business_detail:GOVERNMENT_TENDERS_BLOCK_AGENCY_NAME')}
            </p>
            <p>{t('business_detail:GOVERNMENT_TENDERS_BLOCK_AWARD_DATE')}</p>
            <p>{t('business_detail:GOVERNMENT_TENDERS_BLOCK_AWARD_AMOUNT')}</p>
            <p>{t('business_detail:GOVERNMENT_TENDERS_BLOCK_AWARDED')}</p>
          </div>
          <div className="grid grid-cols-9 gap-40px overflow-y-auto font-normal text-text-primary">
            {governmentTenderRows}
          </div>
        </InfoBlockLayout>
      </div>

      {/* Info: (20250901 - Julian) Trademarks Block */}
      <div>
        <InfoBlockLayout
          title={t('business_detail:TRADEMARKS_BLOCK_TITLE')}
          tooltipContent={t('business_detail:TOOLTIP_TRADEMARKS')}
          className="flex flex-col gap-24px overflow-y-auto text-sm font-medium"
        >
          {trademarkRows}
        </InfoBlockLayout>
      </div>

      {/* Info: (20250901 - Julian) Patents Block */}
      <div>
        <InfoBlockLayout
          title={t('business_detail:PATENTS_BLOCK_TITLE')}
          tooltipContent={t('business_detail:TOOLTIP_PATENTS')}
          className="flex flex-col gap-40px overflow-y-auto text-sm font-medium"
        >
          {patentRows}
        </InfoBlockLayout>
      </div>

      {/* Info: (20250901 - Julian) Political Activities Block */}
      <div className="col-span-2">
        <InfoBlockLayout
          title={t('business_detail:POLITICAL_ACTIVITIES_BLOCK_TITLE')}
          tooltipContent={t('business_detail:TOOLTIP_POLITICAL_ACTIVITIES')}
          className="flex gap-80px"
        >
          {/* Info: (20250901 - Julian) Contribution */}
          <PoliticalActivityBlock
            eventType={PoliticalEventType.CONTRIBUTION}
            politicalActivity={politicalActivities.contribution}
          />
          <hr className="h-full w-px bg-border-secondary" />
          {/* Info: (20250901 - Julian) Donation */}
          <PoliticalActivityBlock
            eventType={PoliticalEventType.DONATION}
            politicalActivity={politicalActivities.donation}
          />
        </InfoBlockLayout>
      </div>
    </div>
  );
};

export default OperationsTab;
