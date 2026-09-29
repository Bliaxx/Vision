# Produit

## Pour qui

| Profil | Ce qu'il cherche | Ce que Dédale lui apporte |
| --- | --- | --- |
| **Lectrice curieuse** (18-45 ans, lit sur mobile) | Une histoire où ses choix comptent, sans payer chaque décision | Catalogue multi-genres, lecture hors ligne, aucune publicité, aucun choix payant |
| **Nostalgique des livres-jeux** | Les dés, les combats, la feuille d'aventure | Épreuves, combats, inventaire, règles, mode puriste sans retour en arrière |
| **Autrice amatrice** | Écrire sans coder, être lue, progresser | Éditeur visuel, vérifications, simulation, retours lecteurs, publication gratuite |
| **Auteur confirmé** | Des revenus et des outils sérieux | 70 à 95 % des revenus, statistiques avancées, bêta-lecteurs, export impression |
| **Enseignant** | Faire lire et écrire autrement | Récits jeunesse filtrés, écriture de récits à embranchements en classe |
| **Éditeur** | Expérimenter l'interactivité sans R&D | Outils pro, catalogue privé, adaptation de fonds existants |

## Fonctionnalités

✅ disponible dans ce dépôt · 🔜 planifié

### Lire

| | Fonctionnalité |
| --- | --- |
| ✅ | Accueil éditorial (tendances, sélection, nouveautés, lectures courtes) avec un micro-récit jouable sans compte |
| ✅ | Exploration : recherche plein texte tolérante aux accents, filtres genre / accès / âge / langue, tris |
| ✅ | Fiche livre : durée estimée, difficulté mesurée, nombre de fins, avertissements de contenu, étiquette IA, codex des fins, avis |
| ✅ | Liseuse web et mobile : dés animés, combats, inventaire et caractéristiques, succès, choix verrouillés avec indice |
| ✅ | Retour en arrière (libre, aux points de sauvegarde, ou désactivé par l'auteur) |
| ✅ | Fil d'Ariane : la carte de son propre chemin, passages non visités dans la brume |
| ✅ | « Ce qu'ont choisi les autres lecteurs » après chaque décision (statistiques anonymes) |
| ✅ | Accessibilité : clavier (1–9 pour choisir), lecteurs d'écran, lecture à voix haute, 4 ambiances, 3 polices dont 2 d'accessibilité, 6 tailles |
| ✅ | Synchronisation web ↔ mobile ; lecture hors ligne sur mobile (3 livres en gratuit, illimité avec Explorateur) |
| ✅ | Bibliothèque : en cours, terminés, favoris ; signaler une coquille à l'auteur depuis un passage |
| 🔜 | Profils enfants de l'offre Famille, listes de lecture, notifications (nouvelle édition, auteur suivi) |
| 🔜 | Lecture à plusieurs : un récit, un vote par choix (soirées, classes, diffusions en direct) |

### Écrire

| | Fonctionnalité |
| --- | --- |
| ✅ | Studio en graphe : créer un passage d'un double-clic, relier deux passages pour créer un choix, disposition automatique, mini-carte |
| ✅ | Inspecteur : texte avec balisage et aperçu, conditions et effets avec autocomplétion et vérification de types, épreuves avec probabilité de réussite affichée, combats, fins |
| ✅ | Variables, objets, succès, règles globales, réglages de lecture |
| ✅ | Vérifications en direct : liens cassés, impasses, fins inaccessibles, variables inutilisées, erreurs de balisage… |
| ✅ | Simulation de 500 parties : durée, difficulté, couverture, répartition des fins |
| ✅ | Tester depuis le début ou depuis n'importe quel passage, dans la vraie liseuse |
| ✅ | Sauvegarde automatique, détection des conflits entre onglets, annuler / rétablir, raccourcis clavier |
| ✅ | Deux modèles de départ (livre-jeu classique, page blanche), import Twine |
| ✅ | Fiche du livre (accroche, résumé, genres, public, avertissements, licence, usage de l'IA, prix) |
| ✅ | Publication d'éditions immuables avec notes de version ; publication privée (lien secret) avec l'offre Architecte |
| ✅ | Muse (offre Architecte) : propositions de choix et relecture critique d'un passage |
| ✅ | Statistiques : lecteurs, complétion, 30 derniers jours, fins atteintes ; avec l'offre Architecte, passages les plus visités, choix disputés et carte de chaleur dans l'éditeur |
| ✅ | Export livre-jeu papier (Markdown, paragraphes numérotés et mélangés) |
| 🔜 | Co-écriture en temps réel (CRDT), commentaires d'éditeur dans le graphe, comparaison d'éditions |
| 🔜 | Illustrations et ambiances sonores hébergées, narration audio |
| 🔜 | Tableau de bord des revenus et versements (Stripe Connect), cagnotte d'abonnement centrée sur le lecteur |

### Communauté et confiance

| | Fonctionnalité |
| --- | --- |
| ✅ | Avis notés (avec masquage des révélations), favoris, abonnement aux auteurs, pourboires |
| ✅ | Pages auteurs, retours privés des lecteurs vers l'auteur |
| ✅ | Signalements, file de modération (classer, masquer, suspendre), charte éthique |
| ✅ | Classification par âge obligatoire, avertissements de contenu, étiquette d'usage de l'IA |
| 🔜 | Concours et prix, sélections éditoriales programmables, badges de lecteurs |

### Écoles et partenaires

| | Fonctionnalité |
| --- | --- |
| ✅ | Page écoles, API publique documentée (OpenAPI 3.1) |
| 🔜 | Dédale Classe : classes, comptes élèves sans e-mail, consignes, suivi, publication interne |
| 🔜 | Atelier : espaces multi-auteurs, marque blanche, catalogue privé, clés d'API partenaires |

## Ce que Dédale ajoute au projet initial

Le projet initial posait les bases : lire, écrire et publier des livres interactifs dans tous les
genres, un éditeur visuel, une communauté, un modèle freemium. Voici ce qui a été ajouté ou
repensé, et pourquoi.

1. **Un moteur déterministe et partagé.** Les parties tiennent en quelques centaines d'octets,
   se rejouent à l'identique, passent d'un appareil à l'autre et ne peuvent pas être falsifiées.
2. **L'éditeur qui vérifie et simule.** Écrire un labyrinthe sans impasse est difficile : le
   studio signale les erreurs en direct et mesure objectivement la difficulté et la durée d'un
   récit avant publication — ces chiffres alimentent la fiche du livre.
3. **Éditions immuables.** Un auteur corrige et enrichit son livre sans jamais casser la partie
   d'un lecteur en cours : c'est la promesse « pas d'obsolescence » du projet, tenue techniquement.
4. **La lecture partagée, sans perte d'intimité.** « 62 % des lecteurs ont fait ce choix »,
   carte de chaleur pour l'auteur : les statistiques sont anonymes et agrégées dès la collecte.
5. **L'accessibilité comme fonctionnalité.** Polices adaptées à la dyslexie et à la basse vision,
   lecture à voix haute, contraste élevé, jeu entièrement au clavier.
6. **Aucune publicité, aucun choix payant.** Le modèle initial prévoyait une publicité légère et
   des bonus payants dans les livres ; ils sont remplacés par un abonnement, des ventes entières
   et une rémunération plus favorable aux auteurs (voir [modèle économique](business-model.md)).
7. **Transparence sur l'IA.** L'IA aide l'auteur, n'écrit pas à sa place, et chaque récit déclare
   son usage.
8. **Ponts avec l'existant.** Import Twine pour accueillir une communauté d'auteurs déjà
   active ; export papier pour les éditeurs et l'impression à la demande.

## Feuille de route

| Horizon | Priorités |
| --- | --- |
| **Lancement** | Versements aux auteurs (Stripe Connect), cagnotte d'abonnement, notifications, EAS Update, illustrations hébergées |
| **+ 6 mois** | Dédale Classe (pilotes), profils enfants, co-écriture en temps réel, concours |
| **+ 12 mois** | Atelier (éditeurs, marque blanche, API partenaires), narration audio, lecture à plusieurs, traduction assistée des récits |
