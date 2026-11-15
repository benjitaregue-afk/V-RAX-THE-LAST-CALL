// Fictional, provisional Rescue One. Visual replacement never controls progression.
import {Scene,MeshBuilder,StandardMaterial,Color3,Vector3,SpotLight,Matrix,Quaternion,Mesh,Constants,VertexBuffer} from '@babylonjs/core';
import type {TransformNode} from '@babylonjs/core';
import {VisualLibrary} from './visuals';
const smooth=(value:number):number=>{const t=Math.max(0,Math.min(1,value));return t*t*(3-2*t);};
export class ObservationRescue {
  readonly ship:TransformNode;
  readonly searchlight:SpotLight;
  elapsed=0;
  active=false;
  scatterEndZ=30.35;
  private beam:Mesh;
  private tracking=0;
  private whiteout:number|null=null;
  private whiteoutIntensity=0;
  private whiteoutTracking=0;
  constructor(scene:Scene,visuals:VisualLibrary){
    const glass=new StandardMaterial('PROVISIONAL-observation-glass',scene);glass.diffuseColor=new Color3(.12,.2,.27);glass.alpha=.1;glass.specularColor.setAll(.1);glass.backFaceCulling=false;
    const window=MeshBuilder.CreatePlane('observation-window',{width:10.5,height:2.55},scene);window.position.set(0,1.65,29.98);window.material=glass;window.isPickable=false;
    const stars=new StandardMaterial('PROVISIONAL-stars',scene);stars.emissiveColor.setAll(.8);stars.disableLighting=true;
    const star=MeshBuilder.CreateSphere('space-star',{diameter:.08,segments:4},scene);star.material=stars;star.isPickable=false;star.applyFog=false;
    let seed=216;const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
    const matrices=new Float32Array(80*16);
    for(let i=0;i<80;i++)Matrix.Translation((random()-.5)*65,(random()-.5)*35,42+random()*35).copyToArray(matrices,i*16);
    star.thinInstanceSetBuffer('matrix',matrices,16,true);
    visuals.create({id:'rescue-one',model:'rescue',zone:'OBSERVATION',x:8,y:4,z:60,yaw:Math.PI,height:2,shadow:false,colliders:[{id:'rescue-envelope',x:0,z:0,w:3,d:6,yaw:0}]});
    this.ship=visuals.anchors.get('rescue-one')!;
    for(const side of [-1,1]){
      const wing=MeshBuilder.CreateBox(`GREYBOX-rescue-wing-${side}`,{width:3,height:.2,depth:2.5},scene);wing.parent=this.ship;wing.position.set(side*2,1,.3);wing.material=visuals.greyMaterial;wing.isPickable=false;
    }
    const hull=new StandardMaterial('PROVISIONAL-rescue-visible-hull',scene);hull.diffuseColor=Color3.FromHexString('#A4AEB7');hull.emissiveColor=Color3.FromHexString('#425063');
    for(const mesh of this.ship.getChildMeshes()){mesh.applyFog=false;mesh.material=hull;}
    const lensMaterial=new StandardMaterial('PROVISIONAL-searchlight-lens',scene);lensMaterial.emissiveColor=new Color3(1,.94,.7);lensMaterial.disableLighting=true;
    const lens=MeshBuilder.CreateSphere('rescue-searchlight-lens',{diameter:.55,segments:8},scene);lens.parent=this.ship;lens.position.set(0,.8,2.5);lens.material=lensMaterial;lens.isPickable=false;lens.applyFog=false;
    const beamMaterial=new StandardMaterial('PROVISIONAL-searchlight-scatter',scene);beamMaterial.emissiveColor=new Color3(1,.9,.6);beamMaterial.disableLighting=true;beamMaterial.alpha=.025;beamMaterial.backFaceCulling=false;beamMaterial.alphaMode=Constants.ALPHA_ADD;beamMaterial.disableDepthWrite=true;
    this.beam=MeshBuilder.CreateCylinder('PROVISIONAL-rescue-light-cone',{height:1,diameterTop:.12,diameterBottom:3.2,tessellation:16,cap:0},scene);this.beam.material=beamMaterial;this.beam.isPickable=false;this.beam.applyFog=false;this.beam.setEnabled(false);
    // Fade smoothly to zero at the wide end instead of exposing the cone's cutoff ring.
    const beamPositions=this.beam.getVerticesData(VertexBuffer.PositionKind)!;
    const beamColors=new Float32Array(beamPositions.length/3*4);
    for(let i=0,j=0;i<beamPositions.length;i+=3,j+=4){beamColors[j]=beamColors[j+1]=beamColors[j+2]=1;beamColors[j+3]=Math.max(0,Math.min(1,beamPositions[i+1]!+.5));}
    this.beam.setVerticesData(VertexBuffer.ColorKind,beamColors);this.beam.useVertexColors=true;this.beam.hasVertexAlpha=true;
    this.ship.setEnabled(false);
    this.searchlight=new SpotLight('RescueOne-searchlight',new Vector3(0,3,40),new Vector3(0,0,-1),.48,5,scene);
    this.searchlight.intensity=0;this.searchlight.range=60;this.searchlight.diffuse=new Color3(1,.93,.76);this.searchlight.renderPriority=10;
  }
  start():void{
    this.elapsed=0;this.tracking=0;this.whiteout=null;this.active=true;
    this.ship.position.set(8,4,60);this.ship.setEnabled(true);this.beam.setEnabled(false);
    this.searchlight.position.copyFrom(this.ship.position).addInPlace(new Vector3(0,.8,-2.5));this.searchlight.intensity=0;
  }
  beginWhiteout():void{this.whiteout=0;this.whiteoutIntensity=this.searchlight.intensity;this.whiteoutTracking=this.tracking;}
  setWhiteout(progress:number):void{if(this.whiteout===null)this.beginWhiteout();this.whiteout=Math.max(0,Math.min(1,Number.isFinite(progress)?progress:0));}
  update(dt:number,target:Vector3,calm=false):void{
    if(!this.active)return;this.elapsed+=dt;
    const t=Math.min(1,this.elapsed/5);const ease=t*t*(3-2*t);
    this.ship.position.set(8*(1-ease),4-1.5*ease,60-20*ease);
    this.searchlight.position.copyFrom(this.ship.position).addInPlace(new Vector3(0,.8,-2.5));
    // A single slow search sweep settles onto the survivor; calm mode tracks steadily.
    this.tracking=calm?1:this.whiteout===null?smooth((this.elapsed-.4)/3.8):this.whiteoutTracking+(1-this.whiteoutTracking)*smooth(this.whiteout);
    const aim=target.add(new Vector3(-4*(1-this.tracking),1.2*(1-this.tracking),0));
    this.searchlight.direction.copyFrom(aim.subtract(this.searchlight.position).normalize());
    this.searchlight.intensity=this.whiteout===null?8*smooth(this.elapsed/4):this.whiteoutIntensity+(12-this.whiteoutIntensity)*this.whiteout;
    // Keep the scatter outside the window; the actual spotlight still tracks the player.
    const ray=aim.subtract(this.searchlight.position);
    if(ray.z>=-1e-6){this.beam.setEnabled(false);return;}
    const fraction=Math.max(0,Math.min(1,(30.35-this.searchlight.position.z)/ray.z));
    const beamEnd=this.searchlight.position.add(ray.scale(fraction));
    this.scatterEndZ=beamEnd.z;this.beam.setEnabled(true);
    const axis=this.searchlight.position.subtract(beamEnd);const length=axis.length();axis.normalize();
    const cross=Vector3.Cross(Vector3.Up(),axis);const angle=Math.acos(Math.max(-1,Math.min(1,Vector3.Dot(Vector3.Up(),axis))));
    this.beam.rotationQuaternion=Quaternion.RotationAxis(cross.normalize(),angle);this.beam.scaling.y=length;
    this.beam.position.copyFrom(this.searchlight.position.add(beamEnd).scale(.5));
  }
  reset():void{this.active=false;this.elapsed=0;this.whiteout=null;this.tracking=0;this.ship.position.set(8,4,60);this.ship.setEnabled(false);this.searchlight.intensity=0;this.beam.setEnabled(false);}
}
