import type { Block, Inline } from '@dedale/engine';
import { Text, View } from 'react-native';
import type { ReaderStyle } from './reader-style';

function Inlines({ inlines, style }: { inlines: readonly Inline[]; style: ReaderStyle }) {
  return inlines.map((inline, index) => {
    const key = `${index}`;
    if (inline.type === 'break') return <Text key={key}>{'\n'}</Text>;
    const family = inline.bold
      ? style.font.bold
      : inline.italic
        ? style.font.italic
        : style.font.regular;
    return (
      <Text
        key={key}
        style={{ fontFamily: family, fontStyle: inline.italic ? 'italic' : 'normal' }}
      >
        {inline.text}
      </Text>
    );
  });
}

/** Rendu natif du modèle neutre du moteur (paragraphes, pensées, intertitres, ruptures). */
export function PassageText({ blocks, style }: { blocks: readonly Block[]; style: ReaderStyle }) {
  const { palette, size, lineHeight, font } = style;
  const body = { fontFamily: font.regular, fontSize: size, lineHeight, color: palette.text };
  return (
    <View style={{ gap: size * 0.9 }}>
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case 'separator':
            return (
              <View
                key={key}
                accessible={false}
                style={{ alignItems: 'center', paddingVertical: 4 }}
              >
                <View
                  style={{
                    width: 56,
                    height: 2,
                    borderRadius: 1,
                    backgroundColor: palette.accent,
                    opacity: 0.7,
                  }}
                />
              </View>
            );
          case 'heading':
            return (
              <Text
                key={key}
                accessibilityRole="header"
                style={[body, { fontFamily: font.bold, fontSize: size * 1.1 }]}
              >
                <Inlines inlines={block.inlines} style={style} />
              </Text>
            );
          case 'quote':
            return (
              <View
                key={key}
                style={{ borderLeftWidth: 2, borderLeftColor: palette.accent, paddingLeft: 14 }}
              >
                <Text
                  style={[
                    body,
                    { fontFamily: font.italic, fontStyle: 'italic', color: palette.muted },
                  ]}
                >
                  <Inlines inlines={block.inlines} style={style} />
                </Text>
              </View>
            );
          case 'paragraph':
            return (
              <Text key={key} style={body} selectable>
                <Inlines inlines={block.inlines} style={style} />
              </Text>
            );
        }
        return null;
      })}
    </View>
  );
}

export function InlineText({
  inlines,
  style,
  color,
}: {
  inlines: readonly Inline[];
  style: ReaderStyle;
  color: string;
}) {
  return (
    <Text
      style={{
        fontFamily: style.font.regular,
        fontSize: Math.max(16, style.size - 2),
        lineHeight: Math.max(22, style.lineHeight - 4),
        color,
      }}
    >
      <Inlines inlines={inlines} style={style} />
    </Text>
  );
}
