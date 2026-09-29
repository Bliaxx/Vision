import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** En développement, l'API tourne sur la machine qui sert le bundle Metro. */
function developmentApiUrl(): string {
  const host = Constants.expoConfig?.hostUri?.split(':')[0];
  if (host) return `http://${host}:4000`;
  return Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
}

const configured =
  process.env.EXPO_PUBLIC_API_URL ??
  (Constants.expoConfig?.extra?.apiUrl as string | undefined) ??
  developmentApiUrl();

export const API_URL = configured.replace(/\/$/, '');
export const APP_SCHEME = 'dedale';
export const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
