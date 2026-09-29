'use client';

import { Tabs as Primitive } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export const Tabs = Primitive.Root;

export function TabsList({ className, ...props }: ComponentProps<typeof Primitive.List>) {
  return <Primitive.List className={cn('flex gap-1 border-b border-line', className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof Primitive.Trigger>) {
  return (
    <Primitive.Trigger
      className={cn(
        '-mb-px cursor-pointer border-b-2 border-transparent px-3 py-2 text-sm font-semibold text-muted transition-colors hover:text-ink data-[state=active]:border-thread data-[state=active]:text-ink',
        className,
      )}
      {...props}
    />
  );
}

export const TabsContent = Primitive.Content;
