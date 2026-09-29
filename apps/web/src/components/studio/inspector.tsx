'use client';

import { apiErrorCode } from '@dedale/api-client';
import type { ChoiceSuggestions, Critique } from '@dedale/contracts';
import type { Choice, Effect, Encounter, EndingKind, Passage } from '@dedale/engine';
import { Flag, Home, Plus, Sparkles, Sword, Trash2, Wand2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { api } from '@/lib/api/browser';
import { Button } from '../ui/button';
import { Checkbox, Field, Input, Textarea } from '../ui/field';
import { ChoiceEditor } from './choice-editor';
import { useEditor } from './context';
import { EffectsEditor } from './effects-editor';
import { MarkupEditor } from './markup-editor';

const selectClass =
  'h-9 w-full rounded-md border border-line-strong bg-raised px-2 text-sm outline-none focus-visible:border-thread';

function Section({
  title,
  children,
  icon: Icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: typeof Flag;
}) {
  return (
    <section className="flex flex-col gap-3 border-t border-line pt-4">
      <h3 className="inline-flex items-center gap-1.5 text-xs font-bold tracking-[0.12em] text-subtle uppercase">
        {Icon ? <Icon className="size-3.5" aria-hidden /> : null} {title}
      </h3>
      {children}
    </section>
  );
}

function EncounterEditor({
  passage,
  onChange,
}: {
  passage: Passage;
  onChange: (encounter: Encounter | undefined) => void;
}) {
  const t = useTranslations('studio.editor');
  const doc = useEditor((state) => state.doc);
  const numbers = doc.variables.filter((variable) => variable.type === 'number');
  const encounter = passage.encounter;
  if (!encounter) {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={numbers.length === 0}
        onClick={() =>
          onChange({
            enemies: [{ id: 'adversaire', name: t('encounterEnemy'), skill: 7, stamina: 8 }],
            skillVar: numbers[0]?.id ?? '',
            staminaVar: (numbers[1] ?? numbers[0])?.id ?? '',
            damage: 2,
            enemyDamage: 2,
            victory: { to: passage.id, effects: [] },
            defeat: { to: passage.id, effects: [] },
          })
        }
        className="self-start"
      >
        <Sword /> {t('addEncounter')}
      </Button>
    );
  }
  const targets = doc.passages.map((candidate) => (
    <option key={candidate.id} value={candidate.id}>
      {candidate.title}
    </option>
  ));
  return (
    <div className="flex flex-col gap-3">
      {encounter.enemies.map((enemy, index) => (
        <div key={enemy.id} className="grid grid-cols-[1fr_4rem_4rem] gap-2">
          <Input
            aria-label={t('encounterEnemy')}
            value={enemy.name}
            onChange={(event) =>
              onChange({
                ...encounter,
                enemies: encounter.enemies.map((e, i) =>
                  i === index ? { ...e, name: event.target.value } : e,
                ),
              })
            }
            className="h-9"
          />
          <Input
            aria-label={t('skill')}
            type="number"
            value={enemy.skill}
            onChange={(event) =>
              onChange({
                ...encounter,
                enemies: encounter.enemies.map((e, i) =>
                  i === index ? { ...e, skill: Number(event.target.value) || 0 } : e,
                ),
              })
            }
            className="h-9"
          />
          <Input
            aria-label={t('stamina')}
            type="number"
            value={enemy.stamina}
            onChange={(event) =>
              onChange({
                ...encounter,
                enemies: encounter.enemies.map((e, i) =>
                  i === index ? { ...e, stamina: Math.max(1, Number(event.target.value) || 1) } : e,
                ),
              })
            }
            className="h-9"
          />
        </div>
      ))}
      <div className="grid grid-cols-2 gap-2">
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          {t('skillVar')}
          <select
            className={selectClass}
            value={encounter.skillVar}
            onChange={(event) => onChange({ ...encounter, skillVar: event.target.value })}
          >
            {numbers.map((variable) => (
              <option key={variable.id} value={variable.id}>
                {variable.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
          {t('staminaVar')}
          <select
            className={selectClass}
            value={encounter.staminaVar}
            onChange={(event) => onChange({ ...encounter, staminaVar: event.target.value })}
          >
            {numbers.map((variable) => (
              <option key={variable.id} value={variable.id}>
                {variable.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-success">
          {t('victory')}
          <select
            className={selectClass}
            value={encounter.victory.to}
            onChange={(event) =>
              onChange({ ...encounter, victory: { ...encounter.victory, to: event.target.value } })
            }
          >
            {targets}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-semibold text-danger">
          {t('defeat')}
          <select
            className={selectClass}
            value={encounter.defeat.to}
            onChange={(event) =>
              onChange({ ...encounter, defeat: { ...encounter.defeat, to: event.target.value } })
            }
          >
            {targets}
          </select>
        </label>
      </div>
      <Button variant="ghost" size="sm" className="self-start" onClick={() => onChange(undefined)}>
        <Trash2 /> {t('removeEncounter')}
      </Button>
    </div>
  );
}

function MusePanel({
  passage,
  onAddChoice,
}: {
  passage: Passage;
  onAddChoice: (text: string) => void;
}) {
  const t = useTranslations('studio.editor');
  const storyId = useEditor((state) => state.storyId);
  const [loading, setLoading] = useState<'suggest' | 'critique' | null>(null);
  const [suggestions, setSuggestions] = useState<ChoiceSuggestions['suggestions'] | null>(null);
  const [notes, setNotes] = useState<Critique['notes'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = async (kind: 'suggest' | 'critique') => {
    setLoading(kind);
    setError(null);
    try {
      if (kind === 'suggest')
        setSuggestions(
          (await api.muse.suggestChoices({ storyId, passageId: passage.id })).suggestions,
        );
      else setNotes((await api.muse.critique({ storyId, passageId: passage.id })).notes);
    } catch (caught) {
      setError(
        apiErrorCode(caught) === 'PAYMENT_REQUIRED' ? t('museLocked') : (caught as Error).message,
      );
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs text-muted">{t('museEmpty')}</p>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="subtle"
          size="sm"
          onClick={() => run('suggest')}
          disabled={loading !== null}
        >
          <Wand2 /> {t('museSuggest')}
        </Button>
        <Button
          variant="subtle"
          size="sm"
          onClick={() => run('critique')}
          disabled={loading !== null}
        >
          <Sparkles /> {t('museCritique')}
        </Button>
      </div>
      {loading ? <p className="animate-pulse text-sm text-muted">Muse…</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {suggestions ? (
        <ul className="flex flex-col gap-2">
          {suggestions.map((suggestion) => (
            <li
              key={suggestion.text}
              className="flex items-start justify-between gap-2 rounded-md bg-sunken p-2.5"
            >
              <div>
                <p className="font-reading font-semibold">{suggestion.text}</p>
                <p className="text-xs text-muted">{suggestion.direction}</p>
              </div>
              <Button
                size="icon-sm"
                variant="ghost"
                aria-label={t('museAdd')}
                onClick={() => onAddChoice(suggestion.text)}
              >
                <Plus />
              </Button>
            </li>
          ))}
        </ul>
      ) : null}
      {notes ? (
        <ul className="flex flex-col gap-2">
          {notes.map((note) => (
            <li key={`${note.kind}-${note.comment}`} className="rounded-md bg-sunken p-2.5 text-sm">
              <span className="mr-2 rounded bg-raised px-1.5 py-0.5 font-mono text-[0.65rem] uppercase">
                {note.kind}
              </span>
              {note.excerpt ? <q className="text-muted italic">{note.excerpt}</q> : null}
              <p className="mt-1">{note.comment}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

/** Panneau d'édition du passage sélectionné. */
export function Inspector() {
  const t = useTranslations();
  const doc = useEditor((state) => state.doc);
  const selectedId = useEditor((state) => state.selectedId);
  const update = useEditor((state) => state.update);
  const addPassage = useEditor((state) => state.addPassage);
  const addChoice = useEditor((state) => state.addChoice);
  const deletePassage = useEditor((state) => state.deletePassage);
  const passage = doc.passages.find((candidate) => candidate.id === selectedId);

  if (!passage) {
    return <p className="p-6 text-sm text-muted">{t('studio.editor.noSelection')}</p>;
  }

  const edit = (mutate: (draft: Passage) => void, coalesce?: string) =>
    update(
      (draft) => {
        const target = draft.passages.find((candidate) => candidate.id === passage.id);
        if (target) mutate(target as Passage);
      },
      coalesce ? { coalesce: `${passage.id}-${coalesce}` } : undefined,
    );

  const createNear = () => {
    const position = passage.position ?? { x: 0, y: 0 };
    return addPassage({ x: position.x + 60, y: position.y + 220 });
  };

  const setChoice = (index: number, choice: Choice, coalesce?: string) =>
    edit((draft) => {
      draft.choices[index] = choice;
    }, coalesce);

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex flex-col gap-3">
        <Field label={t('studio.editor.passageTitle')} htmlFor="passage-title">
          <Input
            id="passage-title"
            value={passage.title}
            onChange={(event) =>
              edit((draft) => {
                draft.title = event.target.value;
              }, 'title')
            }
            className="font-display text-lg font-semibold"
          />
        </Field>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {doc.start === passage.id ? (
            <span className="inline-flex items-center gap-1 font-semibold text-thread">
              <Home className="size-4" aria-hidden /> {t('studio.editor.start')}
            </span>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() =>
                update((draft) => {
                  draft.start = passage.id;
                })
              }
            >
              <Home /> {t('studio.editor.setStart')}
            </Button>
          )}
          <label className="flex items-center gap-2">
            <Checkbox
              checked={passage.checkpoint}
              onChange={(event) =>
                edit((draft) => {
                  draft.checkpoint = event.target.checked;
                })
              }
            />{' '}
            {t('studio.editor.checkpoint')}
          </label>
          <span className="ml-auto font-mono text-xs text-subtle">#{passage.id}</span>
        </div>
      </div>

      <MarkupEditor
        doc={doc}
        id="passage-text"
        value={passage.text}
        onChange={(text) =>
          edit((draft) => {
            draft.text = text;
          }, 'text')
        }
      />

      <Section title={t('studio.editor.onEnter')}>
        <EffectsEditor
          doc={doc}
          effects={passage.onEnter}
          idPrefix={`${passage.id}-enter`}
          onChange={(effects: Effect[]) =>
            edit((draft) => {
              draft.onEnter = effects;
            })
          }
        />
      </Section>

      <Section title={t('studio.editor.ending')} icon={Flag}>
        <label className="flex items-center gap-2 text-sm">
          <Checkbox
            checked={Boolean(passage.ending)}
            onChange={(event) =>
              edit((draft) => {
                if (event.target.checked) draft.ending = { kind: 'neutral', title: passage.title };
                else delete draft.ending;
              })
            }
          />
          {t('studio.editor.isEnding')}
        </label>
        {passage.ending ? (
          <div className="grid grid-cols-[1fr_9rem] gap-2">
            <Input
              aria-label={t('studio.editor.endingTitle')}
              value={passage.ending.title}
              onChange={(event) =>
                edit((draft) => {
                  if (draft.ending) draft.ending.title = event.target.value;
                }, 'ending-title')
              }
              className="h-9"
            />
            <select
              aria-label={t('studio.editor.endingKind')}
              className={selectClass}
              value={passage.ending.kind}
              onChange={(event) =>
                edit((draft) => {
                  if (draft.ending) draft.ending.kind = event.target.value as EndingKind;
                })
              }
            >
              {(['victory', 'defeat', 'death', 'neutral', 'secret'] as const).map((kind) => (
                <option key={kind} value={kind}>
                  {t(`endings.${kind}`)}
                </option>
              ))}
            </select>
          </div>
        ) : null}
      </Section>

      {!passage.ending ? (
        <>
          <Section title={t('studio.editor.choices')}>
            {passage.choices.map((choice, index) => (
              <ChoiceEditor
                key={choice.id}
                doc={doc}
                passageId={passage.id}
                choice={choice}
                index={index}
                count={passage.choices.length}
                onChange={(next, coalesce) => setChoice(index, next, coalesce)}
                onRemove={() => edit((draft) => void draft.choices.splice(index, 1))}
                onMove={(delta) =>
                  edit((draft) => {
                    const [moved] = draft.choices.splice(index, 1);
                    if (moved) draft.choices.splice(index + delta, 0, moved);
                  })
                }
                onCreatePassage={createNear}
              />
            ))}
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => addChoice(passage.id, createNear())}
            >
              <Plus /> {t('studio.editor.addChoice')}
            </Button>
          </Section>
          <Section title={t('studio.editor.encounter')} icon={Sword}>
            <EncounterEditor
              passage={passage}
              onChange={(encounter) =>
                edit((draft) => {
                  if (encounter) draft.encounter = encounter;
                  else delete draft.encounter;
                })
              }
            />
          </Section>
          <Section title={t('studio.editor.muse')} icon={Sparkles}>
            <MusePanel
              passage={passage}
              onAddChoice={(text) => addChoice(passage.id, createNear(), text)}
            />
          </Section>
        </>
      ) : null}

      <Section title={t('studio.editor.notes')}>
        <Textarea
          aria-label={t('studio.editor.notes')}
          value={passage.notes ?? ''}
          onChange={(event) =>
            edit((draft) => {
              draft.notes = event.target.value || undefined;
            }, 'notes')
          }
        />
      </Section>

      {doc.start !== passage.id ? (
        <Button
          variant="ghost"
          className="self-start text-danger"
          onClick={() => {
            if (window.confirm(t('studio.editor.deleteConfirm', { title: passage.title })))
              deletePassage(passage.id);
          }}
        >
          <Trash2 /> {t('studio.editor.deletePassage')}
        </Button>
      ) : null}
    </div>
  );
}
