import { describe, expect, it } from 'vitest';
import { PUZZLE_IDS, STORY_STAGES, stageIndex } from '../../src/game/contracts';
import type { GameEvent, GameState, PuzzleId, StoryStage } from '../../src/game/contracts';
import { flags, initialState, reduce } from '../../src/game/reducer';

const solve = (puzzleId: PuzzleId): GameEvent => ({ type: 'puzzleSolved', puzzleId });
const run = (events: GameEvent[], from: GameState = initialState()): GameState => events.reduce((s, e) => reduce(s, e).state, from);
const at = (storyStage: StoryStage): GameState => ({ ...initialState(), awakened: true, storyStage });
const route: [GameEvent, StoryStage][] = [
  [{type:'awakeningCompleted'},'ARRIVAL'], [solve('PZ-00'),'ARCHIVE_OPEN'],
  [solve('PZ-02'),'OPPORTUNITY_RESTORED'], [{type:'chapterTwoStarted'},'CHAPTER_TWO'],
  [solve('PZ-01'),'INSIGHT_RESTORED'], [solve('PZ-03'),'READY_TO_PRESERVE'],
  [{type:'preserveConfirmed'},'EPILOGUE'], [{type:'monologueCompleted'},'OBSERVATION'],
  [{type:'observationEntered'},'RESCUE'], [{type:'rescueCompleted'},'COMPLETE'],
];

describe('survivor narrative reducer', () => {
  it('requires awakening, Opportunity, chapter transition, InSight, beacon, reflection and physical rescue', () => {
    let state=initialState();
    expect(state.awakened).toBe(false);
    expect(reduce(state,solve('PZ-00')).accepted).toBe(false);
    for(const [event,expected] of route){
      const result=reduce(state,event); expect(result.accepted,JSON.stringify(event)).toBe(true);
      state=result.state; expect(state.storyStage).toBe(expected);
    }
    expect(state.awakened).toBe(true); expect(state.presenting).toBe(false);
  });
  it('does not replay awakening or the chapter transition after completion',()=>{
    const awakened=reduce(initialState(),{type:'awakeningCompleted'}).state;
    expect(reduce(awakened,{type:'awakeningCompleted'}).reason).toBe('duplicate');
    expect(reduce(at('CHAPTER_TWO'),{type:'chapterTwoStarted'}).reason).toBe('duplicate');
    expect(reduce(at('ARCHIVE_OPEN'),{type:'chapterTwoStarted'}).reason).toBe('out-of-order');
  });
  it('rejects each puzzle before its narrative prerequisite, including InSight before the transition', () => {
    const prerequisite: Record<PuzzleId,StoryStage>={'PZ-00':'ARRIVAL','PZ-02':'ARCHIVE_OPEN','PZ-01':'CHAPTER_TWO','PZ-03':'INSIGHT_RESTORED'};
    for(const id of PUZZLE_IDS)for(const stage of STORY_STAGES){
      if(stageIndex(stage)>=stageIndex(prerequisite[id]))continue;
      const state=at(stage);const result=reduce(state,solve(id));
      expect(result.accepted,`${id} at ${stage}`).toBe(false);expect(result.state).toEqual(state);expect(result.reason).toBe('out-of-order');
    }
  });
  it('makes repeated puzzle events idempotent and never reopens completed science',()=>{
    const state=run(route.slice(0,5).map(([event])=>event));
    for(const id of ['PZ-00','PZ-02','PZ-01'] as PuzzleId[]){const result=reduce(state,solve(id));expect(result.reason).toBe('duplicate');expect(result.state).toEqual(state);}
  });
  it('cannot skip directly from a scientific mission or the monologue to THE END',()=>{
    for(const stage of STORY_STAGES){
      const state=at(stage);
      expect(reduce(state,{type:'observationEntered'}).accepted).toBe(stage==='OBSERVATION');
      expect(reduce(state,{type:'rescueCompleted'}).accepted).toBe(stage==='RESCUE');
      for(const type of ['monologueCompleted','presentationCompleted','skipPresentation'] as const){
        const result=reduce(state,{type});expect(result.accepted,`${type} at ${stage}`).toBe(stage==='EPILOGUE');
        if(result.accepted)expect(result.state.storyStage).toBe('OBSERVATION');
      }
    }
  });
  it('activates the distress beacon only after verification, with reflection recoverable',()=>{
    expect(reduce(at('INSIGHT_RESTORED'),{type:'preserveConfirmed'}).accepted).toBe(false);
    const epilogue=reduce(at('READY_TO_PRESERVE'),{type:'preserveConfirmed'}).state;
    expect(epilogue.storyStage).toBe('EPILOGUE');expect(epilogue.presenting).toBe(true);
    const observation=reduce(epilogue,{type:'skipPresentation'}).state;
    expect(observation.storyStage).toBe('OBSERVATION');expect(observation.presenting).toBe(false);
  });
  it('never moves backwards for arbitrary event sequences',()=>{
    const events:GameEvent[]=[...route.map(([event])=>event),{type:'presentationCompleted'},{type:'skipPresentation'},{type:'recordViewed',recordId:'R-INSIGHT'},{type:'beatSeen',beatId:'L05'}];
    let seed=20261114;const next=()=>(seed=(seed*1664525+1013904223)>>>0)/2**32;
    for(let trial=0;trial<150;trial++){
      let state=initialState();
      for(let i=0;i<80;i++){const before=stageIndex(state.storyStage);state=reduce(state,events[Math.floor(next()*events.length)]!).state;expect(stageIndex(state.storyStage)).toBeGreaterThanOrEqual(before);expect(stageIndex(state.storyStage)-before).toBeLessThanOrEqual(1);}
    }
  });
  it('stores each viewed source and narrative beat once',()=>{
    const state=run([{type:'recordViewed',recordId:'R-INSIGHT'},{type:'recordViewed',recordId:'R-INSIGHT'},{type:'beatSeen',beatId:'L01'},{type:'beatSeen',beatId:'L01'}]);
    expect(state.viewedRecordIds).toEqual(['R-INSIGHT']);expect(state.seenBeatIds).toEqual(['L01']);
  });
  it('RESTART clears awakening and rescue progress without mutating its input',()=>{
    const done=run(route.map(([event])=>event));
    const frozen=Object.freeze({...done,viewedRecordIds:Object.freeze(['R-INSIGHT']) as string[]});
    expect(reduce(frozen,{type:'newGame'}).state).toEqual(initialState());
    expect(reduce(frozen,{type:'beatSeen',beatId:'NEW'}).state.seenBeatIds).toContain('NEW');
    expect(frozen.storyStage).toBe('COMPLETE');
  });
  it('derives milestone flags in the new mission order',()=>{
    expect(flags(at('ARRIVAL'))).toEqual({backupOn:false,insightRestored:false,opportunityRestored:false,provenanceChecked:false,complete:false});
    expect(flags(at('OPPORTUNITY_RESTORED'))).toMatchObject({backupOn:true,opportunityRestored:true,insightRestored:false});
    expect(flags(at('INSIGHT_RESTORED'))).toMatchObject({backupOn:true,opportunityRestored:true,insightRestored:true});
    expect(flags(at('OBSERVATION')).complete).toBe(false);
    expect(flags(at('COMPLETE')).complete).toBe(true);
  });
});
