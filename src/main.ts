// Technical survivor-story orchestration. Real NASA records remain immutable in content/.
import {Engine,Scene,SpotLight,Vector3,Matrix} from '@babylonjs/core';
import {ArchiveWorld} from './world/world';
import {readVisualManifest} from './world/visuals';
import {Player} from './player/player';
import {FirstPersonHands,HAND_DURATIONS} from './player/hands';
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
let flashOn=true;let last=performance.now();let elapsed=0;let capturing=false;let saveWarning=false;let handMotionHold=0;
let focused:ReturnType<ArchiveWorld['focused']>=null;
let sequence:Sequence|null=null;let cinematicClock=0;let cinematicSuspended=false;let standing=false;let metalTriggered=false;
let pendingInteraction:(()=>void)|null=null;let interactionClock=0;let interactionDuration=.7;
let observationRadioPending=false;
let rescueExposure=0;let rescueGlareStart=0;let rescueLightDuration=2.8;
const motionPreference=window.matchMedia('(prefers-reduced-motion: reduce)');
const calmCinematics=():boolean=>settings.reducedIntensity||motionPreference.matches;
const smooth=(value:number):number=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
const audio=new ArchiveAudio();const voice=new ArchiveVoice();
function setRescueExposure(value:number):void{
  rescueExposure=Math.max(0,Math.min(1,value));
  let origin:{x:number;y:number}|undefined;
  if(engine&&player&&world?.rescue.active){
    const width=engine.getRenderWidth(),height=engine.getRenderHeight();
    const lens=Vector3.Project(world.rescue.searchlight.position,Matrix.Identity(),player.camera.getTransformationMatrix(),player.camera.viewport.toGlobal(width,height));
    origin={x:lens.x/width,y:lens.y/height};
  }
  ui.setRescueGlare(rescueExposure,origin,calmCinematics());
}
function save():void{if(!store.save(state)&&!saveWarning){saveWarning=true;ui.notify(TEXT.saveFailed);}}
function updateProjection():void{const view=project(state);world?.sync(view);audio.setPreserved(!view.pulseActive);}
function dispatch(event:GameEvent):boolean{const result=reduce(state,event);if(!result.accepted)return false;state=result.state;updateProjection();save();return true;}
function stop(next:Mode):void{mode=next;player?.activate(false);audio.setPaused(true);voice.cancel();if(next!=='CINEMATIC')hands?.setVisible(false);if(document.pointerLockElement===canvas)document.exitPointerLock();}
function restoreView():void{setRescueExposure(0);uiRoot.style.setProperty('--recovery','1');uiRoot.style.setProperty('--chapter-title-opacity','1');player?.cinematicPose(1.65,0);world?.power(1);audio.cinematic('normal');hands?.play('Idle');}
function pause(message?:string):void{pendingInteraction=null;stop('PAUSED');ui.showPause(message);}
function play():void{
  if(settings.lookMode==='mouse'&&document.pointerLockElement!==canvas&&!navigator.userActivation.isActive){restoreView();pause('Continue when ready. Click Return to archive to take control, or use arrow keys to look.');return;}
  sequence=null;restoreView();mode='PLAYING';ui.hide();player.activate(true);hands.setInteractionTarget(null);hands.setVisible(true);audio.setPaused(false);
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
  stop('CINEMATIC');sequence=id;cinematicClock=0;standing=false;metalTriggered=false;cinematicSuspended=false;uiRoot.style.setProperty('--chapter-title-opacity',id==='chapterTwo'?'0':'1');hands.setInteractionTarget(null);hands.setVisible(id==='awakening');audio.setPaused(false);
  void audio.unlock().then(()=>audio.cinematic(sequence===id&&mode==='CINEMATIC'?(id==='awakening'?'awakening':id==='chapterTwo'?'chapter':'normal'):'normal')); 
  if(id==='awakening'){hands.play('Awaken');player.cinematicPose(.24,.9);uiRoot.style.setProperty('--recovery','0');}
  else uiRoot.style.setProperty('--recovery','1');
  const finish=():void=>{voice.cancel();if(id!=='rescue'&&id!=='fade')restoreView();done();};
  if(id==='fade')ui.showRescueTransition(beats[0]?.duration??3.2,finish);
  else ui.showCinematic(title,beats,finish,speak);
}
function prologue():void{cinematic('awakening','PROLOGUE\nTHE AWAKENING',STORY.awakening,()=>{dispatch({type:'awakeningCompleted'});play();});}
function chapterTwo():void{cinematic('chapterTwo','CHAPTER II\nBENEATH THE SILENCE',STORY.chapterTwo,()=>{dispatch({type:'chapterTwoStarted'});play();});}
function reflection():void{
  const monologue=()=>cinematic('monologue','EPILOGUE\nNOT FORGOTTEN',STORY.monologue,()=>{dispatch({type:'monologueCompleted'});observationRadioPending=true;play();});
  if(!state.seenBeatIds.includes('BEACON'))cinematic('beacon','SURVIVOR CHANNEL\nCONTACT ESTABLISHED',STORY.beacon,()=>{dispatch({type:'beatSeen',beatId:'BEACON'});monologue();});
  else monologue();
}
function rescue():void{
  world.rescue.start();setRescueExposure(0);player.camera.rotation.set(0,0,0);
  cinematic('rescue','RESCUE ONE\nVISUAL APPROACH',STORY.rescue,()=>{
    // This clock starts after the dialogue, including when Continue/Skip advances it.
    world.rescue.beginWhiteout();rescueGlareStart=rescueExposure;rescueLightDuration=calmCinematics()?3.6:2.8;
    cinematic('fade','Rescue light transition', [{speaker:'',text:'',duration:rescueLightDuration+.4}],()=>{setRescueExposure(1);sequence=null;dispatch({type:'rescueCompleted'});stop('COMPLETE');hands.setVisible(false);ui.showComplete();});
  });
}
function resume():void{
  if(!player||mode==='RECOVERY')return;
  if(!state.awakened){prologue();return;}
  if(state.storyStage==='COMPLETE'){setRescueExposure(1);stop('COMPLETE');hands.setVisible(false);ui.showComplete();return;}
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
  start:(fresh)=>{voice.cancel();pendingInteraction=null;setRescueExposure(0);if(fresh){state=initialState();store.clearProgress();saveWarning=false;updateProjection();}observationRadioPending=state.storyStage==='OBSERVATION';world.rescue.reset();flashOn=true;flashlight.setEnabled(true);player.teleport(project(state).checkpoint);resume();},
  resume,recenter:()=>{player.teleport(project(state).checkpoint);ui.notify(TEXT.recentered);},
  updateSettings:(value)=>{settings=sanitizeSettings(value);store.saveSettings(settings);player?.configure(settings);world?.configure(settings);audio.configure(settings);if(settings.master===0||settings.effects===0)voice.cancel();if(engine){engine.setHardwareScalingLevel(1/Math.min(devicePixelRatio||1,settings.quality==='low'?1:1.5));engine.resize();}},
  submit,preserve:()=>{if(dispatch({type:'preserveConfirmed'}))reflection();},
  finishEnding:()=>{if(dispatch({type:'monologueCompleted'}))play();},
  keepExploring:()=>ui.showComplete(),recordViewed:id=>{dispatch({type:'recordViewed',recordId:id});},
});
function interact():void{
  if(!focused)return;const item=focused;
  const hit=scene.pickWithRay(player.camera.getForwardRay(2.2),m=>!!m.metadata?.blocksInteraction);
  hands.setInteractionTarget(hit?.pickedPoint??null);
  const gesture=item.kind==='door'?'OperateDoor':item.id==='switch'?'OperateSwitch':item.kind==='puzzle'?'PressTerminal':'Inspect';
  hands.play(gesture);interactionDuration=HAND_DURATIONS[gesture]*.78;
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
  // Development art review only; production QA still follows normal controls/UI.
  if(import.meta.env.DEV)(window as unknown as Record<string,unknown>).__voraxHands={hands,player,scene};
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
      const now=performance.now();const dt=Math.min((now-last)/1000,.1);last=now;elapsed+=dt;let handStep=dt;
      const moving=player.update(dt);const pos=player.position;
      if(mode==='INTERACTING'){interactionClock+=dt;if(interactionClock>=interactionDuration)pendingInteraction?.();}
      if(mode==='CINEMATIC'&&!cinematicSuspended){
        cinematicClock+=dt;
        if(sequence==='awakening'){
          if(cinematicClock>=3.2&&!standing){standing=true;hands.play('StandUp');handStep=cinematicClock-3.2;}
          const rise=Math.min(1,Math.max(0,(cinematicClock-3.2)/3));
          // Match the authored support camera exactly; hand inertia supplies motion.
          player.cinematicPose(.24+1.41*rise,.9*(1-rise));
          const reveal=Math.max(0,Math.min(1,(cinematicClock-.25)/1.25));
          uiRoot.style.setProperty('--recovery',String(reveal*reveal*(3-2*reveal)));
        }else if(sequence==='chapterTwo'){
          if(cinematicClock>=2.5&&!metalTriggered){metalTriggered=true;if(!calmCinematics())audio.effect('metal');}
          uiRoot.style.setProperty('--chapter-title-opacity',calmCinematics()||cinematicClock>=5.5?'1':'0');
          world.power(calmCinematics()?1:cinematicClock<2.5?1.5:cinematicClock<5.5?.12:1);
          uiRoot.style.setProperty('--recovery',String(calmCinematics()?1:cinematicClock<2.5?1:cinematicClock<5.5?.08:Math.min(1,(cinematicClock-5.5)/2)));
        }else if(sequence==='fade'){
          const light=smooth(cinematicClock/rescueLightDuration);world.rescue.setWhiteout(light);
          setRescueExposure(rescueGlareStart+(1-rescueGlareStart)*light);
        }
        ui.updateCinematic(cinematicClock);
      }
      // Render frames without a fixed physics step must not reset the authored walk clip.
      handMotionHold=mode==='PLAYING'?(moving ? 0.1 : Math.max(0,handMotionHold-dt)):0;
      hands.setMotion(handMotionHold>0?(player.sprinting?3.2:1.8):0,player.sprinting,settings.reducedIntensity);
      const clearance=mode==='PLAYING'?scene.pickWithRay(player.camera.getForwardRay(.9),m=>!!m.metadata?.blocksInteraction):null;
      hands.setClearance(clearance?.hit?clearance.distance:Infinity);
      hands.update(cinematicSuspended||!['PLAYING','INTERACTING','CINEMATIC'].includes(mode)?0:handStep);
      if(!rectAt(pos.x,pos.z,.1)){player.teleport(project(state).checkpoint);ui.notify(TEXT.outOfBounds);console.error('Unexpected out-of-bounds position recovered');}
      const zone=world.update(pos.x,pos.z,elapsed,settings.reducedIntensity);
      world.rescue.update(mode==='CINEMATIC'&&!cinematicSuspended?dt:0,pos,calmCinematics());
      if(mode==='CINEMATIC'&&sequence==='rescue')setRescueExposure(calmCinematics()?0:.06*smooth((world.rescue.elapsed-3.4)/1.6));
      else if(mode==='CINEMATIC'&&sequence==='fade')setRescueExposure(rescueExposure);
      flashlight.position.copyFrom(pos);flashlight.direction.copyFrom(player.camera.getForwardRay().direction);
      focused=mode==='PLAYING'?world.focused(player.camera):null;
      ui.hud(project(state).objective,focused?`E — ${focused.label}`:'',zone);
      if(mode==='PLAYING'){
        audio.tick({x:pos.x,z:pos.z,yaw:player.camera.rotation.y},moving);
        if(state.storyStage==='OBSERVATION'&&zone==='OBSERVATION'&&pos.z>=25){dispatch({type:'observationEntered'});rescue();}
      }
      canvas.dataset.x=pos.x.toFixed(4);canvas.dataset.z=pos.z.toFixed(4);canvas.dataset.yaw=player.camera.rotation.y.toFixed(4);canvas.dataset.pitch=player.camera.rotation.x.toFixed(4);
      canvas.dataset.stage=state.storyStage;canvas.dataset.mode=mode;canvas.dataset.flashlight=String(flashOn);canvas.dataset.fps=engine.getFps().toFixed(1);canvas.dataset.meshes=String(scene.meshes.length);canvas.dataset.triangles=String(scene.getActiveIndices()/3);
      canvas.dataset.cinematic=sequence??'';canvas.dataset.handAnimation=hands.animationName;canvas.dataset.handAsset=String(hands.usingProductionAsset);canvas.dataset.handBlend=hands.blendProgress.toFixed(3);canvas.dataset.eyeHeight=pos.y.toFixed(3);canvas.dataset.sprinting=String(player.sprinting);
      canvas.dataset.rescueVisible=String(world.rescue.active);canvas.dataset.rescueZ=world.rescue.ship.position.z.toFixed(3);canvas.dataset.searchlight=String(world.rescue.searchlight.intensity>0);canvas.dataset.searchlightDirectionZ=world.rescue.searchlight.direction.z.toFixed(3);canvas.dataset.speech=voice.status;canvas.dataset.spokenLines=String(voice.spokenLines);canvas.dataset.speechError=voice.lastError;
      canvas.dataset.rescueExposure=rescueExposure.toFixed(5);canvas.dataset.rescueCalm=String(calmCinematics());canvas.dataset.cinematicSuspended=String(cinematicSuspended);canvas.dataset.rescueBeamEndZ=world.rescue.scatterEndZ.toFixed(3);canvas.dataset.searchlightIntensity=world.rescue.searchlight.intensity.toFixed(3);
      scene.render();
    }catch(error){console.error(error);engine.stopRenderLoop();fatal('The spacecraft stopped unexpectedly. Reload to try the last checkpoint.');}
  });
  window.addEventListener('pagehide',()=>{voice.cancel();audio.dispose();hands.dispose();player.dispose();scene.dispose();engine.dispose();},{once:true});
}
ui.showLoading();void boot().catch(error=>{console.error(error);fatal(error instanceof Error?error.message:'The spacecraft could not start.');});
