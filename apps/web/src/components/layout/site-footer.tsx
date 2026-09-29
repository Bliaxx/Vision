import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Logo } from '../brand/wordmark';
import { Container } from '../ui/misc';

export async function SiteFooter() {
  const [t, nav, common] = await Promise.all([
    getTranslations('footer'),
    getTranslations('nav'),
    getTranslations('common'),
  ]);
  const heading = 'mb-3 text-xs font-bold tracking-[0.14em] text-subtle uppercase';
  const link = 'thread-underline text-sm text-muted hover:text-ink';
  return (
    <footer className="mt-24 border-t border-line bg-surface">
      <Container className="grid gap-10 py-14 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div className="flex max-w-sm flex-col gap-4">
          <Logo />
          <p className="text-sm leading-relaxed text-muted">{t('about')}</p>
          <p className="font-display text-lg italic text-ink">{common('tagline')}</p>
        </div>
        <div>
          <p className={heading}>{t('product')}</p>
          <ul className="flex flex-col gap-2">
            <li>
              <Link className={link} href="/explore">
                {nav('explore')}
              </Link>
            </li>
            <li>
              <Link className={link} href="/studio">
                {nav('studio')}
              </Link>
            </li>
            <li>
              <Link className={link} href="/pricing">
                {nav('pricing')}
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className={heading}>{t('community')}</p>
          <ul className="flex flex-col gap-2">
            <li>
              <Link className={link} href="/schools">
                {nav('schools')}
              </Link>
            </li>
            <li>
              <Link className={link} href="/charter">
                {t('charter')}
              </Link>
            </li>
            <li>
              <a className={link} href="/api/v1/docs">
                {t('api')}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className={heading}>{t('legal')}</p>
          <ul className="flex flex-col gap-2">
            <li>
              <Link className={link} href="/charter">
                {t('privacy')}
              </Link>
            </li>
            <li>
              <Link className={link} href="/charter">
                {t('terms')}
              </Link>
            </li>
          </ul>
        </div>
      </Container>
      <div className="border-t border-line">
        <Container className="flex flex-col gap-2 py-6 text-xs text-subtle sm:flex-row sm:justify-between">
          <span>© {new Date().getFullYear()} Dédale</span>
          <span>{t('madeIn')}</span>
        </Container>
      </div>
    </footer>
  );
}
