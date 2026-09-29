'use client';

import type { Me } from '@dedale/contracts';
import { BookMarked, LogOut, PenLine, ShieldCheck, UserRound } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar } from '../ui/misc';

export function UserMenu({ me }: { me: Me }) {
  const t = useTranslations('nav');
  const tp = useTranslations('pricing.plans');
  const router = useRouter();
  const moderator = me.user.role === 'moderator' || me.user.role === 'admin';

  const signOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="cursor-pointer rounded-full ring-offset-2 ring-offset-bg hover:ring-2 hover:ring-line-strong"
        aria-label={t('account')}
      >
        <Avatar name={me.profile.displayName} src={me.profile.avatarUrl} size={34} />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <span className="block text-sm font-semibold text-ink">{me.profile.displayName}</span>
          <span className="block">
            @{me.profile.handle} · {tp(`${me.subscription.plan}.name`)}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/library">
            <BookMarked /> {t('library')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/studio">
            <PenLine /> {t('studio')}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/account">
            <UserRound /> {t('account')}
          </Link>
        </DropdownMenuItem>
        {moderator ? (
          <DropdownMenuItem asChild>
            <Link href="/moderation">
              <ShieldCheck /> {t('moderation')}
            </Link>
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={signOut}>
          <LogOut /> {t('signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
