# 0007 — Better Auth pour l'authentification

**Contexte.** Comptes par e-mail et fournisseurs sociaux, sessions sûres sur le web et le
mobile, données dans notre propre base (RGPD), rôles applicatifs.

**Décision.** Better Auth avec l'adaptateur Drizzle : sessions en cookie `HttpOnly` sur le web,
plugin Expo sur mobile (cookie stocké dans SecureStore), champs additionnels (rôle, langue),
création du profil et de l'abonnement gratuit à l'inscription.

**Options écartées.** Service d'identité hébergé (données hors de notre base, coût par
utilisateur actif, dépendance forte), implémentation maison (risque de sécurité).

**Conséquences.** Aucune donnée d'authentification ne quitte notre infrastructure ; l'ajout de
la double authentification, des clés d'accès ou du SSO pour les écoles passe par des plugins.
