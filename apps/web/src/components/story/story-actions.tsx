'use client';

import type { StoryDetail } from '@dedale/contracts';
import { REPORT_REASONS } from '@dedale/contracts';
import { BookOpen, Crown, Feather, Flag, Heart, Lock, Share2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { Link, useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/browser';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';
import { Field, NativeSelect, Textarea } from '../ui/field';

/** Actions principales de la fiche : lire, acheter, favori, partager, signaler. */
export function StoryActions({ story, signedIn }: { story: StoryDetail; signedIn: boolean }) {
  const t = useTranslations('story');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [favorite, setFavorite] = useState(story.viewer?.favorite ?? false);
  const [busy, setBusy] = useState(false);
  const reading = { pathname: '/read/[slug]' as const, params: { slug: story.slug } };

  const requireSignIn = () => {
    router.push('/sign-in');
  };

  const checkout = async (input: Parameters<typeof api.billing.checkout>[0]) => {
    if (!signedIn) return requireSignIn();
    setBusy(true);
    try {
      const { url } = await api.billing.checkout(input);
      window.location.assign(url);
    } catch {
      toast.error(t('lockedPaid'));
      setBusy(false);
    }
  };

  const toggleFavorite = async () => {
    if (!signedIn) return requireSignIn();
    const previous = favorite;
    setFavorite(!previous);
    try {
      const { active } = await api.community.toggleFavorite({ storyId: story.id });
      setFavorite(active);
    } catch {
      setFavorite(previous);
    }
  };

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: story.title, text: story.tagline ?? '', url }).catch(() => {});
    } else {
      await navigator.clipboard.writeText(url);
      toast.success(tc('copied'));
    }
  };

  const progress = story.viewer?.progress;
  let primary: React.ReactNode;
  if (story.entitlement.canRead) {
    primary = (
      <Button asChild size="lg" className="min-w-52">
        <Link href={reading}>
          <BookOpen />
          {progress?.status === 'playing'
            ? t('continueReading')
            : progress?.status === 'ended'
              ? t('readAgain')
              : t('startReading')}
        </Link>
      </Button>
    );
  } else if (story.entitlement.reason === 'locked_premium') {
    primary = (
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          variant="brass"
          onClick={() => (signedIn ? router.push('/pricing') : requireSignIn())}
        >
          <Crown /> {t('lockedPremiumCta')}
        </Button>
        <p className="inline-flex items-center gap-1.5 text-sm text-muted">
          <Lock className="size-3.5" aria-hidden /> {t('lockedPremium')}
        </p>
      </div>
    );
  } else {
    primary = (
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          disabled={busy}
          onClick={() => checkout({ kind: 'story', storyId: story.id })}
        >
          <BookOpen /> {t('buy', { price: formatPrice(story.priceCents ?? 0, locale) })}
        </Button>
        <p className="text-sm text-muted">{t('lockedPaid')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-3">
      {primary}
      <Button
        size="lg"
        variant="secondary"
        onClick={toggleFavorite}
        aria-pressed={favorite}
        aria-label={favorite ? t('unfavorite') : t('favorite')}
      >
        <Heart className={cn(favorite && 'fill-thread text-thread')} />
      </Button>
      <Button size="lg" variant="secondary" onClick={share} aria-label={tc('share')}>
        <Share2 />
      </Button>
      <TipDialog storyId={story.id} signedIn={signedIn} onCheckout={checkout} />
      <ReportDialog storyId={story.id} signedIn={signedIn} />
    </div>
  );
}

function TipDialog({
  storyId,
  signedIn,
  onCheckout,
}: {
  storyId: string;
  signedIn: boolean;
  onCheckout: (input: { kind: 'tip'; storyId: string; amountCents: number }) => void;
}) {
  const t = useTranslations('story');
  const locale = useLocale();
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="lg" variant="ghost" aria-label={t('tip')} disabled={!signedIn}>
          <Feather />
        </Button>
      </DialogTrigger>
      <DialogContent title={t('tip')} description={t('tipHint')}>
        <div className="grid grid-cols-3 gap-2">
          {[200, 500, 1000].map((amount) => (
            <Button
              key={amount}
              variant="secondary"
              size="lg"
              onClick={() => onCheckout({ kind: 'tip', storyId, amountCents: amount })}
            >
              {formatPrice(amount, locale)}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReportDialog({ storyId, signedIn }: { storyId: string; signedIn: boolean }) {
  const t = useTranslations('story');
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REPORT_REASONS)[number]>('other');
  const [details, setDetails] = useState('');
  const submit = async () => {
    await api.community.report({ targetType: 'story', targetId: storyId, reason, details });
    toast.success(t('reportSent'));
    setOpen(false);
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="ghost" aria-label={t('report')} disabled={!signedIn}>
          <Flag />
        </Button>
      </DialogTrigger>
      <DialogContent title={t('reportTitle')}>
        <Field label={t('reportReason')} htmlFor="report-reason">
          <NativeSelect
            id="report-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value as typeof reason)}
          >
            {REPORT_REASONS.map((candidate) => (
              <option key={candidate} value={candidate}>
                {t(`reasons.${candidate}`)}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field label={t('reportDetails')} htmlFor="report-details">
          <Textarea
            id="report-details"
            value={details}
            onChange={(event) => setDetails(event.target.value)}
          />
        </Field>
        <Button onClick={submit}>{t('report')}</Button>
      </DialogContent>
    </Dialog>
  );
}
