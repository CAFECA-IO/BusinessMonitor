'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHeadphones } from 'react-icons/fi';
import { GrHomeRounded } from 'react-icons/gr';
import { RiComputerLine } from 'react-icons/ri';
import useOuterClick from '@/lib/hooks/use_outer_click';
import Button from '@/components/common/button';
import I18n from '@/components/common/i18n';
import { BM_URL } from '@/constants/url';
import { useTranslation } from 'react-i18next';
import { RxHamburgerMenu } from 'react-icons/rx';

const Navbar: React.FC = () => {
  const { t } = useTranslation(['common']);
  const pathname = usePathname();

  const {
    targetRef: burgerRef,
    componentVisible: isBurgerOpen,
    setComponentVisible: setIsBurgerOpen,
  } = useOuterClick<HTMLDivElement>(false);

  const isActiveHome = pathname === BM_URL.HOME;
  // Info: (20250807 - Julian) 路徑中須包含 /business_monitor
  const isActiveBusinessMonitor = pathname.includes(BM_URL.BUSINESS_MONITOR);

  const toggleBurgerMenu = () => setIsBurgerOpen((prev) => !prev);

  const navigationLinks = (
    <>
      <Link href={BM_URL.HOME}>
        <Button
          type="button"
          variant={isActiveHome ? 'primaryBorderless' : 'secondaryBorderless'}
          className="gap-8px"
        >
          <div className="shrink-0">
            <GrHomeRounded
              size={20}
              className={isActiveHome ? '' : 'text-text-secondary group-hover:text-text-brand'}
            />
          </div>
          <p className="text-xs desktop:text-base">{t('common:HOME')}</p>
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
              size={20}
              className={
                isActiveBusinessMonitor ? '' : 'text-text-secondary group-hover:text-text-brand'
              }
            />
          </div>
          <p className="text-xs desktop:text-base">{t('common:BUSINESS_MONITOR')}</p>
        </Button>
      </Link>
    </>
  );

  const littleTools = (
    <>
      {/* Info: (20250807 - Julian) i18n */}
      <I18n />

      {/* Info: (20250807 - Julian) Listen to page */}
      <Button type="button" variant="secondaryBorderless" size="icon">
        <FiHeadphones size={24} />
      </Button>
    </>
  );

  const loginBtn = (
    <Link href={BM_URL.AUTH_LOGIN}>
      <Button type="button" size="medium" className="w-full">
        {t('common:LOGIN')}
      </Button>
    </Link>
  );

  return (
    <nav className="z-30 flex w-full items-center justify-between gap-16px bg-surface-background px-10px py-8px desktop:gap-40px desktop:px-spacing-2xl desktop:py-spacing-2xs">
      {/* Info: (20250807 - Julian) Logo */}
      <Link href={BM_URL.HOME} className="shrink-0">
        <Image src="/logos/cafeca_logo.svg" alt="cafeca_logo" width={120} height={36} />
      </Link>

      {/* Info: (20251008 - Julian) Desktop Navigation */}
      <div className="hidden flex-1 items-center justify-end desktop:flex">
        {navigationLinks}
        {littleTools}
      </div>

      <Link href={BM_URL.LOGIN}>
        <Button type="button" size="medium">
          {t('common:LOGIN')}
        </Button>
      </Link>

      {/* Info: (20251008 - Julian) Mobile Navigation */}
      <div ref={burgerRef} className="relative block desktop:hidden">
        <Button type="button" size="icon" variant="secondaryBorderless" onClick={toggleBurgerMenu}>
          <RxHamburgerMenu size={20} />
        </Button>

        {isBurgerOpen && (
          <div className="absolute right-0 top-40px flex w-150px flex-col gap-8px rounded-radius-s bg-white px-12px py-8px shadow-drop-L">
            {navigationLinks}
            <div className="grid grid-cols-2 align-middle">{littleTools}</div>
            {loginBtn}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
