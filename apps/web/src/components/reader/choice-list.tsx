'use client';

import type { ChoiceView } from '@dedale/engine';
import { Dices, Lock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { InlineText } from './passage-text';

/**
 * Liste des choix : grandes cibles tactiles, raccourcis 1–9, choix verrouillés
 * annoncés avec leur indice. Le fil rouge se déroule au survol.
 */
export function ChoiceList({
  choices,
  onChoose,
  disabled,
  compact = false,
}: {
  choices: readonly ChoiceView[];
  onChoose: (id: string) => void;
  disabled?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations('reader');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (disabled || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      const index = Number(event.key) - 1;
      const choice = choices[index];
      if (choice?.available) {
        event.preventDefault();
        onChoose(choice.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [choices, disabled, onChoose]);

  return (
    <ol className="flex flex-col gap-2.5" aria-label={t('choose')}>
      {choices.map((choice, index) => (
        <li key={choice.id}>
          <button
            type="button"
            disabled={!choice.available || disabled}
            onClick={() => onChoose(choice.id)}
            aria-describedby={choice.hint ? `hint-${choice.id}` : undefined}
            className={cn(
              'group relative flex w-full cursor-pointer items-start gap-3 overflow-hidden rounded-lg border text-left transition-[border-color,background-color,transform] duration-200 ease-thread',
              compact ? 'px-3.5 py-3' : 'px-4 py-3.5',
              choice.available
                ? 'border-[var(--dd-reader-rule)] bg-[color-mix(in_oklab,var(--dd-reader-page)_92%,var(--dd-reader-text))] hover:-translate-y-0.5 hover:border-[var(--dd-reader-accent)] focus-visible:border-[var(--dd-reader-accent)]'
                : 'cursor-not-allowed border-dashed border-[var(--dd-reader-rule)] opacity-60',
            )}
          >
            <span
              aria-hidden
              className={cn(
                'mt-0.5 inline-flex size-6 shrink-0 items-center justify-center rounded-full border font-sans text-xs font-bold',
                choice.available
                  ? 'border-[var(--dd-reader-accent)] text-[var(--dd-reader-accent)] group-hover:bg-[var(--dd-reader-accent)] group-hover:text-[var(--dd-reader-page)]'
                  : 'border-[var(--dd-reader-muted)] text-[var(--dd-reader-muted)]',
              )}
            >
              {choice.available ? index + 1 : <Lock className="size-3" />}
            </span>
            <span className="flex flex-1 flex-col gap-0.5">
              <span
                className={cn(
                  'font-reading leading-snug',
                  compact ? 'text-base' : 'text-[1.05rem]',
                )}
              >
                <InlineText inlines={choice.inlines} />
              </span>
              {choice.test ? (
                <span className="inline-flex items-center gap-1 font-sans text-xs font-semibold text-[var(--dd-reader-accent)]">
                  <Dices className="size-3.5" aria-hidden /> {choice.test.label ?? t('dice')} ·{' '}
                  {choice.test.dice}
                </span>
              ) : null}
              {choice.hint ? (
                <span
                  id={`hint-${choice.id}`}
                  className="font-sans text-xs text-[var(--dd-reader-muted)] italic"
                >
                  {choice.hint}
                </span>
              ) : !choice.available ? (
                <span className="sr-only">{t('locked')}</span>
              ) : null}
            </span>
            {/* Le fil qui se déroule sous le choix survolé. */}
            <span
              aria-hidden
              className="absolute bottom-0 left-0 h-[2px] w-0 bg-[var(--dd-reader-accent)] transition-[width] duration-500 ease-thread group-hover:w-full"
            />
          </button>
        </li>
      ))}
    </ol>
  );
}
