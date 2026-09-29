import { useNetworkState } from 'expo-network';
import { WifiOff } from 'lucide-react-native';
import { View } from 'react-native';
import { useTranslations } from 'use-intl';
import { useTheme } from '@/theme/theme';
import { Text } from './text';

/** Bandeau discret quand le réseau manque : la lecture hors ligne continue. */
export function OfflineBanner() {
  const t = useTranslations('mobile');
  const { colors, radii } = useTheme();
  const network = useNetworkState();
  if (network.isInternetReachable !== false) return null;
  return (
    <View
      accessibilityRole="alert"
      style={{
        marginHorizontal: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        padding: 12,
        borderRadius: radii.md,
        backgroundColor: colors.surfaceSunken,
      }}
    >
      <WifiOff size={18} color={colors.textMuted} />
      <Text variant="caption" tone="muted" style={{ flex: 1 }}>
        {t('offlineBanner')}
      </Text>
    </View>
  );
}
