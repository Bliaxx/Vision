import { genreColors } from '@dedale/tokens';

/**
 * Couvertures génératives : chaque récit reçoit un labyrinthe circulaire
 * unique, dérivé de son identifiant, que le fil rouge résout jusqu'au centre.
 * Déterministe (même rendu serveur/client), sans image à héberger.
 */
export interface CoverArt {
  readonly background: [string, string];
  readonly walls: string[];
  readonly thread: string;
  readonly knot: { x: number; y: number };
}

function hash(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function mix(hex: string, target: string, amount: number): string {
  const parse = (value: string) => [1, 3, 5].map((i) => Number.parseInt(value.slice(i, i + 2), 16));
  const [a, b] = [parse(hex), parse(target)];
  return `#${a
    .map((channel, i) =>
      Math.round(channel + ((b[i] as number) - channel) * amount)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

const TAU = Math.PI * 2;
const round = (value: number) => Math.round(value * 100) / 100;

export function coverArt(
  seedKey: string,
  genre: string | undefined,
  width = 200,
  height = 300,
): CoverArt {
  const random = mulberry32(hash(seedKey));
  const base =
    genreColors[(genre ?? 'adventure') as keyof typeof genreColors] ?? genreColors.adventure;
  const cx = width * (0.42 + random() * 0.16);
  const cy = height * (0.3 + random() * 0.1);
  const radius = width * (0.36 + random() * 0.06);
  const ringCount = 4 + Math.floor(random() * 3);
  const radii = Array.from({ length: ringCount }, (_, k) => (radius * (k + 1)) / ringCount);
  const gaps = radii.map(() => random() * TAU);
  const gapWidth = 0.55;
  const point = (r: number, angle: number) =>
    `${round(cx + r * Math.cos(angle))} ${round(cy + r * Math.sin(angle))}`;

  const walls: string[] = radii.map((r, k) => {
    const start = (gaps[k] as number) + gapWidth / 2;
    const end = (gaps[k] as number) - gapWidth / 2 + TAU;
    return `M ${point(r, start)} A ${round(r)} ${round(r)} 0 1 1 ${point(r, end)}`;
  });

  // Le fil : de l'extérieur, franchir chaque anneau par sa brèche, jusqu'au centre.
  const corridor = (k: number) => ((radii[k] as number) + (radii[k - 1] ?? 0)) / 2;
  const outer = ringCount - 1;
  let thread = `M ${point(radius * 1.45, gaps[outer] as number)} L ${point(corridor(outer), gaps[outer] as number)}`;
  const travelled: { k: number; from: number; to: number }[] = [];
  for (let k = outer; k > 0; k--) {
    const from = gaps[k] as number;
    const to = gaps[k - 1] as number;
    let delta = (to - from) % TAU;
    if (delta > Math.PI) delta -= TAU;
    if (delta < -Math.PI) delta += TAU;
    const r = corridor(k);
    thread += ` A ${round(r)} ${round(r)} 0 0 ${delta > 0 ? 1 : 0} ${point(r, to)} L ${point(corridor(k - 1), to)}`;
    travelled.push({ k, from, to: from + delta });
  }
  thread += ` L ${round(cx)} ${round(cy)}`;

  // Quelques cloisons radiales, jamais sur le chemin du fil.
  for (let k = 1; k < ringCount; k++) {
    const path = travelled.find((segment) => segment.k === k);
    for (let attempt = 0; attempt < 2; attempt++) {
      const angle = random() * TAU;
      if (path) {
        const [low, high] = path.from < path.to ? [path.from, path.to] : [path.to, path.from];
        const normalized = [angle, angle - TAU, angle + TAU];
        if (normalized.some((a) => a > low - 0.2 && a < high + 0.2)) continue;
      }
      walls.push(`M ${point(radii[k - 1] as number, angle)} L ${point(radii[k] as number, angle)}`);
    }
  }

  return {
    background: [mix(base, '#FFFFFF', 0.08), mix(base, '#0F0E1C', 0.62)],
    walls,
    thread,
    knot: { x: round(cx), y: round(cy) },
  };
}
