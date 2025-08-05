import Head from 'next/head';
import Navbar from '@/components/common/navbar';
import Footer from '@/components/common/footer';
import SearchArea from '@/components/common/search_area';
import SearchResultList from '@/components/search/search_result_list';
import { dummyBusinesses } from '@/interfaces/business';

export default function SearchingResultPage() {
  const dummyData = {
    businesses: dummyBusinesses,
    countOfTotal: 234,
    currentRow: { start: 1, end: 10 },
  };

  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon/favicon.ico" />
        <title>Business Monitor - Searching Result</title>
      </Head>

      <main className="flex flex-col items-center bg-surface-background">
        <Navbar />

        <div className="flex min-h-screen w-full flex-col items-center gap-60px px-80px pb-60px pt-80px">
          {/* Info: (20250804 - Julian) Breadcrumb  */}
          <ol className="flex w-full items-center gap-8px">
            <li>Home</li>
            <li>Searching Result</li>
          </ol>

          {/* Info: (20250804 - Julian) Search Area */}
          <SearchArea />

          {/* Info: (20250804 - Julian) Search Result List */}
          <SearchResultList
            countOfTotal={dummyData.countOfTotal}
            currentRow={dummyData.currentRow}
            list={dummyData.businesses}
          />
        </div>

        <Footer />
      </main>
    </>
  );
}
