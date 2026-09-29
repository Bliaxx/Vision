'use client';

import {
  ACCESS_MODELS,
  AGE_RATINGS,
  AI_USAGES,
  CONTENT_WARNINGS,
  GENRES,
  LICENSES,
  type StoryMeta,
  StoryMetaSchema,
} from '@dedale/contracts';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api/browser';
import { cn } from '@/lib/cn';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';
import { Field, Input, NativeSelect, Textarea } from '../ui/field';
import { useEditor } from './context';

function Chips<T extends string>({
  options,
  value,
  onChange,
  label,
  max,
}: {
  options: readonly T[];
  value: readonly T[];
  onChange: (next: T[]) => void;
  label: (option: T) => string;
  max?: number;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((option) => {
        const active = value.includes(option);
        const disabled = !active && max !== undefined && value.length >= max;
        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            disabled={disabled}
            onClick={() =>
              onChange(active ? value.filter((entry) => entry !== option) : [...value, option])
            }
            className={cn(
              'cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40',
              active
                ? 'border-thread bg-thread text-on-thread'
                : 'border-line-strong text-muted hover:border-ink/40 hover:text-ink',
            )}
          >
            {label(option)}
          </button>
        );
      })}
    </div>
  );
}

/** Fiche du livre : tout ce que le lecteur voit avant d'ouvrir la première page. */
export function MetaDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations('studio.meta');
  const tc = useTranslations('common');
  const ts = useTranslations('studio');
  const tg = useTranslations('genres');
  const ta = useTranslations('ageRatings');
  const tw = useTranslations('contentWarnings');
  const tl = useTranslations('licenses');
  const tai = useTranslations('aiUsage');
  const tac = useTranslations('access');
  const storyId = useEditor((state) => state.storyId);
  const meta = useEditor((state) => state.meta);
  const setMeta = useEditor((state) => state.setMeta);
  const [form, setForm] = useState<StoryMeta>(meta);
  const [tagsText, setTagsText] = useState(meta.tags.join(', '));
  const id = useId();

  const save = useMutation({
    mutationFn: (next: StoryMeta) => api.authoring.updateMeta({ id: storyId, meta: next }),
    onSuccess: (saved) => {
      setMeta(saved);
      toast.success(tc('saved'));
      onOpenChange(false);
    },
    onError: () => toast.error(tc('error')),
  });

  const candidate: StoryMeta = {
    ...form,
    tags: tagsText
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 10),
    priceCents: form.access === 'paid' ? (form.priceCents ?? 299) : null,
  };
  const parsed = StoryMetaSchema.safeParse(candidate);
  const issue = (path: string) =>
    parsed.success
      ? undefined
      : parsed.error.issues.find((entry) => entry.path[0] === path)?.message;
  const set = <K extends keyof StoryMeta>(key: K, value: StoryMeta[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setForm(meta);
          setTagsText(meta.tags.join(', '));
        }
        onOpenChange(next);
      }}
    >
      <DialogContent title={t('title')} side="right" className="max-w-xl">
        <form
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            if (parsed.success) save.mutate(parsed.data);
          }}
        >
          <Field label={ts('storyTitle')} htmlFor={`${id}-title`} error={issue('title')}>
            <Input
              id={`${id}-title`}
              value={form.title}
              onChange={(event) => set('title', event.target.value)}
              className="font-display text-lg"
            />
          </Field>
          <Field
            label={t('tagline')}
            hint={t('taglineHint')}
            htmlFor={`${id}-tagline`}
            error={issue('tagline')}
          >
            <Input
              id={`${id}-tagline`}
              maxLength={160}
              value={form.tagline ?? ''}
              onChange={(event) => set('tagline', event.target.value || null)}
            />
          </Field>
          <Field label={t('synopsis')} htmlFor={`${id}-synopsis`} error={issue('synopsis')}>
            <Textarea
              id={`${id}-synopsis`}
              rows={6}
              value={form.synopsis}
              onChange={(event) => set('synopsis', event.target.value)}
              className="font-reading"
            />
          </Field>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold">{t('genres')}</p>
            <Chips
              options={GENRES}
              value={form.genres}
              onChange={(genres) => set('genres', genres)}
              label={(genre) => tg(genre)}
              max={3}
            />
          </div>
          <Field label={t('tags')} hint={t('tagsHint')} htmlFor={`${id}-tags`}>
            <Input
              id={`${id}-tags`}
              value={tagsText}
              onChange={(event) => setTagsText(event.target.value)}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('ageRating')} htmlFor={`${id}-age`}>
              <NativeSelect
                id={`${id}-age`}
                value={form.ageRating}
                onChange={(event) => set('ageRating', event.target.value as StoryMeta['ageRating'])}
              >
                {AGE_RATINGS.map((rating) => (
                  <option key={rating} value={rating}>
                    {ta(rating)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t('license')} htmlFor={`${id}-license`}>
              <NativeSelect
                id={`${id}-license`}
                value={form.license}
                onChange={(event) => set('license', event.target.value as StoryMeta['license'])}
              >
                {LICENSES.map((license) => (
                  <option key={license} value={license}>
                    {tl(license)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-semibold">{t('contentWarnings')}</p>
            <Chips
              options={CONTENT_WARNINGS}
              value={form.contentWarnings}
              onChange={(warnings) => set('contentWarnings', warnings)}
              label={(warning) => tw(warning)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t('access')} htmlFor={`${id}-access`}>
              <NativeSelect
                id={`${id}-access`}
                value={form.access}
                onChange={(event) => set('access', event.target.value as StoryMeta['access'])}
              >
                {ACCESS_MODELS.map((access) => (
                  <option key={access} value={access}>
                    {tac(access)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            {form.access === 'paid' ? (
              <Field label={t('price')} htmlFor={`${id}-price`} error={issue('priceCents')}>
                <Input
                  id={`${id}-price`}
                  type="number"
                  inputMode="decimal"
                  min={0.99}
                  max={49.99}
                  step={0.01}
                  value={((form.priceCents ?? 299) / 100).toFixed(2)}
                  onChange={(event) =>
                    set('priceCents', Math.round(Number(event.target.value) * 100))
                  }
                />
              </Field>
            ) : null}
          </div>
          <Field label={t('aiUsage')} htmlFor={`${id}-ai`}>
            <NativeSelect
              id={`${id}-ai`}
              value={form.aiUsage}
              onChange={(event) => set('aiUsage', event.target.value as StoryMeta['aiUsage'])}
            >
              {AI_USAGES.map((usage) => (
                <option key={usage} value={usage}>
                  {tai(usage)}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label={t('coverUrl')} htmlFor={`${id}-cover`} error={issue('coverUrl')}>
            <Input
              id={`${id}-cover`}
              type="url"
              placeholder="https://"
              value={form.coverUrl ?? ''}
              onChange={(event) => set('coverUrl', event.target.value || null)}
            />
          </Field>
          <div className="sticky -bottom-6 -mx-6 -mb-6 flex justify-end gap-2 border-t border-line bg-surface px-6 py-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={!parsed.success || save.isPending}>
              {save.isPending ? tc('saving') : tc('save')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
