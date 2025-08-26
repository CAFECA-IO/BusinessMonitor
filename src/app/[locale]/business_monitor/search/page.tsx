import { i18nConfig } from '@/../i18n-config';
import { mockBusinesses } from '@/interfaces/business';
import { BM_URL } from '@/constants/url';
import SearchArea from '@/components/common/search_area';
import SearchResultList from '@/components/search/search_result_list';
import Layout from '@/components/common/layout';

export const metadata = {
  title: 'CAFECA - Searching Result',
};

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export default function SearchingResultPage() {
  const dummyData = {
    businesses: mockBusinesses,
    countOfTotal: 234,
    currentRow: { start: 1, end: 10 },
  };

  const crumbsItems = [
    { name: 'HOME', link: BM_URL.HOME },
    { name: 'SEARCHING_RESULT', link: BM_URL.BUSINESS_MONITOR },
  ];

  return (
    <Layout
      crumbsItems={crumbsItems}
      pageBgColor="bg-surface-background"
      className="items-center gap-60px px-80px pb-60px"
    >
      {/* Info: (20250804 - Julian) Search Area */}
      <div className="w-3/4">
        <SearchArea />
      </div>

      {/* Info: (20250804 - Julian) Search Result List */}
      <div className="w-3/4">
        <SearchResultList
          countOfTotal={dummyData.countOfTotal}
          currentRow={dummyData.currentRow}
          list={dummyData.businesses}
        />
      </div>
    </Layout>
  );
}
