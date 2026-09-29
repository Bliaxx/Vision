import type { ReadingPackage } from '@dedale/contracts';
import type { EngineEvent } from '@dedale/engine';
import {
  chooseInitialSave,
  type GameUpdate,
  useGame,
  useReadingTracker,
  useSaveSync,
} from '@dedale/play';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';
import { StatusBar } from 'expo-status-bar';
import { History, ScrollText, Settings2, Volume2, VolumeX, X } from 'lucide-react-native';
import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  findNodeHandle,
  Text as NativeText,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocale, useTranslations } from 'use-intl';
import { api } from '@/lib/api';
import { usePreferences } from '@/lib/preferences';
import { readLocalSave, writeLocalSave } from '@/lib/saves';
import { Text } from '../ui/text';
import { ChoiceList } from './choice-list';
import { CombatPanel } from './combat-panel';
import { DiceResult } from './dice-result';
import { EndingView } from './ending-view';
import { EventNotices } from './notices';
import { PassageText } from './passage-text';
import { AdventureSheet, RewindSheet, SettingsSheet } from './reader-sheets';
import { useReaderStyle } from './reader-style';

type Panel = 'sheet' | 'rewind' | 'settings' | null;

function lastOf<T extends EngineEvent['type']>(events: readonly EngineEvent[], type: T) {
  return (
    [...events]
      .reverse()
      .find((event): event is Extract<EngineEvent, { type: T }> => event.type === type) ?? null
  );
}

function HeaderButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: ReactNode;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={{ padding: 8 }}
    >
      {children}
    </Pressable>
  );
}

/**
 * Liseuse mobile : le moteur s'exécute sur l'appareil (lecture hors ligne),
 * la partie est sauvegardée localement à chaque choix puis synchronisée.
 */
