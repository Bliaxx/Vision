import type { ReactNode } from 'react';

/** Illustration des pages d'erreur : un fil rouge rompu au milieu du labyrinthe. */
export function LostThread({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-6 px-4 py-24 text-center">
      <svg viewBox="0 0 240 120" className="w-64" aria-hidden fill="none" strokeLinecap="round">
        <g stroke="var(--dd-border-strong)" strokeWidth="3">
          <path d="M20 100 V20 H220 V100" />
          <path d="M60 100 V60 H180 V100" />
          <path d="M100 20 V44" />
        </g>
        <path d="M0 80 H40 V40 H96" stroke="var(--dd-accent)" strokeWidth="3.5" />
        <path
          d="M140 40 H200 V80 H240"
          stroke="var(--dd-accent)"
          strokeWidth="3.5"
          strokeDasharray="2 7"
        />
        <circle cx="96" cy="40" r="4" fill="var(--dd-accent)" />
      </svg>
      <h1 className="font-display text-4xl font-semibold text-balance sm:text-5xl">{title}</h1>
      <p className="text-lg text-muted">{body}</p>
      {children}
    </div>
  );
}
