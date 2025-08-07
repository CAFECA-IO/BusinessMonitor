import Navbar from '@/components/common/navbar';
import Footer from '@/components/common/footer';
import SearchArea from '@/components/common/search_area';
import SearchResultList from '@/components/search/search_result_list';
import Breadcrumb from '@/components/common/breadcrumb';
import { dummyBusinesses } from '@/interfaces/business';
import { BM_URL } from '@/constants/url';

export const metadata = {
  title: 'CAFECA - Searching Result',
};

export default function SearchingResultPage() {
  const dummyData = {
    businesses: dummyBusinesses,
    countOfTotal: 234,
    currentRow: { start: 1, end: 10 },
  };

  return (
    <main className="flex flex-col items-center bg-surface-background">
      <Navbar />

      <div className="flex min-h-screen w-full flex-col items-center gap-60px px-80px pb-60px pt-80px">
        {/* Info: (20250804 - Julian) Breadcrumb  */}
        <Breadcrumb
          items={[
            { name: 'Home', link: BM_URL.HOME },
            { name: 'Searching Result', link: BM_URL.SEARCH },
          ]}
        />

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
      </div>

      <Footer />
    </main>
  );
}
