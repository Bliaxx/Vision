import { brand, palette } from '@dedale/tokens';
import { ImageResponse } from 'next/og';
import { coverArt } from '@/components/brand/cover-art';
import { publicApi } from '@/lib/api/server';
import { BrandMark } from '@/lib/og/brand-mark';
import { ogFonts } from '@/lib/og/fonts';

export const alt = brand.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Carte de partage d'un livre : sa couverture générative, son titre, son auteur. */
export default async function Image({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { slug } = await params;
  const story = await publicApi()
    .catalog.story({ slug })
    .catch(() => null);
  const title = story?.title ?? brand.name;
  const tagline = story?.tagline ?? '';
  const author = story?.author.displayName ?? '';
  const art = coverArt(slug, story?.genres[0]);
  const fonts = await ogFonts(title, `${tagline}${author}${brand.domain}`);

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        background: palette.ink[950],
        color: palette.paper[100],
        fontFamily: 'Manrope',
      }}
    >
      <div
        style={{
          width: 420,
          height: '100%',
          display: 'flex',
          background: `linear-gradient(160deg, ${art.background[0]}, ${art.background[1]})`,
        }}
      >
        <svg
          aria-hidden
          width={420}
          height={630}
          viewBox="0 0 200 300"
          preserveAspectRatio="xMidYMid slice"
        >
          {art.walls.map((d) => (
            <path
              key={d}
              d={d}
              fill="none"
              stroke="#F6F1E7"
              strokeOpacity={0.32}
              strokeWidth={2.2}
              strokeLinecap="round"
            />
          ))}
          <path
            d={art.thread}
            fill="none"
            stroke="#FF6A4D"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx={art.knot.x} cy={art.knot.y} r={3.4} fill="#FF6A4D" />
        </svg>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            fontSize: 28,
            color: palette.paper[400],
          }}
        >
          <BrandMark size={56} />
          {brand.domain}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              fontFamily: 'Fraunces',
              fontSize: title.length > 28 ? 64 : 84,
              lineHeight: 1.02,
              letterSpacing: -2,
            }}
          >
            {title}
          </div>
          {tagline ? (
            <div style={{ fontSize: 30, lineHeight: 1.35, color: palette.paper[400] }}>
              {tagline}
            </div>
          ) : null}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 26,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#FF6A4D',
          }}
        >
          {author}
        </div>
      </div>
    </div>,
    { ...size, fonts },
  );
}
