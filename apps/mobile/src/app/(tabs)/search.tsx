import { GENRES, type Genre } from '@dedale/contracts';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { useDeferredValue, useState } from 'react';
import { ActivityIndicator, FlatList, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslations } from 'use-intl';
import { StoryRow } from '@/components/story/story-card';
import { Chip } from '@/components/ui/chip';
import { Text } from '@/components/ui/text';
import { orpc } from '@/lib/api';
import { useTheme } from '@/theme/theme';

export default function SearchScreen() {
  const t = useTranslations();
  const { colors, fonts, radii } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [genre, setGenre] = useState<Genre | null>(null);
  // La saisie reste fluide : la requête suit la valeur différée.
  const q = useDeferredValue(text.trim());

  const results = useInfiniteQuery(
    orpc.catalog.list.infiniteOptions({
      input: (cursor: string | undefined) => ({
        limit: 20,
        sort: q ? 'top' : 'trending',
        ...(q ? { q } : {}),
        ...(genre ? { genre } : {}),
        ...(cursor ? { cursor } : {}),
      }),
      initialPageParam: undefined,
      getNextPageParam: (page) => page.nextCursor ?? undefined,
    }),
  );
  const stories = results.data?.pages.flatMap((page) => page.items) ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top + 12 }}>
      <View style={{ paddingHorizontal: 20, gap: 14, paddingBottom: 8 }}>
        <Text variant="display">{t('explore.title')}</Text>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 10,
            paddingHorizontal: 14,
            borderRadius: radii.md,
            borderWidth: 1,
            borderColor: colors.borderStrong,
            backgroundColor: colors.surfaceRaised,
          }}
        >
          <Search size={18} color={colors.textSubtle} />
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t('mobile.searchHint')}
            placeholderTextColor={colors.textSubtle}
            accessibilityLabel={t('nav.search')}
            returnKeyType="search"
            autoCorrect={false}
            clearButtonMode="while-editing"
            style={{
              flex: 1,
              paddingVertical: 12,
              fontFamily: fonts.uiRegular,
              fontSize: 16,
              color: colors.text,
            }}
          />
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingVertical: 8 }}
        style={{ flexGrow: 0 }}
      >
        <Chip
          label={t('explore.allGenres')}
          selected={genre === null}
          onPress={() => setGenre(null)}
        />
        {GENRES.map((option) => (
          <Chip
            key={option}
            label={t(`genres.${option}`)}
            selected={genre === option}
            onPress={() => setGenre(option)}
          />
        ))}
      </ScrollView>
      <FlatList
        data={stories}
        keyExtractor={(story) => story.id}
        renderItem={({ item }) => <StoryRow story={item} />}
        onEndReachedThreshold={0.4}
        onEndReached={() => {
          if (results.hasNextPage && !results.isFetchingNextPage) void results.fetchNextPage();
        }}
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: insets.bottom + 90 }}
        ListHeaderComponent={
          results.isSuccess ? (
            <Text
              variant="caption"
              tone="subtle"
              style={{ paddingHorizontal: 20, paddingBottom: 6 }}
            >
              {t('explore.results', { count: stories.length })}
            </Text>
          ) : null
        }
        ListEmptyComponent={
          results.isPending ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
          ) : (
            <View style={{ padding: 32, gap: 8, alignItems: 'center' }}>
              <Text variant="title" style={{ textAlign: 'center' }}>
                {results.isError ? t('mobile.networkError') : t('explore.empty')}
              </Text>
              {results.isError ? null : (
                <Text tone="muted" style={{ textAlign: 'center' }}>
                  {t('explore.emptyHint')}
                </Text>
              )}
            </View>
          )
        }
        ListFooterComponent={
          results.isFetchingNextPage ? <ActivityIndicator color={colors.accent} /> : null
        }
      />
    </View>
  );
}
