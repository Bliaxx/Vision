import type { Compare, EndingKind, Value } from '../format/types';

/**
 * Événements émis par le moteur à chaque transition. Ils alimentent
 * l'interface (animations de dés, notifications d'objets, succès…) et
 * l'analytique (statistiques de choix, fins atteintes) sans que ces couches
 * n'aient à comparer des états.
 */
export type EngineEvent =
  | { type: 'passage:entered'; passage: string }
  | { type: 'choice:made'; passage: string; choice: string }
  | {
      type: 'dice:rolled';
      label: string | null;
      dice: string;
      rolls: readonly number[];
      modifier: number;
      total: number;
      compare: Compare;
      target: number;
      success: boolean;
    }
  | { type: 'test:resolved'; success: boolean; text: string | null }
  | { type: 'var:changed'; var: string; from: Value; to: Value }
  | { type: 'item:gained'; item: string; qty: number }
  | { type: 'item:lost'; item: string; qty: number }
  | { type: 'achievement:unlocked'; achievement: string }
  | { type: 'rule:triggered'; rule: string; to: string }
  | { type: 'combat:started'; enemies: readonly string[] }
  | {
      type: 'combat:round';
      round: number;
      enemy: string;
      heroRolls: readonly number[];
      enemyRolls: readonly number[];
      heroAttack: number;
      enemyAttack: number;
      winner: 'hero' | 'enemy' | 'tie';
      heroStamina: number;
      enemyStamina: number;
    }
  | { type: 'combat:enemy-defeated'; enemy: string }
  | { type: 'combat:ended'; outcome: 'victory' | 'defeat' | 'fled' }
  | { type: 'ending:reached'; passage: string; kind: EndingKind; title: string };

export type EngineEventType = EngineEvent['type'];
