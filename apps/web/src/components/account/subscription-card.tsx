'use client';

import type { Me } from '@dedale/contracts';
import { Crown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { api } from '@/lib/api/browser';
import { formatDate } from '@/lib/format';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export function SubscriptionCard({ me }: { me: Me }) {
  const t = useTranslations();
  const locale = useLocale();
  const { subscription } = me;
  const paid = subscription.plan !== 'wanderer';
  const openPortal = async () => {
    const { url } = await api.billing.portal();
    window.location.assign(url);
  };
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-2xl font-semibold">
          {t(`pricing.plans.${subscription.plan}.name`)}
        </p>
        {paid ? (
          <Badge tone="brass">
            <Crown />{' '}
            {subscription.interval === 'year' ? t('pricing.yearly') : t('pricing.monthly')}
          </Badge>
        ) : null}
      </div>
      <p className="text-muted">{t(`pricing.plans.${subscription.plan}.tagline`)}</p>
      {subscription.renewsAt ? (
        <p className="text-sm">
          {t('account.renewsOn', { date: formatDate(subscription.renewsAt, locale) })}
        </p>
      ) : null}
      <ul className="flex flex-wrap gap-2">
        {me.entitlements.map((entitlement) => (
          <li key={entitlement}>
            <Badge tone="outline">{t(`pricing.features.${entitlement}`)}</Badge>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant={paid ? 'secondary' : 'primary'}>
          <Link href="/pricing">{t('account.upgrade')}</Link>
        </Button>
        {paid ? (
          <Button variant="ghost" onClick={openPortal}>
            {t('account.manage')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
