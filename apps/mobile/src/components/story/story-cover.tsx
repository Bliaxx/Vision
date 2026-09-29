import { coverArt } from '@dedale/tokens';
import { Image, StyleSheet, View } from 'react-native';
import Svg, { Circle, Defs, G, LinearGradient, Path, Rect, Stop } from 'react-native-svg';
import { useTheme } from '@/theme/theme';
import { Text } from '../ui/text';

/**
 * Couverture : image de l'auteur, sinon la couverture générative (même
 * labyrinthe que sur le web, calculé depuis l'identifiant du livre).
 */
export function StoryCover({
  slug,
  title,
  genre,
  coverUrl,
  width,
  showTitle = true,
}: {
  slug: string;
  title: string;
  genre?: string | undefined;
  coverUrl?: string | null | undefined;
  width: number;
  showTitle?: boolean;
}) {
  const { fonts, radii } = useTheme();
  const height = width * 1.5;
  const frame = { width, height, borderRadius: radii.sm, overflow: 'hidden' as const };
  if (coverUrl) {
    return (
      <Image
        source={{ uri: coverUrl }}
        style={frame}
        accessibilityIgnoresInvertColors
        accessible={false}
      />
    );
  }
  const art = coverArt(slug, genre);
  const gradient = `cover-${slug}`;
  return (
    <View style={[frame, styles.shadow]} accessible={false}>
      <Svg width={width} height={height} viewBox="0 0 200 300" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <LinearGradient id={gradient} x1="0" y1="0" x2="0.4" y2="1">
            <Stop offset="0" stopColor={art.background[0]} />
            <Stop offset="1" stopColor={art.background[1]} />
          </LinearGradient>
        </Defs>
        <Rect width="200" height="300" fill={`url(#${gradient})`} />
        <G
          fill="none"
          stroke="#F6F1E7"
          strokeOpacity={0.32}
          strokeWidth={2.2}
          strokeLinecap="round"
        >
          {art.walls.map((d) => (
            <Path key={d} d={d} />
          ))}
        </G>
        <Path
          d={art.thread}
          fill="none"
          stroke="#FF6A4D"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Circle cx={art.knot.x} cy={art.knot.y} r={3.4} fill="#FF6A4D" />
      </Svg>
      {showTitle ? (
        <View style={[StyleSheet.absoluteFill, styles.caption]}>
          <Text
            numberOfLines={3}
            maxFontSizeMultiplier={1}
            style={{
              fontFamily: fonts.display,
              color: '#FFFFFF',
              fontSize: Math.max(11, width / 8.5),
              lineHeight: Math.max(13, width / 7.5),
            }}
          >
            {title}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#1B1A2E',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  caption: { justifyContent: 'flex-end', padding: '8%', backgroundColor: 'rgba(0,0,0,0.12)' },
});
