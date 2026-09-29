import { monogram } from '@dedale/tokens';
import Svg, { Circle, G, Path } from 'react-native-svg';
import { useTheme } from '@/theme/theme';

/** Monogramme Dédale : le « D » labyrinthe et son fil rouge. */
export function Monogram({ size = 32, color }: { size?: number; color?: string }) {
  const { colors } = useTheme();
  return (
    <Svg
      width={size}
      height={size}
      viewBox={monogram.viewBox}
      fill="none"
      accessibilityLabel="Dédale"
    >
      <G
        stroke={color ?? colors.text}
        strokeWidth={3.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {monogram.walls.map((d) => (
          <Path key={d} d={d} />
        ))}
      </G>
      <Path
        d={monogram.thread}
        stroke={colors.accent}
        strokeWidth={2.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle
        cx={monogram.knot.cx}
        cy={monogram.knot.cy}
        r={monogram.knot.r}
        fill={colors.accent}
      />
    </Svg>
  );
}
