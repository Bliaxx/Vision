import { useMutation, useQuery } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { BookOpen, Check, Download, Lock, Star } from 'lucide-react-native';
import { View } from 'react-native';
import { useTranslations } from 'use-intl';
import { StoryCover } from '@/components/story/story-cover';
import { Button } from '@/components/ui/button';
import { Screen, Section } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';
import { orpc } from '@/lib/api';
import { downloadStory, removeOffline, useIsOffline } from '@/lib/offline';
import { useTheme } from '@/theme/theme';

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flex: 1, minWidth: '40%', gap: 2 }}>
      <Text variant="eyebrow" tone="subtle">
        {label}
      </Text>
      <Text variant="bodyStrong">{value}</Text>
    </View>
  );
}

export default function StoryScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const t = useTranslations();
  const { colors, radii } = useTheme();
  const story = useQuery(orpc.catalog.story.queryOptions({ input: { slug } }));
  const offline = useIsOffline(slug);
  const download = useMutation({ mutationFn: () => downloadStory(slug) });

  if (story.isPending) {
    return (
      <Screen>
        <Section>
          <Skeleton width={180} height={270} />
          <Skeleton width="80%" height={30} />
          <Skeleton width="60%" height={18} />
        </Section>
      </Screen>
    );
  }
  if (story.isError) {
    return (
      <Screen>
        <Section>
          <Text tone="muted">{t('mobile.networkError')}</Text>
        </Section>
      </Screen>
    );
  }

  const data = story.data;
  const canRead = data.entitlement.canRead;
  return (
    <Screen edges={['top', 'bottom']}>
      <Section gap={16}>
        <View style={{ alignItems: 'center', marginTop: 32 }}>
          <StoryCover
            slug={data.slug}
            title={data.title}
            genre={data.genres[0]}
            coverUrl={data.coverUrl}
            width={180}
          />
        </View>
        <View style={{ gap: 6 }}>
          <Text variant="eyebrow">
            {data.genres.map((genre) => t(`genres.${genre}`)).join(' · ')}
          </Text>
          <Text variant="hero" style={{ fontSize: 34, lineHeight: 38 }}>
            {data.title}
          </Text>
          <Text tone="muted">{t('common.by', { author: data.author.displayName })}</Text>
          {data.tagline ? (
            <Text
              variant="title"
              tone="muted"
              style={{ fontSize: 18, lineHeight: 24, marginTop: 6 }}
            >
              {data.tagline}
            </Text>
          ) : null}
        </View>
        {data.stats.rating !== null ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Star size={16} color={colors.brass} fill={colors.brass} />
            <Text variant="bodyStrong">{data.stats.rating.toFixed(1)}</Text>
            <Text tone="subtle">· {t('common.ratings', { count: data.stats.ratingCount })}</Text>
          </View>
        ) : null}

        {canRead ? (
          <View style={{ gap: 10 }}>
            <Button
              size="lg"
              icon={BookOpen}
              label={
                data.viewer?.progress?.status === 'playing'
                  ? t('story.continueReading')
                  : t('story.startReading')
              }
              onPress={() => router.push({ pathname: '/read/[slug]', params: { slug: data.slug } })}
            />
            <Button
              variant="secondary"
              icon={offline ? Check : Download}
              loading={download.isPending}
              label={offline ? t('mobile.removeDownload') : t('mobile.download')}
              accessibilityHint={offline ? t('mobile.downloaded') : undefined}
              onPress={() => (offline ? removeOffline(data.slug) : download.mutate())}
            />
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              padding: 16,
              borderRadius: radii.md,
              backgroundColor: colors.brassSoft,
            }}
          >
            <Lock size={20} color={colors.brass} />
            <Text style={{ flex: 1 }}>
              {data.entitlement.reason === 'locked_paid'
                ? t('story.lockedPaid')
                : t('story.lockedPremium')}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, paddingVertical: 8 }}>
          <Fact
            label={t('story.duration')}
            value={t('common.minutes', { count: data.stats.minutes })}
          />
          <Fact label={t('story.difficulty')} value={t(`difficulty.${data.stats.difficulty}`)} />
          <Fact label={t('story.endings')} value={String(data.stats.endings)} />
          <Fact label={t('story.age')} value={t(`ageRatings.${data.ageRating}`)} />
        </View>

        <View style={{ gap: 8 }}>
          <Text variant="title">{t('story.synopsis')}</Text>
          <Text style={{ fontFamily: 'Literata_400Regular', fontSize: 17, lineHeight: 27 }}>
            {data.synopsis}
          </Text>
        </View>

        {data.contentWarnings.length > 0 ? (
          <View style={{ gap: 6 }}>
            <Text variant="eyebrow" tone="subtle">
              {t('story.contentWarnings')}
            </Text>
            <Text tone="muted">
              {data.contentWarnings.map((warning) => t(`contentWarnings.${warning}`)).join(' · ')}
            </Text>
          </View>
        ) : null}
        {data.aiUsage !== 'none' ? (
          <Text variant="caption" tone="subtle">
            {t(`aiUsage.${data.aiUsage}`)}
          </Text>
        ) : null}
      </Section>
    </Screen>
  );
}
