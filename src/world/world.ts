import {
  Scene, Color3, Color4, Mesh, MeshBuilder, StandardMaterial, Vector3, HemisphericLight,
  PointLight, SpotLight, ShadowGenerator, DynamicTexture,
} from '@babylonjs/core';
import type { AbstractMesh } from '@babylonjs/core';
import {
  RECTS, CEIL_H, PLACEMENTS, staticColliders, DOORS, doorBlocker, INTERACTABLES,
  GUIDES, SIGNS, ZONE_LIGHTS, zoneAt,
} from './layout';
import type { InteractableDef } from './layout';
import type { WorldProjection } from '../game/projection';
import type { ZoneId, DoorId } from '../game/contracts';
import type { Settings } from '../save/save';
import { VisualLibrary, readVisualManifest } from './visuals';
import { ObservationRescue } from './rescue';
import { ArtDirector } from './art';

export class ArchiveWorld {
  readonly visuals: VisualLibrary;
  /** Production art layer (Claude). Presentation only; inactive until real visuals load. */
  readonly art: ArtDirector;
  readonly solids: Mesh[] = [];
  readonly rescue:ObservationRescue;
  private powerMultiplier=1;
  private leaves = new Map<DoorId, Mesh>();
  private guides = new Map<string, Mesh[]>();
  private accent: SpotLight;
  private fill: PointLight;
  private shadow: ShadowGenerator;
  private ambient: HemisphericLight;
  private currentZone: ZoneId | null = null;
  private settings: Settings | null = null;
  private projection: WorldProjection | null = null;
  constructor(readonly scene: Scene) {
    scene.clearColor = new Color4(0.025, 0.035, 0.045, 1);
    scene.collisionsEnabled = true;
    scene.fogMode = Scene.FOGMODE_LINEAR; scene.fogStart = 12; scene.fogEnd = 32;
    scene.fogColor = new Color3(0.03, 0.04, 0.05);
    this.visuals = new VisualLibrary(scene);
    this.art = new ArtDirector(scene, this.visuals);
    const wall = this.material('PROVISIONAL-shell', '#39434D');
    const floor = this.material('PROVISIONAL-floor', '#27313A');
    for (const rect of RECTS) {
      const f = this.box(`GREYBOX-floor:${rect.id}`, rect.x1 - rect.x0, 0.15, rect.z1 - rect.z0,
        (rect.x0 + rect.x1) / 2, -0.075, (rect.z0 + rect.z1) / 2, floor);
      f.receiveShadows = true; f.parent=this.visuals.environment;
      const ceiling=this.box(`GREYBOX-ceiling:${rect.id}`, rect.x1 - rect.x0, 0.12, rect.z1 - rect.z0,
        (rect.x0 + rect.x1) / 2, CEIL_H + 0.06, (rect.z0 + rect.z1) / 2, wall);
      ceiling.parent=this.visuals.environment;
    }
    for (const collider of staticColliders()) {
      const placement = PLACEMENTS.find(p => p.colliders.some(c => c.id === collider.id));
      const height = placement?.height ?? CEIL_H;
      const proxy = this.box(collider.id, collider.w, height, collider.d, collider.x, height / 2, collider.z, wall);
      proxy.rotation.y = collider.yaw;
      proxy.checkCollisions = true; proxy.isPickable = true;
      const interaction = INTERACTABLES.find(i => i.target === placement?.id);
      proxy.metadata = { blocksInteraction: true, interactionId: interaction?.id };
      this.solids.push(proxy);
      proxy.visibility=0;
      if(!placement && !collider.id.startsWith('wall-OBSERVATION-N')){
        const visible=proxy.clone(`GREYBOX:${collider.id}`)!;
        visible.parent=this.visuals.environment; visible.visibility=1; visible.checkCollisions=false; visible.isPickable=false; visible.receiveShadows=true;
      }
    }
    for (const p of PLACEMENTS) this.visuals.create(p);
    for (const d of DOORS) {
      const b = doorBlocker(d);
      const leaf = this.box(`door:${d.id}`, b.w, 2.5, b.d, b.x, 1.25, b.z, this.material(`door-mat:${d.id}`, '#685D50'));
      leaf.rotation.y = d.yaw; leaf.checkCollisions = true; leaf.isPickable = true;
      leaf.metadata = { blocksInteraction: true, interactionId: `door-${d.id}` };
      leaf.visibility=0;
      this.visuals.create({id:`door-visual:${d.id}`,model:'door',zone:'HUB',x:d.x,y:0,z:d.z,yaw:d.yaw,height:2.5,shadow:false,colliders:[b]});
      this.leaves.set(d.id, leaf); this.solids.push(leaf);
    }
    for (const i of INTERACTABLES.filter(i => i.kind !== 'door')) {
      const p = PLACEMENTS.find(p => p.id === i.target)!;
      const proxy = this.box(`interaction:${i.id}`, i.kind === 'exhibit' ? 2.4 : 0.95, 1.7,
        i.kind === 'exhibit' ? 2.4 : 0.65, p.x, 0.85, p.z, wall);
      proxy.rotation.y = p.yaw; proxy.visibility = 0; proxy.isPickable = true;
      proxy.metadata = { interactionId: i.id, blocksInteraction: true };
      if (i.kind === 'puzzle') this.label(`label:${i.id}`, i.label, 'GREYBOX · E TO INSPECT', p.x, 1.5, p.z, p.yaw, 1.2, 0.3);
    }
    for (const s of SIGNS) this.label(s.id, s.text, s.sub ?? '', s.x, s.y, s.z, s.yaw, s.w, s.h);
    for (const [id, guide] of Object.entries(GUIDES)) {
      const mat = this.material(`guide:${id}`, guide.color); mat.emissiveColor = Color3.FromHexString(guide.color).scale(0.6);
      const pieces: Mesh[] = [];
      for (let i = 1; i < guide.path.length; i++) {
        const a = guide.path[i - 1]!; const b = guide.path[i]!;
        const mesh = this.box(`guide:${id}:${i}`, 0.055, 0.012, Math.hypot(b[0]-a[0],b[1]-a[1]), (a[0]+b[0])/2,0.012,(a[1]+b[1])/2,mat);
        mesh.rotation.y = Math.atan2(b[0]-a[0],b[1]-a[1]); pieces.push(mesh);
      }
      this.guides.set(id,pieces);
    }
    this.ambient = new HemisphericLight('PROVISIONAL-ambient',new Vector3(0,1,0),scene); this.ambient.intensity = 0.45;
    this.fill = new PointLight('PROVISIONAL-zone-fill',new Vector3(0,2.9,-5),scene); this.fill.intensity = 1.2;
    this.accent = new SpotLight('PROVISIONAL-zone-shadow',new Vector3(0,3,-6),new Vector3(0,-1,0.2),1.4,2,scene);
    this.accent.intensity = 3;
    this.shadow = new ShadowGenerator(1024,this.accent); this.shadow.bias = 0.002; this.shadow.normalBias = 0.03;
    this.shadow.usePoissonSampling = true;
    this.rescue=new ObservationRescue(scene,this.visuals);
    // Temporary damage stays outside walkable routes and never changes collision.
    for(let i=0;i<5;i++){const panel=this.box(`GREYBOX-damaged-panel-${i}`,.8,.09,1.2,i%2?2.3:-2.3,.12,-6+i*.7,wall);panel.rotation.set(.08*i,.4*i,.12);panel.parent=this.visuals.environment;}
    this.setZone('AIRLOCK');
  }
  private material(name:string,hex:string):StandardMaterial {
    const m = new StandardMaterial(name,this.scene); m.diffuseColor = Color3.FromHexString(hex); m.specularColor.setAll(0.05);m.maxSimultaneousLights=6; return m;
  }
  private box(name:string,w:number,h:number,d:number,x:number,y:number,z:number,material:StandardMaterial):Mesh {
    const m = MeshBuilder.CreateBox(name,{width:w,height:h,depth:d},this.scene); m.position.set(x,y,z); m.material=material; m.isPickable=false; return m;
  }
  private label(id:string,text:string,sub:string,x:number,y:number,z:number,yaw:number,w:number,h:number):void {
    const texture = new DynamicTexture(id,{width:1024,height:256},this.scene,false);
    const ctx = texture.getContext() as CanvasRenderingContext2D; ctx.fillStyle='#101820'; ctx.fillRect(0,0,1024,256);
    ctx.textAlign='center'; ctx.fillStyle='#DFE7EB'; ctx.font='bold 48px sans-serif'; ctx.fillText(text,512,100,980);
    ctx.fillStyle='#A9C3CD'; ctx.font='28px sans-serif'; ctx.fillText(sub,512,170,980); texture.update();
    const material=new StandardMaterial(`${id}-mat`,this.scene); material.diffuseTexture=texture; material.emissiveTexture=texture; material.disableLighting=true; material.backFaceCulling=true;
    const mesh=MeshBuilder.CreatePlane(id,{width:w,height:h},this.scene); mesh.position.set(x,y,z); mesh.rotation.y=yaw+Math.PI; mesh.material=material; mesh.isPickable=false;
  }
  async loadVisuals(warn:(text:string)=>void):Promise<void> {
    try { await this.visuals.replace(await readVisualManifest(),warn); await this.art.finalize(); this.currentZone=null; this.setZone('AIRLOCK'); if(this.projection)this.sync(this.projection); }
    catch { warn('Visual configuration unavailable. Provisional geometry remains playable.'); }
  }
  sync(projection:WorldProjection):void {
    this.projection=projection;
    for (const [id,leaf] of this.leaves) {
      const open=projection.doors[id]; leaf.checkCollisions=!open;
      leaf.setEnabled(!open); this.visuals.setDoorOpen(`door-visual:${id}`,open); // Logical opening cannot depend on an animation callback.
    }
    for (const [id,pieces] of this.guides) for (const m of pieces) m.setEnabled(id===projection.guide);
    this.art.sync(projection);
    this.applyLight();
  }
  configure(settings:Settings):void {
    if (settings.quality!==this.settings?.quality) {
      this.shadow.dispose(); this.shadow=new ShadowGenerator(settings.quality==='low'?512:1024,this.accent);
      this.shadow.bias=0.002; this.shadow.normalBias=0.03; this.shadow.usePoissonSampling=true; this.currentZone=null;
    }
    this.settings={...settings}; this.art.configure(settings); this.applyLight();
  }
  private applyLight():void {
    const brightness=this.settings?.brightness ?? 1;
    this.ambient.intensity=this.powerMultiplier*(this.projection?.lightProfile==='DARK'?0.30:0.48)*brightness;
    this.fill.intensity=1.2*brightness*this.powerMultiplier; this.accent.intensity=3*brightness*this.powerMultiplier;
    if (this.projection?.lightProfile==='PRESERVED') this.fill.diffuse=Color3.FromHexString('#D8C6A5');
    if (this.art.active) this.art.light(this.powerMultiplier,this.ambient,this.fill,this.accent);
  }
  power(multiplier:number):void{this.powerMultiplier=multiplier;this.applyLight();}
  setZone(zone:ZoneId):void {
    if (zone===this.currentZone) return; this.currentZone=zone;
    const light=ZONE_LIGHTS[zone]; const a=light.accent;
    this.fill.position.set(light.fill.x,light.fill.y,light.fill.z); this.fill.diffuse=Color3.FromHexString(light.fill.color); this.fill.range=light.fill.range;
    this.accent.position.copyFrom(Vector3.FromArray(a.from)); this.accent.direction=Vector3.FromArray(a.to).subtract(this.accent.position).normalize(); this.accent.angle=a.angle; this.accent.range=a.range;
    const casters:AbstractMesh[]=[];
    for (const p of PLACEMENTS) if (p.zone===zone && p.shadow) casters.push(...(this.visuals.anchors.get(p.id)?.getChildMeshes() ?? []));
    this.shadow.getShadowMap()!.renderList=casters.filter(m=>!m.isDisposed()).slice(0,20);
    this.applyLight();
  }
  update(x:number,z:number,time:number,reduced:boolean):ZoneId {
    const zone=zoneAt(x,z) ?? 'AIRLOCK'; this.setZone(zone);
    this.art.update(time,x,z,reduced);
    const arm=this.visuals.anchors.get('hub-arm');
    if (arm) arm.rotation.y=reduced ? 0 : Math.sin(time*0.15)*0.15;
    return zone;
  }
  focused(camera:import('@babylonjs/core').Camera):InteractableDef|null {
    const hit=this.scene.pickWithRay(camera.getForwardRay(2.2),m=>!!m.metadata?.blocksInteraction);
    return hit?.hit ? INTERACTABLES.find(i=>i.id===hit.pickedMesh?.metadata?.interactionId) ?? null : null;
  }
}
