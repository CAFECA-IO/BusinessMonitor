'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { timestampToString } from '@/lib/common';
import InfoBlockLayout from '@/components/business/info_block_layout';
import Skeleton from '@/components/common/skeleton';
import { FlagType } from '@/constants/flag';
import useApi from '@/lib/hooks/use_api';
import { APIName } from '@/constants/api_connection';
import { Paginated as IPaginated } from '@/types/common';
import { FlagItem as IFlag } from '@/types/company';
interface IRedFlagsTabProps {
  businessId: string;
}

interface IFlagItemProps extends IFlag {
  type: FlagType;
}

const SkeletonItem: React.FC = () => {
  return (
    <>
      <div className="col-span-2">
        <Skeleton width={100} height={20} />
      </div>
      <div className="col-span-3">
        <Skeleton width={150} height={20} />
      </div>
      <div className="col-span-1">
        <Skeleton width={30} height={20} />
      </div>
      <div className="col-span-2">
        <Skeleton width={100} height={20} />
      </div>
    </>
  );
};

const FlagItem: React.FC<IFlagItemProps> = ({ type, date, title, level, sourceUrl }) => {
  const { t } = useTranslation(['business_detail']);

  const timestamp = new Date(date).getTime() / 1000;
  const dateStr = timestampToString(timestamp).formattedDate;

  const flagColor = type === FlagType.RED ? 'text-text-error' : 'text-text-success';

  return (
    <>
      <p className="col-span-2">{dateStr}</p>
      <p className="col-span-3">{title}</p>
      <p className={`col-span-1 text-center font-medium ${flagColor}`}>{level}</p>
      <div className="col-span-2 text-center">
        {sourceUrl && (
          <Link href={sourceUrl} className="text-button-link hover:text-button-primary-hover">
            {t('business_detail:FLAGS_BLOCK_READ_MORE')}
          </Link>
        )}
      </div>
    </>
  );
};

const RedFlagsTab: React.FC<IRedFlagsTabProps> = ({ businessId }) => {
  const { t } = useTranslation(['business_detail']);

  const { payload: redFlagData, isLoading: isRedFlagLoading } = useApi<IPaginated<IFlag>>(
    APIName.GET_FLAGS_BY_COMPANY_ID,
    { params: { id: businessId }, query: { type: 'red' } }
  );

  const { payload: greenFlagData, isLoading: isGreenFlagLoading } = useApi<IPaginated<IFlag>>(
    APIName.GET_FLAGS_BY_COMPANY_ID,
    { params: { id: businessId }, query: { type: 'green' } }
  );

  const redFlags = redFlagData?.items ?? [];
  const greenFlags = greenFlagData?.items ?? [];

  const isShowRedFlag = redFlagData && redFlags.length > 0;
  const isShowGreenFlag = greenFlagData && greenFlags.length > 0;

  const redFlagRow = isRedFlagLoading ? (
    <SkeletonItem />
  ) : isShowRedFlag ? (
    redFlags.map((flag) => <FlagItem key={flag.title} {...flag} type={FlagType.RED} />)
  ) : (
    // ToDo: (20250926 - Julian) No data design
    <div className="col-span-8 row-span-3 flex flex-col items-center justify-center">no data</div>
  );
  const greenFlagRow = isGreenFlagLoading ? (
    <SkeletonItem />
  ) : isShowGreenFlag ? (
    greenFlags.map((flag) => <FlagItem key={flag.title} {...flag} type={FlagType.GREEN} />)
  ) : (
    // ToDo: (20250926 - Julian) No data design
    <div className="col-span-8 row-span-3 flex flex-col items-center justify-center">no data</div>
  );

  return (
    <div className="grid grid-cols-2 gap-60px">
      {/* Info: (20250902 - Julian) Red Flags Block */}
      <InfoBlockLayout
        title={t('business_detail:RED_FLAGS_BLOCK_TITLE')}
        tooltipContent={t('business_detail:TOOLTIP_RED_FLAGS')}
        className="flex flex-col gap-40px"
      >
        <div className="grid grid-cols-8 gap-40px font-medium text-text-note">
          <p className="col-span-2 whitespace-nowrap">{t('business_detail:FLAGS_BLOCK_DATE')}</p>
          <p className="col-span-3 whitespace-nowrap">{t('business_detail:FLAGS_BLOCK_EVENTS')}</p>
          <p className="col-span-1 whitespace-nowrap text-center">
            {t('business_detail:FLAGS_BLOCK_LEVEL')}
          </p>
          <p className="col-span-2 whitespace-nowrap"></p>
        </div>
        <div className="grid grid-cols-8 gap-40px overflow-y-auto text-base font-normal">
          {redFlagRow}
        </div>
      </InfoBlockLayout>
      {/* Info: (20250902 - Julian) Green Flags Block */}
      <InfoBlockLayout
        title={t('business_detail:GREEN_FLAGS_BLOCK_TITLE')}
        tooltipContent={t('business_detail:TOOLTIP_GREEN_FLAGS')}
        className="flex flex-col gap-40px"
      >
        <div className="grid grid-cols-8 gap-40px font-medium text-text-note">
          <p className="col-span-2 whitespace-nowrap">{t('business_detail:FLAGS_BLOCK_DATE')}</p>
          <p className="col-span-3 whitespace-nowrap">{t('business_detail:FLAGS_BLOCK_EVENTS')}</p>
          <p className="col-span-1 whitespace-nowrap text-center">
            {t('business_detail:FLAGS_BLOCK_LEVEL')}
          </p>
          <p className="col-span-2 whitespace-nowrap"></p>
        </div>
        <div className="grid grid-cols-8 gap-40px overflow-y-auto text-base font-normal">
          {greenFlagRow}
        </div>
      </InfoBlockLayout>
    </div>
  );
};

export default RedFlagsTab;
