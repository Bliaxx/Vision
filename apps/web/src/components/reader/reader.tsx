'use client';

import type { ReadingPackage } from '@dedale/contracts';
import type { EngineEvent, Story } from '@dedale/engine';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  Flag,
  Map as MapIcon,
  ScrollText,
  Settings2,
  Undo2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useEffectEvent, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api/browser';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';
import { Dialog, DialogContent } from '../ui/dialog';
import { Textarea } from '../ui/field';
import { Tooltip } from '../ui/tooltip';
import { AdventureSheet } from './adventure-sheet';
import { ChoiceList } from './choice-list';
import { CombatPanel } from './combat-panel';
import { DiceResult } from './dice';
import { EndingScreen } from './ending-screen';
import { EventNotices } from './event-notices';
import { PassageText } from './passage-text';
import { PathMap } from './path-map';
import { pickInitialSave, useReadingTracker, useSaveSync } from './persistence';
import { ReaderSettings, readerStyle, useReaderPreferences } from './reader-settings';
import { type GameUpdate, useGame } from './use-game';

type Panel = 'sheet' | 'map' | 'rewind' | 'settings' | 'feedback' | null;

export interface ReaderProps {
  pkg: ReadingPackage;
  signedIn: boolean;
  /** Mode test du studio : pas de statistiques ni de sauvegarde. */
  playtest?: boolean;
  exitHref?: string;
  onExit?: () => void;
}

function lastOf<T extends EngineEvent['type']>(events: readonly EngineEvent[], type: T) {
  return (
    [...events]
      .reverse()
      .find((event): event is Extract<EngineEvent, { type: T }> => event.type === type) ?? null
  );
}

function IconButton({
  label,
  onClick,
  children,
  active,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  active?: boolean;
}) {
  return (
    <Tooltip content={label} side="bottom">
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
        className={cn(
          'inline-flex size-10 cursor-pointer items-center justify-center rounded-md text-[var(--dd-reader-muted)] transition-colors hover:bg-[var(--dd-reader-rule)] hover:text-[var(--dd-reader-text)] [&_svg]:size-5',
          active && 'text-[var(--dd-reader-accent)]',
        )}
      >
        {children}
      </button>
    </Tooltip>
  );
}

/**
 * La liseuse : immersive, accessible, jouable au clavier, hors ligne après
 * chargement. Le moteur tourne dans le navigateur ; le serveur ne fait que
 * stocker (et vérifier) les parties.
 */
