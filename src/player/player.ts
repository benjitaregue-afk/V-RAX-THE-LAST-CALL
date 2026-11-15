import { MeshBuilder, Scene, UniversalCamera, Vector3 } from '@babylonjs/core';
import { BODY_HALF_H, BODY_R, EYE_H } from '../world/layout';
import type { Pose } from '../world/layout';
import type { Settings } from '../save/save';

export const WALK_SPEED=1.8;
export const SPRINT_SPEED=3.2;

export class Player {
  readonly camera: UniversalCamera;
  private body;
  private keys = new Set<string>();
  private enabled=false;
  private accumulator=0;
  private settings:Settings;
  private readonly controller=new AbortController();
  constructor(canvas:HTMLCanvasElement,scene:Scene,settings:Settings) {
    this.settings=settings;
    this.body=MeshBuilder.CreateBox('player-collision-body',{size:0.1},scene);
    this.body.isVisible=false; this.body.isPickable=false; this.body.ellipsoid.set(BODY_R,BODY_HALF_H,BODY_R);
    this.camera=new UniversalCamera('first-person',new Vector3(0,EYE_H,-6),scene);
    this.camera.inputs.clear(); this.camera.minZ=0.05; this.camera.maxZ=100;
    const signal=this.controller.signal;
    window.addEventListener('keydown',e=>{
      if (!this.enabled || e.ctrlKey || e.metaKey || e.altKey) return;
      if (['KeyW','KeyA','KeyS','KeyD','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ShiftLeft','ShiftRight'].includes(e.code)) { e.preventDefault(); this.keys.add(e.code); }
    },{signal});
    window.addEventListener('keyup',e=>this.keys.delete(e.code),{signal});
    window.addEventListener('blur',()=>this.clear(),{signal});
    document.addEventListener('mousemove',e=>{
      if (!this.enabled || document.pointerLockElement!==canvas) return;
      this.camera.rotation.y+=e.movementX*0.002*this.settings.sensitivity;
      this.camera.rotation.x+=e.movementY*0.002*this.settings.sensitivity*(this.settings.invertY?-1:1); this.clampPitch();
    },{signal});
    this.configure(settings);
  }
  configure(settings:Settings):void { this.settings=settings; this.camera.fov=settings.fov*Math.PI/180; }
  activate(value:boolean):void { this.enabled=value; this.clear(); }
  clear():void { this.keys.clear(); this.accumulator=0; }
  teleport(pose:Pose):void { this.body.position.set(pose.x,BODY_HALF_H,pose.z); this.camera.rotation.set(0,pose.yaw,0); this.sync(); this.clear(); }
  private sync():void { this.camera.position.set(this.body.position.x,EYE_H,this.body.position.z); }
  private clampPitch():void { this.camera.rotation.x=Math.max(-85*Math.PI/180,Math.min(85*Math.PI/180,this.camera.rotation.x)); }
  update(elapsed:number):boolean {
    if (!this.enabled) return false;
    this.accumulator+=Math.min(elapsed,0.083333); let steps=0; let moving=false;
    while (this.accumulator>=1/60 && steps++<5) {
      const yaw=this.camera.rotation.y;
      let x=Number(this.keys.has('KeyD'))-Number(this.keys.has('KeyA'));
      let z=Number(this.keys.has('KeyW'))-Number(this.keys.has('KeyS'));
      const len=Math.hypot(x,z); if (len) { x/=len; z/=len; moving=true; }
      const d=(this.keys.has('ShiftLeft')||this.keys.has('ShiftRight')?SPRINT_SPEED:WALK_SPEED)/60;
      this.body.moveWithCollisions(new Vector3((x*Math.cos(yaw)+z*Math.sin(yaw))*d,0,(z*Math.cos(yaw)-x*Math.sin(yaw))*d));
      this.camera.rotation.y+=(Number(this.keys.has('ArrowRight'))-Number(this.keys.has('ArrowLeft')))*1.5/60;
      this.camera.rotation.x+=(Number(this.keys.has('ArrowDown'))-Number(this.keys.has('ArrowUp')))*1.1/60;
      this.clampPitch(); this.accumulator-=1/60;
    }
    this.sync(); return moving;
  }
  cinematicPose(height:number,pitch:number,roll=0):void {
    this.camera.position.y=height; this.camera.rotation.x=pitch;this.camera.rotation.z=roll;
  }
  get sprinting():boolean {return this.enabled && (this.keys.has('ShiftLeft')||this.keys.has('ShiftRight'));}
  get position():Vector3 { return this.camera.position; }
  dispose():void { this.controller.abort(); this.body.dispose(); this.camera.dispose(); }
}
