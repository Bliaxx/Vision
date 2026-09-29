import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';
import { API_URL, APP_SCHEME } from './config';

/**
 * Session Better Auth : le cookie est conservé dans le trousseau (iOS) ou le
 * Keystore (Android) via SecureStore, jamais en clair.
 */
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins: [expoClient({ scheme: APP_SCHEME, storagePrefix: 'dedale', storage: SecureStore })],
});
