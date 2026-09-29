import { apiErrorCode } from '@dedale/api-client';
import type { ReadingPackage } from '@dedale/contracts';
import { useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { ReaderScreen } from '@/components/reader/reader-screen';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { api } from '@/lib/api';
import { readOffline, saveOffline } from '@/lib/offline';
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/theme';

/**
 * Ouvre un livre : depuis le réseau si possible (sauvegardes du compte à jour),
 * sinon depuis la copie hors ligne. Une copie existante est rafraîchie au passage.
 */
async function openStory(slug: string): Promise<ReadingPackage> {
  const local = readOffline(slug);
  try {
    const pkg = await api.reading.open({ slug });
    if (local) saveOffline(pkg);
    return pkg;
  } catch (error) {
    if (local && apiErrorCode(error) === null) return local;
    throw error;
  }
}

export default function ReadScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const t = useTranslations();
  const { colors } = useTheme();
  const { user } = useSession();
  const pkg = useQuery({
    queryKey: ['reading-package', slug],
    queryFn: () => openStory(slug),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: 0,
  });
  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (pkg.isPending) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (pkg.isError) {
    const locked = apiErrorCode(pkg.error) === 'PAYMENT_REQUIRED';
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          backgroundColor: colors.background,
        }}
      >
        <Text variant="display">
          {locked ? t('story.lockedPremium') : t('errors.genericTitle')}
        </Text>
        <Text tone="muted">{locked ? t('story.lockedPremiumCta') : t('mobile.networkError')}</Text>
        <Button label={t('common.back')} variant="secondary" onPress={close} />
      </View>
    );
  }
  return <ReaderScreen pkg={pkg.data} signedIn={user !== null} onClose={close} />;
}
