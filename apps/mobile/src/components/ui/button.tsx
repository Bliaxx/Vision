import * as Haptics from 'expo-haptics';
import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, Pressable, type PressableProps, StyleSheet, View } from 'react-native';
import { usePreferences } from '@/lib/preferences';
import { useTheme } from '@/theme/theme';
import { Text } from './text';

type Variant = 'primary' | 'secondary' | 'ghost' | 'brass';

export function Button({
  label,
  icon: Icon,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  onPress,
  style,
  ...props
}: Omit<PressableProps, 'children' | 'style'> & {
  label: string;
  icon?: LucideIcon;
  variant?: Variant;
  size?: 'md' | 'lg';
  loading?: boolean;
  style?: PressableProps['style'];
}) {
  const { colors, radii } = useTheme();
  const { haptics } = usePreferences();
  const palette = {
    primary: { background: colors.accent, border: colors.accent, text: colors.onAccent },
    secondary: { background: colors.surfaceRaised, border: colors.borderStrong, text: colors.text },
    ghost: { background: 'transparent', border: 'transparent', text: colors.text },
    brass: { background: colors.brass, border: colors.brass, text: colors.onAccent },
  }[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(inactive), busy: loading }}
      disabled={inactive}
      onPress={(event) => {
        if (haptics) void Haptics.selectionAsync();
        onPress?.(event);
      }}
      style={(state) => [
        styles.base,
        {
          minHeight: size === 'lg' ? 54 : 46,
          borderRadius: radii.md,
          backgroundColor: palette.background,
          borderColor: palette.border,
          opacity: inactive ? 0.55 : state.pressed ? 0.85 : 1,
          transform: [{ scale: state.pressed ? 0.98 : 1 }],
        },
        typeof style === 'function' ? style(state) : style,
      ]}
      {...props}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={palette.text} />
        ) : Icon ? (
          <Icon size={18} color={palette.text} strokeWidth={2.2} />
        ) : null}
        <Text
          variant="bodyStrong"
          style={{ color: palette.text, fontSize: size === 'lg' ? 17 : 15 }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { borderWidth: 1, paddingHorizontal: 18, justifyContent: 'center' },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
});
