'use client';

import type { EngineEvent } from '@dedale/engine';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';

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

/** Un dé à six faces dessiné (ou la valeur pour les autres dés). */
export function Die({
  value,
  delay = 0,
  tone = 'ink',
}: {
  value: number;
  delay?: number;
  tone?: 'ink' | 'enemy';
}) {
  const pips = PIPS[value];
  return (
    <svg
      viewBox="0 0 100 100"
      className="size-11 animate-roll drop-shadow-sm"
      style={{ animationDelay: `${delay}ms` }}
      role="img"
      aria-label={String(value)}
    >
      <rect
        x="4"
        y="4"
        width="92"
        height="92"
        rx="20"
        className={
          tone === 'enemy' ? 'fill-[var(--dd-reader-text)]' : 'fill-[var(--dd-reader-page)]'
        }
        stroke="var(--dd-reader-text)"
        strokeWidth="5"
      />
      {pips ? (
        pips.map(([cx, cy]) => (
          <circle
            key={`${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r="8.5"
            className={
              tone === 'enemy' ? 'fill-[var(--dd-reader-page)]' : 'fill-[var(--dd-reader-accent)]'
            }
          />
        ))
      ) : (
        <text
          x="50"
          y="64"
          textAnchor="middle"
          fontSize="42"
          fontWeight="700"
          fill="var(--dd-reader-text)"
        >
          {value}
        </text>
      )}
    </svg>
  );
}

const COMPARE = { lte: '≤', lt: '<', gte: '≥', gt: '>', eq: '=' } as const;

export function DiceResult({ event, feedback }: { event: DiceEvent; feedback: string | null }) {
  const t = useTranslations('reader');
  return (
    <div
      role="status"
      className={cn(
        'flex animate-rise items-center gap-4 rounded-lg border-l-4 bg-[color-mix(in_oklab,var(--dd-reader-page)_88%,var(--dd-reader-text))] px-4 py-3 font-sans',
        event.success ? 'border-[var(--dd-success)]' : 'border-[var(--dd-danger)]',
      )}
    >
      <div className="flex gap-2">
        {event.rolls.map((roll, index) => (
          <Die key={`${index}-${roll}`} value={roll} delay={index * 120} />
        ))}
      </div>
      <div className="flex flex-col">
        <span className="text-xs font-bold tracking-[0.12em] text-[var(--dd-reader-muted)] uppercase">
          {event.label ?? t('dice')} · {event.dice}
        </span>
        <span className="text-lg font-bold">
          {event.total}
          {event.modifier !== 0 ? (
            <span className="text-sm font-medium text-[var(--dd-reader-muted)]">
              {' '}
              ({event.modifier > 0 ? '+' : ''}
              {event.modifier})
            </span>
          ) : null}{' '}
          <span className="text-sm font-medium text-[var(--dd-reader-muted)]">
            {t('diceTarget', { compare: COMPARE[event.compare], target: event.target })}
          </span>
        </span>
        <span
          className={cn(
            'text-sm font-bold',
            event.success ? 'text-[var(--dd-success)]' : 'text-[var(--dd-danger)]',
          )}
        >
          {event.success ? t('success') : t('failure')}
          {feedback ? (
            <span className="font-medium text-[var(--dd-reader-text)]"> — {feedback}</span>
          ) : null}
        </span>
      </div>
    </div>
  );
}
