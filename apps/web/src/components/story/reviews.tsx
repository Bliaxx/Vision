'use client';

import type { Review } from '@dedale/contracts';
import { Star } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/browser';
import { cn } from '@/lib/cn';
import { formatRelative } from '@/lib/format';
import { Button } from '../ui/button';
import { Checkbox, Textarea } from '../ui/field';
import { Avatar } from '../ui/misc';
import { Stars } from './rating';

function ReviewItem({ review }: { review: Review }) {
  const t = useTranslations('story');
  const locale = useLocale();
  const [revealed, setRevealed] = useState(!review.spoiler);
  return (
    <li className="flex gap-4 border-b border-line py-5 last:border-0">
      <Avatar name={review.author.displayName} src={review.author.avatarUrl} size={40} />
      <div className="flex flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold">{review.author.displayName}</span>
          <Stars value={review.rating} size={14} />
          <span className="text-xs text-subtle">{formatRelative(review.createdAt, locale)}</span>
        </div>
        {review.body ? (
          revealed ? (
            <p className="leading-relaxed text-ink/90">{review.body}</p>
          ) : (
            <p className="text-sm text-muted italic">
              {t('spoilerHidden')}{' '}
              <button
                type="button"
                className="thread-underline cursor-pointer font-semibold not-italic"
                onClick={() => setRevealed(true)}
              >
                {t('showSpoiler')}
              </button>
            </p>
          )
        ) : null}
      </div>
    </li>
  );
}

export function Reviews({
  storyId,
  initial,
  myRating,
  canReview,
}: {
  storyId: string;
  initial: Review[];
  myRating: number | null;
  canReview: boolean;
}) {
  const t = useTranslations('story');
  const router = useRouter();
  const [rating, setRating] = useState(myRating ?? 0);
  const [hover, setHover] = useState(0);
  const [body, setBody] = useState('');
  const [spoiler, setSpoiler] = useState(false);
  const [sending, setSending] = useState(false);

  const submit = async () => {
    setSending(true);
    try {
      await api.community.upsertReview({ storyId, rating, body, spoiler });
      setBody('');
      router.refresh();
    } catch {
      toast.error(t('noReviews'));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {canReview ? (
        <div className="flex flex-col gap-3 rounded-xl border border-line bg-surface p-5">
          <p className="font-semibold">{t('writeReview')}</p>
          <fieldset className="flex gap-1" onMouseLeave={() => setHover(0)}>
            <legend className="sr-only">{t('yourRating')}</legend>
            {[1, 2, 3, 4, 5].map((value) => (
              <label
                key={value}
                onMouseEnter={() => setHover(value)}
                className="cursor-pointer rounded p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-thread"
              >
                <input
                  type="radio"
                  name="review-rating"
                  value={value}
                  checked={rating === value}
                  onChange={() => setRating(value)}
                  aria-label={`${value} / 5`}
                  className="sr-only"
                />
                <Star
                  aria-hidden
                  className={cn(
                    'size-7 transition-colors',
                    value <= (hover || rating) ? 'fill-brass text-brass' : 'text-line-strong',
                  )}
                />
              </label>
            ))}
          </fieldset>
          <Textarea
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={t('reviewPlaceholder')}
            aria-label={t('writeReview')}
            maxLength={3000}
          />
          <label className="flex items-center gap-2 text-sm">
            <Checkbox checked={spoiler} onChange={(event) => setSpoiler(event.target.checked)} />{' '}
            {t('spoiler')}
          </label>
          <div>
            <Button onClick={submit} disabled={rating === 0 || sending}>
              {t('publishReview')}
            </Button>
          </div>
        </div>
      ) : null}
      {initial.length === 0 ? (
        <p className="text-muted italic">{t('noReviews')}</p>
      ) : (
        <ul>
          {initial.map((review) => (
            <ReviewItem key={review.id} review={review} />
          ))}
        </ul>
      )}
    </div>
  );
}
