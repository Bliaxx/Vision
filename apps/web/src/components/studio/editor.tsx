'use client';

import type { Draft, ReadingPackage } from '@dedale/contracts';
import { compileStory, type SimulationReport, type Story, simulate } from '@dedale/engine';
import { useQuery } from '@tanstack/react-query';
import { ReactFlowProvider } from '@xyflow/react';
import {
  ArrowLeft,
  BookText,
  Check,
  CircleAlert,
  CloudOff,
  Flame,
  Loader2,
  Play,
  Redo2,
  Rocket,
  ShieldCheck,
  Undo2,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { orpc } from '@/lib/api/browser';
import { cn } from '@/lib/cn';
import { formatPercent } from '@/lib/format';
import { Wordmark } from '../brand/wordmark';
import { Reader } from '../reader/reader';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Kbd } from '../ui/misc';
import { Tooltip } from '../ui/tooltip';
import { EditorProvider, useEditor, useEditorStore } from './context';
import { GraphCanvas } from './graph-canvas';
import { Inspector } from './inspector';
import { MetaDialog } from './meta-dialog';
import { PublishDialog } from './publish-dialog';
import { DiagnosticsList, Sidebar } from './sidebar';
import type { SaveState } from './store';
import { useAutosave } from './use-autosave';

const SAVE_ICON: Record<SaveState, typeof Check> = {
  saved: Check,
  saving: Loader2,
  dirty: CircleAlert,
  conflict: CloudOff,
  error: CloudOff,
};

function SaveIndicator() {
  const t = useTranslations('studio.editor');
  const saveState = useEditor((state) => state.saveState);
  const Icon = SAVE_ICON[saveState];
  return (
    <span
      role="status"
      className={cn(
        'inline-flex items-center gap-1.5 text-xs font-medium whitespace-nowrap',
        saveState === 'saved' && 'text-subtle',
        saveState === 'saving' && 'text-muted',
        saveState === 'dirty' && 'text-muted',
        (saveState === 'conflict' || saveState === 'error') && 'text-danger',
      )}
    >
      <Icon className={cn('size-3.5', saveState === 'saving' && 'animate-spin')} aria-hidden />
      <span className="hidden md:inline">{t(`saveState.${saveState}`)}</span>
    </span>
  );
}

function isTyping(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
}

/** Raccourcis clavier globaux de l'éditeur. */
function useShortcuts(flush: () => Promise<boolean>) {
  const store = useEditorStore();
  const t = useTranslations('studio.editor');
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const mod = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();
      if (mod && key === 's') {
        event.preventDefault();
        void flush();
        return;
      }
      if (isTyping(event.target)) return;
      if (mod && key === 'z') {
        event.preventDefault();
        if (event.shiftKey) store.getState().redo();
        else store.getState().undo();
      } else if (mod && key === 'y') {
        event.preventDefault();
        store.getState().redo();
      } else if ((event.key === 'Delete' || event.key === 'Backspace') && !mod) {
        const { selectedId, doc, deletePassage } = store.getState();
        const passage = doc.passages.find((candidate) => candidate.id === selectedId);
        if (!passage || passage.id === doc.start) return;
        event.preventDefault();
        if (window.confirm(t('deleteConfirm', { title: passage.title }))) deletePassage(passage.id);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [flush, store, t]);
}

