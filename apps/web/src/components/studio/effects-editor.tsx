'use client';

import type { Effect, Story } from '@dedale/engine';
import { Plus, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '../ui/button';
import { ExpressionInput } from './expression-input';

const selectClass =
  'h-9 rounded-md border border-line-strong bg-raised px-2 text-sm outline-none focus-visible:border-thread';

/** Éditeur de liste d'effets (variables, objets, succès). */
export function EffectsEditor({
  doc,
  effects,
  onChange,
  idPrefix,
}: {
  doc: Story;
  effects: readonly Effect[];
  onChange: (effects: Effect[]) => void;
  idPrefix: string;
}) {
  const t = useTranslations('studio.editor');
  const tc = useTranslations('common');
  const replace = (index: number, effect: Effect) =>
    onChange(effects.map((current, i) => (i === index ? effect : current)));
  const remove = (index: number) => onChange(effects.filter((_, i) => i !== index));
  const firstVar = doc.variables[0]?.id;
  const firstItem = doc.items[0]?.id;
  const firstAchievement = doc.achievements[0]?.id;

  const create = (kind: Effect['kind']): Effect | null => {
    switch (kind) {
      case 'set':
      case 'add':
        return firstVar ? { kind, var: firstVar, value: '1' } : null;
      case 'give':
      case 'take':
        return firstItem ? { kind, item: firstItem, qty: 1 } : null;
      case 'unlock':
        return firstAchievement ? { kind, achievement: firstAchievement } : null;
    }
  };

  return (
    <div className="flex flex-col gap-2">
      {effects.map((effect, index) => (
        <div
          key={`${index}-${effect.kind}`}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-1.5"
        >
          <div className="flex min-w-0 flex-wrap items-start gap-1.5 [&>*]:min-w-0 [&>*]:flex-1">
            <select
              aria-label={t('effects')}
              className={selectClass}
              value={effect.kind}
              onChange={(event) => {
                const next = create(event.target.value as Effect['kind']);
                if (next) replace(index, next);
              }}
            >
              {(['add', 'set', 'give', 'take', 'unlock'] as const).map((kind) => (
                <option key={kind} value={kind}>
                  {t(`effect.${kind}`)}
                </option>
              ))}
            </select>
            {effect.kind === 'set' || effect.kind === 'add' ? (
              <>
                <select
                  aria-label={t('variables')}
                  className={selectClass}
                  value={effect.var}
                  onChange={(event) => replace(index, { ...effect, var: event.target.value })}
                >
                  {doc.variables.map((variable) => (
                    <option key={variable.id} value={variable.id}>
                      {variable.name}
                    </option>
                  ))}
                </select>
                <ExpressionInput
                  id={`${idPrefix}-effect-${index}`}
                  doc={doc}
                  value={effect.value}
                  onChange={(value) => replace(index, { ...effect, value })}
                  className="min-w-24 flex-1"
                />
              </>
            ) : null}
            {effect.kind === 'give' || effect.kind === 'take' ? (
              <>
                <select
                  aria-label={t('items')}
                  className={selectClass}
                  value={effect.item}
                  onChange={(event) => replace(index, { ...effect, item: event.target.value })}
                >
                  {doc.items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  aria-label={t('quantity')}
                  value={effect.qty}
                  onChange={(event) =>
                    replace(index, { ...effect, qty: Math.max(1, Number(event.target.value) || 1) })
                  }
                  className="h-9 w-16 rounded-md border border-line-strong bg-raised px-2 text-sm"
                />
              </>
            ) : null}
            {effect.kind === 'unlock' ? (
              <select
                aria-label={t('achievements')}
                className={selectClass}
                value={effect.achievement}
                onChange={(event) => replace(index, { ...effect, achievement: event.target.value })}
              >
                {doc.achievements.map((achievement) => (
                  <option key={achievement.id} value={achievement.id}>
                    {achievement.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => remove(index)}
            aria-label={tc('remove')}
            className="mt-0.5"
          >
            <X />
          </Button>
        </div>
      ))}
      <div>
        <Button
          variant="ghost"
          size="sm"
          disabled={!firstVar && !firstItem && !firstAchievement}
          onClick={() => {
            const next = create(firstVar ? 'add' : firstItem ? 'give' : 'unlock');
            if (next) onChange([...effects, next]);
          }}
        >
          <Plus /> {t('addEffect')}
        </Button>
      </div>
    </div>
  );
}
