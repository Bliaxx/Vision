import type { AccessModel } from '@dedale/contracts';
import type { EndingKind } from '@dedale/engine';
import { Crown, Flag, Gem, Skull, Sparkles, Trophy, Waypoints } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { Badge } from '../ui/badge';

export function AccessBadge({ access, className }: { access: AccessModel; className?: string }) {
  const t = useTranslations('access');
  if (access === 'free') return null;
  return (
    <Badge tone={access === 'premium' ? 'brass' : 'night'} className={className}>
      {access === 'premium' ? <Crown aria-hidden /> : <Gem aria-hidden />}
      {t(access)}
    </Badge>
  );
}

const DIFFICULTY_LEVEL = { gentle: 1, balanced: 2, challenging: 3, brutal: 4 } as const;

export function DifficultyMeter({ difficulty }: { difficulty: keyof typeof DIFFICULTY_LEVEL }) {
  const t = useTranslations('difficulty');
  const level = DIFFICULTY_LEVEL[difficulty];
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span className="inline-flex gap-0.5" aria-hidden>
        {[1, 2, 3, 4].map((step) => (
          <span
            key={step}
            className={cn('h-3 w-1.5 rounded-full', step <= level ? 'bg-thread' : 'bg-line')}
          />
        ))}
      </span>
      {t(difficulty)}
    </span>
  );
}

const ENDING_ICONS = {
  victory: Trophy,
  defeat: Flag,
  death: Skull,
  neutral: Waypoints,
  secret: Sparkles,
} as const;

export function EndingIcon({ kind, className }: { kind: EndingKind; className?: string }) {
  const Icon = ENDING_ICONS[kind];
  return (
    <Icon
      className={cn('size-4', className)}
      style={{ color: `var(--dd-ending-${kind})` }}
      aria-hidden
    />
  );
}
