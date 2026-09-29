import type { StoryCard as StoryCardData } from '@dedale/contracts';
import { Link } from 'expo-router';
import { Star } from 'lucide-react-native';
import { FlatList, Pressable, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { useTheme } from '@/theme/theme';
import { Text } from '../ui/text';
import { StoryCover } from './story-cover';

const CARD_WIDTH = 138;

/** Carte verticale (rails de la page d'accueil). */
export function StoryCard({ story }: { story: StoryCardData }) {
  const t = useTranslations('common');
  const { colors } = useTheme();
  return (
    <Link href={{ pathname: '/story/[slug]', params: { slug: story.slug } }} asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${story.title}, ${t('by', { author: story.author.displayName })}`}
        style={({ pressed }) => ({ width: CARD_WIDTH, gap: 8, opacity: pressed ? 0.8 : 1 })}
      >
        <StoryCover
          slug={story.slug}
          title={story.title}
          genre={story.genres[0]}
          coverUrl={story.coverUrl}
          width={CARD_WIDTH}
        />
        <View style={{ gap: 2 }}>
          <Text variant="bodyStrong" numberOfLines={2} style={{ fontSize: 14, lineHeight: 18 }}>
            {story.title}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {story.author.displayName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            {story.stats.rating !== null ? (
              <>
                <Star size={12} color={colors.brass} fill={colors.brass} />
                <Text variant="caption" tone="muted">
                  {story.stats.rating.toFixed(1)}
                </Text>
                <Text variant="caption" tone="subtle">
                  ·
                </Text>
              </>
            ) : null}
            <Text variant="caption" tone="subtle">
              {t('minutes', { count: story.stats.minutes })}
            </Text>
          </View>
        </View>
      </Pressable>
    </Link>
  );
}

/** Rangée horizontale de cartes. */
export function StoryRail({
  title,
  stories,
}: {
  title: string;
  stories: readonly StoryCardData[];
}) {
  if (stories.length === 0) return null;
  return (
    <View style={{ gap: 12 }}>
      <Text variant="title" style={{ paddingHorizontal: 20 }}>
        {title}
      </Text>
      <FlatList
        horizontal
        data={stories}
        keyExtractor={(story) => story.id}
        renderItem={({ item }) => <StoryCard story={item} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
      />
    </View>
  );
}

/** Ligne de liste (recherche, bibliothèque). */
export function StoryRow({ story, subtitle }: { story: StoryCardData; subtitle?: string }) {
  const t = useTranslations();
  const { colors } = useTheme();
  return (
    <Link href={{ pathname: '/story/[slug]', params: { slug: story.slug } }} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => ({
          flexDirection: 'row',
          gap: 14,
          paddingHorizontal: 20,
          paddingVertical: 10,
          backgroundColor: pressed ? colors.surfaceSunken : 'transparent',
        })}
      >
        <StoryCover
          slug={story.slug}
          title={story.title}
          genre={story.genres[0]}
          coverUrl={story.coverUrl}
          width={64}
          showTitle={false}
        />
        <View style={{ flex: 1, gap: 3, justifyContent: 'center' }}>
          <Text variant="title" numberOfLines={2} style={{ fontSize: 17, lineHeight: 21 }}>
            {story.title}
          </Text>
          <Text variant="caption" tone="muted" numberOfLines={1}>
            {subtitle ?? t('common.by', { author: story.author.displayName })}
          </Text>
          <Text variant="caption" tone="subtle" numberOfLines={1}>
            {[
              t(`genres.${story.genres[0] ?? 'adventure'}`),
              t('common.minutes', { count: story.stats.minutes }),
              t('common.endings', { count: story.stats.endings }),
            ].join(' · ')}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}
