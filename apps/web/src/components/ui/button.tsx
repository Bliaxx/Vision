import { cva, type VariantProps } from 'class-variance-authority';
import { Slot } from 'radix-ui';
import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';

export const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap font-semibold transition-[background-color,color,box-shadow,transform] duration-150 ease-standard active:translate-y-px disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-[1.1em] [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        /** Action principale : la couleur du fil. */
        primary: 'bg-thread text-on-thread shadow-[0_1px_0_rgba(0,0,0,0.15)] hover:bg-thread-hover',
        /** Encre sur papier. */
        secondary: 'border border-line-strong bg-surface text-ink hover:border-ink hover:bg-raised',
        ghost: 'text-ink hover:bg-sunken',
        subtle: 'bg-sunken text-ink hover:bg-line',
        brass: 'bg-brass text-white hover:brightness-110 dark:text-night',
        danger: 'bg-danger text-white hover:brightness-110',
        link: 'thread-underline rounded-none px-0 text-ink',
      },
      size: {
        sm: 'h-8 rounded-md px-3 text-sm',
        md: 'h-10 rounded-md px-4 text-sm',
        lg: 'h-12 rounded-lg px-6 text-base',
        icon: 'size-10 rounded-md',
        'icon-sm': 'size-8 rounded-md',
      },
    },
    compoundVariants: [{ variant: 'link', className: 'h-auto px-0' }],
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /** Rend l'enfant (lien…) avec le style d'un bouton. */
    asChild?: boolean;
  };

export function Button({ className, variant, size, asChild = false, type, ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button';
  return (
    <Component
      className={cn(buttonVariants({ variant, size }), className)}
      {...(asChild ? {} : { type: type ?? 'button' })}
      {...props}
    />
  );
}
