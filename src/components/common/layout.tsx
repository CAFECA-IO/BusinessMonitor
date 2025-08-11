import React from 'react';
import Navbar from '@/components/common/navbar';
import Footer from '@/components/common/footer';
import Breadcrumb from '@/components/common/breadcrumb';
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
        className={`flex flex-grow flex-col gap-60px ${pageBgColor} ${isLandingPage ? '' : 'py-80px'}`}
      >
        {/* Info: (20250805 - Julian) Breadcrumbs & Search bar */}
        {isShowCrumbs && (
          <div className="flex items-center justify-between px-80px">
            <Breadcrumb items={crumbsItems} />
            {isSearchBar && (
              <div className="flex items-center">
                {/* Info: (20250805 - Julian) Placeholder for Search Bar Component */}
                <input type="text" placeholder="Search..." className="rounded border px-3 py-2" />
              </div>
            )}
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
