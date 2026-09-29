import { monogram } from '@dedale/tokens';
import type { SVGProps } from 'react';

/**
 * Monogramme Dédale : un « D » labyrinthe que le fil rouge traverse jusqu'à
 * son cœur. `animated` trace le fil (réservé aux moments forts).
 */
export function Monogram({
  size = 32,
  animated = false,
  title = 'Dédale',
  ...props
}: SVGProps<SVGSVGElement> & { size?: number; animated?: boolean; title?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={monogram.viewBox}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={title}
      {...props}
    >
      <g stroke="currentColor" strokeWidth={3.6}>
        {monogram.walls.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path
        d={monogram.thread}
        stroke="var(--dd-accent)"
        strokeWidth={2.6}
        pathLength={1}
        strokeDasharray={animated ? 1 : undefined}
        className={animated ? 'animate-thread [--thread-length:1]' : undefined}
      />
      <circle
        cx={monogram.knot.cx}
        cy={monogram.knot.cy}
        r={monogram.knot.r}
        fill="var(--dd-accent)"
      />
    </svg>
  );
}
