'use client';

import type { Feedback } from '@dedale/contracts';
import { useMutation } from '@tanstack/react-query';
import { Check, Download } from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api/browser';
import { cn } from '@/lib/cn';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export function FeedbackList({
  initial,
  titles,
}: {
  initial: Feedback[];
  titles: Record<string, string>;
}) {
  const t = useTranslations('studio.analyticsPage');
  const tc = useTranslations('common');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const [items, setItems] = useState(initial);
  const resolve = useMutation({
    mutationFn: (id: string) => api.authoring.resolveFeedback({ id }),
    onSuccess: (_, id) =>
      setItems((current) =>
        current.map((item) => (item.id === id ? { ...item, status: 'resolved' } : item)),
      ),
    onError: () => toast.error(tc('error')),
  });

  if (items.length === 0) return <p className="text-sm text-muted">{t('noFeedback')}</p>;
  return (
    <ul className="flex flex-col divide-y divide-line">
      {items.map((item) => (
        <li
          key={item.id}
          className={cn(
            'flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between',
            item.status === 'resolved' && 'opacity-60',
          )}
        >
          <div className="flex flex-col gap-1.5">
            <p className="flex flex-wrap items-center gap-2 text-xs text-subtle">
              <Badge
                tone={
                  item.kind === 'praise'
                    ? 'success'
                    : item.kind === 'bug'
                      ? 'danger'
                      : item.kind === 'typo'
                        ? 'brass'
                        : 'thread'
                }
              >
                {t(`kinds.${item.kind}`)}
              </Badge>
              {item.passageId ? (
                <span>{t('passage', { title: titles[item.passageId] ?? item.passageId })}</span>
              ) : null}
              <span>· {item.author ? `@${item.author.handle}` : '—'}</span>
              <span>· {format.relativeTime(new Date(item.createdAt), now)}</span>
            </p>
            <p className="font-reading leading-relaxed">{item.body}</p>
          </div>
          {item.status === 'open' ? (
            <Button
              size="sm"
              variant="ghost"
              className="shrink-0"
              disabled={resolve.isPending}
              onClick={() => resolve.mutate(item.id)}
            >
              <Check /> {t('resolve')}
            </Button>
          ) : (
            <span className="shrink-0 text-xs font-semibold text-success">{t('resolved')}</span>
          )}
        </li>
      ))}
    </ul>
  );
}

/** Export « livre-jeu papier » : paragraphes numérotés, prêts pour l'impression. */
export function GamebookExport({ storyId, slug }: { storyId: string; slug: string }) {
  const t = useTranslations('studio.analyticsPage');
  const tc = useTranslations('common');
  const exportBook = useMutation({
    mutationFn: () => api.authoring.exportGamebook({ id: storyId }),
    onSuccess: ({ markdown, sections }) => {
      const url = URL.createObjectURL(
        new Blob([markdown], { type: 'text/markdown;charset=utf-8' }),
      );
      const link = document.createElement('a');
      link.href = url;
      link.download = `${slug}.md`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success(t('exported', { count: sections }));
    },
    onError: () => toast.error(tc('error')),
  });
  return (
    <Button variant="brass" onClick={() => exportBook.mutate()} disabled={exportBook.isPending}>
      <Download /> {t('download')}
    </Button>
  );
}
