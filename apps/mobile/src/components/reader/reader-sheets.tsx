import type { CompiledStory, GameView, Milestone } from '@dedale/engine';
import { readingSizes } from '@dedale/tokens';
import { History } from 'lucide-react-native';
import { Pressable, Switch, View } from 'react-native';
import { useTranslations } from 'use-intl';
import { updatePreferences, usePreferences } from '@/lib/preferences';
import { useTheme } from '@/theme/theme';
import { Segmented } from '../ui/segmented';
import { Text } from '../ui/text';
import { Sheet } from './sheet';

export function AdventureSheet({
  visible,
  onClose,
  view,
}: {
  visible: boolean;
  onClose: () => void;
  view: GameView;
}) {
  const t = useTranslations('reader');
  const { colors } = useTheme();
  return (
    <Sheet visible={visible} title={t('sheet')} onClose={onClose}>
      <View style={{ gap: 10 }}>
        <Text variant="eyebrow">{t('stats')}</Text>
        {view.stats.map((stat) => (
          <View
            key={stat.id}
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              paddingVertical: 8,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text>{stat.name}</Text>
            <Text variant="bodyStrong">
              {String(stat.value)}
              {stat.max !== null ? ` / ${stat.max}` : ''}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ gap: 10 }}>
        <Text variant="eyebrow">{t('inventory')}</Text>
        {view.inventory.length === 0 ? (
          <Text tone="muted">{t('emptyInventory')}</Text>
        ) : (
          view.inventory.map((item) => (
            <View
              key={item.id}
              style={{
                gap: 2,
                paddingVertical: 8,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <Text variant="bodyStrong">
                {item.qty > 1 ? `${item.qty} × ` : ''}
                {item.name}
              </Text>
              {item.description ? (
                <Text variant="caption" tone="muted">
                  {item.description}
                </Text>
              ) : null}
            </View>
          ))
        )}
      </View>
    </Sheet>
  );
}

export function RewindSheet({
  visible,
  onClose,
  targets,
  story,
  onRewind,
}: {
  visible: boolean;
  onClose: () => void;
  targets: readonly Milestone[];
  story: CompiledStory;
  onRewind: (step: number) => void;
}) {
  const t = useTranslations('reader');
  const { colors } = useTheme();
  const disabled = story.story.settings.rewind === 'none';
  return (
    <Sheet visible={visible} title={t('rewind')} onClose={onClose}>
      <Text tone="muted">{disabled ? t('rewindDisabled') : t('rewindHint')}</Text>
      {disabled
        ? null
        : [...targets].reverse().map((target) => {
            const title = story.passages.get(target.passage)?.title ?? target.passage;
            return (
              <Pressable
                key={target.step}
                accessibilityRole="button"
                onPress={() => {
                  onRewind(target.step);
                  onClose();
                }}
                style={({ pressed }) => ({
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: pressed ? colors.surfaceSunken : colors.surface,
                })}
              >
                <History size={18} color={target.checkpoint ? colors.accent : colors.textMuted} />
                <Text style={{ flex: 1 }}>{t('rewindTo', { title })}</Text>
              </Pressable>
            );
          })}
    </Sheet>
  );
}

export function SettingsSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const t = useTranslations();
  const prefs = usePreferences();
  return (
    <Sheet visible={visible} title={t('reader.settings')} onClose={onClose}>
      <View style={{ gap: 8 }}>
        <Text variant="eyebrow">{t('reader.theme')}</Text>
        <Segmented
          label={t('reader.theme')}
          value={prefs.readerTheme}
          onChange={(readerTheme) => updatePreferences({ readerTheme })}
          options={[
            { value: 'paper', label: t('reader.themePaper') },
            { value: 'sepia', label: t('reader.themeSepia') },
            { value: 'night', label: t('reader.themeNight') },
            { value: 'contrast', label: t('reader.themeContrast') },
          ]}
        />
      </View>
      <View style={{ gap: 8 }}>
        <Text variant="eyebrow">{t('reader.font')}</Text>
        <Segmented
          label={t('reader.font')}
          value={prefs.readerFont}
          onChange={(readerFont) => updatePreferences({ readerFont })}
          options={[
            { value: 'reading', label: t('reader.fontReading') },
            { value: 'accessible', label: 'Atkinson' },
            { value: 'dyslexia', label: 'Lexend' },
          ]}
        />
      </View>
      <View style={{ gap: 8 }}>
        <Text variant="eyebrow">{t('reader.fontSize')}</Text>
        <Segmented
          label={t('reader.fontSize')}
          value={prefs.readerSize}
          onChange={(readerSize) => updatePreferences({ readerSize })}
          options={readingSizes.map((size) => ({ value: size, label: String(size) }))}
        />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text>{t('mobile.haptics')}</Text>
        <Switch value={prefs.haptics} onValueChange={(haptics) => updatePreferences({ haptics })} />
      </View>
    </Sheet>
  );
}
