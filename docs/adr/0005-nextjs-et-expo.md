# 0005 — Next.js pour le web, Expo pour iOS et Android

**Contexte.** Le web doit être indexé (catalogue, fiches de livres, pages auteurs) et offrir un
atelier d'écriture riche ; le mobile doit offrir une lecture native, hors ligne, accessible.

**Décision.** Next.js (App Router, Server Components) pour le web : HTML complet pour le
référencement, îlots interactifs pour la liseuse et le studio. Expo (React Native, nouvelle
architecture, Expo Router) pour le mobile : onglets et feuilles natifs, SQLite, SecureStore,
haptique, synthèse vocale, builds via EAS.

**Options écartées.** Une seule base React Native Web (SEO et studio d'écriture dégradés),
Flutter (pas de partage du moteur TypeScript ni du contrat), application web installable seule
(expérience et distribution inférieures sur iOS).

**Conséquences.** Deux interfaces distinctes, mais le cœur est partagé : moteur, liaisons
React (`@dedale/play`), client d'API, traductions, jetons de marque, couvertures génératives.
