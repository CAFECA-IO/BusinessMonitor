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
}

const Layout: React.FC<ILayoutProps> = ({
  children,
  crumbsItems = [],
  isSearchBar = false,
  className = '',
  pageBgColor = '',
  isLandingPage = false,
}) => {
  const isShowCrumbs = crumbsItems && crumbsItems.length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main
        className={`flex grow flex-col gap-20px desktop:gap-40px ${pageBgColor} ${isLandingPage ? '' : 'py-20px'}`}
      >
        {/* Info: (20250805 - Julian) Breadcrumbs & Search bar */}
        {isShowCrumbs && (
          <div className="flex items-center justify-start px-20px desktop:justify-between desktop:px-80px">
            <Breadcrumb items={crumbsItems} />
            {isSearchBar && <SearchArea />}
          </div>
        )}

        {/* Info: (20250805 - Julian) Page Content */}
        <div className={`flex min-h-screen w-full flex-col ${className}`}>{children}</div>
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