/** Vérifications statiques + simulation de Monte-Carlo, côte à côte. */
function ChecksDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('studio.editor');
  const td = useTranslations('difficulty');
  const locale = useLocale();
  const doc = useEditor((state) => state.doc);
  const analysis = useEditor((state) => state.analysis);
  const [report, setReport] = useState<{ doc: Story; result: SimulationReport } | null>(null);
  const [running, setRunning] = useState(false);

  const run = () => {
    setRunning(true);
    // Laisse le navigateur peindre l'état « en cours » avant le calcul.
    setTimeout(() => {
      try {
        setReport({ doc, result: simulate(compileStory(doc), { runs: 500 }) });
      } finally {
        setRunning(false);
      }
    }, 16);
  };

  const result = report?.doc === doc ? report.result : (report?.result ?? null);
  const endings = result
    ? Object.entries(result.endings)
        .map(([id, count]) => {
          const ending = doc.passages.find((passage) => passage.id === id)?.ending;
          return { id, count, title: ending?.title ?? id, kind: ending?.kind ?? 'neutral' };
        })
        .sort((a, b) => b.count - a.count)
    : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title={t('diagnostics')} side="right" className="max-w-lg">
        <DiagnosticsList diagnostics={analysis.diagnostics} />
        <section className="flex flex-col gap-3 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-display text-lg font-semibold">{t('simulation')}</h3>
            <Button
              size="sm"
              variant="secondary"
              onClick={run}
              disabled={running || !analysis.publishable}
            >
              {running ? <Loader2 className="animate-spin" /> : <Flame />} {t('simulate')}
            </Button>
          </div>
          {running ? <p className="text-sm text-muted">{t('simulationRunning')}</p> : null}
          {result ? (
            <div className={cn('flex flex-col gap-3', report?.doc !== doc && 'opacity-60')}>
              <p className="text-sm leading-relaxed">
                {t('simulationResult', {
                  runs: result.runs,
                  minutes: result.estimatedMinutes,
                  difficulty: td(result.difficulty).toLocaleLowerCase(locale),
                  coverage: formatPercent(result.coverage, locale),
                })}
              </p>
              {result.stuck > 0 ? (
                <p className="text-sm font-semibold text-warning">
                  {t('simulationStuck', { count: result.stuck })}
                </p>
              ) : null}
              <p className="text-xs font-bold tracking-[0.12em] text-subtle uppercase">
                {t('endingsDistribution')}
              </p>
              <ul className="flex flex-col gap-2">
                {endings.map((ending) => (
                  <li key={ending.id} className="flex flex-col gap-1 text-sm">
                    <span className="flex justify-between gap-2">
                      <span className="truncate">{ending.title}</span>
                      <span className="font-mono text-xs text-muted">
                        {formatPercent(ending.count / result.runs, locale)}
                      </span>
                    </span>
                    <span className="h-1.5 overflow-hidden rounded-full bg-sunken">
                      <span
                        className="block h-full rounded-full"
                        style={{
                          width: `${(ending.count / result.runs) * 100}%`,
                          background: `var(--dd-ending-${ending.kind})`,
                        }}
                      />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      </DialogContent>
    </Dialog>
  );
}

/** Test en conditions réelles, avec le vrai lecteur, sans rien enregistrer. */
function Playtest({ from, onExit }: { from: string | null; onExit: () => void }) {
  const doc = useEditor((state) => state.doc);
  const storyId = useEditor((state) => state.storyId);
  const slug = useEditor((state) => state.slug);
  const title = useEditor((state) => state.meta.title);
  // Figé à l'ouverture : modifier le récit pendant un test n'a pas de sens.
  const [pkg] = useState<ReadingPackage>(() => ({
    storyId,
    slug,
    title,
    coverUrl: null,
    author: { id: 'playtest', handle: 'playtest', displayName: '', avatarUrl: null },
    version: { id: storyId, number: 0, publishedAt: new Date().toISOString() },
    document: from ? { ...doc, start: from } : doc,
    saves: [],
    discoveredEndings: [],
  }));
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-bg">
      <Reader pkg={pkg} signedIn={false} playtest onExit={onExit} />
    </div>
  );
}

function useHeatmap(enabled: boolean): ReadonlyMap<string, number> | null {
  const storyId = useEditor((state) => state.storyId);
  const query = useQuery({
    ...orpc.authoring.analytics.queryOptions({ input: { id: storyId } }),
    enabled,
    staleTime: 60_000,
  });
  return useMemo(() => {
    if (!enabled || !query.data) return null;
    return new Map(query.data.passages.map((entry) => [entry.passageId, entry.visits]));
  }, [enabled, query.data]);
}

type Pane = 'structure' | 'canvas' | 'passage';

function EditorShell() {
  const t = useTranslations('studio.editor');
  const ts = useTranslations('studio');
  const store = useEditorStore();
  const flush = useAutosave(store);
  useShortcuts(flush);

  const title = useEditor((state) => state.meta.title);
  const status = useEditor((state) => state.status);
  const analysis = useEditor((state) => state.analysis);
  const canUndo = useEditor((state) => state.past.length > 0);
  const canRedo = useEditor((state) => state.future.length > 0);
  const undo = useEditor((state) => state.undo);
  const redo = useEditor((state) => state.redo);
  const selectedId = useEditor((state) => state.selectedId);
  const saveState = useEditor((state) => state.saveState);

  const [dialog, setDialog] = useState<'meta' | 'publish' | 'checks' | null>(null);
  const [playtest, setPlaytest] = useState<{ from: string | null } | null>(null);
  const [heatOn, setHeatOn] = useState(false);
  const [pane, setPane] = useState<Pane>('canvas');
  const published = status === 'published' || status === 'unlisted';
  const heat = useHeatmap(heatOn && published);

  // Sur petit écran, choisir un passage dans la structure ouvre l'inspecteur.
  useEffect(() => {
    if (selectedId) setPane((current) => (current === 'structure' ? 'passage' : current));
  }, [selectedId]);

  const errors = analysis.diagnostics.filter(
    (diagnostic) => diagnostic.severity === 'error',
  ).length;
  const warnings = analysis.diagnostics.filter(
    (diagnostic) => diagnostic.severity === 'warning',
  ).length;

  return (
    <div className="flex h-dvh flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-line bg-surface px-2 sm:px-3">
        <Tooltip content={t('backToStudio')} side="bottom">
          <Button asChild variant="ghost" size="icon" aria-label={t('backToStudio')}>
            <Link href="/studio" onClick={() => void flush()}>
              <ArrowLeft />
            </Link>
          </Button>
        </Tooltip>
        <Wordmark className="hidden h-5 w-auto text-ink xl:block" />
        <div className="flex min-w-0 items-center gap-2">
          <h1 className="truncate font-display text-lg font-semibold">{title || t('untitled')}</h1>
          <Badge tone={published ? 'success' : 'neutral'} className="hidden sm:inline-flex">
            {ts(`status.${status}`)}
          </Badge>
        </div>
        <SaveIndicator />
        {saveState === 'conflict' ? (
          <Button size="sm" variant="danger" onClick={() => window.location.reload()}>
            {t('reload')}
          </Button>
        ) : null}

        <div className="ml-auto flex items-center gap-1">
          <Tooltip
            content={
              <span>
                {t('undo')} <Kbd>Ctrl Z</Kbd>
              </span>
            }
            side="bottom"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={undo}
              disabled={!canUndo}
              aria-label={t('undo')}
            >
              <Undo2 />
            </Button>
          </Tooltip>
          <Tooltip
            content={
              <span>
                {t('redo')} <Kbd>Ctrl ⇧ Z</Kbd>
              </span>
            }
            side="bottom"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={redo}
              disabled={!canRedo}
              aria-label={t('redo')}
            >
              <Redo2 />
            </Button>
          </Tooltip>
          <Tooltip content={published ? t('heatmap') : t('heatmapEmpty')} side="bottom">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setHeatOn((on) => !on)}
              disabled={!published}
              aria-pressed={heatOn}
              aria-label={t('heatmap')}
              className={cn(heatOn && 'text-thread')}
            >
              <Flame />
            </Button>
          </Tooltip>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDialog('checks')}
            aria-label={t('diagnostics')}
          >
            <ShieldCheck
              className={cn(errors ? 'text-danger' : warnings ? 'text-warning' : 'text-success')}
            />
            <span className="hidden lg:inline">
              {errors || warnings ? t('issues', { errors, warnings }) : t('noIssues')}
            </span>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDialog('meta')}>
            <BookText /> <span className="hidden lg:inline">{t('details')}</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="sm">
                <Play /> <span className="hidden sm:inline">{t('playtest')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setPlaytest({ from: null })}>
                {t('playtestFromStart')}
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={!selectedId}
                onSelect={() => setPlaytest({ from: selectedId })}
              >
                {t('playtestFromHere')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={() => setDialog('publish')}>
            <Rocket /> <span className="hidden sm:inline">{t('publish')}</span>
          </Button>
        </div>
      </header>

      <nav
        aria-label={t('paneCanvas')}
        className="flex shrink-0 border-b border-line bg-surface lg:hidden"
      >
        {(['structure', 'canvas', 'passage'] as const).map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={pane === option}
            onClick={() => setPane(option)}
            className={cn(
              'flex-1 cursor-pointer border-b-2 py-2 text-sm font-semibold',
              pane === option ? 'border-thread text-ink' : 'border-transparent text-muted',
            )}
          >
            {t(
              option === 'structure'
                ? 'paneStructure'
                : option === 'canvas'
                  ? 'paneCanvas'
                  : 'panePassage',
            )}
          </button>
        ))}
      </nav>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[17rem_minmax(0,1fr)_26rem]">
        <aside
          className={cn(
            'min-h-0 overflow-y-auto border-r border-line bg-surface',
            pane !== 'structure' && 'hidden lg:block',
          )}
        >
          <Sidebar />
        </aside>
        <main className={cn('relative min-h-0 bg-canvas', pane !== 'canvas' && 'hidden lg:block')}>
          <GraphCanvas heat={heat} />
        </main>
        <aside
          className={cn(
            'min-h-0 overflow-y-auto border-l border-line bg-surface',
            pane !== 'passage' && 'hidden lg:block',
          )}
        >
          <Inspector />
        </aside>
      </div>

      <MetaDialog
        open={dialog === 'meta'}
        onOpenChange={(open) => setDialog(open ? 'meta' : null)}
      />
      <PublishDialog
        open={dialog === 'publish'}
        onOpenChange={(open) => setDialog(open ? 'publish' : null)}
        flush={flush}
      />
      <ChecksDialog
        open={dialog === 'checks'}
        onOpenChange={(open) => setDialog(open ? 'checks' : null)}
      />
      {playtest ? <Playtest from={playtest.from} onExit={() => setPlaytest(null)} /> : null}
    </div>
  );
}

/** L'atelier : panneau de structure, carte du labyrinthe, inspecteur de passage. */
export function StoryEditor({ draft }: { draft: Draft }) {
  return (
    <EditorProvider draft={draft}>
      <ReactFlowProvider>
        <EditorShell />
      </ReactFlowProvider>
    </EditorProvider>
  );
}
