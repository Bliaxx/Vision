import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/studio',
        '/moderation',
        '/compte',
        '/en/account',
        '/bibliotheque',
        '/en/library',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
