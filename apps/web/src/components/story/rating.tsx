import { Star } from 'lucide-react';
import { cn } from '@/lib/cn';

/** Note sur 5, lisible par les lecteurs d'écran. */
export function Rating({
  value,
  count,
  className,
}: {
  value: number | null;
  count?: number;
  className?: string;
}) {
  if (value === null) return null;
  return (
    <span className={cn('inline-flex items-center gap-1 text-sm font-semibold', className)}>
      <Star className="size-3.5 fill-brass text-brass" aria-hidden />
      <span>{value.toFixed(1)}</span>
      {count !== undefined ? <span className="font-normal text-subtle">({count})</span> : null}
      <span className="sr-only">/ 5</span>
    </span>
  );
}

export function Stars({ value, size = 16 }: { value: number; size?: number }) {
  return (
    <span className="inline-flex" aria-label={`${value} / 5`} role="img">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          style={{ width: size, height: size }}
          className={star <= Math.round(value) ? 'fill-brass text-brass' : 'text-line-strong'}
          aria-hidden
        />
      ))}
    </span>
  );
}
