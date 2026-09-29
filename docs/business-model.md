# Modèle économique

> Ambition d'origine : devenir « le Netflix du livre interactif ». Ambition révisée : **devenir la
> maison des récits à embranchements** — l'endroit où l'on écrit, publie, lit et vit de la
> fiction interactive, dans tous les genres, sans jamais faire payer un choix.

Ce document reprend le modèle économique initial, garde ce qui fonctionne, et corrige ce qui
entrerait en conflit avec la confiance des lecteurs, la rémunération des auteurs ou le public
jeunesse. Les offres et taux décrits ici sont ceux implémentés dans
`packages/contracts/src/plans.ts`.

## 1. Le marché, en bref

| Acteurs | Ce qu'ils prouvent | Leur limite |
| --- | --- | --- |
| Applications de « stories » à choix (Episode, Chapters, Choices…) | Une demande de masse pour la fiction interactive, surtout sur mobile | Monétisation par monnaie virtuelle : les choix intéressants sont payants, ce qui frustre les lecteurs et exclut les plus jeunes |
| Plateformes d'écriture communautaire (Wattpad, Inkitt…) | Des millions d'auteurs amateurs et un lectorat fidèle | Récits linéaires ; outils d'interactivité absents |
| Outils d'auteur (Twine, ink, ChoiceScript) | Une communauté créative exigeante | Gratuits mais techniques, sans distribution ni revenus intégrés |
| Éditeurs de livres-jeux (Défis fantastiques, « Livres dont vous êtes le héros ») | Une nostalgie forte et des rééditions régulières | Catalogue papier, pas de création communautaire |
| Abonnements de lecture numérique | Le lecteur accepte de payer quelques euros par mois pour un catalogue | Aucun contenu interactif |

**Le créneau libre** : un outil de création sans code *et* un lieu de lecture de qualité, dans
tous les genres, qui rémunère correctement les auteurs et respecte les lecteurs — y compris les
enfants et les écoles.

## 2. Ce qui change par rapport au modèle initial

