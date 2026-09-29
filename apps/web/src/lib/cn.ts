import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: [
        'bg',
        'surface',
        'raised',
        'sunken',
        'line',
        'line-strong',
        'ink',
        'muted',
        'subtle',
        'thread',
        'thread-hover',
        'thread-soft',
        'on-thread',
        'brass',
        'brass-soft',
        'success',
        'warning',
        'danger',
        'info',
        'canvas',
        'canvas-dot',
        'night',
        'night-2',
        'parchment',
      ],
      font: ['display', 'reading', 'sans', 'accessible', 'dyslexia', 'mono'],
    },
  },
});

/** Compose des classes Tailwind en résolvant les conflits. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
