import { monogram, palette } from '@dedale/tokens';

/** Monogramme pour `ImageResponse` (Satori : SVG en ligne, sans variables CSS). */
export function BrandMark({
  size,
  walls = palette.paper[100],
  thread = '#FF6A4D',
}: {
  size: number;
  walls?: string;
  thread?: string;
}) {
  return (
    <svg
      aria-hidden
      width={size}
      height={size}
      viewBox={monogram.viewBox}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {monogram.walls.map((d) => (
        <path key={d} d={d} stroke={walls} strokeWidth={4.2} />
      ))}
      <path d={monogram.thread} stroke={thread} strokeWidth={3.2} />
      <circle cx={monogram.knot.cx} cy={monogram.knot.cy} r={monogram.knot.r + 0.4} fill={thread} />
    </svg>
  );
}
