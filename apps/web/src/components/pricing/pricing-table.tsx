'use client';

import type { Entitlement, Plan } from '@dedale/contracts';
import { PLAN_CATALOG } from '@dedale/contracts';
import { Check } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/browser';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

const FEATURES: Record<Plan, (Entitlement | 'free_catalog' | 'cloud_saves')[]> = {
  wanderer: ['free_catalog', 'ad_free', 'cloud_saves'],
  explorer: ['free_catalog', 'ad_free', 'cloud_saves', 'premium_catalog', 'unlimited_offline'],
  family: ['premium_catalog', 'unlimited_offline', 'family_profiles', 'ad_free'],
  architect: ['premium_catalog', 'author_analytics', 'muse', 'private_publishing', 'print_export'],
  studio: ['studio_workspace', 'author_analytics', 'muse', 'print_export'],
};

/** Grille tarifaire : un seul catalogue d'offres, partagé avec l'API. */
export function PricingTable({
  currentPlan,
  signedIn,
}: {
  currentPlan: Plan | null;
  signedIn: boolean;
}) {
  const t = useTranslations('pricing');
  const locale = useLocale();
  const router = useRouter();
  const [interval, setInterval] = useState<'month' | 'year'>('year');
  const [pending, setPending] = useState<Plan | null>(null);

  const choose = async (plan: Plan) => {
    if (plan === 'studio') {
      window.location.href = 'mailto:atelier@dedale.app';
      return;
    }
    if (!signedIn) return router.push('/sign-up');
    if (plan === 'wanderer') return router.push('/explore');
    setPending(plan);
    try {
      const { url } = await api.billing.checkout({ kind: 'subscription', plan, interval });
      window.location.assign(url);
    } catch {
      toast.error(t('checkoutError'));
      setPending(null);
    }
  };

  const plans = (['wanderer', 'explorer', 'family', 'architect', 'studio'] as const).map(
    (id) => PLAN_CATALOG[id],
  );

  return (
    <div className="flex flex-col items-center gap-10">
      <fieldset className="inline-flex rounded-full border border-line-strong bg-surface p-1">
        <legend className="sr-only">{t('yearly')}</legend>
        {(['month', 'year'] as const).map((value) => (
          <label
            key={value}
            className={cn(
              'cursor-pointer rounded-full px-5 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-thread',
              interval === value ? 'bg-ink text-bg' : 'text-muted hover:text-ink',
            )}
          >
            <input
              type="radio"
              name="billing-interval"
              value={value}
              checked={interval === value}
              onChange={() => setInterval(value)}
              className="sr-only"
            />
            {value === 'month' ? t('monthly') : t('yearly')}
            {value === 'year' ? (
              <span className="ml-2 text-xs text-thread">{t('yearlySave')}</span>
            ) : null}
          </label>
        ))}
      </fieldset>
      <div className="grid w-full gap-5 md:grid-cols-2 xl:grid-cols-5">
        {plans.map((plan) => {
          const price = interval === 'year' ? plan.yearly : plan.monthly;
          const current = currentPlan === plan.id;
          return (
            <article
              key={plan.id}
              className={cn(
                'relative flex flex-col gap-5 rounded-2xl border bg-surface p-6',
                plan.highlighted ? 'border-thread shadow-glow' : 'border-line shadow-paper',
              )}
            >
              {plan.highlighted ? (
                <Badge tone="thread" className="absolute -top-3 left-6">
                  {t('popular')}
                </Badge>
              ) : null}
              <div className="flex flex-col gap-1">
                <h2 className="font-display text-2xl font-semibold">
                  {t(`plans.${plan.id}.name`)}
                </h2>
                <p className="min-h-12 text-sm text-muted">{t(`plans.${plan.id}.tagline`)}</p>
              </div>
              <p className="flex items-baseline gap-1">
                <span className="font-display text-4xl font-semibold">
                  {price === null
                    ? t('onQuote')
                    : price === 0
                      ? t('free')
                      : formatPrice(price, locale)}
                </span>
                {price ? (
                  <span className="text-sm text-muted">
                    {interval === 'year' ? t('perYear') : t('perMonth')}
                  </span>
                ) : null}
              </p>
              <ul className="flex flex-1 flex-col gap-2.5">
                {FEATURES[plan.id].map((feature) => (
                  <li key={feature} className="flex items-start gap-2 text-sm">
                    <Check className="mt-0.5 size-4 shrink-0 text-thread" aria-hidden />
                    {t(`features.${feature}`)}
                  </li>
                ))}
              </ul>
              <Button
                variant={plan.highlighted ? 'primary' : 'secondary'}
                disabled={current || pending !== null}
                onClick={() => choose(plan.id)}
              >
                {current
                  ? t('current')
                  : plan.id === 'studio'
                    ? t('contact')
                    : t('choose', { plan: t(`plans.${plan.id}.name`) })}
              </Button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
