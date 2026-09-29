import type { ChoiceView } from '@dedale/engine';
import { Dices, Lock } from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { Text } from '../ui/text';
import { InlineText } from './passage-text';
import type { ReaderStyle } from './reader-style';

/** Choix : grandes cibles tactiles, verrous annoncés avec leur indice. */
export function ChoiceList({
  choices,
  onChoose,
  style,
}: {
  choices: readonly ChoiceView[];
  onChoose: (id: string) => void;
  style: ReaderStyle;
}) {
  const t = useTranslations('reader');
  const { palette } = style;
  return (
    <View style={{ gap: 10 }}>
      <Text variant="eyebrow" style={{ color: palette.muted }}>
        {t('choose')}
      </Text>
      {choices.map((choice, index) => (
        <Pressable
          key={choice.id}
          accessibilityRole="button"
          accessibilityState={{ disabled: !choice.available }}
          accessibilityLabel={choice.available ? choice.text : `${t('locked')} : ${choice.text}`}
          accessibilityHint={choice.hint ?? undefined}
          disabled={!choice.available}
          onPress={() => onChoose(choice.id)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            gap: 12,
            alignItems: 'flex-start',
            padding: 14,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: pressed ? palette.accent : palette.rule,
            backgroundColor: pressed ? `${palette.accent}14` : 'transparent',
            opacity: choice.available ? 1 : 0.55,
          })}
        >
          <View
            style={{
              width: 24,
              height: 24,
              marginTop: 1,
              borderRadius: 12,
              borderWidth: 1.5,
              borderColor: palette.accent,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {choice.available ? (
              <Text variant="caption" style={{ color: palette.accent, fontSize: 12 }}>
                {index + 1}
              </Text>
            ) : (
              <Lock size={12} color={palette.accent} />
            )}
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <InlineText inlines={choice.inlines} style={style} color={palette.text} />
            {choice.test ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Dices size={14} color={palette.muted} />
                <Text variant="caption" style={{ color: palette.muted }}>
                  {choice.test.label ?? t('dice')} · {choice.test.dice}
                </Text>
              </View>
            ) : null}
            {!choice.available && choice.hint ? (
              <Text variant="caption" style={{ color: palette.muted, fontStyle: 'italic' }}>
                {choice.hint}
              </Text>
            ) : null}
          </View>
        </Pressable>
      ))}
    </View>
  );
}
