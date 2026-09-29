import { useQuery } from '@tanstack/react-query';
import { Link } from 'expo-router';
import { ChevronRight } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { Monogram } from '@/components/brand/monogram';
import { StoryRail } from '@/components/story/story-card';
import { StoryCover } from '@/components/story/story-cover';
import { OfflineBanner } from '@/components/ui/offline-banner';
import { Screen, Section } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { orpc } from '@/lib/api';
import { useSession } from '@/lib/session';
import { useTheme } from '@/theme/theme';

function ContinueReading() {
  const t = useTranslations();
  const { colors, radii } = useTheme();
  const { user } = useSession();
  const library = useQuery({ ...orpc.reading.library.queryOptions(), enabled: user !== null });
  const entry = library.data?.inProgress[0];
  if (!entry) return null;
  return (
    <Section>
      <Link href={{ pathname: '/read/[slug]', params: { slug: entry.story.slug } }} asChild>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: 'row',
            gap: 14,
            padding: 14,
            borderRadius: radii.lg,
            backgroundColor: colors.surfaceRaised,
            borderWidth: 1,
            borderColor: colors.border,
            opacity: pressed ? 0.85 : 1,
          })}
        >
          <StoryCover
            slug={entry.story.slug}
            title={entry.story.title}
            genre={entry.story.genres[0]}
            coverUrl={entry.story.coverUrl}
            width={56}
            showTitle={false}
          />
          <View style={{ flex: 1, justifyContent: 'center', gap: 2 }}>
            <Text variant="eyebrow">{t('mobile.continueReading')}</Text>
            <Text variant="title" numberOfLines={1}>
              {entry.story.title}
            </Text>
            <Text variant="caption" tone="muted" numberOfLines={1}>
              {t('library.resumeAt', { title: entry.passageTitle })}
            </Text>
          </View>
          <ChevronRight size={20} color={colors.textSubtle} style={{ alignSelf: 'center' }} />
        </Pressable>
      </Link>
    </Section>
  );
}

export default function DiscoverScreen() {
  const t = useTranslations();
  const home = useQuery(orpc.catalog.home.queryOptions());

  return (
    <Screen refreshing={home.isRefetching} onRefresh={() => void home.refetch()}>
      <Section gap={6}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Monogram size={30} />
          <Text variant="title" style={{ fontSize: 24 }}>
            {t('common.appName')}
          </Text>
        </View>
        <Text variant="hero" style={{ marginTop: 12 }}>
          {t('mobile.greeting')}
        </Text>
        <Text tone="muted">{t('common.tagline')}</Text>
      </Section>
      <OfflineBanner />
      <ContinueReading />
      {home.isPending ? (
        <Section>
          <Skeleton width="50%" height={22} />
          <View style={{ flexDirection: 'row', gap: 14 }}>
            <Skeleton width={138} height={207} />
            <Skeleton width={138} height={207} />
            <Skeleton width={138} height={207} />
          </View>
        </Section>
      ) : home.isError ? (
        <Section>
          <Text tone="muted">{t('mobile.networkError')}</Text>
        </Section>
      ) : (
        home.data.rails.map((rail) => (
          <StoryRail key={rail.key} title={t(`rails.${rail.key}`)} stories={rail.stories} />
        ))
      )}
    </Screen>
  );
}
