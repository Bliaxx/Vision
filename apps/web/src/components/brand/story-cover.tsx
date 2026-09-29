import { coverArt } from '@dedale/tokens';
import { cn } from '@/lib/cn';

/**
 * Couverture d'un récit : image fournie par l'auteur, sinon couverture
 * générative (labyrinthe unique + titre composé en Fraunces).
 */
export function StoryCover({
  slug,
  title,
  genre,
  author,
  coverUrl,
  className,
  size = 'md',
}: {
  slug: string;
  title: string;
  genre?: string | undefined;
  author?: string | undefined;
  coverUrl?: string | null | undefined;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  if (coverUrl) {
    return (
      // biome-ignore lint/performance/noImgElement: couvertures d'auteurs hébergées ailleurs.
      <img
        src={coverUrl}
        alt=""
        className={cn('aspect-[2/3] w-full rounded-md object-cover shadow-paper', className)}
      />
    );
  }
  const art = coverArt(slug, genre);
  const gradientId = `cover-${slug}`;
  return (
    <div
      className={cn(
        'relative isolate aspect-[2/3] w-full overflow-hidden rounded-md text-white shadow-paper',
        className,
      )}
    >
      <svg
        viewBox="0 0 200 300"
        className="absolute inset-0 -z-10 size-full"
        aria-hidden
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0.4" y2="1">
            <stop offset="0" stopColor={art.background[0]} />
            <stop offset="1" stopColor={art.background[1]} />
          </linearGradient>
        </defs>
        <rect width="200" height="300" fill={`url(#${gradientId})`} />
        <g
          fill="none"
          stroke="#F6F1E7"
          strokeOpacity="0.32"
          strokeWidth="2.2"
          strokeLinecap="round"
        >
          {art.walls.map((d) => (
            <path key={d} d={d} />
          ))}
        </g>
        <path
          d={art.thread}
          fill="none"
          stroke="#FF6A4D"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx={art.knot.x} cy={art.knot.y} r="3.4" fill="#FF6A4D" />
      </svg>
      <div className="paper-grain pointer-events-none absolute inset-0 opacity-60 mix-blend-overlay" />
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1 bg-gradient-to-t from-black/55 via-black/20 to-transparent p-[8%] pt-[30%]">
        <p
          className={cn(
            'font-display leading-[1.05] font-semibold tracking-[-0.02em] text-balance drop-shadow-sm',
            size === 'sm' && 'text-[0.95rem]',
            size === 'md' && 'text-[1.35rem]',
            size === 'lg' && 'text-[2.1rem]',
          )}
        >
          {title}
        </p>
        {author ? (
          <p
            className={cn(
              'font-sans font-semibold tracking-[0.12em] text-white/80 uppercase',
              size === 'lg' ? 'text-xs' : 'text-[0.6rem]',
            )}
          >
            {author}
          </p>
        ) : null}
      </div>
    </div>
  );
}
