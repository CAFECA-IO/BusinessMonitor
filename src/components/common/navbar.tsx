'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHeadphones } from 'react-icons/fi';
import { GrHomeRounded } from 'react-icons/gr';
import { RiComputerLine } from 'react-icons/ri';
import Button from '@/components/common/button';
import I18n from '@/components/common/i18n';
import { BM_URL } from '@/constants/url';
import { useTranslation } from 'react-i18next';

const Navbar: React.FC = () => {
  const { t } = useTranslation(['common']);
  const pathname = usePathname();

  const isActiveHome = pathname === BM_URL.HOME;
  // Info: (20250807 - Julian) 路徑中須包含 /business_monitor
  const isActiveBusinessMonitor = pathname.includes(BM_URL.BUSINESS_MONITOR);

  return (
    <nav className="z-50 flex w-full items-center justify-between gap-40px bg-surface-background px-80px py-16px">
      {/* Info: (20250807 - Julian) Logo */}
      <Link href={BM_URL.HOME}>
        <Image src="/logos/cafeca_logo.svg" alt="Cafeca_Logo" width={120} height={36} />
      </Link>

      {/* Info: (20250807 - Julian) Navigation Links */}
      <div className="flex flex-1 items-center justify-end">
        <Link href={BM_URL.HOME}>
          <Button
            type="button"
            variant={isActiveHome ? 'primaryBorderless' : 'secondaryBorderless'}
            className="gap-8px"
          >
            <div className="shrink-0">
              <GrHomeRounded
                size={24}
                className={isActiveHome ? '' : 'text-text-secondary group-hover:text-text-brand'}
              />
            </div>
            <p>{t('common:HOME')}</p>
          </Button>
        </Link>

        <Link href={BM_URL.BUSINESS_MONITOR}>
          <Button
            type="button"
            variant={isActiveBusinessMonitor ? 'primaryBorderless' : 'secondaryBorderless'}
            className="gap-8px"
          >
            <div className="shrink-0">
              <RiComputerLine
                size={24}
                className={
                  isActiveBusinessMonitor ? '' : 'text-text-secondary group-hover:text-text-brand'
                }
              />
            </div>
            <p>{t('common:BUSINESS_MONITOR')}</p>
          </Button>
        </Link>

        {/* Info: (20250807 - Julian) i18n */}
        <I18n />

        {/* Info: (20250807 - Julian) Listen to page */}
        <Button type="button" variant="secondaryBorderless" size="icon">
          <FiHeadphones size={24} />
        </Button>
      </div>

      {/* Info: (20250807 - Julian) Login Button */}
      <Button type="button" size="medium">
        {t('common:LOGIN')}
      </Button>
    </nav>
  );
};

export default Navbar;
