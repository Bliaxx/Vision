'use client';

import { isDefinedError, safe } from '@dedale/api-client';
import type { AnalysisSummary } from '@dedale/contracts';
import { useMutation } from '@tanstack/react-query';
import { BookCheck, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api/browser';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';
import { Field, Textarea } from '../ui/field';
import { useEditor } from './context';
import { DiagnosticsList } from './sidebar';

type Visibility = 'public' | 'unlisted';

/**
 * Publication d'une nouvelle édition immuable. Le brouillon est d'abord
 * enregistré (`flush`), puis le serveur ré-analyse le récit : c'est lui qui a
 * le dernier mot sur ce qui est publiable.
 */
export function PublishDialog({
  open,
  onOpenChange,
  flush,
  privatePublishing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  flush: () => Promise<boolean>;
  privatePublishing: boolean;
}) {
  const t = useTranslations('studio.publishDialog');
  const tc = useTranslations('common');
  const storyId = useEditor((state) => state.storyId);
  const slug = useEditor((state) => state.slug);
  const title = useEditor((state) => state.meta.title);
  const status = useEditor((state) => state.status);
  const analysis = useEditor((state) => state.analysis);
  const setStatus = useEditor((state) => state.setStatus);
  const [changelog, setChangelog] = useState('');
  const [visibility, setVisibility] = useState<Visibility>(
    status === 'unlisted' && privatePublishing ? 'unlisted' : 'public',
  );
  const [serverReport, setServerReport] = useState<AnalysisSummary | null>(null);
  const [published, setPublished] = useState<number | null>(null);
  const id = useId();

  const blocking = analysis.diagnostics.filter((diagnostic) => diagnostic.severity === 'error');

  const publish = useMutation({
    mutationFn: async () => {
      if (!(await flush())) throw new Error('flush');
      const [error, result] = await safe(
        api.authoring.publish({
          id: storyId,
          changelog: changelog.trim() || undefined,
          visibility,
        }),
      );
      if (error) {
        if (isDefinedError(error) && error.code === 'UNPROCESSABLE_CONTENT') {
          setServerReport(error.data);
          return null;
        }
        throw error;
      }
      return result;
    },
    onSuccess: (result) => {
      if (!result) return;
      setStatus(visibility === 'public' ? 'published' : 'unlisted');
      setPublished(result.version.number);
      setChangelog('');
      toast.success(t('success', { number: result.version.number }));
    },
    onError: () => toast.error(tc('error')),
  });

  const diagnostics =
    serverReport?.diagnostics.filter((diagnostic) => diagnostic.severity === 'error') ?? blocking;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (next) {
          setServerReport(null);
          setPublished(null);
        }
        onOpenChange(next);
      }}
    >
      <DialogContent title={t('title', { title })} description={t('body')}>
        {published !== null ? (
          <div className="flex flex-col items-center gap-4 py-4 text-center">
            <BookCheck className="size-12 text-success" aria-hidden />
            <p className="font-display text-xl font-semibold">
              {t('success', { number: published })}
            </p>
            <Button asChild variant="secondary">
              <Link href={{ pathname: '/story/[slug]', params: { slug } }}>
                {t('viewStory')} <ExternalLink />
              </Link>
            </Button>
          </div>
        ) : (
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              publish.mutate();
            }}
          >
            {diagnostics.length > 0 ? (
              <div className="flex flex-col gap-2 rounded-lg border border-danger/40 bg-danger/5 p-3">
                <p className="text-sm font-semibold text-danger">{t('blocked')}</p>
                <DiagnosticsList diagnostics={diagnostics} />
              </div>
            ) : null}
            <Field label={t('changelog')} htmlFor={`${id}-changelog`}>
              <Textarea
                id={`${id}-changelog`}
                rows={3}
                maxLength={500}
                placeholder={t('changelogPlaceholder')}
                value={changelog}
                onChange={(event) => setChangelog(event.target.value)}
              />
            </Field>
            <fieldset className="flex flex-col gap-2">
              <legend className="mb-1.5 text-sm font-semibold">{t('visibility')}</legend>
              {(['public', 'unlisted'] as const).map((option) => (
                <label key={option} className="flex cursor-pointer items-center gap-2 text-sm">
                  <input
                    type="radio"
                    name={`${id}-visibility`}
                    value={option}
                    checked={visibility === option}
                    disabled={option === 'unlisted' && !privatePublishing}
                    onChange={() => setVisibility(option)}
                    className="accent-[var(--dd-accent)]"
                  />
                  {t(option)}
                  {option === 'unlisted' && !privatePublishing ? (
                    <span className="text-xs text-subtle">— {t('architectOnly')}</span>
                  ) : null}
                </label>
              ))}
            </fieldset>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                {tc('cancel')}
              </Button>
              <Button type="submit" disabled={blocking.length > 0 || publish.isPending}>
                {publish.isPending ? tc('loading') : tc('confirm')}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
