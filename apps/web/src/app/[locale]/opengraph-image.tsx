import { brand, palette } from '@dedale/tokens';
import { ImageResponse } from 'next/og';
import { toLocale } from '@/i18n/locale';
import { BrandMark } from '@/lib/og/brand-mark';
import { ogFonts } from '@/lib/og/fonts';

export const alt = brand.name;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Image de partage par défaut : monogramme, nom et promesse. */
export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const locale = toLocale((await params).locale);
  const tagline = brand.tagline[locale];
  const fonts = await ogFonts(`${brand.name}${tagline}`, brand.domain);
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 80,
        background: `radial-gradient(circle at 85% 20%, ${palette.ink[700]} 0%, ${palette.ink[950]} 60%)`,
        color: palette.paper[100],
        fontFamily: 'Manrope',
      }}
    >
      <BrandMark size={140} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontFamily: 'Fraunces', fontSize: 120, lineHeight: 1, letterSpacing: -3 }}>
          {brand.name}
        </div>
        <div style={{ fontFamily: 'Fraunces', fontSize: 52, color: palette.paper[400] }}>
          {tagline}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          width: '100%',
          height: 6,
          background: '#FF6A4D',
          borderRadius: 3,
        }}
      />
    </div>,
    { ...size, fonts },
  );
}
