'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useTranslation } from 'react-i18next';
import { mockBusinesses } from '@/interfaces/business';
import Button from '@/components/common/button';
import { timestampToString, formatNumberWithCommas } from '@/lib/common';

const BasicInfoBlock: React.FC = () => {
  const { t } = useTranslation(['business_detail']);

  // ToDo: (20250812 - Julian) 從 API 取得資料
  const dummyData = mockBusinesses[0];

  const {
    imgSrc,
    name,
    businessTaxId,
    officialWebLink,
    isVerified,
    companyRepresentative,
    countryOfRegistration,
    dateOfEstablishment,
    registeredCapital,
    paidInCapital,
    capitalRanking,
    address,
    updatedAt,
  } = dummyData;

  const updatedAtString = timestampToString(updatedAt);

  return (
    <div className="col-span-2 flex flex-col items-end gap-16px">
      {/* Info: (20250813 - Julian) Last Update Time */}
      <p className="text-base font-normal text-text-primary">
        {t('business_detail:BASIC_INFO_TAB_LAST_UPDATE_TIME')}: {updatedAtString.formattedDate}{' '}
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
            <div className="relative h-150px w-150px overflow-hidden rounded-full">
              <Image src={imgSrc} alt="business_logo" width={150} height={150} />
            </div>
            {/* Info: (20250812 - Julian) Business Name & Tax ID */}
            <div className="flex flex-col items-center gap-12px">
              <div className="flex w-350px items-center gap-4px overflow-x-auto overflow-y-hidden whitespace-nowrap text-h4 font-bold text-text-primary">
                {isVerified && (
                  <Image src="/icons/verified.svg" width={32} height={32} alt="verified_icon" />
                )}
                <p>{name}</p>
              </div>
              <p className="text-base font-medium text-grey-60">{businessTaxId}</p>
            </div>
            {/* Info: (20250812 - Julian) Official Web */}
            <Link href={officialWebLink} target="_blank">
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
              <p className="text-text-primary">{companyRepresentative}</p>
            </div>

            <div className="flex flex-col items-start gap-12px text-sm font-medium">
              <p className="text-text-note">
                {t('business_detail:BASIC_INFO_TAB_COUNTRY_OF_REGISTRATION')}
              </p>
              <p className="text-text-primary">{countryOfRegistration}</p>
            </div>

            <div className="flex flex-col items-start gap-12px text-sm font-medium">
              <p className="text-text-note">
                {t('business_detail:BASIC_INFO_TAB_DATE_OF_ESTABLISHMENT')}
              </p>
              <p className="text-text-primary">
                {timestampToString(dateOfEstablishment).formattedDate}
              </p>
            </div>

            <div className="flex flex-col items-start gap-12px text-sm font-medium">
              <p className="text-text-note">
                {t('business_detail:BASIC_INFO_TAB_REGISTERED_CAPITAL')}
              </p>
              <p className="text-text-primary">$ {formatNumberWithCommas(registeredCapital)} TWD</p>
            </div>

            <div className="flex flex-col items-start gap-12px text-sm font-medium">
              <p className="text-text-note">
                {t('business_detail:BASIC_INFO_TAB_PAID_IN_CAPITAL')}
              </p>
              <p className="text-text-primary">$ {formatNumberWithCommas(paidInCapital)} TWD</p>
            </div>

            <div className="flex flex-col items-start gap-12px text-sm font-medium">
              <p className="text-text-note">
                {t('business_detail:BASIC_INFO_TAB_CAPITAL_RANKING')}
              </p>
              <p className="text-text-primary"># {capitalRanking}</p>
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
