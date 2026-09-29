'use client';

import { createId, type Diagnostic, slugifyId, type VariableType } from '@dedale/engine';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, Plus, Search, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { cn } from '@/lib/cn';
import { EndingIcon } from '../story/badges';
import { Button } from '../ui/button';
import { Checkbox, Input } from '../ui/field';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { useEditor } from './context';
import { ExpressionInput } from './expression-input';

const small = 'h-8 text-xs';
const selectClass =
  'h-8 w-full rounded-md border border-line-strong bg-raised px-1.5 text-xs outline-none focus-visible:border-thread';

/** Identifiant de symbole unique à partir d'un libellé (`Pièce d'or` → `piece_d_or`). */
function symbolId(label: string, taken: ReadonlySet<string>): string {
  const base = slugifyId(label, 'symbole').replace(/-/g, '_');
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}_${n}`;
  return id;
}

/** Diagnostic du moteur (local) ou renvoyé par le serveur à la publication. */
type DiagnosticLike = Omit<Diagnostic, 'code'> & { readonly code: string };

export function DiagnosticsList({ diagnostics }: { diagnostics: readonly DiagnosticLike[] }) {
  const t = useTranslations();
  const doc = useEditor((state) => state.doc);
  const select = useEditor((state) => state.select);
  if (diagnostics.length === 0) {
    return (
      <p className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm font-semibold text-success">
        <CheckCircle2 className="size-4" aria-hidden /> {t('studio.editor.noIssues')}
      </p>
    );
  }
  const title = (id: string | undefined) =>
    doc.passages.find((passage) => passage.id === id)?.title;
  return (
    <ul className="flex flex-col gap-1.5">
      {diagnostics.map((diagnostic, index) => {
        const Icon =
          diagnostic.severity === 'error'
            ? AlertCircle
            : diagnostic.severity === 'warning'
              ? AlertTriangle
              : Info;
        const known = t.has(`diagnostics.${diagnostic.code}` as 'diagnostics.dead_end');
        return (
          <li key={`${diagnostic.code}-${diagnostic.passage}-${diagnostic.choice}-${index}`}>
            <button
              type="button"
              onClick={() => diagnostic.passage && select(diagnostic.passage)}
              className="flex w-full cursor-pointer items-start gap-2 rounded-md p-2 text-left text-xs hover:bg-sunken"
            >
              <Icon
                className={cn(
                  'mt-0.5 size-3.5 shrink-0',
                  diagnostic.severity === 'error'
                    ? 'text-danger'
                    : diagnostic.severity === 'warning'
                      ? 'text-warning'
                      : 'text-info',
                )}
                aria-label={diagnostic.severity}
              />
              <span className="flex flex-col">
                <span className="font-semibold">
                  {known
                    ? t(`diagnostics.${diagnostic.code}` as 'diagnostics.dead_end', {
                        ref: diagnostic.ref ?? '',
                      })
                    : diagnostic.message}
                </span>
                {diagnostic.passage ? (
                  <span className="text-subtle">
                    {title(diagnostic.passage) ?? diagnostic.passage}
                  </span>
                ) : null}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PassagesPanel() {
  const t = useTranslations('studio.editor');
  const doc = useEditor((state) => state.doc);
  const selectedId = useEditor((state) => state.selectedId);
  const select = useEditor((state) => state.select);
  const addPassage = useEditor((state) => state.addPassage);
  const analysis = useEditor((state) => state.analysis);
  const [query, setQuery] = useState('');
  const normalized = query.toLowerCase();
  const passages = doc.passages.filter(
    (passage) =>
      !normalized ||
      passage.title.toLowerCase().includes(normalized) ||
      passage.text.toLowerCase().includes(normalized),
  );
  const withIssue = new Set(
    analysis.diagnostics.filter((d) => d.severity === 'error').map((d) => d.passage),
  );
  return (
    <div className="flex flex-col gap-3">
      <label className="relative">
        <span className="sr-only">{t('searchPassages')}</span>
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-subtle"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('searchPassages')}
          className="h-8 pl-8 text-xs"
        />
      </label>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => addPassage()} className="flex-1">
          <Plus /> {t('addPassage')}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => addPassage(undefined, { ending: true })}
          aria-label={t('addEnding')}
        >
          <EndingIcon kind="neutral" />
        </Button>
      </div>
      <ul className="flex flex-col">
        {passages.map((passage) => (
          <li key={passage.id}>
            <button
              type="button"
              onClick={() => select(passage.id)}
              className={cn(
                'flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm',
                passage.id === selectedId
                  ? 'bg-thread-soft font-semibold text-thread'
                  : 'hover:bg-sunken',
              )}
            >
              {passage.ending ? (
                <EndingIcon kind={passage.ending.kind} className="size-3.5" />
              ) : (
                <span
                  className="size-3.5 shrink-0 rounded-full border border-line-strong"
                  aria-hidden
                />
              )}
              <span className="truncate">{passage.title}</span>
              {withIssue.has(passage.id) ? (
                <AlertCircle className="ml-auto size-3.5 shrink-0 text-danger" aria-hidden />
              ) : null}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function VariablesPanel() {
  const t = useTranslations('studio.editor.variable');
  const tc = useTranslations('common');
  const doc = useEditor((state) => state.doc);
  const update = useEditor((state) => state.update);
  const add = () =>
    update((draft) => {
      const id = symbolId('variable', new Set(draft.variables.map((variable) => variable.id)));
      draft.variables.push({ id, name: id, type: 'number', initial: 0, visible: true });
    });
  return (
    <div className="flex flex-col gap-3">
      {doc.variables.map((variable, index) => (
        <div
          key={variable.id}
          className="flex flex-col gap-1.5 rounded-md border border-line bg-surface p-2"
        >
          <div className="grid grid-cols-2 gap-1.5">
            <Input
              aria-label={t('name')}
              value={variable.name}
              className={small}
              onChange={(event) =>
                update(
                  (draft) => {
                    if (draft.variables[index]) draft.variables[index].name = event.target.value;
                  },
                  { coalesce: `var-${index}-name` },
                )
              }
            />
            <Input
              aria-label={t('id')}
              value={variable.id}
              className={cn(small, 'font-mono')}
              readOnly
              title={t('id')}
            />
            <select
              aria-label={t('type')}
              className={selectClass}
              value={variable.type}
              onChange={(event) =>
                update((draft) => {
                  const target = draft.variables[index];
                  if (!target) return;
                  target.type = event.target.value as VariableType;
                  target.initial =
                    target.type === 'number' ? 0 : target.type === 'boolean' ? false : '';
                })
              }
            >
              <option value="number">{t('number')}</option>
              <option value="boolean">{t('boolean')}</option>
              <option value="text">{t('text')}</option>
            </select>
            {variable.type === 'boolean' ? (
              <label className="flex items-center gap-1.5 text-xs">
                <Checkbox
                  checked={variable.initial === true}
                  onChange={(event) =>
                    update((draft) => {
                      if (draft.variables[index])
                        draft.variables[index].initial = event.target.checked;
                    })
                  }
                />{' '}
                {t('initial')}
              </label>
            ) : (
              <Input
                aria-label={t('initial')}
                className={small}
                value={String(variable.initial)}
                type={variable.type === 'number' ? 'number' : 'text'}
                onChange={(event) =>
                  update(
                    (draft) => {
                      if (draft.variables[index])
                        draft.variables[index].initial =
                          variable.type === 'number'
                            ? Number(event.target.value) || 0
                            : event.target.value;
                    },
                    { coalesce: `var-${index}-initial` },
                  )
                }
              />
            )}
          </div>
          {variable.type === 'number' ? (
            <div className="grid grid-cols-2 gap-1.5">
              <Input
                aria-label={t('min')}
                placeholder={t('min')}
                className={small}
                type="number"
                value={variable.min ?? ''}
                onChange={(event) =>
                  update((draft) => {
                    const target = draft.variables[index];
                    if (target)
                      target.min =
                        event.target.value === '' ? undefined : Number(event.target.value);
                  })
                }
              />
              <Input
                aria-label={t('max')}
                placeholder={t('max')}
                className={small}
                type="number"
                value={variable.max ?? ''}
                onChange={(event) =>
                  update((draft) => {
                    const target = draft.variables[index];
                    if (target)
                      target.max =
                        event.target.value === '' ? undefined : Number(event.target.value);
                  })
                }
              />
            </div>
          ) : null}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-1.5 text-xs">
              <Checkbox
                checked={variable.visible}
                onChange={(event) =>
                  update((draft) => {
                    if (draft.variables[index])
                      draft.variables[index].visible = event.target.checked;
                  })
                }
              />{' '}
              {t('visible')}
            </label>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label={tc('remove')}
              onClick={() => update((draft) => void draft.variables.splice(index, 1))}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      <Button size="sm" variant="secondary" onClick={add}>
        <Plus /> {t('add')}
      </Button>
    </div>
  );
}

function ItemsPanel() {
  const t = useTranslations('studio.editor.item');
  const tc = useTranslations('common');
  const doc = useEditor((state) => state.doc);
  const update = useEditor((state) => state.update);
  return (
    <div className="flex flex-col gap-3">
      {doc.items.map((item, index) => (
        <div
          key={item.id}
          className="flex flex-col gap-1.5 rounded-md border border-line bg-surface p-2"
        >
          <div className="grid grid-cols-2 gap-1.5">
            <Input
              aria-label={t('name')}
              value={item.name}
              className={small}
              onChange={(event) =>
                update(
                  (draft) => {
                    if (draft.items[index]) draft.items[index].name = event.target.value;
                  },
                  { coalesce: `item-${index}` },
                )
              }
            />
            <Input
              aria-label={t('id')}
              value={item.id}
              className={cn(small, 'font-mono')}
              readOnly
            />
          </div>
          <Input
            aria-label={t('description')}
            placeholder={t('description')}
            value={item.description ?? ''}
            className={small}
            onChange={(event) =>
              update(
                (draft) => {
                  const target = draft.items[index];
                  if (target) target.description = event.target.value || undefined;
                },
                { coalesce: `item-${index}-desc` },
              )
            }
          />
          <div className="flex items-center gap-3 text-xs">
            <label className="flex items-center gap-1.5">
              <Checkbox
                checked={item.stackable}
                onChange={(event) =>
                  update((draft) => {
                    if (draft.items[index]) draft.items[index].stackable = event.target.checked;
                  })
                }
              />{' '}
              {t('stackable')}
            </label>
            <label className="flex items-center gap-1.5">
              <Checkbox
                checked={item.hidden}
                onChange={(event) =>
                  update((draft) => {
                    if (draft.items[index]) draft.items[index].hidden = event.target.checked;
                  })
                }
              />{' '}
              {t('hidden')}
            </label>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto"
              aria-label={tc('remove')}
              onClick={() => update((draft) => void draft.items.splice(index, 1))}
            >
              <Trash2 />
            </Button>
          </div>
        </div>
      ))}
      <Button
        size="sm"
        variant="secondary"
        onClick={() =>
          update((draft) => {
            const id = symbolId('objet', new Set(draft.items.map((item) => item.id)));
            draft.items.push({ id, name: id, stackable: false, hidden: false });
          })
        }
      >
        <Plus /> {t('add')}
      </Button>
    </div>
  );
}

function AchievementsAndRulesPanel() {
  const t = useTranslations('studio.editor');
  const tc = useTranslations('common');
  const doc = useEditor((state) => state.doc);
  const update = useEditor((state) => state.update);
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-[0.12em] text-subtle uppercase">
          {t('achievements')}
        </p>
        {doc.achievements.map((achievement, index) => (
          <div
            key={achievement.id}
            className="flex flex-col gap-1.5 rounded-md border border-line bg-surface p-2"
          >
            <Input
              aria-label={t('item.name')}
              value={achievement.name}
              className={small}
              onChange={(event) =>
                update(
                  (draft) => {
                    if (draft.achievements[index])
                      draft.achievements[index].name = event.target.value;
                  },
                  { coalesce: `ach-${index}` },
                )
              }
            />
            <Input
              aria-label={t('item.description')}
              value={achievement.description}
              className={small}
              onChange={(event) =>
                update(
                  (draft) => {
                    if (draft.achievements[index])
                      draft.achievements[index].description = event.target.value;
                  },
                  { coalesce: `ach-${index}-d` },
                )
              }
            />
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5">
                <Checkbox
                  checked={achievement.secret}
                  onChange={(event) =>
                    update((draft) => {
                      if (draft.achievements[index])
                        draft.achievements[index].secret = event.target.checked;
                    })
                  }
                />{' '}
                {t('achievement.secret')}
              </label>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={tc('remove')}
                onClick={() => update((draft) => void draft.achievements.splice(index, 1))}
              >
                <Trash2 />
              </Button>
            </div>
          </div>
        ))}
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            update((draft) => {
              const id = symbolId('succes', new Set(draft.achievements.map((a) => a.id)));
              draft.achievements.push({ id, name: id, description: '', secret: false });
            })
          }
        >
          <Plus /> {t('achievement.add')}
        </Button>
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-bold tracking-[0.12em] text-subtle uppercase">{t('rules')}</p>
        <p className="text-xs text-muted">{t('rule.hint')}</p>
        {doc.rules.map((rule, index) => (
          <div
            key={rule.id}
            className="flex flex-col gap-1.5 rounded-md border border-line bg-surface p-2"
          >
            <ExpressionInput
              id={`rule-${rule.id}`}
              doc={doc}
              value={rule.when}
              onChange={(when) =>
                update(
                  (draft) => {
                    if (draft.rules[index]) draft.rules[index].when = when;
                  },
                  {
                    coalesce: `rule-${index}`,
                  },
                )
              }
            />
            <select
              aria-label={t('rule.goto')}
              className={selectClass}
              value={rule.goto}
              onChange={(event) =>
                update((draft) => {
                  if (draft.rules[index]) draft.rules[index].goto = event.target.value;
                })
              }
            >
              {doc.passages.map((passage) => (
                <option key={passage.id} value={passage.id}>
                  {passage.title}
                </option>
              ))}
            </select>
            <Button
              variant="ghost"
              size="icon-sm"
              className="self-end"
              aria-label={tc('remove')}
              onClick={() => update((draft) => void draft.rules.splice(index, 1))}
            >
              <Trash2 />
            </Button>
          </div>
        ))}
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            update((draft) => {
              const ending =
                draft.passages.find((passage) => passage.ending?.kind === 'death') ??
                draft.passages[0];
              draft.rules.push({
                id: createId('r', new Set(draft.rules.map((r) => r.id))),
                when: `${draft.variables.find((v) => v.type === 'number')?.id ?? 'true'} <= 0`,
                goto: ending?.id ?? draft.start,
                once: true,
              });
            })
          }
        >
          <Plus /> {t('rule.add')}
        </Button>
      </div>
    </div>
  );
}

function SettingsPanel() {
  const t = useTranslations('studio.editor.settings');
  const doc = useEditor((state) => state.doc);
  const update = useEditor((state) => state.update);
  return (
    <div className="flex flex-col gap-4 text-sm">
      <label className="flex flex-col gap-1 font-semibold">
        {t('rewind')}
        <select
          className={selectClass}
          value={doc.settings.rewind}
          onChange={(event) =>
            update((draft) => {
              draft.settings.rewind = event.target.value as typeof doc.settings.rewind;
            })
          }
        >
          <option value="free">{t('rewindFree')}</option>
          <option value="checkpoint">{t('rewindCheckpoint')}</option>
          <option value="none">{t('rewindNone')}</option>
        </select>
      </label>
      <label className="flex items-center gap-2">
        <Checkbox
          checked={doc.settings.showChoiceStats}
          onChange={(event) =>
            update((draft) => {
              draft.settings.showChoiceStats = event.target.checked;
            })
          }
        />{' '}
        {t('choiceStats')}
      </label>
    </div>
  );
}

export function Sidebar() {
  const t = useTranslations('studio.editor');
  const analysis = useEditor((state) => state.analysis);
  return (
    <Tabs defaultValue="passages" className="flex h-full flex-col">
      <TabsList className="shrink-0 overflow-x-auto px-3">
        <TabsTrigger value="passages">{t('passages')}</TabsTrigger>
        <TabsTrigger value="variables">{t('variables')}</TabsTrigger>
        <TabsTrigger value="items">{t('items')}</TabsTrigger>
        <TabsTrigger value="more">{t('rules')}</TabsTrigger>
        <TabsTrigger value="checks">
          {t('diagnostics')}
          {analysis.errors > 0 ? (
            <span className="ml-1 rounded-full bg-danger px-1.5 text-[0.65rem] text-white">
              {analysis.errors}
            </span>
          ) : null}
        </TabsTrigger>
      </TabsList>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        <TabsContent value="passages">
          <PassagesPanel />
        </TabsContent>
        <TabsContent value="variables">
          <VariablesPanel />
        </TabsContent>
        <TabsContent value="items">
          <ItemsPanel />
        </TabsContent>
        <TabsContent value="more">
          <AchievementsAndRulesPanel />
          <div className="mt-6">
            <SettingsPanel />
          </div>
        </TabsContent>
        <TabsContent value="checks">
          <DiagnosticsList diagnostics={analysis.diagnostics} />
        </TabsContent>
      </div>
    </Tabs>
  );
}
