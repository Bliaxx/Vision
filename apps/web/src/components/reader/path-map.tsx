'use client';

import type { Story } from '@dedale/engine';
import { buildGraph } from '@dedale/engine';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { formatPercent } from '@/lib/format';
import { layoutStory } from '@/lib/story-layout';

const BOX = { width: 120, height: 40 };

/**
 * Le fil d'Ariane : le graphe du récit vu du dessus. Les passages visités
 * s'allument, le chemin parcouru est tracé en rouge, le reste dort dans la
 * brume — assez pour donner envie de rejouer, sans rien divulgâcher.
 */
export function PathMap({
  story,
  path,
  current,
  locale,
}: {
  story: Story;
  path: readonly string[];
  current: string;
  locale: string;
}) {
  const t = useTranslations('reader');
  const positions = useMemo(() => layoutStory(story, BOX, { nodes: 26, ranks: 46 }), [story]);
  const edges = useMemo(
    () => buildGraph(story).edges.filter((edge) => edge.kind !== 'rule'),
    [story],
  );
  const visited = new Set(path);
  const center = (id: string) => {
    const position = positions.get(id);
    return position ? { x: position.x + BOX.width / 2, y: position.y + BOX.height / 2 } : null;
  };
  const xs = [...positions.values()].map((p) => p.x);
  const ys = [...positions.values()].map((p) => p.y);
  const width = Math.max(...xs) + BOX.width + 40;
  const height = Math.max(...ys) + BOX.height + 40;

  const trail = path
    .map((id) => center(id))
    .filter((point) => point !== null)
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

  const explored = visited.size / Math.max(1, story.passages.length);

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm text-muted">{t('mapHint')}</p>
      <p className="font-display text-lg font-semibold">
        {t('explored', { percent: formatPercent(explored, locale) })}
      </p>
      <div className="overflow-auto rounded-lg border border-line bg-canvas p-2">
        <svg
          viewBox={`-20 -20 ${width} ${height}`}
          className="w-full"
          style={{ minWidth: Math.min(width, 520) }}
          role="img"
          aria-label={t('map')}
        >
          {edges.map((edge) => {
            const from = center(edge.from);
            const to = center(edge.to);
            if (!from || !to) return null;
            const known = visited.has(edge.from) && visited.has(edge.to);
            return (
              <line
                key={`${edge.from}-${edge.to}-${edge.choice ?? edge.kind}`}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="var(--dd-canvas-dot)"
                strokeWidth={known ? 2 : 1.5}
                strokeDasharray={known ? undefined : '3 5'}
              />
            );
          })}
          <path
            d={trail}
            fill="none"
            stroke="var(--dd-accent)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={1}
            strokeDasharray="1"
            className="animate-thread [--thread-length:1]"
          />
          {story.passages.map((passage) => {
            const position = positions.get(passage.id);
            if (!position) return null;
            const seen = visited.has(passage.id);
            const isCurrent = passage.id === current;
            return (
              <g key={passage.id} transform={`translate(${position.x} ${position.y})`}>
                {seen ? (
                  <>
                    <rect
                      width={BOX.width}
                      height={BOX.height}
                      rx="10"
                      fill="var(--dd-surface-raised)"
                      stroke={isCurrent ? 'var(--dd-accent)' : 'var(--dd-border-strong)'}
                      strokeWidth={isCurrent ? 2.5 : 1}
                    />
                    <text
                      x={BOX.width / 2}
                      y={BOX.height / 2 + 4}
                      textAnchor="middle"
                      fontSize="11"
                      fontWeight="600"
                      fill="var(--dd-text)"
                      fontFamily="var(--dd-font-ui)"
                    >
                      {passage.title.length > 18 ? `${passage.title.slice(0, 17)}…` : passage.title}
                    </text>
                  </>
                ) : (
                  <circle
                    cx={BOX.width / 2}
                    cy={BOX.height / 2}
                    r="5"
                    fill="var(--dd-canvas-dot)"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
