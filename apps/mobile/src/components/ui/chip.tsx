import { Pressable } from 'react-native';
import { useTheme } from '@/theme/theme';
import { Text } from './text';

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, radii } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: radii.pill,
        borderWidth: 1,
        borderColor: selected ? colors.accent : colors.borderStrong,
        backgroundColor: selected ? colors.accent : 'transparent',
      }}
    >
      <Text variant="caption" style={{ color: selected ? colors.onAccent : colors.textMuted }}>
        {label}
      </Text>
    </Pressable>
  );
}
