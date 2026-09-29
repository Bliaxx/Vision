# 0004 — Monolithe modulaire hexagonal pour l'API

**Contexte.** Le domaine est riche (catalogue, lecture, création, communauté, modération,
facturation, IA) mais l'équipe et la charge de départ ne justifient pas des microservices.

**Décision.** Une seule API déployable, découpée en modules métier (service, requêtes,
routeur). Les dépendances externes sont derrière des ports : `PaymentGateway` (Stripe ou
simulé), `MuseEngine` (Claude ou hors ligne), `RateLimiter`. Le câblage est explicite dans une
racine de composition (`container.ts`), sans conteneur d'injection magique.

**Conséquences.** Tests d'intégration rapides sur une vraie base avec des adaptateurs simulés ;
l'application tourne entièrement sans aucune clé externe. Un module pourra être extrait en
service le jour où sa charge l'exige (la recherche ou les statistiques en premier), sans
toucher aux autres.
