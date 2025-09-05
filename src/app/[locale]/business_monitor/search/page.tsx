import { i18nConfig } from '@/i18nconfig';
import initTranslations from '@/lib/i18n';
import type { Metadata } from 'next';
import { mockBusinesses } from '@/interfaces/business';
import { BM_URL } from '@/constants/url';
import SearchArea from '@/components/common/search_area';
import SearchResultList from '@/components/search/search_result_list';
import Layout from '@/components/common/layout';

// Info: (20250904 - Julian) 網頁標題 i18n
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { t } = await initTranslations(params.locale, ['search_page']);
  return {
    title: `CAFECA - ${t('search_page:HEAD_TITLE')}`,
  };
}

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
    { name: 'BUSINESS_MONITOR', link: BM_URL.BUSINESS_MONITOR },
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
