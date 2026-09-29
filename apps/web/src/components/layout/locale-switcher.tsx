'use client';

import { localeNames, locales } from '@dedale/i18n';
import { Languages } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { usePathname, useRouter } from '@/i18n/navigation';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

export function LocaleSwitcher() {
  const t = useTranslations('nav');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t('language')} disabled={pending}>
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-36">
        {locales.map((candidate) => (
          <DropdownMenuItem
            key={candidate}
            aria-current={candidate === locale}
            className={candidate === locale ? 'font-bold' : undefined}
            onSelect={() =>
              startTransition(() =>
                // @ts-expect-error -- les paramètres dynamiques correspondent toujours au chemin courant.
                router.replace({ pathname, params }, { locale: candidate }),
              )
            }
          >
            {localeNames[candidate]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
