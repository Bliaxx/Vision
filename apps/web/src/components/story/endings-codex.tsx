import type { EndingsCodex } from '@dedale/contracts';
import { getLocale, getTranslations } from 'next-intl/server';
import { formatPercent } from '@/lib/format';
import { Meter } from '../ui/misc';
import { EndingIcon } from './badges';

/** Collection de fins : titres cachés tant qu'elles ne sont pas découvertes. */
export async function EndingsCodexView({ codex }: { codex: EndingsCodex }) {
  const [t, te, locale] = await Promise.all([
    getTranslations('story'),
    getTranslations('endings'),
    getLocale(),
  ]);
  const found = codex.endings.filter((ending) => ending.title).length;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-muted">
          {t('codexProgress', { found, total: codex.total })}
        </p>
      </div>
      <Meter value={found} max={codex.total} label={t('codex')} />
      <ul className="grid gap-3 sm:grid-cols-2">
        {codex.endings.map((ending) => (
          <li
            key={ending.passageId}
            className={
              ending.title
                ? 'flex items-center gap-3 rounded-lg border border-line bg-surface p-3'
                : 'flex items-center gap-3 rounded-lg border border-dashed border-line-strong p-3 text-muted'
            }
          >
            <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sunken">
              {ending.title || ending.kind !== 'secret' ? <EndingIcon kind={ending.kind} /> : '?'}
            </span>
            <span className="flex flex-col">
              <span className="font-semibold">{ending.title ?? t('undiscovered')}</span>
              <span className="text-xs text-subtle">
                {ending.title || ending.kind !== 'secret' ? te(ending.kind) : '???'} ·{' '}
                {t('rarity', { percent: formatPercent(ending.rarity, locale) })}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
