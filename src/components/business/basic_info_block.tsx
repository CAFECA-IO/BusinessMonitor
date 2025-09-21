'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import Button from '@/components/common/button';
import { timestampToString, formatNumberWithCommas } from '@/lib/common';
import { CompanyBasicCard as IBasicInfo } from '@/types/company';

interface IBasicInfoSkeletonProps {
  basicData: IBasicInfo;
}

const BasicInfoBlock: React.FC<IBasicInfoSkeletonProps> = ({ basicData }) => {
  const { t } = useTranslation(['business_detail']);

  const {
    name,
    logoUrl,
    registrationNo,
    representative,
    registrationCountry,
    establishedDate,
    capitalAmount,
    paidInCapital,
    capitalRanking,
    address,
    websiteUrl,
    status,
    lastUpdateTime,
  } = basicData;

  const isVerified = status === '核准設立'; // ToDo: (20250915 - Julian) set constant
  const websiteLink = websiteUrl ?? '/';

  const establishedTimestamp = establishedDate ? new Date(establishedDate).getTime() / 1000 : 0;
  const establishedString = timestampToString(establishedTimestamp);

  const updatedAtTimestamp = lastUpdateTime ? new Date(lastUpdateTime).getTime() / 1000 : 0;
  const updatedAtString = timestampToString(updatedAtTimestamp);

  const isShowLogo = !!logoUrl ? (
    <Image src={logoUrl} alt="business_logo" width={150} height={150} />
  ) : (
    <div className="size-150px animate-pulse rounded-full bg-grey-100"></div>
  );

  return (
    <div className="col-span-2 flex flex-col items-end gap-16px">
      {/* Info: (20250813 - Julian) Last Update Time */}
      <p className="text-base font-normal text-text-primary">
        {t('business_detail:LAST_UPDATE_TIME')}: {updatedAtString.formattedDate}{' '}
        {updatedAtString.time}
      </p>
      {/* Info: (20250813 - Julian) Main Block */}
      <div className="flex w-full flex-col gap-40px rounded-radius-l bg-white px-60px py-40px">
        <p className="text-h5 font-bold text-text-brand">
          {t('business_detail:BASIC_INFO_TAB_TITLE')}
        </p>
        <hr className="border-border-secondary" />
        {/* Info: (20250812 - Julian) Content */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col items-center gap-40px">
            {/* Info: (20250812 - Julian) Business Logo */}
            <div className="relative size-150px overflow-hidden rounded-full">{isShowLogo}</div>
            {/* Info: (20250812 - Julian) Business Name & Tax ID */}
            <div className="flex flex-col items-center gap-12px">
              <div className="flex w-350px items-center gap-4px overflow-x-auto overflow-y-hidden whitespace-nowrap text-h4 font-bold text-text-primary">
                {isVerified && (
                  <Image src="/icons/verified.svg" width={32} height={32} alt="verified_icon" />
                )}
                <p className="flex-1 text-center">{name}</p>
              </div>
              <p className="text-base font-medium text-grey-60">{registrationNo}</p>
            </div>
            {/* Info: (20250812 - Julian) Official Web */}
            <Link href={websiteLink} target="_blank">
              <Button type="button" variant="primaryBorderless" className="gap-8px">
                <Image src="/icons/link.svg" width={18} height={18} alt="link_icon" />
                <p className="font-normal">{t('business_detail:BASIC_INFO_TAB_OFFICIAL_WEB')}</p>
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-60px">
            <div className="flex flex-col items-start gap-12px text-sm font-medium">
              <p className="text-text-note">
                {t('business_detail:BASIC_INFO_TAB_COMPANY_REPRESENTATIVE')}
              </p>
              <p className="text-text-primary">{representative}</p>
            </div>

            <div className="flex flex-col items-start gap-12px text-sm font-medium">
              <p className="text-text-note">
                {t('business_detail:BASIC_INFO_TAB_COUNTRY_OF_REGISTRATION')}
              </p>
              <p className="text-text-primary">{registrationCountry}</p>
            </div>

            <div className="flex flex-col items-start gap-12px text-sm font-medium">
              <p className="text-text-note">
                {t('business_detail:BASIC_INFO_TAB_DATE_OF_ESTABLISHMENT')}
              </p>
              <p className="text-text-primary">{establishedString.formattedDate}</p>
            </div>

            <div className="flex flex-col items-start gap-12px text-sm font-medium">
              <p className="text-text-note">
                {t('business_detail:BASIC_INFO_TAB_REGISTERED_CAPITAL')}
              </p>
              <p className="text-text-primary">
                $ {formatNumberWithCommas(capitalAmount ?? '-')} TWD
              </p>
            </div>

            <div className="flex flex-col items-start gap-12px text-sm font-medium">
              <p className="text-text-note">
                {t('business_detail:BASIC_INFO_TAB_PAID_IN_CAPITAL')}
              </p>
              <p className="text-text-primary">
                $ {formatNumberWithCommas(paidInCapital ?? '-')} TWD
              </p>
            </div>

            <div className="flex flex-col items-start gap-12px text-sm font-medium">
              <p className="text-text-note">
                {t('business_detail:BASIC_INFO_TAB_CAPITAL_RANKING')}
              </p>
              <p className="text-text-primary"># {capitalRanking ?? '-'}</p>
            </div>

            <div className="col-span-3 flex flex-col items-start gap-12px text-sm font-medium">
              <p className="text-text-note">{t('business_detail:BASIC_INFO_TAB_ADDRESS')}</p>
              <p className="text-text-primary">{address}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoBlock;
