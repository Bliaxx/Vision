'use client';

/**
 * Dernier recours si le layout racine lui-même échoue : aucun fournisseur
 * (traductions, thème) n'est disponible, d'où un rendu autonome et bilingue.
 */
export default function GlobalError({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#0F0E1C',
          color: '#F6F1E7',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <main style={{ maxWidth: 520, padding: 32, textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 40, margin: '0 0 12px' }}>
            Le fil s'est rompu.
          </h1>
          <p style={{ color: '#ADA7BC', margin: '0 0 24px' }}>
            The thread snapped. {error.digest ? `#${error.digest}` : ''}
          </p>
          <button
            type="button"
            onClick={() => retry()}
            style={{
              background: '#FF6A4D',
              color: '#1B0A06',
              border: 0,
              borderRadius: 8,
              padding: '10px 20px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Réessayer · Retry
          </button>
        </main>
      </body>
    </html>
  );
}
