import initTranslations from '@/lib/i18n';
import type { Metadata } from 'next';
import BusinessDetailPageBody from '@/components/business/business_detail_page_body';

// Info: (20250904 - Julian) 網頁標題 i18n
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { t } = await initTranslations(params.locale, ['business_detail']);
  return {
    title: `CAFECA - ${t('business_detail:HEAD_TITLE')}`,
  };
}

interface IBusinessDetailPageProps {
  params: {
    businessId: string;
  };
}

export default async function BusinessDetailPage({ params }: IBusinessDetailPageProps) {
  const { businessId } = await params;

  return <BusinessDetailPageBody businessId={businessId} />;
}
