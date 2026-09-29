import { Pressable, View } from 'react-native';
import { useTheme } from '@/theme/theme';
import { Text } from './text';

/** Sélecteur à segments (thème, police…), annoncé comme un groupe de boutons radio. */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}) {
  const { colors, radii } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={{
        flexDirection: 'row',
        padding: 3,
        borderRadius: radii.md,
        backgroundColor: colors.surfaceSunken,
        gap: 3,
      }}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={String(option.value)}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            style={{
              flex: 1,
              paddingVertical: 9,
              alignItems: 'center',
              borderRadius: radii.sm,
              backgroundColor: selected ? colors.surfaceRaised : 'transparent',
            }}
          >
            <Text variant="caption" tone={selected ? 'default' : 'muted'} numberOfLines={1}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
