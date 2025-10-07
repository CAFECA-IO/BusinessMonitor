import { i18nConfig } from 'i18n-config';
import initTranslations from '@/lib/i18n';
import type { Metadata } from 'next';
import { Suspense } from 'react';
import SearchResultPageBody from '@/components/search/search_result_page_body';

// Info: (20250904 - Julian) 網頁標題 i18n
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = await params;
  const { t } = await initTranslations(locale, ['search_page']);
  return {
    title: `CAFECA - ${t('search_page:HEAD_TITLE')}`,
  };
}

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export default function SearchingResultPage() {
  return (
    // Info: (20250917 - Julian) 使用 Suspense 來包裹需要讀取搜尋參數 `useSearchParams()` 的元件，避免整個頁面進入客戶端渲染
    <Suspense fallback={<>...</>}>
      <SearchResultPageBody />
    </Suspense>
  );
}
