import { useId } from 'react';
import { cn } from '@/lib/cn';

/** Illustration de l'éditeur : un graphe de passages, un chemin tracé en rouge. */
export function GraphIllustration({
  labels,
  className,
}: {
  labels: readonly string[];
  className?: string;
}) {
  const nodes = [
    { id: 'a', x: 170, y: 20, on: true },
    { id: 'b', x: 40, y: 120, on: true },
    { id: 'c', x: 300, y: 120, on: false },
    { id: 'd', x: 170, y: 220, on: true },
    { id: 'e', x: 40, y: 320, on: false },
    { id: 'f', x: 300, y: 320, on: true },
    { id: 'g', x: 170, y: 420, on: true },
  ].map((node, index) => ({ ...node, label: labels[index] ?? '' }));
  const edges: [string, string][] = [
    ['a', 'b'],
    ['a', 'c'],
    ['b', 'd'],
    ['c', 'd'],
    ['d', 'e'],
    ['d', 'f'],
    ['f', 'g'],
    ['e', 'g'],
  ];
  const patternId = useId();
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const path = ['a', 'b', 'd', 'f', 'g']
    .map((id) => byId.get(id))
    .filter((node) => node !== undefined);
  return (
    <svg viewBox="0 0 440 480" className={cn('w-full', className)} aria-hidden>
      <defs>
        <pattern id={patternId} width="18" height="18" patternUnits="userSpaceOnUse">
          <circle cx="1.5" cy="1.5" r="1.5" fill="var(--dd-canvas-dot)" />
        </pattern>
      </defs>
      <rect width="440" height="480" rx="20" fill="var(--dd-canvas)" />
      <rect width="440" height="480" rx="20" fill={`url(#${patternId})`} />
      {edges.map(([from, to]) => {
        const a = byId.get(from);
        const b = byId.get(to);
        if (!a || !b) return null;
        return (
          <line
            key={`${from}${to}`}
            x1={a.x + 50}
            y1={a.y + 22}
            x2={b.x + 50}
            y2={b.y + 22}
            stroke="var(--dd-border-strong)"
            strokeWidth="1.5"
          />
        );
      })}
      <polyline
        points={path.map((node) => `${node.x + 50},${node.y + 22}`).join(' ')}
        fill="none"
        stroke="var(--dd-accent)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {nodes.map((node) => (
        <g key={node.id} transform={`translate(${node.x} ${node.y})`}>
          <rect
            width="100"
            height="44"
            rx="10"
            fill="var(--dd-surface-raised)"
            stroke={node.on ? 'var(--dd-accent)' : 'var(--dd-border)'}
            strokeWidth={node.on ? 2 : 1}
          />
          <text
            x="50"
            y="27"
            textAnchor="middle"
            fontSize="12"
            fontWeight="600"
            fill="var(--dd-text)"
            fontFamily="var(--dd-font-ui)"
          >
            {node.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
