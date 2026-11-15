// Scene/HUD projection for the survivor story. Science puzzle IDs and answers stay intact.
import { PUZZLE_IDS, stageIndex } from './contracts';
import type { DoorId, GameState, PuzzleId, StoryStage } from './contracts';
import { SOLVE_TRANSITIONS, flags } from './reducer';
import { SAFE_POINTS } from '../world/layout';
import type { GuideId, Pose } from '../world/layout';

export type LightProfile = 'DARK' | 'BACKUP' | 'INSIGHT' | 'OPPORTUNITY' | 'PRESERVED';
export type PuzzleStatus = 'locked' | 'available' | 'solved';
export interface WorldProjection {
  doors: Record<DoorId, boolean>;
  lightProfile: LightProfile;
  pulseActive: boolean;
  guide: GuideId | null;
  objective: string;
  checkpoint: Pose;
  puzzles: Record<PuzzleId, PuzzleStatus>;
  canPreserve: boolean;
}

const OBJECTIVES: Record<StoryStage, string> = {
  ARRIVAL: 'Find your footing. Restore emergency backup power.',
  ARCHIVE_OPEN: 'Recover the Opportunity archive to restore the ship’s emergency power routing. East: Witness in Stone.',
  OPPORTUNITY_RESTORED: 'Power is returning. Leave the terminal and investigate the metallic sound.',
  CHAPTER_TWO: 'Recover the InSight archive to restore the distress beacon. West: Listening Station.',
  INSIGHT_RESTORED: 'Both records are safe. Reach the Relay and verify the beacon transmission.',
  READY_TO_PRESERVE: 'Activate the distress beacon. Preserve the records.',
  EPILOGUE: 'The distress beacon is transmitting. Take a moment to listen.',
  OBSERVATION: 'REACH THE OBSERVATION DECK.',
  RESCUE: 'Rescue One is approaching. Hold your position by the window.',
  COMPLETE: 'Some missions never truly end.',
};
const CHECKPOINTS: Record<StoryStage, Pose> = {
  ARRIVAL: SAFE_POINTS.AIRLOCK,
  ARCHIVE_OPEN: SAFE_POINTS.HUB,
  OPPORTUNITY_RESTORED: SAFE_POINTS.OPPORTUNITY,
  CHAPTER_TWO: SAFE_POINTS.HUB,
  INSIGHT_RESTORED: SAFE_POINTS.INSIGHT,
  READY_TO_PRESERVE: SAFE_POINTS.RELAY,
  EPILOGUE: SAFE_POINTS.RELAY,
  OBSERVATION: SAFE_POINTS.RELAY,
  RESCUE: SAFE_POINTS.OBSERVATION,
  COMPLETE: SAFE_POINTS.OBSERVATION,
};
const GUIDE: Record<StoryStage, GuideId | null> = {
  ARRIVAL: 'SWITCH', ARCHIVE_OPEN: 'OPPORTUNITY', OPPORTUNITY_RESTORED: 'INSIGHT',
  CHAPTER_TWO: 'INSIGHT', INSIGHT_RESTORED: 'RELAY', READY_TO_PRESERVE: 'RELAY',
  EPILOGUE: null, OBSERVATION: 'OBSERVATION', RESCUE: null, COMPLETE: null,
};
export function project(state: GameState): WorldProjection {
  const f = flags(state);
  const i = stageIndex(state.storyStage);
  const preserved = i >= stageIndex('EPILOGUE');
  const puzzles = {} as Record<PuzzleId, PuzzleStatus>;
  for (const id of PUZZLE_IDS) {
    const transition = SOLVE_TRANSITIONS[id];
    const solved = i >= stageIndex(transition.to);
    puzzles[id] = solved ? 'solved' : state.awakened && state.storyStage === transition.from ? 'available' : 'locked';
  }
  let lightProfile: LightProfile = 'DARK';
  if (preserved) lightProfile = 'PRESERVED';
  else if (f.insightRestored) lightProfile = 'INSIGHT';
  else if (f.opportunityRestored) lightProfile = 'OPPORTUNITY';
  else if (f.backupOn) lightProfile = 'BACKUP';
  return {
    doors: { D0: f.backupOn, D1: f.backupOn, D2: f.insightRestored },
    lightProfile, pulseActive: !preserved,
    guide: GUIDE[state.storyStage], objective: OBJECTIVES[state.storyStage], checkpoint: CHECKPOINTS[state.storyStage],
    puzzles, canPreserve: state.storyStage === 'READY_TO_PRESERVE' && !state.presenting,
  };
}
