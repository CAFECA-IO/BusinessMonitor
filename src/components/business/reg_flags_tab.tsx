'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { timestampToString } from '@/lib/common';
import InfoBlockLayout from '@/components/business/info_block_layout';
import { FlagType } from '@/constants/flag';
import { mockFlags, IFlags } from '@/interfaces/flag';

const FlagItem: React.FC<IFlags> = ({ id, flagType, date, eventTitle, level }) => {
  const { t } = useTranslation(['business_detail']);

  const flagColor = flagType === FlagType.RED ? 'text-text-error' : 'text-text-success';
  const readMoreLink = `/flags/${id}`;

  return (
    <>
      <p className="col-span-2">{timestampToString(date).formattedDate}</p>
      <p className="col-span-3">{eventTitle}</p>
      <p className={`col-span-1 text-center font-medium ${flagColor}`}>{level}</p>
      <div className="col-span-2 text-center">
        <Link href={readMoreLink} className="text-button-link hover:text-button-primary-hover">
          {t('business_detail:FLAGS_BLOCK_READ_MORE')}
        </Link>
      </div>
    </>
  );
};

const RedFlagsTab: React.FC = () => {
  const { t } = useTranslation(['business_detail']);

  // ToDo: (20250902 - Julian) Replace with actual data fetching logic
  const lastUpdateTime = 1737289600;
  const flagData = mockFlags;

  const formattedTime = timestampToString(lastUpdateTime);

  // Info: (20250902 - Julian) Separate red and green flags
  const redFlags = flagData.filter((flag) => flag.flagType === FlagType.RED);
  const greenFlags = flagData.filter((flag) => flag.flagType === FlagType.GREEN);

  const redFlagRow = redFlags.map((flag) => <FlagItem key={flag.id} {...flag} />);
  const greenFlagRow = greenFlags.map((flag) => <FlagItem key={flag.id} {...flag} />);

  return (
    <div className="flex flex-col gap-16px">
      <p className="text-right">
        {t('business_detail:LAST_UPDATE_TIME')}: {formattedTime.formattedDate} {formattedTime.time}
      </p>
      <div className="grid grid-cols-2 gap-60px">
        {/* Info: (20250902 - Julian) Red Flags Block */}
        <InfoBlockLayout
          title={t('business_detail:RED_FLAGS_BLOCK_TITLE')}
          tooltipContent="tooltip content"
          className="flex flex-col gap-40px"
        >
          <div className="grid grid-cols-8 gap-40px font-medium text-text-note">
            <p className="col-span-2">{t('business_detail:FLAGS_BLOCK_DATE')}</p>
            <p className="col-span-3">{t('business_detail:FLAGS_BLOCK_EVENTS')}</p>
            <p className="col-span-1 text-center">{t('business_detail:FLAGS_BLOCK_LEVEL')}</p>
            <p className="col-span-2"></p>
          </div>
          <div className="grid grid-cols-8 gap-40px overflow-y-auto text-base font-normal">
            {redFlagRow}
          </div>
        </InfoBlockLayout>
        {/* Info: (20250902 - Julian) Green Flags Block */}
        <InfoBlockLayout
          title={t('business_detail:GREEN_FLAGS_BLOCK_TITLE')}
          tooltipContent="tooltip content"
          className="flex flex-col gap-40px"
        >
          <div className="grid grid-cols-8 gap-40px font-medium text-text-note">
            <p className="col-span-2">{t('business_detail:FLAGS_BLOCK_DATE')}</p>
            <p className="col-span-3">{t('business_detail:FLAGS_BLOCK_EVENTS')}</p>
            <p className="col-span-1 text-center">{t('business_detail:FLAGS_BLOCK_LEVEL')}</p>
            <p className="col-span-2"></p>
          </div>
          <div className="grid grid-cols-8 gap-40px overflow-y-auto text-base font-normal">
            {greenFlagRow}
          </div>
        </InfoBlockLayout>
      </div>
    </div>
  );
};

export default RedFlagsTab;
