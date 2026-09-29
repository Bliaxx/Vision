import { cn } from '@/lib/cn';
import { Monogram } from './monogram';

/**
 * Logotype : « Dédale » en Fraunces, dont l'accent aigu est un brin de fil
 * rouge. Le texte accessible reste « Dédale ».
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'font-display font-semibold tracking-[-0.035em] [font-variation-settings:"SOFT"_50,"WONK"_1]',
        className,
      )}
      role="img"
      aria-label="Dédale"
    >
      <span aria-hidden>
        D
        <span className="relative inline-block">
          e
          <span className="absolute top-[0.1em] left-1/2 h-[0.07em] w-[0.3em] origin-left -translate-x-[18%] -rotate-[34deg] rounded-full bg-thread" />
        </span>
        dale
      </span>
    </span>
  );
}

export function Logo({ className, size = 30 }: { className?: string; size?: number }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5 text-ink', className)}>
      <Monogram size={size} title="" aria-hidden />
      <Wordmark className="text-[1.6rem] leading-none" />
    </span>
  );
}