export function Reader({ pkg, signedIn, playtest = false, onExit }: ReaderProps) {
  const t = useTranslations('reader');
  const locale = useLocale();
  const story: Story = pkg.document;
  const [preferences, setPreferences] = useReaderPreferences();
  const [panel, setPanel] = useState<Panel>(null);
  const [speaking, setSpeaking] = useState(false);
  const [lastChoice, setLastChoice] = useState<{ passage: string; choice: string } | null>(null);
  const [discovered, setDiscovered] = useState<Set<string>>(() => new Set(pkg.discoveredEndings));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [initialSave] = useState(() =>
    playtest ? null : pickInitialSave(pkg.storyId, pkg.version.id, pkg.saves),
  );

  const saveSync = useSaveSync({
    storyId: pkg.storyId,
    versionId: pkg.version.id,
    signedIn,
    enabled: !playtest,
  });
  const track = useReadingTracker({
    storyId: pkg.storyId,
    versionId: pkg.version.id,
    enabled: !playtest,
  });

  const onUpdate = (update: GameUpdate) => {
    const passage = story.passages.find(
      (candidate) => candidate.id === update.session.state.passage,
    );
    saveSync(update.session, passage?.title ?? '');
    if (update.reason !== 'rewind') track(update.events, update.reason === 'start');
    const choice = lastOf(update.events, 'choice:made');
    setLastChoice(choice ? { passage: choice.passage, choice: choice.choice } : null);
    const ending = lastOf(update.events, 'ending:reached');
    if (ending) setDiscovered((current) => new Set([...current, ending.passage]));
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  };

  const game = useGame(story, { initialSave, onUpdate });
  const { view, session, events } = game;

  // Première lecture : compter le démarrage une fois.
  const startedRef = useRef(false);
  const trackStart = useEffectEvent(() => {
    if (startedRef.current || initialSave || playtest) return;
    startedRef.current = true;
    track(events, true);
  });
  useEffect(() => trackStart(), []);

  useEffect(() => {
    if (game.restoredFailed) toast.info(t('incompatibleSave'));
  }, [game.restoredFailed, t]);

  // Nouveau passage : on remonte en haut et on donne le focus au titre (lecteurs d'écran).
  // biome-ignore lint/correctness/useExhaustiveDependencies: déclenché par le changement d'étape.
  useEffect(() => {
    if (session.state.step === 0 && !initialSave) return;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    headingRef.current?.focus({ preventScroll: true });
  }, [session.state.step]);

  const choiceStats = useQuery({
    queryKey: ['choice-stats', pkg.storyId, lastChoice?.passage],
    queryFn: () =>
      api.reading.choiceStats({ storyId: pkg.storyId, passageId: lastChoice?.passage ?? '' }),
    enabled: Boolean(lastChoice) && story.settings.showChoiceStats && !playtest,
    staleTime: 60_000,
  });
  const chosenShare =
    lastChoice && choiceStats.data && choiceStats.data.total >= 5
      ? choiceStats.data.choices.find((choice) => choice.choiceId === lastChoice.choice)?.share
      : undefined;

  const dice = lastOf(events, 'dice:rolled');
  const testFeedback = lastOf(events, 'test:resolved');
  const round = lastOf(events, 'combat:round');
  const explored = new Set(session.state.path).size / story.passages.length;
  const staminaVar = story.passages.find((passage) => passage.id === session.state.passage)
    ?.encounter?.staminaVar;
  const heroMax = staminaVar
    ? Number(
        story.variables.find((variable) => variable.id === staminaVar)?.max ??
          story.variables.find((variable) => variable.id === staminaVar)?.initial ??
          0,
      )
    : 0;

  const speak = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    if (speaking) {
      synth.cancel();
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(
      `${view.passage.title}. ${view.passage.plainText}`,
    );
    utterance.lang = story.language;
    utterance.rate = 0.95;
    utterance.onend = () => setSpeaking(false);
    synth.speak(utterance);
    setSpeaking(true);
  };

  const [feedback, setFeedback] = useState('');
  const sendFeedback = async () => {
    try {
      await api.community.sendFeedback({
        storyId: pkg.storyId,
        passageId: view.passage.id,
        kind: 'typo',
        body: feedback,
      });
      toast.success(t('feedbackSent'));
      setFeedback('');
      setPanel(null);
    } catch {
      toast.error(t('signInToSync'));
    }
  };

  const ending = view.passage.ending;

  return (
    <div
      data-reader-theme={preferences.theme}
      style={readerStyle(preferences)}
      className="min-h-dvh bg-[var(--dd-reader-background)] text-[var(--dd-reader-text)] transition-colors duration-300"
    >
      <header className="sticky top-0 z-30 border-b border-[var(--dd-reader-rule)] bg-[color-mix(in_oklab,var(--dd-reader-background)_88%,transparent)] backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-2 px-3">
          {onExit ? (
            <IconButton label={t('exit')} onClick={onExit}>
              <ArrowLeft />
            </IconButton>
          ) : (
            <Tooltip content={t('backToStory')} side="bottom">
              <Link
                href={{ pathname: '/story/[slug]', params: { slug: pkg.slug } }}
                aria-label={t('backToStory')}
                className="inline-flex size-10 items-center justify-center rounded-md text-[var(--dd-reader-muted)] hover:bg-[var(--dd-reader-rule)] hover:text-[var(--dd-reader-text)]"
              >
                <ArrowLeft className="size-5" />
              </Link>
            </Tooltip>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-base font-semibold">
              {pkg.title}
              {playtest ? (
                <span className="ml-2 rounded-full bg-[var(--dd-reader-accent)] px-2 py-0.5 font-sans text-[0.65rem] font-bold text-[var(--dd-reader-page)] uppercase">
                  {t('playtest')}
                </span>
              ) : null}
            </p>
            <div
              className="mt-1 h-0.5 w-full max-w-48 overflow-hidden rounded-full bg-[var(--dd-reader-rule)]"
              role="progressbar"
              aria-label={t('explored', { percent: formatPercent(explored, locale) })}
              aria-valuenow={Math.round(explored * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full bg-[var(--dd-reader-accent)] transition-[width] duration-700 ease-thread"
                style={{ width: `${explored * 100}%` }}
              />
            </div>
          </div>
          <IconButton
            label={speaking ? t('stopReading') : t('readAloud')}
            onClick={speak}
            active={speaking}
          >
            {speaking ? <VolumeX /> : <Volume2 />}
          </IconButton>
          {story.variables.some((variable) => variable.visible) || story.items.length > 0 ? (
            <IconButton label={t('sheet')} onClick={() => setPanel('sheet')}>
              <ScrollText />
            </IconButton>
          ) : null}
          <IconButton label={t('map')} onClick={() => setPanel('map')}>
            <MapIcon />
          </IconButton>
          <IconButton label={t('rewind')} onClick={() => setPanel('rewind')}>
            <Undo2 />
          </IconButton>
          <IconButton label={t('settings')} onClick={() => setPanel('settings')}>
            <Settings2 />
          </IconButton>
        </div>
      </header>

      <main id="contenu" className="mx-auto max-w-[46rem] px-3 py-6 sm:px-6 sm:py-10">
        <article
          key={session.state.step}
          className="paper-grain flex animate-rise flex-col gap-7 rounded-2xl bg-[var(--dd-reader-page)] px-5 py-8 shadow-[0_1px_0_rgba(0,0,0,0.04),0_30px_60px_-30px_rgba(0,0,0,0.35)] sm:px-12 sm:py-12"
        >
          {chosenShare !== undefined ? (
            <p className="-mb-3 font-sans text-xs font-semibold text-[var(--dd-reader-muted)]">
              {t('choiceShare', { percent: formatPercent(chosenShare, locale) })}
            </p>
          ) : null}
          <header className="flex flex-col gap-1">
            <h1
              ref={headingRef}
              tabIndex={-1}
              className="eyebrow !text-[var(--dd-reader-accent)] outline-none"
            >
              {view.passage.title}
            </h1>
          </header>
          {dice ? <DiceResult event={dice} feedback={testFeedback?.text ?? null} /> : null}
          <EventNotices events={events} story={game.compiled} />
          <PassageText blocks={view.passage.blocks} />

          {view.encounter ? (
            <CombatPanel
              encounter={view.encounter}
              lastRound={round}
              heroMaxStamina={heroMax}
              onAttack={() => game.perform({ type: 'attack' })}
              onFlee={() => game.perform({ type: 'flee' })}
            />
          ) : null}

          {ending ? (
            <EndingScreen
              story={story}
              ending={ending}
              discovered={discovered}
              canRewind={game.targets.length > 0}
              onRestart={game.restart}
              onRewind={() => setPanel('rewind')}
            >
              {!playtest ? (
                <Link
                  href={{ pathname: '/story/[slug]', params: { slug: pkg.slug } }}
                  className="thread-underline text-sm font-semibold"
                >
                  {t('rateStory')}
                </Link>
              ) : null}
            </EndingScreen>
          ) : !view.encounter ? (
            <div className="flex flex-col gap-3 border-t border-[var(--dd-reader-rule)] pt-6">
              <p className="font-sans text-xs font-bold tracking-[0.14em] text-[var(--dd-reader-muted)] uppercase">
                {t('choose')}
              </p>
              {view.stuck ? <p className="font-sans text-sm italic">{t('stuck')}</p> : null}
              <ChoiceList
                choices={view.choices}
                onChoose={(choice) => game.perform({ type: 'choose', choice })}
              />
              <p className="hidden font-sans text-xs text-[var(--dd-reader-muted)] sm:block">
                {t('keyboardHint')}
              </p>
            </div>
          ) : null}
        </article>

        <div className="mt-6 flex items-center justify-between gap-3 px-2 font-sans text-xs text-[var(--dd-reader-muted)]">
          <span>{playtest ? t('playtest') : signedIn ? t('saved') : t('savedLocally')}</span>
          {!playtest && signedIn ? (
            <button
              type="button"
              onClick={() => setPanel('feedback')}
              className="inline-flex cursor-pointer items-center gap-1 hover:text-[var(--dd-reader-text)]"
            >
              <Flag className="size-3.5" aria-hidden /> {t('reportTypo')}
            </button>
          ) : null}
        </div>
      </main>

      <Dialog open={panel !== null} onOpenChange={(open) => !open && setPanel(null)}>
        {panel === 'sheet' ? (
          <DialogContent side="right" title={t('sheet')}>
            <AdventureSheet view={view} />
          </DialogContent>
        ) : null}
        {panel === 'map' ? (
          <DialogContent side="right" title={t('map')} className="max-w-2xl">
            <PathMap
              story={story}
              path={session.state.path}
              current={session.state.passage}
              locale={locale}
            />
          </DialogContent>
        ) : null}
        {panel === 'rewind' ? (
          <DialogContent side="right" title={t('rewind')} description={t('rewindHint')}>
            {game.targets.length === 0 ? (
              <p className="text-sm text-muted">
                {story.settings.rewind === 'none' ? t('rewindDisabled') : t('rewindHint')}
              </p>
            ) : (
              <ol className="flex flex-col gap-2">
                {[...game.targets].reverse().map((milestone) => {
                  const passage = story.passages.find(
                    (candidate) => candidate.id === milestone.passage,
                  );
                  return (
                    <li key={milestone.step}>
                      <button
                        type="button"
                        onClick={() => {
                          game.rewindTo(milestone.step);
                          setPanel(null);
                        }}
                        className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-lg border border-line bg-raised px-3 py-2.5 text-left text-sm hover:border-thread"
                      >
                        <span className="font-semibold">
                          {t('rewindTo', { title: passage?.title ?? milestone.passage })}
                        </span>
                        <span className="font-mono text-xs text-subtle">#{milestone.step}</span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            )}
          </DialogContent>
        ) : null}
        {panel === 'settings' ? (
          <DialogContent side="right" title={t('settings')}>
            <ReaderSettings preferences={preferences} onChange={setPreferences} />
          </DialogContent>
        ) : null}
        {panel === 'feedback' ? (
          <DialogContent title={t('reportTypo')} description={view.passage.title}>
            <Textarea
              value={feedback}
              onChange={(event) => setFeedback(event.target.value)}
              placeholder={t('feedbackPlaceholder')}
              aria-label={t('feedbackPlaceholder')}
            />
            <button
              type="button"
              disabled={feedback.trim().length < 3}
              onClick={sendFeedback}
              className="h-10 cursor-pointer rounded-md bg-thread px-4 text-sm font-semibold text-on-thread disabled:opacity-50"
            >
              {t('reportTypo')}
            </button>
          </DialogContent>
        ) : null}
      </Dialog>
    </div>
  );
}
