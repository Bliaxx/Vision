'use client';

import { type StoryInput, StorySchema } from '@dedale/engine';
import { RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { EndingIcon } from '../story/badges';
import { ChoiceList } from './choice-list';
import { DiceResult } from './dice';
import { PassageText } from './passage-text';
import { useGame } from './use-game';

function lastDice(events: ReturnType<typeof useGame>['events']) {
  return [...events].reverse().find((event) => event.type === 'dice:rolled') ?? null;
}

/** Micro-récit jouable directement sur la page d'accueil, sans compte ni réseau. */
export function DemoReader({ input }: { input: StoryInput }) {
  const t = useTranslations();
  const story = useMemo(() => StorySchema.parse(input), [input]);
  const game = useGame(story);
  const { view, events } = game;
  const dice = lastDice(events);
  const feedback = [...events].reverse().find((event) => event.type === 'test:resolved');

  return (
    <div
      data-reader-theme="paper"
      className="paper-grain relative flex min-h-[27rem] flex-col gap-5 rounded-2xl bg-[var(--dd-reader-page)] p-6 text-[var(--dd-reader-text)] shadow-lift sm:p-8 dark:[--dd-reader-page:var(--dd-ink-900)] dark:[--dd-reader-text:#D9D3C6] dark:[--dd-reader-rule:var(--dd-ink-700)] dark:[--dd-reader-muted:#8A8497] dark:[--dd-reader-accent:var(--dd-thread-400)]"
    >
      <div key={game.session.state.step} className="flex animate-rise flex-col gap-4">
        <p className="eyebrow !text-[var(--dd-reader-accent)]">{view.passage.title}</p>
        {dice?.type === 'dice:rolled' ? (
          <DiceResult
            event={dice}
            feedback={feedback?.type === 'test:resolved' ? feedback.text : null}
          />
        ) : null}
        <div className="[--reader-size:1.05rem]">
          <PassageText blocks={view.passage.blocks} dropCap={false} />
        </div>
      </div>
      <div className="mt-auto">
        {view.passage.ending ? (
          <div className="flex items-center justify-between gap-3 border-t border-[var(--dd-reader-rule)] pt-4">
            <span className="inline-flex items-center gap-2 font-sans text-sm font-bold">
              <EndingIcon kind={view.passage.ending.kind} /> {view.passage.ending.title}
            </span>
            <button
              type="button"
              onClick={game.restart}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-[var(--dd-reader-rule)] px-3 py-1.5 font-sans text-sm font-semibold hover:border-[var(--dd-reader-accent)]"
            >
              <RotateCcw className="size-4" aria-hidden /> {t('landing.demoRestart')}
            </button>
          </div>
        ) : (
          <ChoiceList
            compact
            choices={view.choices}
            onChoose={(choice) => game.perform({ type: 'choose', choice })}
          />
        )}
      </div>
    </div>
  );
}
