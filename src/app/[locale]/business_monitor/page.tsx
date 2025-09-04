import type { Metadata } from 'next';
import { i18nConfig } from '@/../i18n-config';
import initTranslations from '@/lib/i18n';
import { mockBusinesses } from '@/interfaces/business';
import MainSearch from '@/components/business/main_search';
import NewBusinessList from '@/components/business/new_business_list';
import MostViewedList from '@/components/business/most_viewed_list';
import Layout from '@/components/common/layout';

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

// Info: (20250904 - Julian) 網頁標題 i18n
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { t } = await initTranslations(params.locale, ['home_page']);
  return {
    title: `CAFECA - ${t('home_page:HEAD_TITLE')}`,
  };
}

export default function SearchPage() {
  return (
    <Layout pageBgColor="bg-surface-background" className="items-center gap-60px">
      {/* Info: (20250904 - Julian) Main Search Area */}
      <MainSearch />

      {/* Info: (20250804 - Julian) Business Lists */}
      <div className="flex w-full flex-col items-center gap-56px">
        {/* Info: (20250804 - Julian) New Business List */}
        <NewBusinessList businessList={mockBusinesses} />
        {/* Info: (20250804 - Julian) Most Viewed List */}
        <MostViewedList businessList={mockBusinesses} />
      </div>
    </Layout>
  );
}
