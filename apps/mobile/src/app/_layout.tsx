import {
  focusManager,
  onlineManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { addNetworkStateListener } from 'expo-network';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState, useSyncExternalStore } from 'react';
import { AppState, Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTranslations } from 'use-intl';
import { I18nProvider } from '@/i18n/provider';
import { kv } from '@/lib/kv';
import { currentLocale } from '@/lib/locale';
import { appFonts } from '@/theme/fonts';
import { ThemeProvider, useTheme } from '@/theme/theme';

void SplashScreen.preventAutoHideAsync();

// TanStack Query suit l'état réel de l'app : premier plan et connectivité.
onlineManager.setEventListener((setOnline) => {
  const subscription = addNetworkStateListener((state) =>
    setOnline(state.isInternetReachable !== false),
  );
  return () => subscription.remove();
});

function useAppFocus() {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (status) => {
      if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
    });
    return () => subscription.remove();
  }, []);
}

function Navigation() {
  const t = useTranslations('common');
  const { colors, fonts, scheme } = useTheme();
  return (
    <>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerTintColor: colors.accent,
          headerTitleStyle: { fontFamily: fonts.display, color: colors.text },
          headerBackTitle: t('back'),
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="story/[slug]" options={{ title: '', headerTransparent: true }} />
        <Stack.Screen
          name="read/[slug]"
          options={{ headerShown: false, presentation: 'fullScreenModal', gestureEnabled: false }}
        />
        <Stack.Screen name="sign-in" options={{ presentation: 'modal', title: '' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
      }),
  );
  const [fontsLoaded, fontError] = useFonts(appFonts);
  const locale = useSyncExternalStore(
    (listener) => kv.subscribe('prefs:locale', listener),
    currentLocale,
  );
  useAppFocus();

  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider locale={locale}>
          <ThemeProvider>
            <Navigation />
          </ThemeProvider>
        </I18nProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
