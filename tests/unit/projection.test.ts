import { describe, expect, it } from 'vitest';
import { DOOR_IDS, PUZZLE_IDS, STORY_STAGES } from '../../src/game/contracts';
import type { StoryStage } from '../../src/game/contracts';
import { project } from '../../src/game/projection';
import { initialState, reduce } from '../../src/game/reducer';
import { zoneAt } from '../../src/world/layout';

const DOORS:Record<StoryStage,[boolean,boolean,boolean]>={
  ARRIVAL:[false,false,false],ARCHIVE_OPEN:[true,true,false],OPPORTUNITY_RESTORED:[true,true,false],
  CHAPTER_TWO:[true,true,false],INSIGHT_RESTORED:[true,true,true],READY_TO_PRESERVE:[true,true,true],
  EPILOGUE:[true,true,true],OBSERVATION:[true,true,true],RESCUE:[true,true,true],COMPLETE:[true,true,true],
};
const CHECKPOINT:Record<StoryStage,[string,number,number]>={
  ARRIVAL:['AIRLOCK',0,-6],ARCHIVE_OPEN:['HUB',0,4],OPPORTUNITY_RESTORED:['OPPORTUNITY',9,6],
  CHAPTER_TWO:['HUB',0,4],INSIGHT_RESTORED:['INSIGHT',-9,6],READY_TO_PRESERVE:['RELAY',0,14.5],
  EPILOGUE:['RELAY',0,14.5],OBSERVATION:['RELAY',0,14.5],RESCUE:['OBSERVATION',0,26],COMPLETE:['OBSERVATION',0,26],
};
const at=(storyStage:StoryStage)=>({...initialState(),awakened:true,storyStage});
describe('survivor world projection',()=>{
  for(const stage of STORY_STAGES)it(`${stage}: deterministic doors and safe checkpoint`,()=>{
    const p=project(at(stage));expect(DOOR_IDS.map(id=>p.doors[id])).toEqual(DOORS[stage]);
    expect([p.checkpoint.zone,p.checkpoint.x,p.checkpoint.z]).toEqual(CHECKPOINT[stage]);
    expect(zoneAt(p.checkpoint.x,p.checkpoint.z)).toBe(p.checkpoint.zone);expect(p.objective.length).toBeGreaterThan(5);
  });
  it('keeps puzzles unavailable while unconscious, then follows the Opportunity-first route',()=>{
    expect(PUZZLE_IDS.filter(id=>project(initialState()).puzzles[id]==='available')).toEqual([]);
    const available:Record<StoryStage,string|null>={ARRIVAL:'PZ-00',ARCHIVE_OPEN:'PZ-02',OPPORTUNITY_RESTORED:null,CHAPTER_TWO:'PZ-01',INSIGHT_RESTORED:'PZ-03',READY_TO_PRESERVE:null,EPILOGUE:null,OBSERVATION:null,RESCUE:null,COMPLETE:null};
    for(const stage of STORY_STAGES)expect(PUZZLE_IDS.filter(id=>project(at(stage)).puzzles[id]==='available')).toEqual(available[stage]?[available[stage]]:[]);
  });
  it('never marks the unvisited InSight puzzle solved during the chapter transition',()=>{
    const p=project(at('OPPORTUNITY_RESTORED'));expect(p.puzzles['PZ-02']).toBe('solved');expect(p.puzzles['PZ-01']).toBe('locked');expect(p.doors.D2).toBe(false);
    expect(project(at('CHAPTER_TWO')).puzzles['PZ-01']).toBe('available');
  });
  it('is idempotent under repeated input and stage projection',()=>{
    for(const stage of STORY_STAGES)expect(project(at(stage))).toEqual(project(at(stage)));
    let s=reduce(initialState(),{type:'awakeningCompleted'}).state;s=reduce(s,{type:'puzzleSolved',puzzleId:'PZ-00'}).state;
    expect(project(reduce(s,{type:'puzzleSolved',puzzleId:'PZ-00'}).state)).toEqual(project(s));
  });
  it('requires a physical observation-deck walk after the monologue',()=>{
    const p=project(at('OBSERVATION'));expect(p.objective).toBe('REACH THE OBSERVATION DECK.');expect(p.checkpoint.zone).toBe('RELAY');expect(p.canPreserve).toBe(false);
    expect(project(at('RESCUE')).checkpoint.zone).toBe('OBSERVATION');
    expect(project(at('COMPLETE')).objective).toBe('Some missions never truly end.');
  });
  it('stops the archive pulse after beacon activation, without calling the game complete',()=>{
    expect(project(at('READY_TO_PRESERVE')).pulseActive).toBe(true);
    expect(project(at('READY_TO_PRESERVE')).canPreserve).toBe(true);
    for(const stage of ['EPILOGUE','OBSERVATION','RESCUE','COMPLETE'] as StoryStage[]){expect(project(at(stage)).pulseActive).toBe(false);expect(project(at(stage)).lightProfile).toBe('PRESERVED');}
  });
});
