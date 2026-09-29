import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-semibold [&_svg]:size-3.5',
  {
    variants: {
      tone: {
        neutral: 'bg-sunken text-muted',
        thread: 'bg-thread-soft text-thread',
        brass: 'bg-brass-soft text-brass',
        success: 'bg-success/12 text-success',
        danger: 'bg-danger/12 text-danger',
        outline: 'border border-line-strong text-muted',
        night: 'bg-night text-parchment',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
