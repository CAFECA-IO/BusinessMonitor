'use client';

import { I18nextProvider } from 'react-i18next';
import initTranslations from '@/lib/i18n';
import { createInstance } from 'i18next';
import { Resource } from 'node_modules/i18next';

interface ITranslationsProviderProps {
  children: React.ReactNode;
  locale: string;
  namespaces: string[];
  resources: Resource;
}

export default function TranslationsProvider({
  children,
  locale,
  namespaces,
  resources,
}: ITranslationsProviderProps) {
  const i18n = createInstance();

  initTranslations(locale, namespaces, i18n, resources);

  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>;
}
