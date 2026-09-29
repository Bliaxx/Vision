import { type Locale, type Messages, messages } from '@dedale/i18n';
import type { ReactNode } from 'react';
import { IntlProvider } from 'use-intl';

/**
 * Mêmes catalogues ICU que le site : une seule source de vérité pour les
 * textes, les pluriels et les formats de date ou de nombre.
 */
export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <IntlProvider
      locale={locale}
      messages={messages[locale]}
      timeZone="Europe/Paris"
      onError={(error) => {
        if (__DEV__) console.warn(error.message);
      }}
    >
      {children}
    </IntlProvider>
  );
}

declare module 'use-intl' {
  interface AppConfig {
    Locale: Locale;
    Messages: Messages;
  }
}
