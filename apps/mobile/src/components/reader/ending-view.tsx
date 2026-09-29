import type { Ending } from '@dedale/engine';
import { endingColors } from '@dedale/tokens';
import { CircleDot, Flag, Skull, Sparkles, Trophy } from 'lucide-react-native';
import { View } from 'react-native';
import { useTranslations } from 'use-intl';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import type { ReaderStyle } from './reader-style';

const ICONS = {
  victory: Trophy,
  defeat: Flag,
  death: Skull,
  neutral: CircleDot,
  secret: Sparkles,
} as const;

export function EndingView({
  ending,
  found,
  total,
  onRestart,
  onClose,
  style,
}: {
  ending: Ending;
  found: number;
  total: number;
  onRestart: () => void;
  onClose: () => void;
  style: ReaderStyle;
}) {
  const t = useTranslations();
  const Icon = ICONS[ending.kind];
  const color = endingColors[ending.kind];
  return (
    <View style={{ alignItems: 'center', gap: 14, paddingVertical: 12 }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 32,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: `${color}22`,
        }}
      >
        <Icon size={30} color={color} />
      </View>
      <Text variant="eyebrow" style={{ color }}>
        {t('reader.endingKind', { kind: t(`endings.${ending.kind}`) })}
      </Text>
      <Text variant="display" style={{ color: style.palette.text, textAlign: 'center' }}>
        {ending.title}
      </Text>
      {total > 0 ? (
        <Text variant="caption" style={{ color: style.palette.muted }}>
          {t('reader.endingsFound', { found, total })}
        </Text>
      ) : null}
      <View style={{ alignSelf: 'stretch', gap: 10, marginTop: 8 }}>
        <Button label={t('reader.restart')} onPress={onRestart} size="lg" />
        <Button label={t('reader.backToStory')} variant="secondary" onPress={onClose} />
      </View>
    </View>
  );
}
