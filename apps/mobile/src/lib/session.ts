import { useQueryClient } from '@tanstack/react-query';
import { authClient } from './auth';

/** Session courante (Better Auth) ; `null` pour un lecteur anonyme. */
export function useSession() {
  const session = authClient.useSession();
  return { user: session.data?.user ?? null, pending: session.isPending };
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return async () => {
    await authClient.signOut();
    queryClient.clear();
  };
}
