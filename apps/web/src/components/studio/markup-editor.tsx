'use client';

import { parseTemplate, resolveTemplate, type Story, toBlocks } from '@dedale/engine';
import { Bold, Braces, GitFork, Italic, Minus, Quote } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { PassageText } from '../reader/passage-text';
import { Tooltip } from '../ui/tooltip';

/**
 * Éditeur de texte d'un passage : balisage léger avec barre d'outils, aperçu
 * rendu par le moteur (valeurs de départ), erreurs de balisage signalées.
 */
export function MarkupEditor({
  doc,
  value,
  onChange,
  id,
}: {
  doc: Story;
  value: string;
  onChange: (value: string) => void;
  id: string;
}) {
  const t = useTranslations('studio.editor');
  const locale = useLocale();
  const [mode, setMode] = useState<'write' | 'preview'>('write');
  const area = useRef<HTMLTextAreaElement>(null);
  const errors = parseTemplate(value).errors;

  const wrap = (before: string, after = before, placeholder = '') => {
    const element = area.current;
    if (!element) return;
    const { selectionStart, selectionEnd } = element;
    const selected = value.slice(selectionStart, selectionEnd) || placeholder;
    const next = `${value.slice(0, selectionStart)}${before}${selected}${after}${value.slice(selectionEnd)}`;
    onChange(next);
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(
        selectionStart + before.length,
        selectionStart + before.length + selected.length,
      );
    });
  };

  const firstVar = doc.variables[0]?.id ?? 'variable';
  const firstItem = doc.items[0]?.id;
  const tools = [
    { icon: Bold, label: t('tools.bold'), action: () => wrap('**') },
    { icon: Italic, label: t('tools.italic'), action: () => wrap('*') },
    { icon: Quote, label: t('tools.thought'), action: () => wrap('\n> ', '\n') },
    { icon: Minus, label: t('tools.sceneBreak'), action: () => wrap('\n\n---\n\n', '') },
    { icon: Braces, label: t('tools.variable'), action: () => wrap(`{{${firstVar}}}`, '') },
    {
      icon: GitFork,
      label: t('tools.condition'),
      action: () =>
        wrap(`{{#if ${firstItem ? `has ${firstItem}` : `${firstVar} > 0`}}}`, '{{/if}}', '…'),
    },
  ];

  const scope = {
    vars: Object.fromEntries(doc.variables.map((variable) => [variable.id, variable.initial])),
    inventory: {},
    visits: {},
    achievements: [],
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-0.5" role="toolbar" aria-label={t('passageText')}>
          {tools.map(({ icon: Icon, label, action }) => (
            <Tooltip key={label} content={label}>
              <button
                type="button"
                onClick={action}
                aria-label={label}
                disabled={mode === 'preview'}
                className="inline-flex size-8 cursor-pointer items-center justify-center rounded-md text-muted hover:bg-sunken hover:text-ink disabled:opacity-40"
              >
                <Icon className="size-4" />
              </button>
            </Tooltip>
          ))}
        </div>
        <div className="flex rounded-md border border-line p-0.5 text-xs font-semibold">
          {(['write', 'preview'] as const).map((candidate) => (
            <button
              key={candidate}
              type="button"
              onClick={() => setMode(candidate)}
              className={cn(
                'cursor-pointer rounded px-2.5 py-1',
                mode === candidate ? 'bg-ink text-bg' : 'text-muted',
              )}
            >
              {candidate === 'write' ? t('write') : t('preview')}
            </button>
          ))}
        </div>
      </div>
      {mode === 'write' ? (
        <textarea
          id={id}
          ref={area}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          spellCheck
          lang={doc.language}
          rows={12}
          className="min-h-64 w-full resize-y rounded-md border border-line-strong bg-raised p-3 font-reading text-[0.95rem] leading-relaxed outline-none focus-visible:border-thread focus-visible:ring-2 focus-visible:ring-thread/25"
        />
      ) : (
        <div
          data-reader-theme="paper"
          className="min-h-64 rounded-md border border-line bg-[var(--dd-reader-page)] p-4 text-[var(--dd-reader-text)] [--reader-size:1rem]"
        >
          <PassageText
            blocks={toBlocks(resolveTemplate(parseTemplate(value).nodes, scope, locale))}
          />
        </div>
      )}
      {errors.length > 0 ? (
        <ul className="flex flex-col gap-0.5">
          {errors.map((error) => (
            <li key={`${error.code}-${error.at}`} className="font-mono text-xs text-danger">
              {error.message} (@{error.at})
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-subtle">{t('textHint')}</p>
      )}
    </div>
  );
}
