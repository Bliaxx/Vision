'use client';

import { GENRES, type Genre } from '@dedale/contracts';
import { localeNames, locales } from '@dedale/i18n';
import { useMutation } from '@tanstack/react-query';
import { FileUp, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/browser';
import { cn } from '@/lib/cn';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { Field, Input, NativeSelect, Textarea } from '../ui/field';

type Template = 'classic' | 'blank';

export function NewStoryButton({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const t = useTranslations('studio');
  const tc = useTranslations('common');
  const tg = useTranslations('genres');
  const tn = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [language, setLanguage] = useState<string>(locale);
  const [genre, setGenre] = useState<Genre>('adventure');
  const [template, setTemplate] = useState<Template>('classic');

  const create = useMutation({
    mutationFn: () =>
      api.authoring.create({ title: title.trim(), language, genres: [genre], template }),
    onSuccess: ({ id: storyId }) =>
      router.push({ pathname: '/studio/[id]', params: { id: storyId } }),
    onError: () => toast.error(tc('error')),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={size}>
          <Plus /> {t('newStory')}
        </Button>
      </DialogTrigger>
      <DialogContent title={t('newStoryTitle')}>
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (title.trim()) create.mutate();
          }}
        >
          <Field label={t('storyTitle')} htmlFor={`${id}-title`}>
            <Input
              id={`${id}-title`}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={120}
              required
              autoFocus
              className="font-display text-lg"
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={tn('language')} htmlFor={`${id}-language`}>
              <NativeSelect
                id={`${id}-language`}
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
              >
                {locales.map((code) => (
                  <option key={code} value={code}>
                    {localeNames[code]}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label={t('genre')} htmlFor={`${id}-genre`}>
              <NativeSelect
                id={`${id}-genre`}
                value={genre}
                onChange={(event) => setGenre(event.target.value as Genre)}
              >
                {GENRES.map((option) => (
                  <option key={option} value={option}>
                    {tg(option)}
                  </option>
                ))}
              </NativeSelect>
            </Field>
          </div>
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 text-sm font-semibold">{t('template')}</legend>
            {(['classic', 'blank'] as const).map((option) => (
              <label
                key={option}
                className={cn(
                  'flex cursor-pointer flex-col gap-0.5 rounded-lg border p-3 transition-colors',
                  template === option
                    ? 'border-thread bg-thread-soft'
                    : 'border-line hover:border-line-strong',
                )}
              >
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <input
                    type="radio"
                    name={`${id}-template`}
                    checked={template === option}
                    onChange={() => setTemplate(option)}
                    className="accent-[var(--dd-accent)]"
                  />
                  {t(option === 'classic' ? 'templateClassic' : 'templateBlank')}
                </span>
                <span className="pl-6 text-xs text-muted">
                  {t(option === 'classic' ? 'templateClassicHint' : 'templateBlankHint')}
                </span>
              </label>
            ))}
          </fieldset>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={!title.trim() || create.isPending}>
              {create.isPending ? tc('loading') : tc('continue')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function ImportTwineButton() {
  const t = useTranslations('studio');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState('');

  const importStory = useMutation({
    mutationFn: () => api.authoring.importTwee({ source, language: locale }),
    onSuccess: ({ id: storyId, warnings }) => {
      if (warnings.length > 0) toast.message(t('importWarnings', { count: warnings.length }));
      router.push({ pathname: '/studio/[id]', params: { id: storyId } });
    },
    onError: () => toast.error(tc('error')),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <FileUp /> {t('importTwine')}
        </Button>
      </DialogTrigger>
      <DialogContent title={t('importTwine')} description={t('importHint')} className="max-w-2xl">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (source.trim()) importStory.mutate();
          }}
        >
          <Field label=".twee" htmlFor={`${id}-source`}>
            <Textarea
              id={`${id}-source`}
              rows={12}
              value={source}
              onChange={(event) => setSource(event.target.value)}
              className="font-mono text-xs"
              spellCheck={false}
            />
          </Field>
          <input
            type="file"
            accept=".twee,.tw,.txt"
            aria-label=".twee"
            className="text-sm text-muted file:mr-3 file:cursor-pointer file:rounded-md file:border file:border-line-strong file:bg-raised file:px-3 file:py-1.5 file:text-sm file:font-semibold"
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (file) setSource(await file.text());
            }}
          />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {tc('cancel')}
            </Button>
            <Button type="submit" disabled={!source.trim() || importStory.isPending}>
              {importStory.isPending ? tc('loading') : tc('continue')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
