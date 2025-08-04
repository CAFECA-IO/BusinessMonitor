import Head from 'next/head';
import Navbar from '@/components/common/navbar';
import Footer from '@/components/common/footer';
import SearchArea from '@/components/common/search_area';
import NewBusinessList from '@/components/business/new_business_list';
import MostViewedList from '@/components/business/most_viewed_list';
import { dummyBusinesses } from '@/interfaces/business';

export default function LandingPage() {
  return (
    <>
      <Head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon/favicon.ico" />
        <title>Business Monitor - Search</title>
      </Head>

      <main className="flex min-h-screen flex-col items-center bg-surface-background">
        <Navbar />

        <div className="flex w-full flex-col items-center gap-60px px-80px pb-32px pt-60px">
          <div className="flex w-1/2 flex-col items-stretch gap-40px">
            {/* Info: (20250804 - Julian) Main Title and Subtitle */}
            <div className="flex flex-col items-center">
              <h6 className="text-h6 font-bold text-text-primary">SEARCH</h6>
              <h2 className="text-h2 font-bold text-text-brand">Business Monitor</h2>
            </div>

            {/* Info: (20250804 - Julian) Search Area */}
            <SearchArea />
          </div>

          {/* Info: (20250804 - Julian) Business Lists */}
          <div className="flex w-full flex-col items-center gap-56px">
            {/* Info: (20250804 - Julian) New Business List */}
            <NewBusinessList businessList={dummyBusinesses} />
            {/* Info: (20250804 - Julian) Most Viewed List */}
            <MostViewedList businessList={dummyBusinesses} />
          </div>
        </div>

        <Footer />
      </main>
    </>
  );
}
