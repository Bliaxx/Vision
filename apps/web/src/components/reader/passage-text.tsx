import type { Block, Inline } from '@dedale/engine';
import { Fragment } from 'react';

function Inlines({ inlines }: { inlines: readonly Inline[] }) {
  return (
    <>
      {inlines.map((inline, index) => {
        const key = `${index}`;
        if (inline.type === 'break') return <br key={key} />;
        let content: React.ReactNode = inline.text;
        if (inline.italic) content = <em>{content}</em>;
        if (inline.bold) content = <strong className="font-semibold">{content}</strong>;
        return <Fragment key={key}>{content}</Fragment>;
      })}
    </>
  );
}

/** Rendu d'un passage (modèle neutre du moteur → éléments HTML sémantiques). */
export function PassageText({
  blocks,
  dropCap = true,
}: {
  blocks: readonly Block[];
  dropCap?: boolean;
}) {
  let firstParagraph = dropCap;
  return (
    <div className="reading">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`;
        switch (block.type) {
          case 'separator':
            return <hr key={key} />;
          case 'heading':
            return (
              <h3 key={key}>
                <Inlines inlines={block.inlines} />
              </h3>
            );
          case 'quote':
            return (
              <blockquote key={key}>
                <Inlines inlines={block.inlines} />
              </blockquote>
            );
          case 'paragraph': {
            const withCap = firstParagraph;
            firstParagraph = false;
            return (
              <p key={key} className={withCap ? 'drop-cap' : undefined}>
                <Inlines inlines={block.inlines} />
              </p>
            );
          }
        }
        return null;
      })}
    </div>
  );
}

export function InlineText({ inlines }: { inlines: readonly Inline[] }) {
  return <Inlines inlines={inlines} />;
}
