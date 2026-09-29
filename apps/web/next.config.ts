import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** L'API est servie sous la même origine (`/api/*`) : cookies de session simples et pas de CORS. */
const apiOrigin = process.env.API_INTERNAL_URL ?? 'http://localhost:4000';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const config: NextConfig = {
  reactCompiler: true,
  poweredByHeader: false,
  output: 'standalone',
  transpilePackages: [
    '@dedale/api-client',
    '@dedale/contracts',
    '@dedale/engine',
    '@dedale/i18n',
    '@dedale/samples',
    '@dedale/tokens',
  ],
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${apiOrigin}/api/:path*` }];
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default withNextIntl(config);
