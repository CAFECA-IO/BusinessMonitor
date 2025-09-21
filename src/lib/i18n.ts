import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next/initReactI18next';
import resourcesToBackend from 'i18next-resources-to-backend';
import { i18nConfig } from 'i18n-config';
import { Resource, i18n } from 'node_modules/i18next';

export default async function initTranslations(
  locale: string,
  namespaces: string[],
  i18nInstance?: i18n,
  resources?: Resource
) {
  const i18nOperator = i18nInstance || createInstance();

  i18nOperator.use(initReactI18next);

  if (!resources) {
    i18nOperator.use(
      resourcesToBackend(
        (language: string, namespace: string) => import(`@/locales/${language}/${namespace}.json`)
      )
    );
  }

  await i18nOperator.init({
    lng: locale,
    resources,
    fallbackLng: i18nConfig.defaultLocale,
    supportedLngs: i18nConfig.locales,
    defaultNS: namespaces[0],
    fallbackNS: namespaces[0],
    ns: namespaces,
    preload: resources ? [] : i18nConfig.locales,
  });

  return {
    i18n: i18nOperator,
    resources: { [locale]: i18nOperator.services.resourceStore.data[locale] },
    t: i18nOperator.t,
  };
}
