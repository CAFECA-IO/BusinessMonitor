import type { Metadata } from 'next';
import { Noto_Sans_TC, Jost } from 'next/font/google';
import '@/styles/globals.css';
import TranslationsProvider from '@/components/translation/translations_provider';
import initTranslations from '@/lib/i18n';

// Info: (20250808 - Julian) 應寫入所有 i18n namespace
const I18N_NAMESPACES = ['common', 'landing_page', 'business_detail'];

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
});

const jost = Jost({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CAFECA',
  description:
    'CAFECA is a decentralized identity verification platform that allows you to own and control your identity without relying on third parties.',
  authors: [{ name: 'CAFECA Team' }],
  keywords: [
    'CAFECA',
    'Decentralized Identity',
    'Identity Verification',
    'Zero-Knowledge Proof',
    'FIDO2 Protocol',
    'OAuth2',
    'Privacy Protection',
  ],
  icons: {
    icon: '/logos/cafeca_icon.svg',
  },
  // ToDo: (20250805 - Julian) Add Open Graph metadata
  // openGraph: {},
};

interface IRootLayoutProps {
  params: {
    locale: string;
  };
  children: React.ReactNode;
}

export default async function RootLayout({ children, params }: Readonly<IRootLayoutProps>) {
  const { locale } = await params;
  const { resources } = await initTranslations(locale, I18N_NAMESPACES);

  return (
    <html lang="tw">
      <body className={`${notoSansTC.className} ${jost.className} antialiased`}>
        <TranslationsProvider locale={locale} resources={resources} namespaces={I18N_NAMESPACES}>
          {children}
        </TranslationsProvider>
      </body>
    </html>
  );
}
