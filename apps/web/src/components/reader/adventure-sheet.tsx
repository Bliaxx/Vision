'use client';

import type { GameView } from '@dedale/engine';
import { useTranslations } from 'next-intl';

/** Feuille d'aventure : caractéristiques visibles et inventaire. */
export function AdventureSheet({ view }: { view: GameView }) {
  const t = useTranslations('reader');
  return (
    <div className="flex flex-col gap-6">
      {view.stats.length > 0 ? (
        <section className="flex flex-col gap-3">
          <h3 className="eyebrow">{t('stats')}</h3>
          <dl className="grid grid-cols-2 gap-3">
            {view.stats.map((stat) => (
              <div key={stat.id} className="rounded-lg border border-line bg-raised p-3">
                <dt className="text-xs font-semibold text-muted">{stat.name}</dt>
                <dd className="font-display text-3xl font-semibold tabular-nums">
                  {typeof stat.value === 'boolean' ? (stat.value ? '✓' : '—') : String(stat.value)}
                  {stat.max !== null ? (
                    <span className="text-base text-subtle"> / {stat.max}</span>
                  ) : null}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : null}
      <section className="flex flex-col gap-3">
        <h3 className="eyebrow">{t('inventory')}</h3>
        {view.inventory.length === 0 ? (
          <p className="text-sm text-muted italic">{t('emptyInventory')}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {view.inventory.map((item) => (
              <li
                key={item.id}
                className="flex items-start justify-between gap-3 rounded-lg border border-line bg-raised p-3"
              >
                <div>
                  <p className="font-semibold">{item.name}</p>
                  {item.description ? (
                    <p className="text-sm text-muted">{item.description}</p>
                  ) : null}
                </div>
                {item.qty > 1 ? (
                  <span className="rounded-full bg-sunken px-2 py-0.5 text-xs font-bold">
                    ×{item.qty}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
