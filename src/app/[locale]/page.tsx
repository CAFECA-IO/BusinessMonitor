import { i18nConfig } from '@/../i18n-config';
import Kv from '@/components/landing_page/kv';
import IntroCard from '@/components/landing_page/intro_card';
import Cta from '@/components/landing_page/cta';
import Layout from '@/components/common/layout';

export const metadata = {
  title: 'CAFECA - Own Your Identity',
};

export async function generateStaticParams() {
  return i18nConfig.locales.map((locale) => ({ locale }));
}

export default async function LandingPage() {
  return (
    <Layout isLandingPage>
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
    </Layout>
  );
}
