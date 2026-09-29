# 0002 — Moteur narratif isomorphe et déterministe

**Contexte.** La lecture doit être instantanée et fonctionner hors ligne ; le serveur doit
pourtant pouvoir faire confiance aux progressions (fins découvertes, succès, statistiques) et
une partie doit se poursuivre d'un appareil à l'autre.

**Décision.** Le moteur est une bibliothèque TypeScript pure, exécutée sur le client. Une
partie est définie par une **graine** et un **journal d'actions** ; tout l'aléatoire vient d'un
générateur SFC32 initialisé par la graine. L'état se reconstruit par rejeu. Le serveur valide
une sauvegarde en la rejouant contre l'édition publiée.

**Options écartées.** Moteur côté serveur (latence à chaque choix, pas de hors ligne),
sauvegarde de l'état complet (volumineuse, falsifiable, fragile aux évolutions du format).

**Conséquences.** Sauvegardes minuscules et infalsifiables, retour en arrière gratuit, tests
reproductibles, simulation de Monte-Carlo possible avec le même code. En contrepartie, toute
évolution du moteur doit préserver le rejeu des éditions déjà publiées : c'est pourquoi le
format est versionné (DSF v1) et les éditions sont immuables.
