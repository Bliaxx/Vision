import type { ReactNode } from 'react';

/** Espace immersif (liseuse, éditeur) : ni en-tête ni pied de page. */
export default function ImmersiveLayout({ children }: { children: ReactNode }) {
  return children;
}
