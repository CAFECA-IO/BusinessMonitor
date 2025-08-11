import { i18nConfig } from '@/../i18n-config';
import TranslationsProvider from '@/components/translation/translations_provider';
import initTranslations from '@/lib/i18n';

export const metadata = {
  title: 'CAFECA - Business Detail',
};

const I18N_NAMESPACES = ['business_detail', 'common'];

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

interface IBusinessDetailPageProps {
  params: {
    locale: string;
  };
}

export default async function BusinessDetailPage({ params }: IBusinessDetailPageProps) {
  const { locale } = await params;
  const { resources } = await initTranslations(locale, I18N_NAMESPACES);

  return (
    <TranslationsProvider resources={resources} locale={locale} namespaces={I18N_NAMESPACES}>
      <div></div>
    </TranslationsProvider>
  );
}
