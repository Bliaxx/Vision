import { slugifyId } from '../format/ids';
import { StorySchema } from '../format/schema';
import type { Passage, Story } from '../format/types';

/**
 * Import de récits Twine au format Twee 3 (https://github.com/iftechfoundation/twine-specs).
 * Les passages et liens sont convertis fidèlement ; les macros propres aux
 * formats Harlowe/SugarCube sont conservées en texte et signalées, pour que
 * l'auteur les remplace par des conditions et effets Dédale.
 */
export interface TweeImportWarning {
  readonly passage: string | null;
  readonly message: string;
}

export interface TweeImportResult {
  readonly story: Story;
  readonly warnings: readonly TweeImportWarning[];
}

export class TweeImportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TweeImportError';
  }
}

interface RawPassage {
  name: string;
  tags: string[];
  metadata: Record<string, unknown>;
  body: string;
}

const HEADER = /^::\s*(.+?)\s*(?:\[([^\]]*)\])?\s*(\{.*\})?\s*$/;
const LINK = /\[\[(.+?)\]\](?:\[[^\]]*\])?/g;
const MACRO = /(\(\w+:|<<\w+|\$[A-Za-z_]\w*|_[A-Za-z]\w*\s+to\b)/;
const SPECIAL = new Set(['StoryTitle', 'StoryData', 'StoryInit', 'StoryAuthor', 'StoryIncludes']);
const SKIPPED_TAGS = new Set(['script', 'stylesheet', 'widget', 'Twine.private']);

function unescapeName(name: string): string {
  return name.replace(/\\(.)/g, '$1');
}

function parseRaw(source: string): RawPassage[] {
  const passages: RawPassage[] = [];
  let current: RawPassage | null = null;
  for (const line of source.replace(/\r\n?/g, '\n').split('\n')) {
    const header = line.startsWith('::') ? HEADER.exec(line) : null;
    if (header) {
      if (current) passages.push(current);
      let metadata: Record<string, unknown> = {};
      if (header[3]) {
        try {
          metadata = JSON.parse(header[3]) as Record<string, unknown>;
        } catch {
          metadata = {};
        }
      }
      current = {
        name: unescapeName(header[1] ?? ''),
        tags: (header[2] ?? '').split(/\s+/).filter(Boolean),
        metadata,
        body: '',
      };
    } else if (current) {
      current.body += `${line}\n`;
    }
  }
  if (current) passages.push(current);
  return passages.map((passage) => ({ ...passage, body: passage.body.trim() }));
}

function parseLink(inner: string): { text: string; target: string } {
  const arrow = inner.indexOf('->');
  if (arrow !== -1) return { text: inner.slice(0, arrow), target: inner.slice(arrow + 2) };
  const back = inner.indexOf('<-');
  if (back !== -1) return { text: inner.slice(back + 2), target: inner.slice(0, back) };
  const pipe = inner.indexOf('|');
  if (pipe !== -1) return { text: inner.slice(0, pipe), target: inner.slice(pipe + 1) };
  return { text: inner, target: inner };
}

function parsePosition(value: unknown): { x: number; y: number } | undefined {
  if (typeof value !== 'string') return undefined;
  const [x, y] = value.split(',').map(Number);
  return Number.isFinite(x) && Number.isFinite(y) ? { x: x as number, y: y as number } : undefined;
}

export function importTwee(source: string, options: { language?: string } = {}): TweeImportResult {
  const raw = parseRaw(source);
  const warnings: TweeImportWarning[] = [];
  const title = raw.find((passage) => passage.name === 'StoryTitle')?.body || 'Récit importé';
  let startName: string | undefined;
  const data = raw.find((passage) => passage.name === 'StoryData');
  if (data) {
    try {
      const parsed = JSON.parse(data.body) as { start?: unknown; format?: unknown };
      if (typeof parsed.start === 'string') startName = parsed.start;
      if (typeof parsed.format === 'string') {
        warnings.push({ passage: null, message: `format d'origine : ${parsed.format}` });
      }
    } catch {
      warnings.push({ passage: null, message: 'StoryData illisible, ignoré' });
    }
  }

  const playable = raw.filter((passage) => {
    if (SPECIAL.has(passage.name)) {
      if (passage.name === 'StoryInit' && passage.body) {
        warnings.push({
          passage: passage.name,
          message: 'StoryInit ignoré : déclarez vos variables',
        });
      }
      return false;
    }
    if (passage.tags.some((tag) => SKIPPED_TAGS.has(tag))) {
      warnings.push({ passage: passage.name, message: 'passage technique ignoré' });
      return false;
    }
    return true;
  });
  if (playable.length === 0) throw new TweeImportError('aucun passage jouable trouvé');

  const ids = new Map<string, string>();
  const used = new Set<string>();
  for (const passage of playable) {
    const base = slugifyId(passage.name, 'passage');
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    used.add(id);
    ids.set(passage.name, id);
  }

  const passages: Passage[] = playable.map((passage) => {
    const id = ids.get(passage.name) as string;
    const choices: Passage['choices'] = [];
    const text = passage.body
      .replace(LINK, (_match, inner: string) => {
        const link = parseLink(inner);
        const target = ids.get(link.target.trim());
        if (!target) {
          warnings.push({ passage: passage.name, message: `lien cassé vers « ${link.target} »` });
          return link.text;
        }
        choices.push({
          id: `c${choices.length + 1}`,
          text: link.text.trim() || link.target.trim(),
          to: target,
          effects: [],
          once: false,
        });
        return '';
      })
      .replace(/[ \t]+\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    if (MACRO.test(text)) {
      warnings.push({
        passage: passage.name,
        message: 'macros Twine conservées en texte : à convertir en conditions/effets',
      });
    }

    const position = parsePosition(passage.metadata.position);
    return {
      id,
      title: passage.name.slice(0, 120),
      text,
      tags: passage.tags.slice(0, 20),
      checkpoint: false,
      onEnter: [],
      choices,
      ...(choices.length === 0
        ? { ending: { kind: 'neutral' as const, title: passage.name.slice(0, 80) } }
        : {}),
      ...(position ? { position } : {}),
    };
  });

  const start = (startName && ids.get(startName)) || (passages[0] as Passage).id;
  const story = StorySchema.parse({
    title: title.slice(0, 120),
    language: options.language ?? 'fr',
    start,
    passages,
  });
  return { story, warnings };
}
