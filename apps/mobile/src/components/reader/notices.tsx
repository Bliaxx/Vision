import type { CompiledStory, EngineEvent } from '@dedale/engine';
import { Award, PackageMinus, PackagePlus } from 'lucide-react-native';
import { View } from 'react-native';
import { useTranslations } from 'use-intl';
import { Text } from '../ui/text';
import type { ReaderStyle } from './reader-style';

/** Conséquences d'un choix (objets, succès), annoncées aux lecteurs d'écran. */
export function EventNotices({
  events,
  story,
  style,
}: {
  events: readonly EngineEvent[];
  story: CompiledStory;
  style: ReaderStyle;
}) {
  const t = useTranslations('reader');
  const notices = events.flatMap((event) => {
    if (event.type === 'item:gained' || event.type === 'item:lost') {
      const item = story.items.get(event.item);
      if (!item || item.hidden) return [];
      const name = event.qty > 1 ? `${event.qty} × ${item.name}` : item.name;
      return event.type === 'item:gained'
        ? [{ key: `g-${event.item}`, Icon: PackagePlus, text: t('itemGained', { item: name }) }]
        : [
            {
              key: `l-${event.item}`,
              Icon: PackageMinus,
              text: t('itemLost', { item: item.name }),
            },
          ];
    }
    if (event.type === 'achievement:unlocked') {
      const achievement = story.achievements.get(event.achievement);
      return achievement
        ? [
            {
              key: `a-${event.achievement}`,
              Icon: Award,
              text: t('achievementUnlocked', { name: achievement.name }),
            },
          ]
        : [];
    }
    return [];
  });
  if (notices.length === 0) return null;
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}
    >
      {notices.map(({ key, Icon, text }) => (
        <View
          key={key}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 12,
            paddingVertical: 6,
            borderRadius: 999,
            borderWidth: 1,
            borderColor: style.palette.rule,
          }}
        >
          <Icon size={14} color={style.palette.accent} />
          <Text variant="caption" style={{ color: style.palette.text }}>
            {text}
          </Text>
        </View>
      ))}
    </View>
  );
}
