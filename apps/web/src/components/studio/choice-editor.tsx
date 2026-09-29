'use client';

import {
  type Choice,
  compare as compareRoll,
  diceDistribution,
  evaluate,
  parseDice,
  type Story,
  tryParseExpr,
} from '@dedale/engine';
import { ArrowDown, ArrowUp, Dices, Trash2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatPercent } from '@/lib/format';
import { Button } from '../ui/button';
import { Checkbox, Input } from '../ui/field';
import { EffectsEditor } from './effects-editor';
import { ExpressionInput } from './expression-input';

const selectClass =
  'h-9 w-full rounded-md border border-line-strong bg-raised px-2 text-sm outline-none focus-visible:border-thread';
const NEW_PASSAGE = '__new__';

/** Probabilité de réussite d'une épreuve, avec les valeurs de départ des variables. */
function successChance(doc: Story, choice: Choice): number | null {
  const test = choice.test;
  if (!test) return null;
  const spec = parseDice(test.dice);
  const target = tryParseExpr(test.target);
  if (!spec || !target.ok) return null;
  const scope = {
    vars: Object.fromEntries(doc.variables.map((variable) => [variable.id, variable.initial])),
    inventory: {},
    visits: {},
    achievements: [],
  };
  const modifier = test.modifier ? tryParseExpr(test.modifier) : null;
  const shift = modifier?.ok ? Number(evaluate(modifier.expr, scope)) || 0 : 0;
  const goal = Number(evaluate(target.expr, scope)) || 0;
  let chance = 0;
  for (const [total, probability] of diceDistribution(spec)) {
    if (compareRoll(total + shift, test.compare, goal)) chance += probability;
  }
  return chance;
}

function TargetSelect({
  doc,
  value,
  onChange,
  onCreate,
  label,
}: {
  doc: Story;
  value: string;
  onChange: (id: string) => void;
  onCreate: () => string;
  label: string;
}) {
  const t = useTranslations('studio.editor');
  return (
    <select
      aria-label={label}
      className={selectClass}
      value={value}
      onChange={(event) =>
        onChange(event.target.value === NEW_PASSAGE ? onCreate() : event.target.value)
      }
    >
      {doc.passages.map((passage) => (
        <option key={passage.id} value={passage.id}>
          {passage.title}
        </option>
      ))}
      <option value={NEW_PASSAGE}>{t('newPassage')}</option>
    </select>
  );
}

