import type { EngineEvent } from '@dedale/engine';
import { endingColors } from '@dedale/tokens';
import { View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { useTranslations } from 'use-intl';
import { Text } from '../ui/text';
import type { ReaderStyle } from './reader-style';

type DiceEvent = Extract<EngineEvent, { type: 'dice:rolled' }>;

const PIPS: Record<number, [number, number][]> = {
  1: [[50, 50]],
  2: [
    [28, 28],
    [72, 72],
  ],
  3: [
    [25, 25],
    [50, 50],
    [75, 75],
  ],
  4: [
    [28, 28],
    [72, 28],
    [28, 72],
    [72, 72],
  ],
  5: [
    [26, 26],
    [74, 26],
    [50, 50],
    [26, 74],
    [74, 74],
  ],
  6: [
    [28, 24],
    [72, 24],
    [28, 50],
    [72, 50],
    [28, 76],
    [72, 76],
  ],
};
const COMPARE = { lte: '≤', lt: '<', gte: '≥', gt: '>', eq: '=' } as const;

function Die({ value, color, ink }: { value: number; color: string; ink: string }) {
  const pips = PIPS[value];
  return (
    <Svg width={36} height={36} viewBox="0 0 100 100">
      <Rect x={4} y={4} width={92} height={92} rx={20} fill={color} />
      {pips ? (
        pips.map(([cx, cy]) => <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={9} fill={ink} />)
      ) : (
        <Circle cx={50} cy={50} r={0} />
      )}
    </Svg>
  );
}

/** Résultat d'une épreuve : dés, total, cible et verdict. */
export function DiceResult({
  event,
  feedback,
  style,
}: {
  event: DiceEvent;
  feedback: string | null;
  style: ReaderStyle;
}) {
  const t = useTranslations('reader');
  const { palette } = style;
  const verdict = event.success ? t('success') : t('failure');
  return (
    <View
      accessible
      accessibilityLabel={`${event.label ?? t('dice')} : ${event.rolls.join(', ')} = ${event.total}. ${verdict}.`}
      style={{ gap: 10, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: palette.rule }}
    >
      <Text variant="eyebrow" style={{ color: palette.muted }}>
        {event.label ?? t('dice')} · {event.dice}
      </Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
        {event.rolls.map((roll, index) => (
          <Die key={`${index}-${roll}`} value={roll} color={palette.text} ink={palette.page} />
        ))}
        <Text variant="title" style={{ color: palette.text }}>
          = {event.total}
        </Text>
        <Text variant="caption" style={{ color: palette.muted }}>
          {t('diceTarget', { compare: COMPARE[event.compare], target: event.target })}
        </Text>
      </View>
      <Text
        variant="bodyStrong"
        style={{ color: event.success ? endingColors.victory : palette.accent }}
      >
        {verdict}
        {feedback ? ` — ${feedback}` : ''}
      </Text>
    </View>
  );
}
