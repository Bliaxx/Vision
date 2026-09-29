'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Dialog as Primitive } from 'radix-ui';
import type { ComponentProps, ReactNode } from 'react';
import { cn } from '@/lib/cn';

export const Dialog = Primitive.Root;
export const DialogTrigger = Primitive.Trigger;
export const DialogClose = Primitive.Close;

export function DialogContent({
  className,
  children,
  title,
  description,
  side,
  ...props
}: ComponentProps<typeof Primitive.Content> & {
  title: ReactNode;
  description?: ReactNode;
  /** `side` transforme la boîte de dialogue en panneau latéral. */
  side?: 'right' | 'left' | 'bottom';
}) {
  const t = useTranslations('common');
  return (
    <Primitive.Portal>
      <Primitive.Overlay className="fixed inset-0 z-50 bg-[var(--dd-overlay)] backdrop-blur-[2px] data-[state=open]:animate-fade" />
      <Primitive.Content
        className={cn(
          'fixed z-50 flex flex-col gap-4 border border-line bg-surface p-6 shadow-lift outline-none',
          side === 'right' && 'inset-y-0 right-0 w-full max-w-md overflow-y-auto rounded-l-xl',
          side === 'left' && 'inset-y-0 left-0 w-full max-w-md overflow-y-auto rounded-r-xl',
          side === 'bottom' && 'inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-xl',
          !side &&
            'top-1/2 left-1/2 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl data-[state=open]:animate-rise',
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <Primitive.Title className="font-display text-2xl font-semibold">
              {title}
            </Primitive.Title>
            {description ? (
              <Primitive.Description className="text-sm text-muted">
                {description}
              </Primitive.Description>
            ) : (
              <Primitive.Description className="sr-only">{title}</Primitive.Description>
            )}
          </div>
          <Primitive.Close
            className="-mt-1 -mr-2 rounded-md p-2 text-muted hover:bg-sunken hover:text-ink"
            aria-label={t('close')}
          >
            <X className="size-5" />
          </Primitive.Close>
        </div>
        {children}
      </Primitive.Content>
    </Primitive.Portal>
  );
}
