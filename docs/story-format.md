# Format de récit — DSF v1

Un récit Dédale est un document JSON (`"format": "dedale-story"`, `"formatVersion": 1`). La
source de vérité est le schéma zod `StorySchema` de `packages/engine/src/format/schema.ts` ;
ce document en donne une lecture humaine. Le format est ouvert : un récit s'exporte et
s'importe sans perte, et peut être produit par d'autres outils.

## Exemple minimal

```json
{
  "format": "dedale-story",
  "formatVersion": 1,
  "title": "Le Seuil",
  "language": "fr",
  "start": "porte",
  "variables": [
    { "id": "courage", "name": "Courage", "type": "number", "initial": 5, "min": 0, "max": 12 }
  ],
  "items": [{ "id": "cle", "name": "Clé de fer" }],
  "passages": [
    {
      "id": "porte",
      "title": "La porte",
      "text": "Une porte **close**. Votre courage : {{courage}}.",
      "choices": [
        { "id": "fouiller", "text": "Fouiller le paillasson", "to": "porte", "once": true,
          "effects": [{ "kind": "give", "item": "cle" }] },
        { "id": "ouvrir", "text": "Ouvrir avec la clé", "to": "dedans",
          "condition": "has cle", "lockedHint": "Il vous faudrait une clé." },
        { "id": "forcer", "text": "Forcer la porte",
          "test": { "dice": "2d6", "compare": "lte", "target": "courage",
                    "success": { "to": "dedans", "text": "Le bois cède !" },
                    "failure": { "to": "porte", "effects": [{ "kind": "add", "var": "courage", "value": "-1" }] } } }
      ]
    },
    { "id": "dedans", "title": "Dedans", "text": "Vous êtes entré.", "ending": { "kind": "victory", "title": "Le seuil franchi" } }
  ]
}
```

## Structure

| Élément | Champs principaux |
| --- | --- |
| **Récit** | `title`, `language`, `start` (passage de départ), `variables`, `items`, `achievements`, `rules`, `settings`, `passages` (1 à 5 000) |
| **Variable** | `id`, `name`, `type` (`number`, `boolean`, `text`), `initial`, `min`/`max` (bornes appliquées automatiquement), `visible` (feuille d'aventure) |
| **Objet** | `id`, `name`, `description`, `stackable` (quantités), `hidden` (drapeau narratif invisible) |
| **Succès** | `id`, `name`, `description`, `secret` (masqué tant qu'il n'est pas débloqué) |
| **Passage** | `id`, `title`, `text` (balisage), `choices` (≤ 20), `onEnter` (effets à l'arrivée), `ending` (`kind` + `title`), `checkpoint`, `encounter`, `tags`, `image`, `position` (studio), `notes` (privées) |
| **Choix** | `id`, `text`, `to` et/ou `test`, `condition`, `locked` (`show`/`hide`) et `lockedHint`, `effects`, `once` |
| **Épreuve** | `dice` (`2d6`, `1d20`…), `compare` (`lte`, `lt`, `gte`, `gt`, `eq`), `target` et `modifier` (expressions), `success`/`failure` (destination, effets, court texte), `effects` communs |
| **Combat** | `enemies` (nom, habileté, endurance), `skillVar`/`staminaVar` du héros, dégâts, `victory`/`defeat`, `flee` optionnel (dégâts, assaut minimum) |
| **Règle** | `when` (expression) → `goto` (passage) ; évaluée après chaque changement d'état, `once` par défaut. Ex. `endurance <= 0` → « À bout de forces » |
| **Réglages** | `rewind` (`free`, `checkpoint`, `none`), `showChoiceStats`, `lockedChoices` |

Types de fin : `victory`, `defeat`, `death`, `neutral`, `secret` — ils colorent les badges, le
codex des fins et les statistiques.

## Effets

| Effet | Exemple | Sens |
| --- | --- | --- |
| `set` | `{ "kind": "set", "var": "lanterne", "value": "true" }` | Affecte une expression à une variable |
| `add` | `{ "kind": "add", "var": "ecus", "value": "-3" }` | Ajoute (ou retire) une valeur numérique |
| `give` / `take` | `{ "kind": "give", "item": "cle", "qty": 1 }` | Ajoute ou retire un objet |
| `unlock` | `{ "kind": "unlock", "achievement": "brave" }` | Débloque un succès |

## Expressions

Utilisées par les conditions, cibles d'épreuve, modificateurs, valeurs d'effet et règles.

- Valeurs : nombres, `"texte"`, `true` / `false`, identifiants de variables.
- Opérateurs : `+ - * / %`, comparaisons `== != < <= > >=`, logique `and or not`
  (ou `&& || !`), parenthèses.
- Fonctions et prédicats : `has cle`, `count(piece)`, `visited phare`, `visits(crypte)`,
  `unlocked brave`, `min(a, b)`, `max(a, b)`, `abs(x)`, `round(x)`, `floor(x)`, `ceil(x)`.
- Mots réservés (interdits comme identifiants) : `and or not true false has visited visits count unlocked`.

Chaque expression est analysée et **typée** dans le studio : une comparaison entre un nombre et
un texte, une variable inconnue ou une parenthèse oubliée sont signalées avant publication.

## Balisage du texte

| Syntaxe | Rendu |
| --- | --- |
| `**gras**`, `*italique*` | Emphase |
| `> Une pensée…` | Citation / monologue intérieur |
| `---` | Changement de scène (ornement) |
| `## Intertitre` | Intertitre |
| `{{courage}}` | Valeur d'une variable (échappée) |
| `{{#if has cle}}…{{else if courage > 5}}…{{else}}…{{/if}}` | Texte conditionnel |

Le moteur transforme le texte en blocs neutres (`paragraph`, `quote`, `heading`, `separator`)
que chaque plateforme rend avec ses propres composants.

## Parties et sauvegardes

Une partie est décrite par une **graine** et le **journal des actions** (`choose`, `attack`,
`flee`) : `{ "v": 1, "seed": 1837465, "actions": [{ "type": "choose", "choice": "forcer" }] }`.
Rejouer le journal contre l'édition reproduit exactement la partie, dés compris.

## Interopérabilité

- **Import Twine** (Twee 3) : passages, liens `[[texte->cible]]`, étiquettes et positions ; les
  macros (Harlowe, SugarCube) et variables `$x` sont signalées une à une pour être réécrites en
  conditions et effets Dédale.
- **Export livre-jeu** : Markdown prêt à mettre en page, paragraphes numérotés et mélangés,
  renvois « rendez-vous au 214 », feuille d'aventure — pour l'impression à la demande.
