// Pure story reducer. Stages only move forward; a wrong answer or a repeated event never
// revokes progress. Doors, lights and checkpoints are derived from the stage (projection.ts).

import { stageIndex } from './contracts';
import type { GameEvent, GameState, PuzzleId, ReduceResult, StoryStage } from './contracts';

export function initialState(): GameState {
  return { storyStage: 'ARRIVAL', awakened: false, presenting: false, viewedRecordIds: [], seenBeatIds: [] };
}

/** Each puzzle advances exactly one stage, from its prerequisite. */
export const SOLVE_TRANSITIONS: Record<PuzzleId, { from: StoryStage; to: StoryStage }> = {
  'PZ-00': { from: 'ARRIVAL', to: 'ARCHIVE_OPEN' },
  'PZ-01': { from: 'CHAPTER_TWO', to: 'INSIGHT_RESTORED' },
  'PZ-02': { from: 'ARCHIVE_OPEN', to: 'OPPORTUNITY_RESTORED' },
  'PZ-03': { from: 'INSIGHT_RESTORED', to: 'READY_TO_PRESERVE' },
};

const rejected = (state: GameState, reason: ReduceResult['reason']): ReduceResult => ({ state, accepted: false, reason });
const accepted = (state: GameState): ReduceResult => ({ state, accepted: true });

function transition(state: GameState, from: StoryStage, to: StoryStage, presenting = false): ReduceResult {
  if (!state.awakened || stageIndex(state.storyStage) < stageIndex(from)) return rejected(state, 'out-of-order');
  if (state.storyStage !== from) return rejected(state, 'duplicate');
  return accepted({ ...state, storyStage: to, presenting });
}

export function reduce(state: GameState, event: GameEvent): ReduceResult {
  switch (event.type) {
    case 'awakeningCompleted': {
      if (state.awakened) return rejected(state, 'duplicate');
      if (state.storyStage !== 'ARRIVAL') return rejected(state, 'out-of-order');
      return accepted({ ...state, awakened: true });
    }
    case 'chapterTwoStarted':
      return transition(state, 'OPPORTUNITY_RESTORED', 'CHAPTER_TWO');
    case 'observationEntered':
      return transition(state, 'OBSERVATION', 'RESCUE');
    case 'rescueCompleted':
      return transition(state, 'RESCUE', 'COMPLETE');
    case 'puzzleSolved': {
      const t = SOLVE_TRANSITIONS[event.puzzleId];
      if (!t) return rejected(state, 'unknown');
      if (!state.awakened) return rejected(state, 'out-of-order');
      if (state.storyStage === t.from) return accepted({ ...state, storyStage: t.to });
      return rejected(state, stageIndex(state.storyStage) > stageIndex(t.from) ? 'duplicate' : 'out-of-order');
    }
    case 'preserveConfirmed':
      return transition(state, 'READY_TO_PRESERVE', 'EPILOGUE', true);
    // Compatibility aliases now finish the reflection only, never the game.
    case 'presentationCompleted':
    case 'skipPresentation':
    case 'monologueCompleted':
      return transition(state, 'EPILOGUE', 'OBSERVATION');
    case 'recordViewed': {
      if (state.viewedRecordIds.includes(event.recordId)) return rejected(state, 'duplicate');
      return accepted({ ...state, viewedRecordIds: [...state.viewedRecordIds, event.recordId] });
    }
    case 'beatSeen': {
      if (state.seenBeatIds.includes(event.beatId)) return rejected(state, 'duplicate');
      return accepted({ ...state, seenBeatIds: [...state.seenBeatIds, event.beatId] });
    }
    case 'newGame':
      return accepted(initialState());
    default:
      return rejected(state, 'unknown');
  }
}

export interface MilestoneFlags {
  backupOn: boolean;
  insightRestored: boolean;
  opportunityRestored: boolean;
  provenanceChecked: boolean;
  complete: boolean;
}

export function flags(state: GameState): MilestoneFlags {
  const i = stageIndex(state.storyStage);
  return {
    backupOn: i >= 1,
    insightRestored: i >= stageIndex('INSIGHT_RESTORED'),
    opportunityRestored: i >= stageIndex('OPPORTUNITY_RESTORED'),
    provenanceChecked: i >= stageIndex('READY_TO_PRESERVE'),
    complete: state.storyStage === 'COMPLETE',
  };
}
