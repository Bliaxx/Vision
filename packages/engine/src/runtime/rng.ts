/**
 * Générateur pseudo-aléatoire déterministe (SFC32, initialisé par SplitMix32).
 *
 * L'état est une simple valeur (quatre entiers 32 bits) stockée dans l'état de
 * jeu : une partie est entièrement reproductible à partir de sa graine et de
 * la liste des actions du lecteur. C'est ce qui permet le retour arrière sans
 * « save-scumming », des sauvegardes minuscules et la vérification côté
 * serveur des fins atteintes.
 */
export type RngState = readonly [number, number, number, number];

function splitmix32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x9e3779b9) >>> 0;
    let z = state;
    z = Math.imul(z ^ (z >>> 16), 0x85ebca6b) >>> 0;
    z = Math.imul(z ^ (z >>> 13), 0xc2b2ae35) >>> 0;
    return (z ^ (z >>> 16)) >>> 0;
  };
}

export function seedRng(seed: number): RngState {
  const next = splitmix32(seed);
  let state: RngState = [next(), next(), next(), next()];
  // Quelques tours à vide pour décorréler les graines proches.
  for (let i = 0; i < 12; i++) state = nextUint32(state)[1];
  return state;
}

export function nextUint32(state: RngState): [value: number, next: RngState] {
  let [a, b, c, d] = state;
  a >>>= 0;
  b >>>= 0;
  c >>>= 0;
  d >>>= 0;
  const t = (((a + b) >>> 0) + d) >>> 0;
  d = (d + 1) >>> 0;
  a = b ^ (b >>> 9);
  b = (c + (c << 3)) >>> 0;
  c = (c << 21) | (c >>> 11);
  c = (c + t) >>> 0;
  return [t, [a >>> 0, b >>> 0, c >>> 0, d]];
}

/** Nombre flottant dans [0, 1). */
export function nextFloat(state: RngState): [value: number, next: RngState] {
  const [value, next] = nextUint32(state);
  return [value / 4_294_967_296, next];
}

/** Entier uniforme dans [1, sides]. */
export function rollDie(state: RngState, sides: number): [value: number, next: RngState] {
  const [value, next] = nextFloat(state);
  return [1 + Math.floor(value * sides), next];
}

/** Graine aléatoire pour démarrer une nouvelle partie. */
export function randomSeed(): number {
  return Math.floor(Math.random() * 4_294_967_296) >>> 0;
}
