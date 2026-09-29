import { localeNames, locales } from '@dedale/i18n';
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { LogOut } from 'lucide-react-native';
import { Pressable, Switch, View } from 'react-native';
import { useLocale, useTranslations } from 'use-intl';
import { Monogram } from '@/components/brand/monogram';
import { Button } from '@/components/ui/button';
import { Screen, Section } from '@/components/ui/screen';
import { Segmented } from '@/components/ui/segmented';
import { Text } from '@/components/ui/text';
import { orpc } from '@/lib/api';
import { APP_VERSION } from '@/lib/config';
import { setLocale } from '@/lib/locale';
import { updatePreferences, usePreferences } from '@/lib/preferences';
import { useSession, useSignOut } from '@/lib/session';
import { useTheme } from '@/theme/theme';

const SITE = 'https://dedale.app';

function Card({ children }: { children: React.ReactNode }) {
  const { colors, radii } = useTheme();
  return (
    <View
      style={{
        gap: 14,
        padding: 16,
        borderRadius: radii.lg,
        backgroundColor: colors.surfaceRaised,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      {children}
    </View>
  );
}

function Account() {
  const t = useTranslations();
  const { user } = useSession();
  const signOut = useSignOut();
  const me = useQuery({ ...orpc.account.me.queryOptions(), enabled: user !== null });
  if (!user) {
    return (
      <Card>
        <Text>{t('mobile.signInCta')}</Text>
        <Button label={t('nav.signIn')} onPress={() => router.push('/sign-in')} />
      </Card>
    );
  }
  const plan = me.data?.subscription.plan;
  return (
    <Card>
      <Text variant="title">
        {t('mobile.signedInAs', { name: me.data?.profile.displayName ?? user.name })}
      </Text>
      {plan ? (
        <Text tone="muted">
          {t('account.currentPlan', { plan: t(`pricing.plans.${plan}.name`) })}
        </Text>
      ) : null}
      <Button
        label={t('nav.signOut')}
        icon={LogOut}
        variant="secondary"
        onPress={() => void signOut()}
      />
    </Card>
  );
}

export default function ProfileScreen() {
  const t = useTranslations();
  const locale = useLocale();
  const prefs = usePreferences();
  const { colors } = useTheme();
  return (
    <Screen>
      <Section>
        <Text variant="display">{t('mobile.tabs.profile')}</Text>
        <Account />
      </Section>
      <Section>
        <Text variant="eyebrow">{t('mobile.appearance')}</Text>
        <Segmented
          label={t('nav.theme')}
          value={prefs.appearance}
          onChange={(appearance) => updatePreferences({ appearance })}
          options={[
            { value: 'system', label: t('nav.themeSystem') },
            { value: 'light', label: t('nav.themeLight') },
            { value: 'dark', label: t('nav.themeDark') },
          ]}
        />
        <Segmented
          label={t('nav.language')}
          value={locale}
          onChange={setLocale}
          options={locales.map((code) => ({ value: code, label: localeNames[code] }))}
        />
      </Section>
      <Section>
        <Text variant="eyebrow">{t('mobile.reading')}</Text>
        <Segmented
          label={t('reader.theme')}
          value={prefs.readerTheme}
          onChange={(readerTheme) => updatePreferences({ readerTheme })}
          options={[
            { value: 'paper', label: t('reader.themePaper') },
            { value: 'sepia', label: t('reader.themeSepia') },
            { value: 'night', label: t('reader.themeNight') },
            { value: 'contrast', label: t('reader.themeContrast') },
          ]}
        />
        <View
          style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
        >
          <Text>{t('mobile.haptics')}</Text>
          <Switch
            value={prefs.haptics}
            onValueChange={(haptics) => updatePreferences({ haptics })}
            trackColor={{ true: colors.accent, false: colors.borderStrong }}
          />
        </View>
      </Section>
      <Section>
        <Text variant="eyebrow">{t('mobile.about')}</Text>
        {[
          { label: t('footer.charter'), path: locale === 'fr' ? '/charte' : '/en/charter' },
          { label: t('nav.pricing'), path: locale === 'fr' ? '/tarifs' : '/en/pricing' },
          { label: t('nav.studio'), path: '/studio' },
        ].map((link) => (
          <Pressable
            key={link.path}
            accessibilityRole="link"
            onPress={() => void WebBrowser.openBrowserAsync(`${SITE}${link.path}`)}
          >
            <Text tone="accent">{link.label}</Text>
          </Pressable>
        ))}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <Monogram size={20} />
          <Text variant="caption" tone="subtle">
            {t('mobile.version', { version: APP_VERSION })}
          </Text>
        </View>
      </Section>
    </Screen>
  );
}
