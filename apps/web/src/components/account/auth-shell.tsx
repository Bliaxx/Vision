import type { ReactNode } from 'react';
import { Monogram } from '../brand/monogram';
import { Container } from '../ui/misc';

/** Mise en page des écrans d'authentification : formulaire + citation de marque. */
export function AuthShell({
  title,
  subtitle,
  children,
  aside,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <Container className="grid min-h-[calc(100dvh-4rem)] items-center gap-12 py-12 lg:grid-cols-2">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-4xl font-semibold">{title}</h1>
          <p className="text-muted">{subtitle}</p>
        </div>
        {children}
        {aside}
      </div>
      <div
        className="relative hidden h-full min-h-[32rem] overflow-hidden rounded-3xl bg-night lg:block"
        data-theme="dark"
      >
        <Monogram
          size={520}
          animated
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--dd-ink-700)]"
          title=""
          aria-hidden
        />
        <p className="absolute right-10 bottom-10 left-10 font-display text-3xl leading-snug text-parchment italic">
          « Le labyrinthe n'a de sens que pour qui tient le fil. »
        </p>
      </div>
    </Container>
  );
}
