// Technical survivor-story orchestration. Real NASA records remain immutable in content/.
import {Engine,Scene,SpotLight,Vector3} from '@babylonjs/core';
import {ArchiveWorld} from './world/world';
import {readVisualManifest} from './world/visuals';
import {Player} from './player/player';
import {FirstPersonHands} from './player/hands';
import {GameUI} from './ui/ui';
import {ArchiveAudio} from './audio/audio';
import {ArchiveVoice} from './audio/voice';
import {initialState,reduce} from './game/reducer';
import {project} from './game/projection';
import type {GameEvent,PuzzleId} from './game/contracts';
import {SaveStore,browserStorage,sanitizeSettings} from './save/save';
import {RECORD_IDS} from './content/records';
import {BEAT_IDS,TEXT} from './content/narrative';
import {STORY} from './content/story';
import type {SceneBeat} from './content/story';
import {puzzleById} from './content/puzzles';
import {validateAnswers} from './puzzles/validate';
import {validateContent} from './content/validate';
import {rectAt} from './world/layout';
import './ui/style.css';

type Mode='MENU'|'PLAYING'|'INTERACTING'|'TERMINAL'|'PAUSED'|'CINEMATIC'|'COMPLETE'|'RECOVERY';
type Sequence=keyof typeof STORY|'fade';
const canvas=document.querySelector<HTMLCanvasElement>('#scene')!;
const uiRoot=document.querySelector<HTMLElement>('#ui')!;
const store=new SaveStore(browserStorage(),{recordIds:RECORD_IDS,beatIds:[...BEAT_IDS,'CHAPTER1','BEACON']});
const loaded=store.load();let state=loaded.ok?loaded.state:initialState();let settings=store.loadSettings();
let mode:Mode='MENU';let engine:Engine;let scene:Scene;let world:ArchiveWorld;let player:Player;let hands:FirstPersonHands;let flashlight:SpotLight;
let flashOn=true;let last=performance.now();let elapsed=0;let capturing=false;let saveWarning=false;
let focused:ReturnType<ArchiveWorld['focused']>=null;
let sequence:Sequence|null=null;let cinematicClock=0;let cinematicSuspended=false;let standing=false;let metalTriggered=false;
let pendingInteraction:(()=>void)|null=null;let interactionClock=0;
let observationRadioPending=false;
const audio=new ArchiveAudio();const voice=new ArchiveVoice();
function save():void{if(!store.save(state)&&!saveWarning){saveWarning=true;ui.notify(TEXT.saveFailed);}}
function updateProjection():void{const view=project(state);world?.sync(view);audio.setPreserved(!view.pulseActive);}
function dispatch(event:GameEvent):boolean{const result=reduce(state,event);if(!result.accepted)return false;state=result.state;updateProjection();save();return true;}
function stop(next:Mode):void{mode=next;player?.activate(false);audio.setPaused(true);voice.cancel();if(document.pointerLockElement===canvas)document.exitPointerLock();}
function restoreView():void{uiRoot.style.setProperty('--recovery','1');uiRoot.style.setProperty('--chapter-title-opacity','1');player?.cinematicPose(1.65,0);world?.power(1);audio.cinematic('normal');hands?.play('Idle');}
function pause(message?:string):void{pendingInteraction=null;stop('PAUSED');ui.showPause(message);}
function play():void{
  if(settings.lookMode==='mouse'&&document.pointerLockElement!==canvas&&!navigator.userActivation.isActive){restoreView();pause('Continue when ready. Click Return to archive to take control, or use arrow keys to look.');return;}
  sequence=null;restoreView();mode='PLAYING';ui.hide();player.activate(true);hands.setVisible(true);audio.setPaused(false);
  void audio.unlock().then(ok=>{
    if(!ok)ui.notify('Audio is unavailable. Captions and puzzles remain available.');
    if(mode==='PLAYING'&&observationRadioPending&&state.storyStage==='OBSERVATION'){
      observationRadioPending=false;
      ui.caption('REACH THE OBSERVATION DECK. Rescue One needs visual confirmation.','FICTIONAL RESCUE TRANSMISSION');
      audio.effect('radio');voice.speak('Survivor, Rescue One is approaching. Move to the observation deck for visual confirmation.',settings.master*settings.effects);
    }
  });
  if(settings.lookMode==='mouse'&&document.pointerLockElement!==canvas){capturing=true;try{Promise.resolve(canvas.requestPointerLock()).catch(()=>pause(TEXT.pointerLockFailed)).finally(()=>{capturing=false;});}catch{capturing=false;pause(TEXT.pointerLockFailed);}}
}
function speak(beat:SceneBeat):void{
  if(beat.speaker.includes('RADIO'))audio.effect('radio');
  voice.speak(beat.text,settings.master*settings.effects);
}
function cinematic(id:Sequence,title:string,beats:SceneBeat[],done:()=>void):void{
  stop('CINEMATIC');sequence=id;cinematicClock=0;standing=false;metalTriggered=false;cinematicSuspended=false;uiRoot.style.setProperty('--chapter-title-opacity',id==='chapterTwo'?'0':'1');hands.setVisible(id!=='fade');audio.setPaused(false);
  void audio.unlock().then(()=>audio.cinematic(sequence===id&&mode==='CINEMATIC'?(id==='awakening'?'awakening':id==='chapterTwo'?'chapter':'normal'):'normal')); 
  if(id==='awakening'){hands.play('Awaken');player.cinematicPose(.24,.9,-.1);uiRoot.style.setProperty('--recovery','0');}
  else uiRoot.style.setProperty('--recovery','1');
  ui.showCinematic(title,beats,()=>{voice.cancel();restoreView();done();},speak);
}
function prologue():void{cinematic('awakening','PROLOGUE\nTHE AWAKENING',STORY.awakening,()=>{dispatch({type:'awakeningCompleted'});play();});}
function chapterTwo():void{cinematic('chapterTwo','CHAPTER II\nBENEATH THE SILENCE',STORY.chapterTwo,()=>{dispatch({type:'chapterTwoStarted'});play();});}
function reflection():void{
  const monologue=()=>cinematic('monologue','EPILOGUE\nNOT FORGOTTEN',STORY.monologue,()=>{dispatch({type:'monologueCompleted'});observationRadioPending=true;play();});
  if(!state.seenBeatIds.includes('BEACON'))cinematic('beacon','SURVIVOR CHANNEL\nCONTACT ESTABLISHED',STORY.beacon,()=>{dispatch({type:'beatSeen',beatId:'BEACON'});monologue();});
  else monologue();
}
function rescue():void{
  world.rescue.start();player.camera.rotation.set(0,0,0);
  cinematic('rescue','RESCUE ONE\nVISUAL APPROACH',STORY.rescue,()=>{
    cinematic('fade','', [{speaker:'FICTIONAL EPILOGUE',text:'',duration:1.4}],()=>{dispatch({type:'rescueCompleted'});stop('COMPLETE');hands.setVisible(false);ui.showComplete();});
  });
}
function resume():void{
  if(!player||mode==='RECOVERY')return;
  if(!state.awakened){prologue();return;}
  if(state.storyStage==='COMPLETE'){stop('COMPLETE');hands.setVisible(false);ui.showComplete();return;}
  if(state.storyStage==='OPPORTUNITY_RESTORED'){chapterTwo();return;}
  if(state.storyStage==='EPILOGUE'){reflection();return;}
  if(state.storyStage==='RESCUE'){rescue();return;}
  if(state.storyStage==='ARCHIVE_OPEN'&&!state.seenBeatIds.includes('CHAPTER1')){
    cinematic('chapterOne','CHAPTER I\nTHE FORGOTTEN',STORY.chapterOne,()=>{dispatch({type:'beatSeen',beatId:'CHAPTER1'});play();});return;
  }
  play();
}
function submit(id:PuzzleId,answers:Record<string,string>){
  const result=validateAnswers(puzzleById(id),answers);
  if(project(state).puzzles[id]==='locked')return {...result,solved:false,feedback:['Restore the required ship system first.']};
  if(result.solved&&dispatch({type:'puzzleSolved',puzzleId:id}))audio.effect('success');
  return result;
}
uiRoot.style.setProperty('--text-scale',String(settings.textScale));
const ui=new GameUI(uiRoot,{
  getState:()=>state,getSettings:()=>settings,
  start:(fresh)=>{voice.cancel();pendingInteraction=null;if(fresh){state=initialState();store.clearProgress();saveWarning=false;updateProjection();}observationRadioPending=state.storyStage==='OBSERVATION';world.rescue.reset();flashOn=true;flashlight.setEnabled(true);player.teleport(project(state).checkpoint);resume();},
  resume,recenter:()=>{player.teleport(project(state).checkpoint);ui.notify(TEXT.recentered);},
  updateSettings:(value)=>{settings=sanitizeSettings(value);store.saveSettings(settings);player?.configure(settings);world?.configure(settings);audio.configure(settings);if(settings.master===0||settings.effects===0)voice.cancel();if(engine){engine.setHardwareScalingLevel(1/Math.min(devicePixelRatio||1,settings.quality==='low'?1:1.5));engine.resize();}},
  submit,preserve:()=>{if(dispatch({type:'preserveConfirmed'}))reflection();},
  finishEnding:()=>{if(dispatch({type:'monologueCompleted'}))play();},
  keepExploring:()=>ui.showComplete(),recordViewed:id=>{dispatch({type:'recordViewed',recordId:id});},
});
function interact():void{
  if(!focused)return;const item=focused;hands.play(item.kind==='door'?'OperateDoor':item.id==='switch'?'OperateSwitch':item.kind==='puzzle'?'PressTerminal':'Reach');
  mode='INTERACTING';player.activate(false);interactionClock=0;
  pendingInteraction=()=>{
    pendingInteraction=null;audio.effect('click');
    if(item.kind==='door'){ui.notify(project(state).doors[item.doorId!]?'Door is open.':item.doorId==='D0'?'Restore backup power.':item.doorId==='D1'?'Restore emergency power.':'Restore both archive records to power the Relay.');play();}
    else{stop('TERMINAL');if(item.puzzleId)ui.showPuzzle(item.puzzleId);else if(item.recordId)ui.showRecord(item.recordId);}
  };
}
function fatal(message:string):void{stop('RECOVERY');uiRoot.replaceChildren();const p=document.createElement('section');p.className='panel';const h=document.createElement('h1');h.textContent='Archive recovery';const t=document.createElement('p');t.textContent=message;const b=document.createElement('button');b.textContent='Reload archive';b.onclick=()=>location.reload();p.append(h,t,b);const overlay=document.createElement('div');overlay.className='overlay';overlay.append(p);uiRoot.append(overlay);}
async function boot():Promise<void>{
  const problems=validateContent();if(problems.length)throw new Error(problems.join('; '));if(!Engine.IsSupported)throw new Error(TEXT.unsupported);
  engine=new Engine(canvas,true,{preserveDrawingBuffer:false,stencil:true});if(engine.webGLVersion<2)throw new Error(TEXT.unsupported);
  scene=new Scene(engine);world=new ArchiveWorld(scene);player=new Player(canvas,scene,settings);hands=new FirstPersonHands(player.camera,scene);
  hands.setVisible(false);player.teleport(project(state).checkpoint);
  flashlight=new SpotLight('PROVISIONAL-flashlight',player.position.clone(),new Vector3(0,0,1),.9,3,scene);flashlight.range=12;flashlight.intensity=2;
  world.configure(settings);audio.configure(settings);updateProjection();
  engine.setHardwareScalingLevel(1/Math.min(devicePixelRatio||1,settings.quality==='low'?1:1.5));
  void world.loadVisuals(text=>ui.notify(text)).then(()=>{canvas.dataset.productionVisuals=[...world.visuals.anchors.entries()].filter(([,a])=>!a.metadata.provisional).map(([id])=>id).join(',');});
  void readVisualManifest().then(m=>hands.loadAsset(m.hands)).catch(()=>ui.notify('Hand model unavailable; using the provisional rig.'));
  ui.showMenu(loaded.ok,loaded.ok?undefined:loaded.reason!=='empty'?TEXT.saveUnreadable:undefined);
  window.addEventListener('resize',()=>engine.resize());
  document.addEventListener('pointerlockchange',()=>{if(mode==='PLAYING'&&settings.lookMode==='mouse'&&document.pointerLockElement!==canvas&&!capturing)pause();});
  document.addEventListener('pointerlockerror',()=>{capturing=false;if(mode==='PLAYING')pause(TEXT.pointerLockFailed);});
  window.addEventListener('blur',()=>{if(mode==='PLAYING')pause();else if(mode==='CINEMATIC'){cinematicSuspended=true;audio.setPaused(true);voice.pause();}});
  window.addEventListener('focus',()=>{if(mode==='CINEMATIC'){cinematicSuspended=false;audio.setPaused(false);voice.resume();}});
  window.addEventListener('keydown',e=>{
    if(e.repeat)return;
    if(e.code==='Escape'&&(mode==='PLAYING'||mode==='TERMINAL'||mode==='INTERACTING')){e.preventDefault();pause();}
    if(mode==='INTERACTING'&&e.code==='KeyE'){pendingInteraction?.();return;}
    if(mode!=='PLAYING')return;
    if(e.code==='KeyE'){e.preventDefault();interact();}
    if(e.code==='KeyF'){flashOn=!flashOn;flashlight.setEnabled(flashOn);}
    if(e.code==='KeyJ'){stop('TERMINAL');ui.showJournal();}
  });
  engine.onContextLostObservable.add(()=>{save();fatal('Graphics context lost. Reload to try the last stored checkpoint.');});
  engine.runRenderLoop(()=>{
    try{
      const now=performance.now();const dt=Math.min((now-last)/1000,.1);last=now;elapsed+=dt;
      const moving=player.update(dt);const pos=player.position;
      if(mode==='INTERACTING'){interactionClock+=dt;if(interactionClock>=.35)pendingInteraction?.();}
      if(mode==='CINEMATIC'&&!cinematicSuspended){
        cinematicClock+=dt;
        if(sequence==='awakening'){
          if(cinematicClock>=3.2&&!standing){standing=true;hands.play('StandUp');}
          const rise=Math.min(1,Math.max(0,(cinematicClock-3.2)/3));
          player.cinematicPose(.24+1.41*rise,.9*(1-rise),settings.reducedIntensity?0:-.1*(1-rise));
          uiRoot.style.setProperty('--recovery',String(Math.min(1,cinematicClock/4)));
        }else if(sequence==='chapterTwo'){
          if(cinematicClock>=2.5&&!metalTriggered){metalTriggered=true;audio.effect('metal');}
          uiRoot.style.setProperty('--chapter-title-opacity',cinematicClock>=5.5?'1':'0');
          world.power(cinematicClock<2.5?1.5:cinematicClock<5.5?.12:1);
          uiRoot.style.setProperty('--recovery',String(cinematicClock<2.5?1:cinematicClock<5.5?.08:Math.min(1,(cinematicClock-5.5)/2)));
        }else if(sequence==='fade')uiRoot.style.setProperty('--recovery',String(Math.max(0,1-cinematicClock/1.4)));
        ui.updateCinematic(cinematicClock);
      }
      hands.update(cinematicSuspended?0:dt);
      if(!rectAt(pos.x,pos.z,.1)){player.teleport(project(state).checkpoint);ui.notify(TEXT.outOfBounds);console.error('Unexpected out-of-bounds position recovered');}
      const zone=world.update(pos.x,pos.z,elapsed,settings.reducedIntensity);
      world.rescue.update(mode==='CINEMATIC'&&!cinematicSuspended?dt:0,pos);
      flashlight.position.copyFrom(pos);flashlight.direction.copyFrom(player.camera.getForwardRay().direction);
      focused=mode==='PLAYING'?world.focused(player.camera):null;
      ui.hud(project(state).objective,focused?`E — ${focused.label}`:'',zone);
      if(mode==='PLAYING'){
        audio.tick({x:pos.x,z:pos.z,yaw:player.camera.rotation.y},moving);
        if(state.storyStage==='OBSERVATION'&&zone==='OBSERVATION'&&pos.z>=25){dispatch({type:'observationEntered'});rescue();}
      }
      canvas.dataset.x=pos.x.toFixed(4);canvas.dataset.z=pos.z.toFixed(4);canvas.dataset.yaw=player.camera.rotation.y.toFixed(4);canvas.dataset.pitch=player.camera.rotation.x.toFixed(4);
      canvas.dataset.stage=state.storyStage;canvas.dataset.mode=mode;canvas.dataset.flashlight=String(flashOn);canvas.dataset.fps=engine.getFps().toFixed(1);canvas.dataset.meshes=String(scene.meshes.length);canvas.dataset.triangles=String(scene.getActiveIndices()/3);
      canvas.dataset.cinematic=sequence??'';canvas.dataset.handAnimation=hands.animationName;canvas.dataset.eyeHeight=pos.y.toFixed(3);canvas.dataset.sprinting=String(player.sprinting);
      canvas.dataset.rescueVisible=String(world.rescue.active);canvas.dataset.rescueZ=world.rescue.ship.position.z.toFixed(3);canvas.dataset.searchlight=String(world.rescue.searchlight.intensity>0);canvas.dataset.searchlightDirectionZ=world.rescue.searchlight.direction.z.toFixed(3);canvas.dataset.speech=voice.status;canvas.dataset.spokenLines=String(voice.spokenLines);canvas.dataset.speechError=voice.lastError;
      scene.render();
    }catch(error){console.error(error);engine.stopRenderLoop();fatal('The spacecraft stopped unexpectedly. Reload to try the last checkpoint.');}
  });
  window.addEventListener('pagehide',()=>{voice.cancel();audio.dispose();hands.dispose();player.dispose();scene.dispose();engine.dispose();},{once:true});
}
ui.showLoading();void boot().catch(error=>{console.error(error);fatal(error instanceof Error?error.message:'The spacecraft could not start.');});
