'use client';

import { Menu } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';

export function MobileNav({ signedIn }: { signedIn: boolean }) {
  const t = useTranslations('nav');
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const item = 'rounded-md px-3 py-3 font-display text-2xl font-semibold hover:bg-sunken';
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={t('menu')}>
          <Menu />
        </Button>
      </DialogTrigger>
      <DialogContent side="right" title={t('menu')}>
        <nav className="flex flex-col gap-1">
          <Link className={item} href="/explore" onClick={close}>
            {t('explore')}
          </Link>
          <Link className={item} href="/studio" onClick={close}>
            {t('studio')}
          </Link>
          <Link className={item} href="/pricing" onClick={close}>
            {t('pricing')}
          </Link>
          <Link className={item} href="/schools" onClick={close}>
            {t('schools')}
          </Link>
          {signedIn ? (
            <Link className={item} href="/library" onClick={close}>
              {t('library')}
            </Link>
          ) : (
            <Link className={item} href="/sign-in" onClick={close}>
              {t('signIn')}
            </Link>
          )}
        </nav>
      </DialogContent>
    </Dialog>
  );
}