| Modèle initial | Modèle Dédale | Pourquoi |
| --- | --- | --- |
| Gratuit « avec pub légère » | **Aucune publicité, jamais** | La lecture est immersive et intime ; une publicité casse le récit, dévalorise l'offre et pose problème avec un public mineur. Le revenu perdu est compensé par l'abonnement et les ventes. |
| Premium à 4,99 €/mois | **Explorateur 5,99 €/mois ou 49 €/an** et **Famille 8,99 €/mois ou 79 €/an** | Prix aligné sur les abonnements de lecture, forte incitation à l'annuel (−32 %), et une offre famille qui concrétise le « portail jeunesse sécurisé » du projet initial. |
| Sauvegardes multi-appareils payantes | **Synchronisation gratuite pour tous** | Une partie tient en quelques centaines d'octets : coût quasi nul, et c'est la fonctionnalité qui fidélise le plus. La limite gratuite porte sur les téléchargements hors ligne (3). |
| Bonus payants dans le livre (fins secrètes, contenus alternatifs) | **Jamais de choix ni de fin payants à l'intérieur d'un récit** ; à la place, des *éditions enrichies* vendues d'un bloc | Le « pay-to-choose » est la première cause de rejet des applications concurrentes. Un livre s'achète entier ; une édition illustrée, commentée ou audio est un autre produit. |
| 70 % auteur / 30 % plateforme | **70 % standard, 85 % « Premier fil »** sur les 10 000 premiers euros, **95 % sur les pourboires**, **50 % des abonnements** reversés aux auteurs | Attirer et garder les auteurs, surtout les nouveaux talents : c'est l'offre qui fait le catalogue. |
| « Abonnements » aux auteurs (non défini) | **Cagnotte centrée sur le lecteur** (voir 4.2) | Répartition plus juste que le pro rata global, qui favorise mécaniquement les best-sellers. |
| Pack premium auteurs (IA, stats, co-création) | **Architecte 7,99 €/mois ou 69 €/an** | Muse (IA plafonnée et déclarée), statistiques avancées, publication privée pour bêta-lecteurs, export impression. |
| Offre écoles | **Dédale Classe** (licence d'établissement) | Voir 5.2 : un produit à part entière, avec les garanties RGPD attendues pour les mineurs. |
| Outils pro éditeurs | **Atelier** (sur devis) | Espaces multi-auteurs, marque blanche, catalogue privé, API partenaire. |

## 3. Les offres

| Offre | Prix | Pour qui | Contenu |
| --- | --- | --- | --- |
| **Promeneur** | Gratuit | Tout lecteur | Catalogue gratuit, synchronisation, 3 livres hors ligne, avis, favoris, écriture et publication illimitées |
| **Explorateur** | 5,99 €/mois · 49 €/an | Lecteurs réguliers | Tout le catalogue « Explorateur », hors ligne illimité |
| **Famille** | 8,99 €/mois · 79 €/an | Foyers | Explorateur + profils enfants avec portail jeunesse filtré (profils : à venir) |
| **Architecte** | 7,99 €/mois · 69 €/an | Auteurs | Explorateur + Muse, statistiques avancées (cartes de chaleur, entonnoirs), publication privée, export livre-jeu pour l'impression |
| **Atelier** | Sur devis (à partir d'environ 490 €/mois) | Éditeurs, studios, institutions | Tout, plus espaces multi-auteurs, marque blanche, catalogue privé, API, accompagnement (à venir, voir la [feuille de route](product.md#feuille-de-route)) |

Écrire et publier sont **gratuits pour tous** : l'offre Architecte vend des outils de
productivité, jamais le droit d'être lu.

## 4. Rémunération des auteurs

### 4.1 Ventes et pourboires

| Revenu | Part auteur | Détail |
| --- | --- | --- |
| Vente d'un livre à l'unité (0,99 € à 49,99 €) | **70 %** | Taux standard |
| « Premier fil » | **85 %** | Tant que les revenus cumulés de l'auteur restent sous 10 000 € |
| Pourboires (« plumes ») | **95 %** | Le lecteur soutient directement un auteur |
| Impression à la demande | **70 %** de la marge nette | Via l'export livre-jeu et un imprimeur partenaire |

Parts calculées sur le montant hors taxes, après frais de paiement.

### 4.2 La cagnotte des abonnements, centrée sur le lecteur

La moitié des revenus d'abonnement Explorateur et Famille est reversée aux auteurs (taux fixé
dans le code ; calcul et versements prévus au lancement, via Stripe Connect). Chaque
abonné finance **les auteurs qu'il lit, au prorata de son propre temps de lecture** — et non au
prorata de toutes les lectures de la plateforme. Un abonné qui ne lit qu'un auteur de poésie
interactive le finance entièrement, même si ce genre pèse peu dans l'audience totale. Le temps
de lecture est estimé à partir des passages lus (statistiques anonymisées déjà collectées), ce
qui limite la fraude par clics répétés.

### 4.3 Ce que Dédale ne fait pas

- Pas d'exclusivité : l'auteur accorde une licence de diffusion non exclusive et reste libre de
  publier ailleurs, en papier ou en numérique. Licences Creative Commons proposées.
- Pas de revente de données, pas de publicité ciblée, pas de choix payants.
- Pas de disparition : une édition publiée reste lisible, même si l'auteur la retire du
  catalogue (les lecteurs qui l'ont commencée ou achetée la gardent).

## 5. Revenus complémentaires

### 5.1 Éditeurs et transmédia (Atelier)

- **Adaptations** de collections existantes en récits interactifs, **collections originales** de
  livres-jeux, **catalogues privés** en marque blanche, intégration par API.
- **Transmédia** : récits dérivés de jeux vidéo, séries ou bandes dessinées sous licence ;
  à terme, intermédiation des droits d'adaptation des œuvres nées sur Dédale, uniquement avec
  l'accord de l'auteur (commission d'agent de l'ordre de 10 %).

### 5.2 Éducation (Dédale Classe)

- Licence d'établissement (ordre de grandeur : 2 € par élève et par an, plancher annuel), classes,
  consignes d'écriture, suivi des élèves, publication privée au sein de la classe.
- Garanties : comptes élèves sans e-mail, données hébergées en Europe, aucune donnée exploitée à
  des fins commerciales, portail jeunesse filtré, modération renforcée.
- Pistes de financement à instruire : dispositifs d'éducation artistique et culturelle
  (ex. part collective du pass Culture pour des ateliers d'écriture), budgets numériques des
  collectivités, médiathèques.

### 5.3 Institutions et mécénat

Concours et prix littéraires co-organisés, programmes de soutien aux jeunes auteurs, aides à la
création et au numérique à solliciter — qui alimentent aussi la mise en avant éditoriale.

## 6. Distribution sur mobile

Les abonnements sont vendus en priorité sur le web (marge complète). Sur iOS et Android, l'achat
intégré est proposé au même prix lorsque les règles des magasins l'exigent ; la commission
(de 15 à 30 % selon les programmes) est absorbée plutôt que répercutée. Les parts auteurs ne
sont jamais réduites par le canal d'achat.

## 7. Projections — hypothèses de travail

Scénario illustratif, **à valider** par un pilote. Il sert à vérifier la cohérence du modèle,
pas à prédire.

| Hypothèse | Année 1 | Année 2 | Année 3 |
| --- | --- | --- | --- |
| Lecteurs actifs mensuels | 60 000 | 300 000 | 1 000 000 |
| Conversion Explorateur/Famille | 2,5 % | 3,5 % | 4,5 % |
| Abonnés lecteurs | 1 500 | 10 500 | 45 000 |
| Revenu moyen par abonné (HT, mix annuel/mensuel) | 4,50 €/mois | 4,50 €/mois | 4,50 €/mois |
| Auteurs Architecte | 400 | 2 000 | 6 000 |
| Ventes à l'unité (volume) | 60 k€ | 400 k€ | 1,5 M€ |
| Écoles et Atelier | 20 k€ | 150 k€ | 500 k€ |

| Résultat | Année 1 | Année 2 | Année 3 |
| --- | --- | --- | --- |
| Abonnements lecteurs | 81 k€ | 567 k€ | 2,43 M€ |
| Abonnements Architecte (6 €/mois HT) | 29 k€ | 144 k€ | 432 k€ |
| Commission sur ventes (≈ 25 % effectifs avec Premier fil) | 15 k€ | 100 k€ | 375 k€ |
| Écoles et Atelier | 20 k€ | 150 k€ | 500 k€ |
| **Chiffre d'affaires** | **≈ 145 k€** | **≈ 961 k€** | **≈ 3,74 M€** |
| **Reversé aux auteurs** (cagnotte + ventes) | **≈ 86 k€** | **≈ 584 k€** | **≈ 2,34 M€** |

Leviers de marge : l'hébergement coûte peu (lecture exécutée sur l'appareil, documents légers) ;
le principal poste variable est l'IA, plafonnée par auteur et incluse dans une offre payante.

## 8. Mise sur le marché

1. **Les auteurs d'abord** : import Twine, programme Premier fil, concours de lancement par
   genre, mise en avant éditoriale — le catalogue attire les lecteurs.
2. **Référencement naturel** : chaque livre a une fiche indexable, une image de partage et un
   extrait jouable ; la page d'accueil fait jouer un micro-récit sans inscription.
3. **Communautés existantes** : amateurs de livres-jeux et de jeu de rôle, clubs d'écriture,
   médiathèques.
4. **Écoles** : pilotes avec quelques classes, puis établissements.
5. **Éditeurs** : une collection pilote adaptée d'un fonds de livres-jeux existant.

## 9. Indicateurs suivis

Lecteurs : rétention à 30 jours, parties terminées, passages lus par session, fins découvertes.
Auteurs : récits publiés par mois, part d'auteurs qui publient une deuxième édition, revenus
versés, délai avant le premier euro. Économie : conversion gratuite → payante, attrition,
revenu moyen, coût d'acquisition, part du revenu reversée aux auteurs (objectif : plus de 55 %).

## 10. Risques et parades

| Risque | Parade |
| --- | --- |
| Catalogue trop faible au lancement | Récits commandés à des auteurs reconnus, adaptations éditeurs, programme Premier fil |
| Contenus inappropriés | Charte éthique, classification par âge obligatoire, signalements, file de modération, portail jeunesse filtré |
| Textes générés en masse | Étiquette IA obligatoire, Muse limitée à l'assistance, mise en avant éditoriale humaine |
| Dépendance aux magasins d'applications | Vente web prioritaire, lecture web complète, parité de prix |
| Fraude sur la cagnotte | Temps de lecture estimé sur des passages réellement lus, plafonds par lecteur, détection d'anomalies |
