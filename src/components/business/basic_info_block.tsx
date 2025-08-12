import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { dummyBusinesses } from '@/interfaces/business';
import Button from '@/components/common/button';

const BasicInfoBlock: React.FC = () => {
  // ToDo: (20250812 - Julian) 從 API 取得資料
  const dummyData = dummyBusinesses[0];

  const { imgSrc, name, businessTaxId, officialWebLink, isVerified } = dummyData;

  return (
    <div className="col-span-2 flex flex-col gap-40px rounded-radius-l bg-white px-60px py-40px">
      <p className="text-h5 font-bold text-text-brand">Basic Info</p>
      <hr className="border-border-secondary" />
      <div className="flex justify-between">
        <div className="flex flex-col items-center gap-40px">
          {/* Info: (20250812 - Julian) Business Logo */}
          <div className="relative overflow-hidden rounded-full">
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
            <p className="text-base font-medium">{businessTaxId}</p>
          </div>
          {/* Info: (20250812 - Julian) Official Web */}
          <Link href={officialWebLink}>
            <Button type="button" variant="primaryBorderless" className="gap-8px">
              <Image src="/icons/link.svg" width={18} height={18} alt="link_icon" />
              <p className="font-normal">Official Web</p>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BasicInfoBlock;
