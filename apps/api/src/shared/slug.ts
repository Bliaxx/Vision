/** `Le Phare des Brumes !` → `le-phare-des-brumes`. */
export function slugify(value: string, maxLength = 80): string {
  const slug = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/['’]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength)
    .replace(/-+$/g, '');
  return slug || 'recit';
}

/** Identifiant public : minuscules, chiffres et `_`. */
export function toHandle(value: string): string {
  const handle = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);
  return handle.length >= 3 ? handle : `lecteur_${handle || 'dedale'}`;
}
