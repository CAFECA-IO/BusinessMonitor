import { i18nConfig } from '@/../i18n-config';
import Navbar from '@/components/common/navbar';
import Kv from '@/components/landing_page/kv';
import IntroCard from '@/components/landing_page/intro_card';
import Cta from '@/components/landing_page/cta';
import Footer from '@/components/common/footer';
import TranslationsProvider from '@/components/translation/translations_provider';
import initTranslations from '@/lib/i18n';

export const metadata = {
  title: 'CAFECA - Own Your Identity',
};

const I18N_NAMESPACES = ['landing_page', 'common'];

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

interface ILandingPageProps {
  params: {
    locale: string;
  };
}

export default async function LandingPage({ params }: ILandingPageProps) {
  const { locale } = await params;
  const { resources } = await initTranslations(locale, I18N_NAMESPACES);

  return (
    <TranslationsProvider resources={resources} locale={locale} namespaces={I18N_NAMESPACES}>
      <main className="flex min-h-screen flex-col items-center">
        <Navbar />

        <Kv />

        <div className="flex flex-col items-center">
          <IntroCard
            imgSrc="/elements/identity.png"
            title="landing_page:INTRO_CARD_1_TITLE"
            description="landing_page:INTRO_CARD_1_DESCRIPTION"
          />
          <IntroCard
            imgSrc="/elements/phone.png"
            title="landing_page:INTRO_CARD_2_TITLE"
            description="landing_page:INTRO_CARD_2_DESCRIPTION"
          />
          <IntroCard
            imgSrc="/elements/service.png"
            title="landing_page:INTRO_CARD_3_TITLE"
            description="landing_page:INTRO_CARD_3_DESCRIPTION"
          />
          <IntroCard
            imgSrc="/elements/global.png"
            title="landing_page:INTRO_CARD_4_TITLE"
            description="landing_page:INTRO_CARD_4_DESCRIPTION"
          />
          <IntroCard
            imgSrc="/elements/private.png"
            title="landing_page:INTRO_CARD_5_TITLE"
            description="landing_page:INTRO_CARD_5_DESCRIPTION"
          />
        </div>

        <Cta />

        <Footer />
      </main>
    </TranslationsProvider>
  );
}
