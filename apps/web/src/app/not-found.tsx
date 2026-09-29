/** Filet de sécurité pour les requêtes hors locale (le proxy redirige normalement). */
export default function RootNotFound() {
  return (
    <html lang="fr">
      <body
        style={{
          fontFamily: 'system-ui',
          padding: '4rem',
          background: '#F6F1E7',
          color: '#1B1A2E',
        }}
      >
        <h1>Ce chemin ne mène nulle part.</h1>
        <a href="/">Revenir à l'accueil</a>
      </body>
    </html>
  );
}
