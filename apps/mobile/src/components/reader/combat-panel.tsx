import type { EncounterView, EngineEvent } from '@dedale/engine';
import { Shield, Swords } from 'lucide-react-native';
import { View } from 'react-native';
import { useTranslations } from 'use-intl';
import { Button } from '../ui/button';
import { Text } from '../ui/text';
import type { ReaderStyle } from './reader-style';

type Round = Extract<EngineEvent, { type: 'combat:round' }>;

function Meter({
  label,
  value,
  max,
  color,
  rule,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
  rule: string;
}) {
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max, now: value }}
      style={{ height: 6, borderRadius: 3, backgroundColor: rule, overflow: 'hidden' }}
    >
      <View
        style={{
          width: `${Math.max(0, Math.min(1, value / Math.max(1, max))) * 100}%`,
          height: '100%',
          backgroundColor: color,
        }}
      />
    </View>
  );
}

/** Combat à la Fighting Fantasy : assauts successifs, fuite possible. */
export function CombatPanel({
  encounter,
  lastRound,
  onAttack,
  onFlee,
  style,
  heroMax,
}: {
  encounter: EncounterView;
  lastRound: Round | null;
  onAttack: () => void;
  onFlee: () => void;
  style: ReaderStyle;
  heroMax: number;
}) {
  const t = useTranslations('reader');
  const { palette } = style;
  const fighters = [
    {
      key: 'hero',
      name: t('you'),
      skill: encounter.hero.skill,
      stamina: encounter.hero.stamina,
      max: heroMax,
      defeated: false,
      active: true,
    },
    ...encounter.enemies.map((enemy) => ({
      key: enemy.id,
      name: enemy.name,
      skill: enemy.skill,
      stamina: enemy.stamina,
      max: Math.max(enemy.stamina, 1),
      defeated: enemy.defeated,
      active: enemy.active,
    })),
  ];
  const summary = lastRound
    ? { hero: t('heroWins'), enemy: t('enemyWins'), tie: t('tie') }[lastRound.winner]
    : null;
  return (
    <View
      style={{ gap: 14, padding: 16, borderRadius: 14, borderWidth: 1, borderColor: palette.rule }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text variant="eyebrow" style={{ color: palette.accent }}>
          {t('combat')}
        </Text>
        <Text variant="caption" style={{ color: palette.muted }}>
          {t('round', { round: encounter.round })}
        </Text>
      </View>
      {fighters.map((fighter) => (
        <View key={fighter.key} style={{ gap: 6, opacity: fighter.defeated ? 0.45 : 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text variant="bodyStrong" style={{ color: palette.text }}>
              {fighter.name}
              {fighter.defeated ? ` — ${t('defeated')}` : ''}
            </Text>
            <Text variant="caption" style={{ color: palette.muted }}>
              ⚔ {fighter.skill} · ♥ {fighter.stamina}
            </Text>
          </View>
          <Meter
            label={fighter.name}
            value={fighter.stamina}
            max={fighter.max}
            color={palette.accent}
            rule={palette.rule}
          />
        </View>
      ))}
      {summary ? (
        <Text variant="caption" accessibilityLiveRegion="polite" style={{ color: palette.text }}>
          {summary} ({lastRound?.heroAttack} / {lastRound?.enemyAttack})
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button label={t('attack')} icon={Swords} onPress={onAttack} style={{ flex: 1 }} />
        {encounter.canFlee ? (
          <Button
            label={t('flee')}
            icon={Shield}
            variant="secondary"
            onPress={onFlee}
            style={{ flex: 1 }}
          />
        ) : null}
      </View>
    </View>
  );
}
