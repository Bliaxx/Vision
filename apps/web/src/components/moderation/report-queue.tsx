'use client';

import type { Report } from '@dedale/contracts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ban, EyeOff, X } from 'lucide-react';
import { useFormatter, useNow, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { api, orpc } from '@/lib/api/browser';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/field';
import { Skeleton } from '../ui/misc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

type Status = Report['status'];
type Action = 'dismiss' | 'hide' | 'suspend';

function ReportItem({ report }: { report: Report }) {
  const t = useTranslations('moderation');
  const tr = useTranslations('story.reasons');
  const tc = useTranslations('common');
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const queryClient = useQueryClient();
  const [note, setNote] = useState('');
  const resolve = useMutation({
    mutationFn: (action: Action) => api.moderation.resolve({ id: report.id, action, note }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: orpc.moderation.queue.key() }),
    onError: () => toast.error(tc('error')),
  });

  return (
    <li className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center gap-2 text-xs text-subtle">
        <Badge tone="danger">{tr(report.reason)}</Badge>
        <Badge tone="outline">{t(`targets.${report.targetType}`)}</Badge>
        {report.reporter ? (
          <span>{t('reportedBy', { handle: report.reporter.handle })}</span>
        ) : null}
        <span>· {format.relativeTime(new Date(report.createdAt), now)}</span>
      </div>
      <p className="font-display text-xl font-semibold">{report.targetLabel ?? report.targetId}</p>
      {report.details ? (
        <p className="rounded-md bg-sunken p-3 text-sm leading-relaxed">{report.details}</p>
      ) : null}
      {report.status === 'open' ? (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Input
            aria-label={t('note')}
            placeholder={t('note')}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="h-9 sm:max-w-xs"
          />
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={resolve.isPending}
              onClick={() => resolve.mutate('dismiss')}
            >
              <X /> {t('dismiss')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled={resolve.isPending}
              onClick={() => resolve.mutate('hide')}
            >
              <EyeOff /> {t('hide')}
            </Button>
            {report.targetType === 'story' ? (
              <Button
                size="sm"
                variant="danger"
                disabled={resolve.isPending}
                onClick={() => resolve.mutate('suspend')}
              >
                <Ban /> {t('suspend')}
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </li>
  );
}

function Queue({ status }: { status: Status }) {
  const t = useTranslations('moderation');
  const query = useQuery(orpc.moderation.queue.queryOptions({ input: { status, limit: 50 } }));
  if (query.isPending) return <Skeleton className="h-40 w-full" />;
  if (query.isError) return <p className="text-danger">{query.error.message}</p>;
  if (query.data.items.length === 0)
    return <p className="py-12 text-center font-display text-xl text-muted">{t('empty')}</p>;
  return (
    <ul className="flex flex-col gap-3">
      {query.data.items.map((report) => (
        <ReportItem key={report.id} report={report} />
      ))}
    </ul>
  );
}

export function ReportQueue() {
  const t = useTranslations('moderation');
  return (
    <Tabs defaultValue="open">
      <TabsList>
        {(['open', 'actioned', 'dismissed'] as const).map((status) => (
          <TabsTrigger key={status} value={status}>
            {t(status)}
          </TabsTrigger>
        ))}
      </TabsList>
      {(['open', 'actioned', 'dismissed'] as const).map((status) => (
        <TabsContent key={status} value={status} className="pt-6">
          <Queue status={status} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
