import { useQuery } from '@tanstack/react-query';
import { Link, router } from 'expo-router';
import { CloudOff, Trash2 } from 'lucide-react-native';
import { Alert, Pressable, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { StoryRow } from '@/components/story/story-card';
import { StoryCover } from '@/components/story/story-cover';
import { Button } from '@/components/ui/button';
import { Screen, Section } from '@/components/ui/screen';
import { Text } from '@/components/ui/text';
import { orpc } from '@/lib/api';
import { removeOffline, useOfflineLibrary } from '@/lib/offline';
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/theme';

function Downloads() {
  const t = useTranslations('mobile');
  const tc = useTranslations('common');
  const { colors, radii } = useTheme();
  const downloads = useOfflineLibrary();
  return (
    <Section>
      <Text variant="title">{t('downloads')}</Text>
      {downloads.length === 0 ? (
        <View
          style={{
            flexDirection: 'row',
            gap: 12,
            padding: 16,
            borderRadius: radii.md,
            backgroundColor: colors.surfaceSunken,
          }}
        >
          <CloudOff size={20} color={colors.textMuted} />
          <Text variant="caption" tone="muted" style={{ flex: 1 }}>
            {t('downloadsEmpty')}
          </Text>
        </View>
      ) : (
        downloads.map((entry) => (
          <View key={entry.slug} style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <Link href={{ pathname: '/read/[slug]', params: { slug: entry.slug } }} asChild>
              <Pressable
                accessibilityRole="button"
                style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 }}
              >
                <StoryCover
                  slug={entry.slug}
                  title={entry.title}
                  coverUrl={entry.coverUrl}
                  width={48}
                  showTitle={false}
                />
                <View style={{ flex: 1 }}>
                  <Text variant="bodyStrong" numberOfLines={1}>
                    {entry.title}
                  </Text>
                  <Text variant="caption" tone="muted" numberOfLines={1}>
                    {entry.author} · v{entry.version}
                  </Text>
                </View>
              </Pressable>
            </Link>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t('removeDownload')} : ${entry.title}`}
              hitSlop={10}
              onPress={() =>
                Alert.alert(entry.title, t('removeDownload'), [
                  { text: tc('cancel'), style: 'cancel' },
                  {
                    text: t('removeDownload'),
                    style: 'destructive',
                    onPress: () => removeOffline(entry.slug),
                  },
                ])
              }
            >
              <Trash2 size={20} color={colors.textSubtle} />
            </Pressable>
          </View>
        ))
      )}
    </Section>
  );
}

export default function LibraryScreen() {
  const t = useTranslations();
  const { user } = useSession();
  const library = useQuery({ ...orpc.reading.library.queryOptions(), enabled: user !== null });

  return (
    <Screen
      refreshing={library.isRefetching}
      onRefresh={user ? () => void library.refetch() : undefined}
    >
      <Section>
        <Text variant="display">{t('library.title')}</Text>
      </Section>
      <Downloads />
      {user === null ? (
        <Section>
          <Text tone="muted">{t('library.signInRequired')}</Text>
          <Button label={t('nav.signIn')} onPress={() => router.push('/sign-in')} />
        </Section>
      ) : (
        [
          {
            key: 'inProgress',
            title: t('library.inProgress'),
            entries: library.data?.inProgress ?? [],
          },
          { key: 'finished', title: t('library.finished'), entries: library.data?.finished ?? [] },
        ].map(({ key, title, entries }) =>
          entries.length > 0 ? (
            <View key={key} style={{ gap: 4 }}>
              <Text variant="title" style={{ paddingHorizontal: 20 }}>
                {title}
              </Text>
              {entries.map((entry) => (
                <StoryRow
                  key={entry.story.id}
                  story={entry.story}
                  subtitle={
                    key === 'inProgress'
                      ? t('library.resumeAt', { title: entry.passageTitle })
                      : t('library.finishedAt', { title: entry.passageTitle })
                  }
                />
              ))}
            </View>
          ) : null,
        )
      )}
    </Screen>
  );
}
