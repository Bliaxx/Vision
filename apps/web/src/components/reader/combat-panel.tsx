'use client';

import type { EncounterView, EngineEvent } from '@dedale/engine';
import { Shield, Sword, Wind } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect } from 'react';
import { cn } from '@/lib/cn';
import { Die } from './dice';

type RoundEvent = Extract<EngineEvent, { type: 'combat:round' }>;

function StaminaBar({ value, max, label }: { value: number; max: number; label: string }) {
  const ratio = max === 0 ? 0 : Math.max(0, value / max);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-xs font-semibold">
        <span>{label}</span>
        <span className="tabular-nums">
          {value}/{max}
        </span>
      </div>
      {/* biome-ignore lint/a11y/useSemanticElements: <meter> n'est pas stylable de façon homogène entre navigateurs. */}
      <div
        className="h-2 overflow-hidden rounded-full bg-[var(--dd-reader-rule)]"
        role="meter"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
      >
        <div
          className={cn(
            'h-full rounded-full transition-[width] duration-500 ease-thread',
            ratio > 0.35 ? 'bg-[var(--dd-success)]' : 'bg-[var(--dd-danger)]',
          )}
          style={{ width: `${ratio * 100}%` }}
        />
      </div>
    </div>
  );
}

/** Combat au tour par tour : 2d6 + habileté de chaque côté, le plus fort touche. */
export function CombatPanel({
  encounter,
  lastRound,
  heroMaxStamina,
  onAttack,
  onFlee,
}: {
  encounter: EncounterView;
  lastRound: RoundEvent | null;
  heroMaxStamina: number;
  onAttack: () => void;
  onFlee: () => void;
}) {
  const t = useTranslations('reader');

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'a' || event.key === 'A' || event.key === '1') onAttack();
      if ((event.key === 'f' || event.key === 'F') && encounter.canFlee) onFlee();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [encounter.canFlee, onAttack, onFlee]);

  return (
    <section
      aria-label={t('combat')}
      className="flex flex-col gap-5 rounded-xl border border-[var(--dd-reader-rule)] bg-[color-mix(in_oklab,var(--dd-reader-page)_90%,var(--dd-reader-text))] p-5 font-sans"
    >
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[var(--dd-reader-accent)] uppercase">
          <Sword className="size-4" aria-hidden /> {t('combat')}
        </span>
        <span className="text-xs font-semibold text-[var(--dd-reader-muted)]">
          {t('round', { round: encounter.round + 1 })}
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <StaminaBar
          value={encounter.hero.stamina}
          max={Math.max(heroMaxStamina, encounter.hero.stamina)}
          label={`${t('you')} · ⚔ ${encounter.hero.skill}`}
        />
        {encounter.enemies.map((enemy) => (
          <div key={enemy.id} className={cn(!enemy.active && 'opacity-50')}>
            <StaminaBar
              value={enemy.stamina}
              max={enemy.maxStamina}
              label={`${enemy.name} · ⚔ ${enemy.skill}${enemy.defeated ? ` · ${t('defeated')}` : ''}`}
            />
          </div>
        ))}
      </div>
      {lastRound ? (
        <div
          key={lastRound.round}
          className="flex animate-rise flex-wrap items-center justify-center gap-4 rounded-lg bg-[var(--dd-reader-page)] p-3"
          role="status"
        >
          <div className="flex items-center gap-1.5">
            {lastRound.heroRolls.map((roll, index) => (
              <Die key={`h${index}`} value={roll} delay={index * 100} />
            ))}
            <span className="ml-1 text-lg font-bold tabular-nums">{lastRound.heroAttack}</span>
          </div>
          <span className="text-sm font-bold text-[var(--dd-reader-muted)]">vs</span>
          <div className="flex items-center gap-1.5">
            <span className="mr-1 text-lg font-bold tabular-nums">{lastRound.enemyAttack}</span>
            {lastRound.enemyRolls.map((roll, index) => (
              <Die key={`e${index}`} value={roll} delay={200 + index * 100} tone="enemy" />
            ))}
          </div>
          <p
            className={cn(
              'w-full text-center text-sm font-bold',
              lastRound.winner === 'hero'
                ? 'text-[var(--dd-success)]'
                : lastRound.winner === 'enemy'
                  ? 'text-[var(--dd-danger)]'
                  : 'text-[var(--dd-reader-muted)]',
            )}
          >
            {lastRound.winner === 'hero'
              ? t('heroWins')
              : lastRound.winner === 'enemy'
                ? t('enemyWins')
                : t('tie')}
          </p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onAttack}
          className="inline-flex h-11 flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg bg-[var(--dd-reader-accent)] px-5 font-bold text-[var(--dd-reader-page)] transition-transform hover:-translate-y-0.5"
        >
          <Sword className="size-4" aria-hidden /> {t('attack')}
        </button>
        <button
          type="button"
          onClick={onFlee}
          disabled={!encounter.canFlee}
          className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-lg border border-[var(--dd-reader-rule)] px-5 font-bold disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Wind className="size-4" aria-hidden /> {t('flee')}
        </button>
      </div>
      <p className="inline-flex items-center gap-1.5 text-xs text-[var(--dd-reader-muted)]">
        <Shield className="size-3.5" aria-hidden /> A = {t('attack')} · F = {t('flee')}
      </p>
    </section>
  );
}
