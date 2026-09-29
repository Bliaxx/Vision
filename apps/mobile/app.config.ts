import type { ConfigContext, ExpoConfig } from 'expo/config';

const INK = '#0F0E1C';
const PAPER = '#F6F1E7';

/**
 * Configuration Expo, typée et pilotée par l'environnement (profils EAS :
 * development, preview, production).
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Dédale',
  slug: 'dedale',
  scheme: 'dedale',
  owner: process.env.EXPO_OWNER,
  version: '1.0.0',
  orientation: 'default',
  icon: './assets/images/icon.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: PAPER,
  ios: {
    bundleIdentifier: 'app.dedale',
    supportsTablet: true,
    config: { usesNonExemptEncryption: false },
    infoPlist: {
      // Lecture à voix haute qui continue écran verrouillé.
      UIBackgroundModes: ['audio'],
    },
  },
  android: {
    package: 'app.dedale',
    adaptiveIcon: {
      backgroundColor: INK,
      foregroundImage: './assets/images/adaptive-icon.png',
      monochromeImage: './assets/images/adaptive-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: true,
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-sqlite',
    'expo-localization',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        imageWidth: 96,
        backgroundColor: PAPER,
        dark: { image: './assets/images/splash-icon-dark.png', backgroundColor: INK },
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL,
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
});
