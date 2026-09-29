'use client';

import { checkExpr, type Story, type TypeEnvironment, tryParseExpr } from '@dedale/engine';
import { useMemo } from 'react';
import { cn } from '@/lib/cn';

function environment(doc: Story): TypeEnvironment {
  const variables = new Map(doc.variables.map((variable) => [variable.id, variable.type]));
  const items = new Set(doc.items.map((item) => item.id));
  const passages = new Set(doc.passages.map((passage) => passage.id));
  const achievements = new Set(doc.achievements.map((achievement) => achievement.id));
  return {
    varType: (id) => variables.get(id),
    hasItem: (id) => items.has(id),
    hasPassage: (id) => passages.has(id),
    hasAchievement: (id) => achievements.has(id),
  };
}

/** Validation instantanée d'une expression (syntaxe, références, types). */
export function useExpressionCheck(doc: Story, source: string | undefined) {
  return useMemo(() => {
    if (!source?.trim()) return null;
    const parsed = tryParseExpr(source);
    if (!parsed.ok) return { message: parsed.error.message, at: parsed.error.at };
    const { issues } = checkExpr(parsed.expr, environment(doc));
    const issue = issues[0];
    if (!issue) return null;
    return {
      message: 'ref' in issue ? `? ${issue.ref}` : `${issue.found} ≠ ${issue.expected}`,
      at: null,
    };
  }, [doc, source]);
}

/** Champ d'expression : police à chasse fixe, erreur annoncée, suggestions de symboles. */
export function ExpressionInput({
  doc,
  value,
  onChange,
  placeholder,
  id,
  className,
}: {
  doc: Story;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id: string;
  className?: string;
}) {
  const problem = useExpressionCheck(doc, value);
  const listId = `${id}-symbols`;
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <input
        id={id}
        list={listId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={problem !== null}
        aria-describedby={problem ? `${id}-error` : undefined}
        className="h-9 w-full rounded-md border border-line-strong bg-raised px-2.5 font-mono text-[0.8rem] outline-none focus-visible:border-thread focus-visible:ring-2 focus-visible:ring-thread/25 aria-invalid:border-danger"
      />
      <datalist id={listId}>
        {doc.variables.map((variable) => (
          <option key={variable.id} value={`${variable.id} >= 1`} />
        ))}
        {doc.items.map((item) => (
          <option key={item.id} value={`has ${item.id}`} />
        ))}
      </datalist>
      {problem ? (
        <p id={`${id}-error`} className="font-mono text-xs text-danger">
          {problem.message}
        </p>
      ) : null}
    </div>
  );
}
