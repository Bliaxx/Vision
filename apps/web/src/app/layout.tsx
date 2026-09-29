import type { ReactNode } from 'react';
import './globals.css';

/** Le vrai layout racine est `[locale]/layout.tsx` (balise <html lang>). */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
