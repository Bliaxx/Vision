import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, type ScrollViewProps, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/theme';

/** Écran défilant aux couleurs du thème, respectant les zones sûres. */
export function Screen({
  children,
  refreshing,
  onRefresh,
  contentContainerStyle,
  edges = ['top'],
  ...props
}: ScrollViewProps & {
  children: ReactNode;
  refreshing?: boolean;
  onRefresh?: () => void;
  edges?: ('top' | 'bottom')[];
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={[
        {
          paddingTop: edges.includes('top') ? insets.top + 12 : 12,
          paddingBottom: (edges.includes('bottom') ? insets.bottom : 0) + 32,
          gap: 28,
        },
        contentContainerStyle,
      ]}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={Boolean(refreshing)}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        ) : undefined
      }
      {...props}
    >
      {children}
    </ScrollView>
  );
}

export function Section({ children, gap = 12 }: { children: ReactNode; gap?: number }) {
  return <View style={{ paddingHorizontal: 20, gap }}>{children}</View>;
}
