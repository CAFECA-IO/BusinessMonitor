import { i18nConfig } from '@/../i18n-config';
import { dummyBusinesses } from '@/interfaces/business';
import SearchArea from '@/components/common/search_area';
import NewBusinessList from '@/components/business/new_business_list';
import MostViewedList from '@/components/business/most_viewed_list';
import Layout from '@/components/common/layout';

export const metadata = {
  title: 'CAFECA - Searching Businesses',
};

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export default function SearchPage() {
  return (
    <Layout pageBgColor="bg-surface-background" className="items-center gap-60px">
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
    </Layout>
  );
}
