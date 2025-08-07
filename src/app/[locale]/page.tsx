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

interface ILandingPageProps {
  params: {
    locale: string;
  };
}

export default async function LandingPage({ params: { locale } }: ILandingPageProps) {
  const { resources } = await initTranslations(locale, I18N_NAMESPACES);

  return (
    <TranslationsProvider resources={resources} locale={locale} namespaces={I18N_NAMESPACES}>
      <main className="flex min-h-screen flex-col items-center">
        <Navbar />

        <Kv />

        <div className="flex flex-col items-center">
          <IntroCard
            imgSrc="/elements/identity.png"
            title="Verify your **identity** without relying on third parties."
            description="Decentralized Verification: No intermediaries needed. Identity authorization is achieved through blockchain smart contract interactions."
          />
          <IntroCard
            imgSrc="/elements/phone.png"
            title="**Prove** who you are without revealing who you are."
            description="Zero-Knowledge Proof: Uses mobile biometric authentication and the FIDO2 protocol to verify identity without revealing personal information."
          />
          <IntroCard
            imgSrc="/elements/service.png"
            title="Easily connect your identity across **apps** and **services**."
            description="Multi-Platform Integration: Supports OAuth2 protocol, allowing easy integration across various services and applications."
          />
          <IntroCard
            imgSrc="/elements/global.png"
            title="Create once. Use **anywhere**. Stay in control."
            description="Portable Identity: Create your identity once and use it across multiple platforms. All authentication data is stored on the user's mobile device, free from platform lock-in."
          />
          <IntroCard
            imgSrc="/elements/private.png"
            title="Your data stays yours—**private**, **encrypted**, and **protected**."
            description="Privacy Protection: Personal data is encrypted and stored securely, inaccessible to unauthorized parties and protected from misuse."
          />
        </div>

        <Cta />

        <Footer />
      </main>
    </TranslationsProvider>
  );
}
