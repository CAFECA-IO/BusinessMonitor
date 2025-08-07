import type { Metadata } from 'next';
import { Noto_Sans_TC, Jost } from 'next/font/google';
import '@/styles/globals.css';

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${notoSansTC.className} ${jost.className} antialiased`}>{children}</body>
    </html>
  );
}
