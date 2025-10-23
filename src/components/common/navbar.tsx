'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { FiHeadphones } from 'react-icons/fi';
import { GrHomeRounded } from 'react-icons/gr';
import { RiComputerLine } from 'react-icons/ri';
import { RxHamburgerMenu } from 'react-icons/rx';
import useOuterClick from '@/lib/hooks/use_outer_click';
import Button from '@/components/common/button';
import I18n from '@/components/common/i18n';
import { BM_URL } from '@/constants/url';
import { useAuth } from '@/contexts/auth_context';
import { DEFAULT_USER_AVATAR } from '@/constants/display';

const Navbar: React.FC = () => {
  const { t } = useTranslation(['common']);
  const pathname = usePathname();
  const { user, isLoading, logout } = useAuth();

  const {
    targetRef: burgerRef,
    componentVisible: isBurgerOpen,
    setComponentVisible: setIsBurgerOpen,
  } = useOuterClick<HTMLDivElement>(false);

  const {
    targetRef: userRef,
    componentVisible: isUserOpen,
    setComponentVisible: setIsUserOpen,
  } = useOuterClick<HTMLDivElement>(false);

  const isActiveHome = pathname === BM_URL.HOME;
  // Info: (20250807 - Julian) 路徑中須包含 /business_monitor
  const isActiveBusinessMonitor = pathname.includes(BM_URL.BUSINESS_MONITOR);

  const toggleBurgerMenu = () => setIsBurgerOpen((prev) => !prev);
  const toggleUserMenu = () => setIsUserOpen((prev) => !prev);

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

  const loginBtn = () => {
    if (isLoading) {
      return <div className="h-10 w-24 animate-pulse rounded-md bg-gray-200" />;
    }
    return (
      <>
        {user ? (
          <div className="relative">
            <button
              type="button"
              onClick={toggleUserMenu}
              className="relative size-40px overflow-hidden rounded-full"
            >
              <Image
                src={user.photo ?? DEFAULT_USER_AVATAR}
                width={40}
                height={40}
                alt="user_avatar"
              />
            </button>
            {isUserOpen && (
              <div
                ref={userRef}
                className="absolute right-0 flex w-100px flex-col gap-8px rounded-radius-s bg-white px-12px py-8px shadow-drop-L"
              >
                <Link href={BM_URL.PROFILE} className="w-full">
                  <Button type="button" size="small" className="w-full">
                    Profile
                  </Button>
                </Link>
                <Button type="button" size="small" variant="secondary" onClick={logout}>
                  登出
                </Button>
              </div>
            )}
          </div>
        ) : (
          <Link href={BM_URL.LOGIN}>
            <Button type="button" size="medium" className="w-full">
              {t('common:LOGIN')}
            </Button>
          </Link>
        )}
      </>
    );
  };

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
        <div className="ml-4">{loginBtn()}</div>
      </div>

      {/* Info: (20251008 - Julian) Mobile Navigation */}
      <div ref={burgerRef} className="relative block desktop:hidden">
        <Button type="button" size="icon" variant="secondaryBorderless" onClick={toggleBurgerMenu}>
          <RxHamburgerMenu size={20} />
        </Button>

        {isBurgerOpen && (
          <div className="absolute right-0 top-40px flex w-150px flex-col gap-8px rounded-radius-s bg-white px-12px py-8px shadow-drop-L">
            {navigationLinks}
            <div className="grid grid-cols-2 align-middle">{littleTools}</div>

            {loginBtn()}
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
