/**
 * @dedale/engine — moteur narratif isomorphe (web, mobile, serveur).
 *
 * Aucune dépendance au DOM, à React ou à Node : du TypeScript pur,
 * déterministe et entièrement testé.
 */

export {
  type AnalysisReport,
  analyzeStory,
  type Diagnostic,
  type DiagnosticCode,
  type Severity,
} from './analysis/diagnostics';
export {
  buildGraph,
  canReachEnding,
  depths,
  type EdgeKind,
  outgoingEdges,
  reachableFromStart,
  type StoryEdge,
  type StoryGraph,
} from './analysis/graph';
export {
  type Difficulty,
  difficultyFromFailureRate,
  type SimulationOptions,
  type SimulationReport,
  simulate,
} from './analysis/simulate';
export { computeStoryStats, countMarkupWords, countWords, type StoryStats } from './analysis/stats';
export { collectReferences, type Expr, type ExprReferences } from './expr/ast';
export {
  type ExprScope,
  evaluate,
  evaluateCondition,
  formatValue,
  isTruthy,
} from './expr/evaluate';
export {
  type ExprError,
  type ExprErrorCode,
  ExprSyntaxError,
  parseExpr,
  type TryParseResult,
  tryParseExpr,
} from './expr/parser';
export { printExpr } from './expr/printer';
export { checkExpr, type ExprType, type TypeEnvironment, type TypeIssue } from './expr/typecheck';
export { createId, slugifyId } from './format/ids';
export { type FormatIssue, type ParseStoryResult, parseStory } from './format/parse';
export * from './format/schema';
export type * from './format/types';
export {
  type Block,
  blocksToPlainText,
  type Inline,
  parseInlines,
  renderInline,
  resolveTemplate,
  toBlocks,
} from './markup/render';
export {
  type MarkupError,
  type MarkupErrorCode,
  type ParsedTemplate,
  parseTemplate,
  type TemplateNode,
} from './markup/template';
export { type CompiledStory, compileStory } from './runtime/compile';
export {
  type DiceRoll,
  type DiceSpec,
  diceDistribution,
  parseDice,
  rollDice,
} from './runtime/dice';
export {
  type Action,
  applyAction,
  type ChoiceAvailability,
  choiceAvailability,
  compare,
  createGame,
  EngineError,
  type EngineErrorCode,
  encounterActions,
  evaluateInState,
  type Transition,
} from './runtime/engine';
export type { EngineEvent, EngineEventType } from './runtime/events';
export { type RngState, randomSeed, seedRng } from './runtime/rng';
export {
  ActionSchema,
  act,
  type Milestone,
  type RestoreResult,
  replay,
  restoreSession,
  rewind,
  rewindTargets,
  type SaveData,
  SaveDataSchema,
  type Session,
  type SessionUpdate,
  startSession,
  toSaveData,
} from './runtime/session';
export type { EncounterState, EndingState, EnemyState, GameState } from './runtime/state';
export {
  type ChoiceView,
  type EncounterView,
  type GameView,
  getView,
  type ItemView,
  type StatView,
} from './runtime/view';
