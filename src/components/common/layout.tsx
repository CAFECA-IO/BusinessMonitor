import React from 'react';
import Navbar from '@/components/common/navbar';
import Footer from '@/components/common/footer';
import Breadcrumb from '@/components/common/breadcrumb';
import { IBreadcrumbItem } from '@/interfaces/breadcrumb';

interface ILayoutProps {
  children: React.ReactNode;
  crumbsItems?: IBreadcrumbItem[];
  isSearchBar?: boolean;
}

const Layout: React.FC<ILayoutProps> = ({ children, crumbsItems = [], isSearchBar = false }) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="flex flex-grow flex-col gap-60px">
        {/* Info: (20250805 - Julian) Breadcrumbs & Search bar */}
        <div className="flex items-center justify-between">
          {crumbsItems && crumbsItems.length > 0 && <Breadcrumb items={crumbsItems} />}
          {isSearchBar && (
            <div className="flex items-center">
              {/* Info: (20250805 - Julian) Placeholder for Search Bar Component */}
              <input type="text" placeholder="Search..." className="rounded border px-3 py-2" />
            </div>
          )}
        </div>

        {/* Info: (20250805 - Julian) Page Content */}
        {children}
      </main>

      <Footer />
    </div>
  );
};

export default Layout;
