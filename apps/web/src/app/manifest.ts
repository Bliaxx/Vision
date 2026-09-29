import { brand } from '@dedale/tokens';
import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.name,
    short_name: brand.name,
    description: brand.tagline.fr,
    start_url: '/',
    display: 'standalone',
    background_color: brand.themeColor.light,
    theme_color: brand.themeColor.dark,
    lang: 'fr',
    categories: ['books', 'entertainment', 'education'],
    icons: [
      { src: '/icon.svg', type: 'image/svg+xml', sizes: 'any', purpose: 'any' },
      { src: '/apple-icon', type: 'image/png', sizes: '180x180' },
    ],
  };
}
