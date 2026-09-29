'use client';

import { Tooltip as Primitive } from 'radix-ui';
import type { ReactNode } from 'react';

export const TooltipProvider = Primitive.Provider;

export function Tooltip({
  content,
  children,
  side = 'top',
}: {
  content: ReactNode;
  children: ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
}) {
  return (
    <Primitive.Root delayDuration={250}>
      <Primitive.Trigger asChild>{children}</Primitive.Trigger>
      <Primitive.Portal>
        <Primitive.Content
          side={side}
          sideOffset={6}
          className="z-50 max-w-xs rounded-md bg-night px-2.5 py-1.5 text-xs font-medium text-parchment shadow-lift data-[state=delayed-open]:animate-fade"
        >
          {content}
          <Primitive.Arrow className="fill-night" />
        </Primitive.Content>
      </Primitive.Portal>
    </Primitive.Root>
  );
}
