import type { Metadata } from 'next';
import { Noto_Sans_TC, Jost } from 'next/font/google';
import '@/styles/globals.css';
import TranslationsProvider from '@/components/translation/translations_provider';
import initTranslations from '@/lib/i18n';
import fs from 'fs';
import path from 'path';

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
  title: '企業觀測站',
  description:
    '提供上市、上櫃及興櫃公司之重要資訊，涵蓋財務報告、重大訊息與股東會資料，協助投資人快速掌握公司動態與市場趨勢，同時亦揭露未公開發行公司的相關資訊。',
  authors: [{ name: 'CAFECA Team' }],
  keywords: [
    '企業觀測站',
    '財務報告',
    '股東會資料',
    '投資人服務',
    '市場趨勢',
    '企業透明度',
    '投資決策',
    '財經資訊',
  ],
  icons: {
    icon: '/logos/cafeca_icon.svg',
  },
  // ToDo: (20250805 - Julian) Add Open Graph metadata
  openGraph: {
    title: '企業觀測站',
    description:
      '提供上市、上櫃及興櫃公司之重要資訊，涵蓋財務報告、重大訊息與股東會資料，協助投資人快速掌握公司動態與市場趨勢，同時亦揭露未公開發行公司的相關資訊。',
    url: 'https://cafeca.io/',
    siteName: '企業觀測站',
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
      <body className={`${notoSansTC.className} ${jost.className} antialiased`}>
        <TranslationsProvider locale={locale} resources={resources} namespaces={I18N_NAMESPACES}>
          {children}
        </TranslationsProvider>
      </body>
    </html>
  );
}
