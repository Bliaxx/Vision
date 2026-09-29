'use client';

import type { Passage } from '@dedale/engine';
import { Handle, type Node, type NodeProps, Position } from '@xyflow/react';
import { AlertCircle, Dices, Flag, Lock, Save, Sword } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { memo } from 'react';
import { cn } from '@/lib/cn';
import { EndingIcon } from '../story/badges';

export interface PassageNodeData extends Record<string, unknown> {
  passage: Passage;
  isStart: boolean;
  severity: 'error' | 'warning' | null;
  heat: number | null;
}

export type PassageNodeType = Node<PassageNodeData, 'passage'>;

function excerpt(text: string): string {
  const plain = text
    .replace(/\{\{[^}]*\}\}/g, '…')
    .replace(/[*#>_]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return plain.length > 96 ? `${plain.slice(0, 95)}…` : plain;
}

/** Carte d'un passage dans le graphe : titre, extrait, mécaniques, état de validation. */
export const PassageNode = memo(function PassageNode({
  data,
  selected,
}: NodeProps<PassageNodeType>) {
  const t = useTranslations('studio.editor');
  const { passage, isStart, severity, heat } = data;
  const hasTest = passage.choices.some((choice) => choice.test);
  const hasCondition = passage.choices.some((choice) => choice.condition);
  return (
    <div
      className={cn(
        'relative w-[240px] rounded-xl border bg-raised text-left shadow-paper transition-[box-shadow,border-color]',
        selected ? 'border-thread shadow-glow' : 'border-line-strong',
        passage.ending && 'border-dashed',
      )}
      style={
        heat !== null
          ? {
              boxShadow: `0 0 0 ${2 + heat * 8}px color-mix(in oklab, var(--dd-accent) ${Math.round(15 + heat * 55)}%, transparent)`,
            }
          : undefined
      }
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!size-3 !border-2 !border-raised !bg-line-strong"
      />
      <div className="flex items-center gap-1.5 border-b border-line px-3 py-2">
        {isStart ? (
          <span className="rounded-full bg-thread px-1.5 py-0.5 text-[0.6rem] font-bold tracking-wide text-on-thread uppercase">
            {t('start')}
          </span>
        ) : null}
        {passage.ending ? <EndingIcon kind={passage.ending.kind} /> : null}
        <span className="min-w-0 flex-1 truncate text-sm font-bold">{passage.title}</span>
        {severity ? (
          <AlertCircle
            className={cn('size-4 shrink-0', severity === 'error' ? 'text-danger' : 'text-warning')}
            aria-label={severity}
          />
        ) : null}
      </div>
      <p className="line-clamp-3 min-h-[3.6em] px-3 py-2 font-reading text-[0.8rem] leading-snug text-muted">
        {excerpt(passage.text) || '—'}
      </p>
      <div className="flex items-center gap-2 px-3 pb-2 text-subtle [&_svg]:size-3.5">
        {passage.checkpoint ? <Save aria-label={t('checkpoint')} /> : null}
        {hasTest ? <Dices aria-label={t('test')} /> : null}
        {passage.encounter ? <Sword aria-label={t('encounter')} /> : null}
        {hasCondition ? <Lock aria-label={t('condition')} /> : null}
        {passage.ending ? <Flag aria-label={t('ending')} /> : null}
        <span className="ml-auto font-mono text-[0.65rem]">{passage.choices.length}</span>
      </div>
      {!passage.ending ? (
        <Handle
          type="source"
          position={Position.Bottom}
          className="!size-3 !border-2 !border-raised !bg-thread"
        />
      ) : null}
    </div>
  );
});
