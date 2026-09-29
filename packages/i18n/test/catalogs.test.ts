import { IntlMessageFormat } from 'intl-messageformat';
import { describe, expect, it } from 'vitest';
import { messages, negotiateLocale } from '../src';

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ''): Map<string, string> {
  const out = new Map<string, string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out.set(path, value);
    else for (const [k, v] of flatten(value, path)) out.set(k, v);
  }
  return out;
}

/** Arguments ICU utilisés dans un message (`{count}`, `{name}`…). */
function argumentsOf(message: string): string[] {
  return [...message.matchAll(/\{\s*([a-zA-Z0-9_]+)\s*(?:,|\})/g)]
    .map((m) => m[1] as string)
    .sort();
}

describe('catalogues de traduction', () => {
  const fr = flatten(messages.fr as unknown as Tree);
  const en = flatten(messages.en as unknown as Tree);

  it('ont exactement les mêmes clés', () => {
    expect([...en.keys()].sort()).toEqual([...fr.keys()].sort());
  });

  it('utilisent les mêmes arguments ICU', () => {
    for (const [key, message] of fr) {
      expect(argumentsOf(en.get(key) ?? ''), key).toEqual(argumentsOf(message));
    }
  });

  it('ne contiennent que des messages ICU valides', () => {
    for (const [locale, catalog] of [
      ['fr', fr],
      ['en', en],
    ] as const) {
      for (const [key, message] of catalog) {
        expect(() => new IntlMessageFormat(message, locale), `${locale}:${key}`).not.toThrow();
      }
    }
  });

  it('ne contiennent aucun message vide', () => {
    for (const [key, message] of [...fr, ...en]) expect(message.trim(), key).not.toBe('');
  });

  it('négocie la langue', () => {
    expect(negotiateLocale(['en-GB', 'fr'])).toBe('en');
    expect(negotiateLocale(['de-DE'])).toBe('fr');
  });
});
