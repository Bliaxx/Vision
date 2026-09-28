const ALPHABET = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Génère un identifiant court et lisible (`p_k3x9a2`) pour les éléments d'un
 * récit. L'unicité n'a besoin d'être garantie qu'à l'intérieur d'un document :
 * on vérifie donc contre les identifiants existants.
 */
export function createId(
  prefix: string,
  existing: ReadonlySet<string> = new Set(),
  random: () => number = Math.random,
): string {
  for (;;) {
    let suffix = '';
    for (let i = 0; i < 6; i++) suffix += ALPHABET[Math.floor(random() * ALPHABET.length)];
    const id = `${prefix}_${suffix}`;
    if (!existing.has(id)) return id;
  }
}

/** Convertit un libellé libre en identifiant valide (`La Tour Noire` → `la-tour-noire`). */
export function slugifyId(label: string, fallback = 'element'): string {
  const slug = label
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return /^[a-z]/.test(slug) ? slug : `${fallback}-${slug || '1'}`.replace(/-$/, '');
}
