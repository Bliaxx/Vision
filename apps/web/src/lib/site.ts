/** Origine publique du site (liens absolus : sitemap, OpenGraph, JSON-LD). */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);
