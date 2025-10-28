import React from 'react';
import Navbar from '@/components/common/navbar';
import Footer from '@/components/common/footer';
import Breadcrumb from '@/components/common/breadcrumb';
import SearchArea from '@/components/common/search_area';
import { IBreadcrumbItem } from '@/interfaces/breadcrumb';

interface ILayoutProps {
  children: React.ReactNode;
  crumbsItems?: IBreadcrumbItem[];
  isSearchBar?: boolean;
  className?: string;
  pageBgColor?: string;
  isLandingPage?: boolean;
  isLoginPage?: boolean;
}

const Layout: React.FC<ILayoutProps> = ({
  children,
  crumbsItems = [],
  isSearchBar = false,
  className = '',
  pageBgColor = '',
  isLandingPage = false,
  isLoginPage = false,
}) => {
  const isShowCrumbs = crumbsItems && crumbsItems.length > 0;

  // Info: (20251016 - Julian) Landing page and Login page don't have padding
  const paddingClass = isLandingPage || isLoginPage ? '' : 'py-20px';

  // Info: (20251016 - Julian) Don't show Navbar and Footer on Login page
  const displayedNavbar = isLoginPage ? null : <Navbar />;
  const displayedFooter = isLoginPage ? null : <Footer />;

  return (
    <div className="flex min-h-screen flex-col">
      {displayedNavbar}

      <main
        className={`flex grow flex-col gap-20px desktop:gap-40px ${pageBgColor} ${paddingClass}`}
      >
        {/* Info: (20250805 - Julian) Breadcrumbs & Search bar */}
        {isShowCrumbs && (
          <div className="flex flex-col items-center justify-start gap-y-20px px-20px desktop:flex-row desktop:justify-between desktop:px-80px">
            <Breadcrumb items={crumbsItems} />
            {isSearchBar && <SearchArea />}
          </div>
        )}

        {/* Info: (20250805 - Julian) Page Content */}
        {/* <div className={`flex min-h-screen w-full flex-col ${className}`}>{children}</div> */}
        <div
          className={`flex w-full flex-col ${isLoginPage ? 'h-dvh overflow-hidden overscroll-none' : 'min-h-screen'} ${className}`}
        >
          {children}
        </div>
      </main>
      {displayedFooter}
    </div>
  );
};

export default Layout;