export function ChoiceEditor({
  doc,
  passageId,
  choice,
  index,
  count,
  onChange,
  onRemove,
  onMove,
  onCreatePassage,
}: {
  doc: Story;
  passageId: string;
  choice: Choice;
  index: number;
  count: number;
  onChange: (choice: Choice, coalesce?: string) => void;
  onRemove: () => void;
  onMove: (delta: -1 | 1) => void;
  onCreatePassage: () => string;
}) {
  const t = useTranslations('studio.editor');
  const locale = useLocale();
  const id = `${passageId}-${choice.id}`;
  const chance = successChance(doc, choice);

  const toggleTest = () => {
    if (choice.test) {
      const { test, ...rest } = choice;
      onChange({ ...rest, to: test.success.to });
      return;
    }
    const numeric = doc.variables.find((variable) => variable.type === 'number');
    onChange({
      ...choice,
      test: {
        label: undefined,
        dice: '2d6',
        compare: 'lte',
        target: numeric?.id ?? '7',
        success: { to: choice.to ?? passageId, effects: [] },
        failure: { to: choice.to ?? passageId, effects: [] },
        effects: [],
      },
    });
  };

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-line bg-surface p-3">
      <div className="flex items-start gap-2">
        <span className="mt-2 inline-flex size-5 shrink-0 items-center justify-center rounded-full border border-thread text-[0.65rem] font-bold text-thread">
          {index + 1}
        </span>
        <Input
          aria-label={t('choiceText')}
          value={choice.text}
          onChange={(event) => onChange({ ...choice, text: event.target.value }, `${id}-text`)}
          className="font-reading"
        />
        <div className="flex">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label={t('moveUp')}
          >
            <ArrowUp />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
            aria-label={t('moveDown')}
          >
            <ArrowDown />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={onRemove} aria-label={t('removeChoice')}>
            <Trash2 />
          </Button>
        </div>
      </div>

      {choice.test ? null : (
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          {t('target')}
          <TargetSelect
            doc={doc}
            label={t('target')}
            value={choice.to ?? passageId}
            onChange={(to) => onChange({ ...choice, to })}
            onCreate={onCreatePassage}
          />
        </label>
      )}

      <details
        className="group"
        open={Boolean(choice.condition || choice.effects.length || choice.test)}
      >
        <summary className="cursor-pointer text-xs font-semibold text-muted select-none hover:text-ink">
          {t('condition')} · {t('effects')} · {t('test')}
        </summary>
        <div className="mt-3 flex flex-col gap-3">
          <label
            className="flex flex-col gap-1 text-xs font-semibold text-muted"
            htmlFor={`${id}-condition`}
          >
            {t('condition')}
            <ExpressionInput
              id={`${id}-condition`}
              doc={doc}
              value={choice.condition ?? ''}
              placeholder={t('conditionPlaceholder')}
              onChange={(value) => {
                const { condition: _, ...rest } = choice;
                onChange(value.trim() ? { ...rest, condition: value } : rest, `${id}-condition`);
              }}
            />
          </label>
          {choice.condition ? (
            <div className="grid grid-cols-2 gap-2">
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                {t('whenLocked')}
                <select
                  className={selectClass}
                  value={choice.locked ?? doc.settings.lockedChoices}
                  onChange={(event) =>
                    onChange({ ...choice, locked: event.target.value as 'show' | 'hide' })
                  }
                >
                  <option value="show">{t('lockedShow')}</option>
                  <option value="hide">{t('lockedHide')}</option>
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
                {t('lockedHint')}
                <Input
                  value={choice.lockedHint ?? ''}
                  onChange={(event) =>
                    onChange(
                      { ...choice, lockedHint: event.target.value || undefined },
                      `${id}-hint`,
                    )
                  }
                  className="h-9"
                />
              </label>
            </div>
          ) : null}
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={choice.once}
              onChange={(event) => onChange({ ...choice, once: event.target.checked })}
            />{' '}
            {t('once')}
          </label>
          <div className="flex flex-col gap-1">
            <p className="text-xs font-semibold text-muted">{t('effects')}</p>
            <EffectsEditor
              doc={doc}
              effects={choice.effects}
              onChange={(effects) => onChange({ ...choice, effects })}
              idPrefix={id}
            />
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-dashed border-line-strong p-3">
            <Button variant="ghost" size="sm" onClick={toggleTest} className="self-start">
              <Dices /> {choice.test ? t('removeTest') : t('addTest')}
            </Button>
            {choice.test ? (
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-[1fr_5rem] gap-2">
                  <Input
                    aria-label={t('testLabel')}
                    placeholder={t('testLabel')}
                    value={choice.test.label ?? ''}
                    onChange={(event) =>
                      choice.test &&
                      onChange(
                        {
                          ...choice,
                          test: { ...choice.test, label: event.target.value || undefined },
                        },
                        `${id}-label`,
                      )
                    }
                    className="h-9"
                  />
                  <Input
                    aria-label={t('dice')}
                    value={choice.test.dice}
                    onChange={(event) =>
                      choice.test &&
                      onChange(
                        { ...choice, test: { ...choice.test, dice: event.target.value } },
                        `${id}-dice`,
                      )
                    }
                    className="h-9 font-mono"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-muted">{t('compare')}</span>
                  <select
                    aria-label={t('compare')}
                    className="h-9 rounded-md border border-line-strong bg-raised px-2"
                    value={choice.test.compare}
                    onChange={(event) =>
                      choice.test &&
                      onChange({
                        ...choice,
                        test: {
                          ...choice.test,
                          compare: event.target.value as NonNullable<Choice['test']>['compare'],
                        },
                      })
                    }
                  >
                    {(['lte', 'lt', 'gte', 'gt', 'eq'] as const).map((op) => (
                      <option key={op} value={op}>
                        {t(`compareOps.${op}`)}
                      </option>
                    ))}
                  </select>
                  <ExpressionInput
                    id={`${id}-target`}
                    doc={doc}
                    value={choice.test.target}
                    onChange={(target) =>
                      choice.test &&
                      onChange({ ...choice, test: { ...choice.test, target } }, `${id}-target`)
                    }
                    className="w-32"
                  />
                </div>
                {chance !== null ? (
                  <p className="text-xs font-semibold text-thread">
                    {t('successChance', { percent: formatPercent(chance, locale) })}
                  </p>
                ) : null}
                {(['success', 'failure'] as const).map((branch) => {
                  const outcome = choice.test?.[branch];
                  if (!outcome || !choice.test) return null;
                  const test = choice.test;
                  return (
                    <div key={branch} className="flex flex-col gap-2 rounded-md bg-sunken p-2.5">
                      <p
                        className={
                          branch === 'success'
                            ? 'text-xs font-bold text-success'
                            : 'text-xs font-bold text-danger'
                        }
                      >
                        {branch === 'success' ? t('successGoesTo') : t('failureGoesTo')}
                      </p>
                      <TargetSelect
                        doc={doc}
                        label={branch}
                        value={outcome.to}
                        onChange={(to) =>
                          onChange({ ...choice, test: { ...test, [branch]: { ...outcome, to } } })
                        }
                        onCreate={onCreatePassage}
                      />
                      <Input
                        aria-label={branch}
                        placeholder="…"
                        value={outcome.text ?? ''}
                        onChange={(event) =>
                          onChange(
                            {
                              ...choice,
                              test: {
                                ...test,
                                [branch]: { ...outcome, text: event.target.value || undefined },
                              },
                            },
                            `${id}-${branch}-text`,
                          )
                        }
                        className="h-9"
                      />
                      <EffectsEditor
                        doc={doc}
                        effects={outcome.effects}
                        onChange={(effects) =>
                          onChange({
                            ...choice,
                            test: { ...test, [branch]: { ...outcome, effects } },
                          })
                        }
                        idPrefix={`${id}-${branch}`}
                      />
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        </div>
      </details>
    </div>
  );
}