export function ReaderScreen({
  pkg,
  signedIn,
  onClose,
}: {
  pkg: ReadingPackage;
  signedIn: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('reader');
  const locale = useLocale();
  const insets = useSafeAreaInsets();
  const style = useReaderStyle();
  const { palette } = style;
  const { haptics, readerTheme } = usePreferences();
  const [panel, setPanel] = useState<Panel>(null);
  const [speaking, setSpeaking] = useState(false);
  const [discovered, setDiscovered] = useState(() => new Set(pkg.discoveredEndings));
  const scrollRef = useRef<ScrollView>(null);
  const titleRef = useRef<NativeText>(null);

  const [initialSave] = useState(() =>
    chooseInitialSave(pkg.version.id, pkg.saves, readLocalSave(pkg.storyId)),
  );
  const saveSync = useSaveSync({
    enabled: true,
    versionId: pkg.version.id,
    persistLocal: (save) => writeLocalSave(pkg.storyId, save),
    pushRemote: signedIn
      ? (data) =>
          api.reading.saveProgress({
            storyId: pkg.storyId,
            versionId: pkg.version.id,
            slot: 'auto',
            data,
          })
      : undefined,
  });
  const track = useReadingTracker({
    enabled: true,
    send: (events) =>
      api.reading.track({ storyId: pkg.storyId, versionId: pkg.version.id, events }),
  });

  const onUpdate = (update: GameUpdate) => {
    const passage = pkg.document.passages.find(
      (candidate) => candidate.id === update.session.state.passage,
    );
    saveSync(update.session, passage?.title ?? '');
    if (update.reason !== 'rewind') track(update.events, update.reason === 'start');
    const ending = lastOf(update.events, 'ending:reached');
    if (ending) setDiscovered((current) => new Set(current).add(ending.passage));
    if (!haptics) return;
    const dice = lastOf(update.events, 'dice:rolled');
    if (ending) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    else if (dice)
      void Haptics.notificationAsync(
        dice.success
          ? Haptics.NotificationFeedbackType.Success
          : Haptics.NotificationFeedbackType.Warning,
      );
    else void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const game = useGame(pkg.document, { locale, initialSave, onUpdate });
  const { view, events, compiled } = game;

  // Première ouverture : compter le démarrage une fois.
  const started = useRef(false);
  useEffect(() => {
    if (started.current || initialSave) return;
    started.current = true;
    track([], true);
  }, [initialSave, track]);

  // Nouveau passage : retour en haut, lecture vocale coupée, focus d'accessibilité sur le titre.
  const step = game.session.state.step;
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: step > 0 });
    Speech.stop();
    setSpeaking(false);
    const node = titleRef.current ? findNodeHandle(titleRef.current) : null;
    if (node && step > 0) AccessibilityInfo.setAccessibilityFocus(node);
  }, [step]);
  useEffect(() => () => void Speech.stop(), []);

  const toggleSpeech = () => {
    if (speaking) {
      void Speech.stop();
      setSpeaking(false);
      return;
    }
    setSpeaking(true);
    Speech.speak(`${view.passage.title}. ${view.passage.plainText}`, {
      language: pkg.document.language,
      onDone: () => setSpeaking(false),
      onStopped: () => setSpeaking(false),
    });
  };

  const dice = lastOf(events, 'dice:rolled');
  const feedback = lastOf(events, 'test:resolved');
  const round = lastOf(events, 'combat:round');
  const encounterDef = compiled.passages.get(view.passage.id)?.encounter;
  const heroVariable = encounterDef ? compiled.variables.get(encounterDef.staminaVar) : undefined;
  const heroMax =
    typeof heroVariable?.max === 'number' ? heroVariable.max : Number(heroVariable?.initial ?? 1);
  const totalEndings = pkg.document.passages.filter((passage) => passage.ending).length;
  const icon = palette.muted;

  return (
    <View style={{ flex: 1, backgroundColor: palette.background }}>
      <StatusBar style={readerTheme === 'night' || readerTheme === 'contrast' ? 'light' : 'dark'} />
      <View
        style={{
          paddingTop: insets.top + 4,
          paddingHorizontal: 8,
          flexDirection: 'row',
          alignItems: 'center',
          borderBottomWidth: 1,
          borderBottomColor: palette.rule,
        }}
      >
        <HeaderButton label={t('exit')} onPress={onClose}>
          <X size={22} color={icon} />
        </HeaderButton>
        <NativeText
          numberOfLines={1}
          style={{ flex: 1, fontFamily: style.font.bold, fontSize: 15, color: palette.text }}
        >
          {pkg.title}
        </NativeText>
        <HeaderButton label={speaking ? t('stopReading') : t('readAloud')} onPress={toggleSpeech}>
          {speaking ? (
            <VolumeX size={21} color={palette.accent} />
          ) : (
            <Volume2 size={21} color={icon} />
          )}
        </HeaderButton>
        <HeaderButton label={t('sheet')} onPress={() => setPanel('sheet')}>
          <ScrollText size={21} color={icon} />
        </HeaderButton>
        <HeaderButton label={t('rewind')} onPress={() => setPanel('rewind')}>
          <History size={21} color={icon} />
        </HeaderButton>
        <HeaderButton label={t('settings')} onPress={() => setPanel('settings')}>
          <Settings2 size={21} color={icon} />
        </HeaderButton>
      </View>

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32 }}
      >
        <Animated.View
          key={step}
          entering={FadeIn.duration(260)}
          style={{ gap: 20, padding: 22, borderRadius: 18, backgroundColor: palette.page }}
        >
          <NativeText
            ref={titleRef}
            accessibilityRole="header"
            style={{
              fontFamily: 'Manrope_700Bold',
              fontSize: 11,
              letterSpacing: 1.6,
              textTransform: 'uppercase',
              color: palette.accent,
            }}
          >
            {view.passage.title}
          </NativeText>
          {dice ? (
            <DiceResult event={dice} feedback={feedback?.text ?? null} style={style} />
          ) : null}
          <PassageText blocks={view.passage.blocks} style={style} />
          <EventNotices events={events} story={compiled} style={style} />
          <View style={{ height: 1, backgroundColor: palette.rule }} />
          {view.passage.ending ? (
            <EndingView
              ending={view.passage.ending}
              found={discovered.size}
              total={totalEndings}
              onRestart={game.restart}
              onClose={onClose}
              style={style}
            />
          ) : view.encounter ? (
            <CombatPanel
              encounter={view.encounter}
              lastRound={round}
              heroMax={heroMax}
              onAttack={() => game.perform({ type: 'attack' })}
              onFlee={() => game.perform({ type: 'flee' })}
              style={style}
            />
          ) : view.stuck ? (
            <Text style={{ color: palette.muted }}>{t('stuck')}</Text>
          ) : (
            <ChoiceList
              choices={view.choices}
              onChoose={(choice) => game.perform({ type: 'choose', choice })}
              style={style}
            />
          )}
        </Animated.View>
      </ScrollView>

      <AdventureSheet visible={panel === 'sheet'} onClose={() => setPanel(null)} view={view} />
      <RewindSheet
        visible={panel === 'rewind'}
        onClose={() => setPanel(null)}
        targets={game.targets}
        story={compiled}
        onRewind={game.rewindTo}
      />
      <SettingsSheet visible={panel === 'settings'} onClose={() => setPanel(null)} />
    </View>
  );
}
