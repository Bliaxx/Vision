import { palette } from '@dedale/tokens';
import { ImageResponse } from 'next/og';
import { BrandMark } from '@/lib/og/brand-mark';

export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: palette.ink[950],
      }}
    >
      <BrandMark size={132} />
    </div>,
    size,
  );
}
