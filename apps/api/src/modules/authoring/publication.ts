import { createHash } from 'node:crypto';
import type { AnalysisSummary, StoryMeta } from '@dedale/contracts';
import {
  type AnalysisReport,
  analyzeStory,
  compileStory,
  computeStoryStats,
  type Story,
  simulate,
} from '@dedale/engine';
import type { VersionStats } from '../../infrastructure/db/schema';

export function toAnalysisSummary(report: AnalysisReport): AnalysisSummary {
  return {
    errors: report.errors,
    warnings: report.warnings,
    publishable: report.publishable,
    diagnostics: report.diagnostics.map((diagnostic) => ({ ...diagnostic })),
  };
}

/**
 * Analyse de publication : règles du moteur + règles éditoriales (un récit
 * payant doit avoir un prix, un récit doit avoir un résumé).
 */
export function publicationReport(document: Story, meta: StoryMeta): AnalysisSummary {
  const summary = toAnalysisSummary(analyzeStory(document));
  const extra: AnalysisSummary['diagnostics'] = [];
  if (meta.access === 'paid' && !meta.priceCents) {
    extra.push({
      code: 'missing_price',
      severity: 'error',
      message: 'un récit payant doit avoir un prix',
    });
  }
  if (meta.synopsis.trim().length < 20) {
    extra.push({
      code: 'missing_synopsis',
      severity: 'warning',
      message: 'ajoutez un résumé pour donner envie aux lecteurs',
    });
  }
  const errors = summary.errors + extra.filter((d) => d.severity === 'error').length;
  return {
    errors,
    warnings: summary.warnings + extra.filter((d) => d.severity === 'warning').length,
    publishable: errors === 0,
    diagnostics: [...extra, ...summary.diagnostics],
  };
}

/** Métadonnées de lecture calculées : durée, difficulté, fins — par simulation. */
export function buildVersionStats(document: Story): VersionStats {
  const stats = computeStoryStats(document);
  const simulation = simulate(compileStory(document), { runs: 300, seed: 7 });
  return {
    passages: stats.passages,
    words: stats.words,
    choices: stats.choices,
    achievements: stats.achievements,
    endings: stats.endings.total,
    endingsByKind: { ...stats.endings.byKind },
    minutes: simulation.estimatedMinutes,
    difficulty: simulation.difficulty,
    failureRate: simulation.failureRate,
  };
}

/** Empreinte stable d'un document (détecte les republications sans changement). */
export function checksum(document: Story): string {
  return createHash('sha256').update(JSON.stringify(document)).digest('hex');
}
