import type { ChoiceSuggestions, Critique } from '@dedale/contracts';
import type { MuseEngine, PassageContext } from '../../modules/muse/muse.port';

/**
 * Muse hors ligne : heuristiques déterministes, sans appel réseau. Utilisée en
 * développement et dans les tests quand aucune clé d'API n'est configurée —
 * l'interface du studio reste entièrement explorable.
 */
export class OfflineMuse implements MuseEngine {
  readonly name = 'offline';

  async suggestChoices(context: PassageContext): Promise<ChoiceSuggestions> {
    const fr = context.language.startsWith('fr');
    const item = context.items[0];
    const suggestions = fr
      ? [
          {
            text: 'Observer les lieux avant d’agir',
            direction: 'Un temps de prudence qui révèle un détail caché du décor.',
          },
          {
            text: 'Foncer sans réfléchir',
            direction: 'Un choix audacieux, idéal pour une épreuve de chance ou un combat.',
          },
          {
            text: 'Chercher un allié',
            direction: 'Une rencontre qui peut ouvrir une branche relationnelle.',
          },
          ...(item
            ? [
                {
                  text: `Utiliser : ${item}`,
                  direction: `Récompense le lecteur qui possède « ${item} » (choix conditionnel).`,
                },
              ]
            : []),
        ]
      : [
          {
            text: 'Look around before acting',
            direction: 'A cautious beat that reveals a hidden detail.',
          },
          { text: 'Charge ahead', direction: 'A bold option, perfect for a luck test or a fight.' },
          {
            text: 'Look for an ally',
            direction: 'An encounter that can open a relationship branch.',
          },
          ...(item
            ? [
                {
                  text: `Use: ${item}`,
                  direction: `Rewards readers holding “${item}” (conditional choice).`,
                },
              ]
            : []),
        ];
    return { suggestions: suggestions.slice(0, 5) };
  }

  async critique(context: PassageContext): Promise<Critique> {
    const fr = context.language.startsWith('fr');
    const notes: Critique['notes'] = [];
    const text = context.passage.text;
    const words = text.split(/\s+/).filter(Boolean).length;
    if (words < 40) {
      notes.push({
        kind: 'pacing',
        excerpt: null,
        comment: fr
          ? 'Passage très court : ajoutez une sensation ou un détail concret pour ancrer la scène.'
          : 'Very short passage: add a sensory detail to ground the scene.',
      });
    }
    if (words > 450) {
      notes.push({
        kind: 'pacing',
        excerpt: null,
        comment: fr
          ? 'Passage long : envisagez de le scinder et d’offrir un choix intermédiaire.'
          : 'Long passage: consider splitting it with an intermediate choice.',
      });
    }
    const doubled = /\b(\p{L}+)\s+\1\b/iu.exec(text);
    if (doubled) {
      notes.push({
        kind: 'typo',
        excerpt: doubled[0],
        comment: fr ? 'Mot répété.' : 'Repeated word.',
      });
    }
    if (/ ([!?;:])/.test(text) === false && fr && /[!?;:]/.test(text)) {
      notes.push({
        kind: 'typo',
        excerpt: null,
        comment: 'Typographie française : espace insécable avant « ! ? ; : ».',
      });
    }
    if (context.passage.choices.length === 1) {
      notes.push({
        kind: 'choice',
        excerpt: null,
        comment: fr
          ? 'Un seul choix : le lecteur n’a pas vraiment la main ici.'
          : 'Only one choice: the reader has no real agency here.',
      });
    }
    if (notes.length === 0) {
      notes.push({
        kind: 'style',
        excerpt: null,
        comment: fr
          ? 'Rien à signaler : le passage est fluide.'
          : 'Nothing to report: the passage reads well.',
      });
    }
    return { notes };
  }
}
