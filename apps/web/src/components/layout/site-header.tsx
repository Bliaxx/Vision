import { Search } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { getPathname, Link } from '@/i18n/navigation';
import { getMe } from '@/lib/session';
import { getThemePreference } from '@/lib/theme-server';
import { Logo } from '../brand/wordmark';
import { Button } from '../ui/button';
import { Container } from '../ui/misc';
import { LocaleSwitcher } from './locale-switcher';
import { MobileNav } from './mobile-nav';
import { ThemeToggle } from './theme-toggle';
import { UserMenu } from './user-menu';

export async function SiteHeader() {
  const [t, me, locale, theme] = await Promise.all([
    getTranslations('nav'),
    getMe(),
    getLocale(),
    getThemePreference(),
  ]);
  const link = 'thread-underline py-1 text-sm font-semibold text-muted hover:text-ink';
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur-md">
      <Container className="flex h-16 items-center gap-6">
        <Link href="/" className="shrink-0 rounded-md" aria-label={t('home')}>
          <Logo />
        </Link>
        <nav aria-label={t('primary')} className="hidden items-center gap-6 md:flex">
          <Link className={link} href="/explore">
            {t('explore')}
          </Link>
          <Link className={link} href="/studio">
            {t('studio')}
          </Link>
          <Link className={link} href="/pricing">
            {t('pricing')}
          </Link>
          <Link className={link} href="/schools">
            {t('schools')}
          </Link>
        </nav>
        <search className="ml-auto hidden max-w-xs flex-1 lg:block">
          <form action={getPathname({ href: '/explore', locale })}>
            <label className="relative block">
              <span className="sr-only">{t('search')}</span>
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-subtle" />
              <input
                name="q"
                type="search"
                placeholder={t('search')}
                className="h-9 w-full rounded-full border border-line bg-surface pr-3 pl-9 text-sm outline-none placeholder:text-subtle focus-visible:border-thread focus-visible:ring-2 focus-visible:ring-thread/20"
              />
            </label>
          </form>
        </search>
        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <LocaleSwitcher />
          <ThemeToggle initial={theme} />
          {me ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/library">{t('library')}</Link>
              </Button>
              <UserMenu me={me} />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link href="/sign-in">{t('signIn')}</Link>
              </Button>
              <Button asChild size="sm" className="hidden sm:inline-flex">
                <Link href="/sign-up">{t('signUp')}</Link>
              </Button>
            </>
          )}
          <MobileNav signedIn={me !== null} />
        </div>
      </Container>
    </header>
  );
}
