'use client';

import type { EndingKind, Story } from '@dedale/engine';
import { RotateCcw, Undo2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Monogram } from '../brand/monogram';
import { EndingIcon } from '../story/badges';

/** Fin atteinte : le type de fin, la collection de fins et l'invitation à rejouer. */
export function EndingScreen({
  story,
  ending,
  discovered,
  canRewind,
  onRestart,
  onRewind,
  children,
}: {
  story: Story;
  ending: { kind: EndingKind; title: string };
  discovered: ReadonlySet<string>;
  canRewind: boolean;
  onRestart: () => void;
  onRewind: () => void;
  children?: React.ReactNode;
}) {
  const t = useTranslations();
  const endings = story.passages.filter((passage) => passage.ending);
  return (
    <section
      className="flex animate-rise flex-col items-center gap-6 border-t border-[var(--dd-reader-rule)] pt-10 text-center font-sans"
      aria-live="polite"
    >
      {/* Le fil rejoint le cœur du labyrinthe : le seul tracé animé de la liseuse. */}
      <Monogram size={56} animated className="text-[var(--dd-reader-text)]" title="" aria-hidden />
      <div className="flex flex-col items-center gap-2">
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-[var(--dd-reader-accent)] uppercase">
          <EndingIcon kind={ending.kind} />{' '}
          {t('reader.endingKind', { kind: t(`endings.${ending.kind}`) })}
        </span>
        <p className="font-display text-4xl font-semibold text-balance">{ending.title}</p>
      </div>
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm font-semibold text-[var(--dd-reader-muted)]">
          {t('reader.endingsFound', { found: discovered.size, total: endings.length })}
        </p>
        <ul className="flex flex-wrap justify-center gap-2" aria-label={t('story.codex')}>
          {endings.map((passage) => {
            const found = discovered.has(passage.id);
            return (
              <li
                key={passage.id}
                title={found ? (passage.ending?.title ?? '') : t('story.undiscovered')}
                className={
                  found
                    ? 'flex size-10 items-center justify-center rounded-full border-2 border-[var(--dd-reader-accent)] bg-[var(--dd-reader-page)]'
                    : 'flex size-10 items-center justify-center rounded-full border-2 border-dashed border-[var(--dd-reader-rule)] text-[var(--dd-reader-muted)]'
                }
              >
                {found && passage.ending ? <EndingIcon kind={passage.ending.kind} /> : '?'}
                <span className="sr-only">
                  {found ? passage.ending?.title : t('story.undiscovered')}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-[var(--dd-reader-accent)] px-5 font-bold text-[var(--dd-reader-page)]"
        >
          <RotateCcw className="size-4" aria-hidden /> {t('reader.restart')}
        </button>
        {canRewind ? (
          <button
            type="button"
            onClick={onRewind}
            className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-[var(--dd-reader-rule)] px-5 font-bold"
          >
            <Undo2 className="size-4" aria-hidden /> {t('reader.rewind')}
          </button>
        ) : null}
      </div>
      {children}
    </section>
  );
}
