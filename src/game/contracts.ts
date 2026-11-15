// Shared data contracts (ARCHITECTURE.md § Contratos de datos). Pure types and constants only.

export const STORY_STAGES = [
  'ARRIVAL',
  'ARCHIVE_OPEN',
  'OPPORTUNITY_RESTORED',
  'CHAPTER_TWO',
  'INSIGHT_RESTORED',
  'READY_TO_PRESERVE',
  'EPILOGUE',
  'OBSERVATION',
  'RESCUE',
  'COMPLETE',
] as const;
export type StoryStage = (typeof STORY_STAGES)[number];

export const PUZZLE_IDS = ['PZ-00', 'PZ-01', 'PZ-02', 'PZ-03'] as const;
export type PuzzleId = (typeof PUZZLE_IDS)[number];

export const DOOR_IDS = ['D0', 'D1', 'D2'] as const;
export type DoorId = (typeof DOOR_IDS)[number];

export const ZONE_IDS = ['AIRLOCK', 'HUB', 'INSIGHT', 'OPPORTUNITY', 'RELAY', 'OBSERVATION'] as const;
export type ZoneId = (typeof ZONE_IDS)[number];

/** Content layers. A layer label is always shown as text, never by colour alone. */
export type Layer =
  | 'NASA ARCHIVAL RECORD'
  | 'EDUCATIONAL MODEL'
  | 'FICTIONAL ARCHIVE SYSTEM'
  | 'UNSUPPORTED CLAIM'
  | 'EDITORIAL NOTE';

export type EvidenceKind = 'FACT' | 'MODEL' | 'FICTION';

export interface SourceRef {
  id: string;
  title: string;
  publisher: string;
  url: string;
}

export interface Claim {
  id: string;
  statementEn: string;
  sourceIds: string[];
  evidenceKind: EvidenceKind;
  /** What the claim must not be stretched to mean. */
  limit?: string;
  /** False for registered claims that the core game does not display. */
  usedInCore: boolean;
}

export interface SourceField {
  label: string;
  value: string;
  claimIds: string[];
}

export type SummaryAspect = 'OBJECTIVE' | 'MECHANISM' | 'FINDING' | 'END OF MISSION' | 'LIMIT' | 'NOTE';

export interface SummarySection {
  aspect: SummaryAspect;
  text: string;
  claimIds: string[];
}

export interface RecordImage {
  assetId: string;
  alt: string;
  caption: string;
  /** Short labels shown on the image frame, e.g. instrument and colour treatment. */
  labels: string[];
  /** Reviewed text shown when the file cannot be loaded. */
  fallbackText: string;
}

export interface ScientificRecord {
  id: string;
  missionId: string;
  title: string;
  layer: Layer;
  sourceId: string;
  sourceUrl: string;
  /** Values taken from the source. Never fiction. */
  sourceFields: SourceField[];
  retrievedAt: string;
  claimIds: string[];
  credit: string;
  usageTerms: string;
  /** Editorial explanation, kept apart from source values. */
  editorialSummary: SummarySection[];
  image?: RecordImage;
}

export interface PuzzleOption {
  id: string;
  label: string;
}

export interface PuzzleField {
  id: string;
  label: string;
  options: PuzzleOption[];
  /** Shown when this field is wrong. */
  feedback: string;
  /** Shown beside the field once the puzzle is solved. */
  reason?: string;
}

export interface PuzzleDefinition {
  id: PuzzleId;
  title: string;
  zone: ZoneId;
  prerequisiteStage: StoryStage;
  layer: Layer;
  layerNote: string;
  instruction: string;
  recordIds: string[];
  fields: PuzzleField[];
  solution: Record<string, string>;
  /** Pre-selected options (PZ-00 starts at OFF). */
  initial?: Record<string, string>;
  solutionClaimIds: string[];
  hints: string[];
  success: string;
  confirmLabel: string;
}

export interface NarrativeBeat {
  id: string;
  trigger: string;
  layer: Layer;
  caption: string;
  durationMs: number;
  /** Bracketed description of a sound, for players without audio. */
  isSoundCaption?: boolean;
}

export interface AssetRecord {
  id: string;
  /** Path under public/, as served. */
  path: string;
  kind: 'model' | 'image';
  title: string;
  sourceUrl: string;
  rights: string;
  credit: string;
  aiAssisted: boolean;
  derivedFrom?: string;
  transforms: string[];
  fallback: string;
}

export interface GameState {
  storyStage: StoryStage;
  /** Persisted so a resumed survivor does not awaken twice. */
  awakened: boolean;
  /** True while the post-beacon reflection is being presented. */
  presenting: boolean;
  viewedRecordIds: string[];
  seenBeatIds: string[];
}

export type GameEvent =
  | { type: 'awakeningCompleted' }
  | { type: 'chapterTwoStarted' }
  | { type: 'monologueCompleted' }
  | { type: 'observationEntered' }
  | { type: 'rescueCompleted' }
  | { type: 'puzzleSolved'; puzzleId: PuzzleId }
  | { type: 'preserveConfirmed' }
  | { type: 'presentationCompleted' }
  | { type: 'skipPresentation' }
  | { type: 'recordViewed'; recordId: string }
  | { type: 'beatSeen'; beatId: string }
  | { type: 'newGame' };

export interface ReduceResult {
  state: GameState;
  accepted: boolean;
  /** Present when the event was not applied. */
  reason?: 'out-of-order' | 'duplicate' | 'unknown';
}

export function stageIndex(stage: StoryStage): number {
  return STORY_STAGES.indexOf(stage);
}

export function isStoryStage(value: unknown): value is StoryStage {
  return typeof value === 'string' && (STORY_STAGES as readonly string[]).includes(value);
}
