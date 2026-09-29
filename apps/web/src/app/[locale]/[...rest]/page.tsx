import { notFound } from 'next/navigation';

/** Toute URL inconnue sous une locale affiche la 404 localisée (et non celle de la racine). */
export default function CatchAll() {
  notFound();
}
