'use client';

import type { CompiledStory, EngineEvent } from '@dedale/engine';
import { Award, PackageMinus, PackagePlus } from 'lucide-react';
import { useTranslations } from 'next-intl';

/** Annonces discrètes des conséquences d'un choix (objets, succès). */
export function EventNotices({
  events,
  story,
}: {
  events: readonly EngineEvent[];
  story: CompiledStory;
}) {
  const t = useTranslations('reader');
  const notices = events.flatMap((event) => {
    switch (event.type) {
      case 'item:gained': {
        const item = story.items.get(event.item);
        if (!item || item.hidden) return [];
        return [
          {
            key: `g-${event.item}`,
            icon: PackagePlus,
            text: t('itemGained', {
              item: event.qty > 1 ? `${event.qty} × ${item.name}` : item.name,
            }),
          },
        ];
      }
      case 'item:lost': {
        const item = story.items.get(event.item);
        if (!item || item.hidden) return [];
        return [
          { key: `l-${event.item}`, icon: PackageMinus, text: t('itemLost', { item: item.name }) },
        ];
      }
      case 'achievement:unlocked': {
        const achievement = story.achievements.get(event.achievement);
        return achievement
          ? [
              {
                key: `a-${event.achievement}`,
                icon: Award,
                text: t('achievementUnlocked', { name: achievement.name }),
              },
            ]
          : [];
      }
      default:
        return [];
    }
  });
  if (notices.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-live="polite">
      {notices.map(({ key, icon: Icon, text }) => (
        <li
          key={key}
          className="inline-flex animate-rise items-center gap-1.5 rounded-full border border-[var(--dd-reader-rule)] px-3 py-1 font-sans text-xs font-semibold"
        >
          <Icon className="size-3.5 text-[var(--dd-reader-accent)]" aria-hidden /> {text}
        </li>
      ))}
    </ul>
  );
}
