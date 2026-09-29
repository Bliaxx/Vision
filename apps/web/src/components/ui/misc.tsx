import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return <div className={cn('animate-pulse rounded-md bg-sunken', className)} {...props} />;
}

export function Kbd({ className, ...props }: ComponentProps<'kbd'>) {
  return (
    <kbd
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded border border-line-strong bg-raised px-1 font-mono text-[0.7rem] text-muted',
        className,
      )}
      {...props}
    />
  );
}

/** Jauge horizontale accessible (statistiques, progression). */
export function Meter({
  value,
  max = 1,
  label,
  className,
  tone = 'thread',
}: {
  value: number;
  max?: number;
  label: string;
  className?: string;
  tone?: 'thread' | 'brass' | 'ink' | 'success';
}) {
  const ratio = max === 0 ? 0 : Math.min(1, Math.max(0, value / max));
  const color = { thread: 'bg-thread', brass: 'bg-brass', ink: 'bg-ink', success: 'bg-success' }[
    tone
  ];
  return (
    // biome-ignore lint/a11y/useSemanticElements: <meter> n'est pas stylable de façon homogène entre navigateurs.
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-sunken', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-500 ease-thread', color)}
        style={{ width: `${ratio * 100}%` }}
      />
    </div>
  );
}

export function Avatar({
  name,
  src,
  size = 36,
  className,
}: {
  name: string;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  if (src) {
    return (
      // biome-ignore lint/performance/noImgElement: avatars externes de taille fixe.
      <img
        src={src}
        alt=""
        width={size}
        height={size}
        className={cn('rounded-full object-cover', className)}
      />
    );
  }
  return (
    <span
      aria-hidden
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-full bg-night font-display font-semibold text-parchment',
        className,
      )}
    >
      {initials}
    </span>
  );
}

export function Container({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div className={cn('mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8', className)} {...props} />
  );
}
