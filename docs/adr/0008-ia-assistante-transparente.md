# 0008 — L'IA assiste, n'écrit pas à la place — et se déclare

**Contexte.** Les outils génératifs peuvent aider les auteurs (débloquer une scène, repérer une
impasse), mais une plateforme inondée de textes générés perdrait la confiance des lecteurs et
la valeur des œuvres.

**Décision.** Muse, l'assistante d'écriture, propose des choix et une relecture critique d'un
passage ; elle n'écrit jamais un récit entier. Elle est réservée à l'offre Architecte et
plafonnée (20 demandes par heure). Chaque récit déclare son usage de l'IA (aucun, assisté,
largement généré), affiché aux lecteurs sur la fiche du livre. L'adaptateur utilise Claude
avec des sorties structurées validées par zod et le repli automatique côté serveur prévu par
l'API ; un refus, une surcharge ou une panne deviennent une erreur « indisponible » typée,
affichée proprement dans le studio. Sans clé d'API, une Muse hors ligne (règles simples)
permet de développer et de tester sans dépendance externe.

**Conséquences.** Le coût d'inférence est borné et inclus dans une offre payante ; la
transparence devient un argument éditorial plutôt qu'un risque.
