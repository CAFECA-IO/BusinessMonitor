import type { Metadata } from 'next';
import { Noto_Sans_TC, Jost } from 'next/font/google';
import Script from 'next/script';
import '@/styles/globals.css';
import TranslationsProvider from '@/components/translation/translations_provider';
import initTranslations from '@/lib/i18n';
import fs from 'fs';
import path from 'path';
import { AuthProvider } from '@/contexts/auth_context';

// Info: (20250904 - Julian) 讀取 src/locales/en 底下的所有 namespace
const localesDir = path.join(process.cwd(), 'src', 'locales', 'en');
const localeFiles = fs.readdirSync(localesDir);
const I18N_NAMESPACES = localeFiles
  .filter((file) => file.endsWith('.json'))
  .map((file) => path.basename(file, '.json'));

const notoSansTC = Noto_Sans_TC({
  subsets: ['latin'],
});

const jost = Jost({
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'CAFECA',
  description:
    'CAFECA 是一個去中心化身份驗證平台，透過區塊鏈與零知識證明技術，讓個人與企業在網路上擁 有安全、隱私、可攜的身份，實現真正的自我主權身份。',
  authors: [{ name: 'CAFECA' }],
  keywords: ['CAFECA', 'DID', 'FIDO2', 'blockchain'],
  icons: {
    icon: '/logos/cafeca_icon.svg',
  },
  openGraph: {
    title: 'CAFECA',
    description:
      'CAFECA 是一個去中心化身份驗證平台，透過區塊鏈與零知識證明技術，讓個人與企業在網路上擁 有安全、隱私、可攜的身份，實現真正的自我主權身份。',
    url: 'https://cafeca.io/',
    siteName: 'CAFECA',
    locale: 'zh_TW',
    type: 'website',
  },
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
      {/* Info: (20251209 - Julian) GA-code */}
      <head>
        <Script
          id="ga-script"
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-5X6ZLFNDZ2"
        ></Script>
        <Script id="ga-script">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5X6ZLFNDZ2');
          `}
        </Script>
      </head>

      <AuthProvider>
        <body className={`${notoSansTC.className} ${jost.className} antialiased`}>
          <TranslationsProvider locale={locale} resources={resources} namespaces={I18N_NAMESPACES}>
            {children}
          </TranslationsProvider>
        </body>
      </AuthProvider>
    </html>
  );
}
