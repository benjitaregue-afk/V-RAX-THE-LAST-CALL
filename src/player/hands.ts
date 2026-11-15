// Temporary first-person embodiment, not final production art. Claude can replace this
// viewmodel with an animated GLB without changing interactions or story progression.
import {
  AnimationGroup, AssetContainer, Camera, Color3, MeshBuilder, Scene,
  StandardMaterial, TransformNode, Vector3,
} from '@babylonjs/core';

export const HAND_ANIMATIONS = ['Awaken', 'StandUp', 'Idle', 'Reach', 'PressTerminal', 'OperateSwitch', 'OperateDoor'] as const;
export type HandAnimation = (typeof HAND_ANIMATIONS)[number];
export const HAND_ASSET_PATH = 'assets/models/player-hands.glb';
/** Seconds. Clip completion is only visual: no gameplay event depends on it. */
export const HAND_DURATIONS: Readonly<Record<HandAnimation, number>> = Object.freeze({
  Awaken: 3.2, StandUp: 3, Idle: 1.8, Reach: 0.72, PressTerminal: 0.9, OperateSwitch: 1.1, OperateDoor: 0.8,
});

type Triple = readonly [number, number, number];
export interface HandPose {
  position: Triple;
  rotation: Triple;
  /** Zero = straight fingers; one = lightly curled grip. */
  curl: number;
}
export interface FirstPersonPose { left: HandPose; right: HandPose }
interface KeyPose extends FirstPersonPose { at: number }

const idle: FirstPersonPose = {
  left: { position: [-0.23, -0.32, 0.48], rotation: [-0.12, -0.12, -0.12], curl: 0.2 },
  right: { position: [0.23, -0.32, 0.48], rotation: [-0.12, 0.12, 0.12], curl: 0.2 },
};
const frame = (at: number, left: HandPose, right: HandPose): KeyPose => ({ at, left, right });
const pose = (position: Triple, rotation: Triple, curl = 0.2): HandPose => ({ position, rotation, curl });
const CLIPS: Readonly<Record<Exclude<HandAnimation, 'Idle'>, readonly KeyPose[]>> = {
  // The raised right palm enters the dark view first; the left finds support below it.
  Awaken: [
    frame(0, pose([-0.27, -0.62, 0.42], [0.55, -0.25, -0.55], 0.5), pose([0.24, -0.58, 0.4], [0.5, 0.3, 0.4], 0.5)),
    frame(0.32, pose([-0.27, -0.22, 0.55], [0.4, -0.15, -0.3], 0.35), pose([0.18, -0.18, 0.52], [0.85, 0.35, 0.2], 0.08)),
    frame(0.66, pose([-0.28, -0.1, 0.64], [0.9, -0.16, -0.15], 0.02), pose([0.15, -0.06, 0.54], [1.1, 0.32, 0.12], 0.02)),
    frame(1, pose([-0.28, -0.09, 0.7], [1.3, -0.05, -0.1], 0), pose([0.26, -0.08, 0.65], [0.75, 0.2, 0.14], 0.08)),
  ],
  // Keep support palms above the lower caption panel while the camera rises.
  // These camera-space gestures are provisional; the final rig supplies floor contact.
  StandUp: [
    frame(0, pose([-0.28, -0.09, 0.7], [1.3, -0.05, -0.1], 0), pose([0.26, -0.08, 0.65], [0.75, 0.2, 0.14], 0.08)),
    frame(0.28, pose([-0.3, -0.08, 0.7], [1.45, 0, -0.1], 0), pose([0.3, -0.07, 0.7], [1.4, 0, 0.1], 0)),
    frame(0.63, pose([-0.32, -0.19, 0.6], [0.65, -0.2, -0.2], 0.12), pose([0.32, -0.18, 0.6], [0.65, 0.2, 0.2], 0.12)),
    frame(1, idle.left, idle.right),
  ],
  Reach: [
    frame(0, idle.left, idle.right),
    frame(0.5, idle.left, pose([0.12, -0.16, 0.72], [0.05, -0.12, 0.03], 0.04)),
    frame(0.76, idle.left, pose([0.1, -0.14, 0.74], [0.15, -0.12, 0.03], 0.12)),
    frame(1, idle.left, idle.right),
  ],
  PressTerminal: [
    frame(0, idle.left, idle.right),
    frame(0.42, idle.left, pose([0.07, -0.14, 0.71], [0.08, -0.08, 0], 0.6)),
    frame(0.58, idle.left, pose([0.07, -0.12, 0.77], [0.16, -0.08, 0], 0.6)),
    frame(0.72, idle.left, pose([0.07, -0.14, 0.7], [0.08, -0.08, 0], 0.6)),
    frame(1, idle.left, idle.right),
  ],
  OperateSwitch: [
    frame(0, idle.left, idle.right),
    frame(0.35, idle.left, pose([0.09, -0.13, 0.71], [0.25, -0.15, 0.12], 0.75)),
    frame(0.64, idle.left, pose([0.09, -0.3, 0.7], [-0.1, -0.15, 0.12], 0.8)),
    frame(1, idle.left, idle.right),
  ],
  OperateDoor: [
    frame(0, idle.left, idle.right),
    frame(0.45, idle.left, pose([0.16, -0.1, 0.72], [0.28, 0.08, 0.08], 0.06)),
    frame(0.65, idle.left, pose([0.16, -0.1, 0.77], [0.4, 0.08, 0.08], 0.06)),
    frame(1, idle.left, idle.right),
  ],
};

const mix = (a: number, b: number, t: number): number => a + (b - a) * t;
function blendHand(a: HandPose, b: HandPose, t: number): HandPose {
  return {
    position: [mix(a.position[0], b.position[0], t), mix(a.position[1], b.position[1], t), mix(a.position[2], b.position[2], t)],
    rotation: [mix(a.rotation[0], b.rotation[0], t), mix(a.rotation[1], b.rotation[1], t), mix(a.rotation[2], b.rotation[2], t)],
    curl: mix(a.curl, b.curl, t),
  };
}
/** Pure pose sampler: normalized clip time is deterministic and safe at its boundaries. */
export function sampleHandPose(name: HandAnimation, seconds: number): FirstPersonPose {
  const time = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  if (name === 'Idle') {
    const lift = Math.sin(time / HAND_DURATIONS.Idle * Math.PI * 2) * 0.004;
    return {
      left: { ...idle.left, position: [idle.left.position[0], idle.left.position[1] + lift, idle.left.position[2]] },
      right: { ...idle.right, position: [idle.right.position[0], idle.right.position[1] - lift, idle.right.position[2]] },
    };
  }
  const keys = CLIPS[name];
  const t = Math.min(1, time / HAND_DURATIONS[name]);
  if (t === 0) return { left: keys[0]!.left, right: keys[0]!.right };
  if (t === 1) return { left: keys[keys.length - 1]!.left, right: keys[keys.length - 1]!.right };
  let a = keys[0]!; let b = keys[keys.length - 1]!;
  for (let i = 1; i < keys.length; i++) if (t <= keys[i]!.at) { a = keys[i - 1]!; b = keys[i]!; break; }
  const linear = Math.max(0, Math.min(1, (t - a.at) / (b.at - a.at)));
  const smooth = linear * linear * (3 - 2 * linear);
  return { left: blendHand(a.left, b.left, smooth), right: blendHand(a.right, b.right, smooth) };
}

/** Deliberately a single local path; viewmodel assets may not load remote scripts/URLs. */
export function isHandAssetPath(path: unknown): path is typeof HAND_ASSET_PATH { return path === HAND_ASSET_PATH; }

export class FirstPersonHands {
  readonly root: TransformNode;
  private readonly greyRoot: TransformNode;
  private readonly assetRoot: TransformNode;
  private readonly palms: TransformNode[] = [];
  private readonly fingers: TransformNode[][] = [];
  private readonly material: StandardMaterial;
  private animation: HandAnimation = 'Idle';
  private elapsed = 0;
  private groups: AnimationGroup[] = [];
  private activeGroup: AnimationGroup | null = null;
  private container: AssetContainer | null = null;
  private disposed = false;
  private loadSerial = 0;
  private assetReady = false;

  constructor(camera: Camera, private readonly scene: Scene) {
    this.root = new TransformNode('fp-hands-root', scene);
    this.root.parent = camera;
    this.root.metadata = { provisional: true, assetPath: null, animation: 'Idle' };
    this.greyRoot = new TransformNode('fp-hands-greybox', scene); this.greyRoot.parent = this.root;
    this.assetRoot = new TransformNode('fp-hands-production', scene); this.assetRoot.parent = this.root;
    this.assetRoot.setEnabled(false);
    this.material = new StandardMaterial('PROVISIONAL-hand-grey', scene);
    this.material.diffuseColor = Color3.FromHexString('#879198');
    this.material.emissiveColor = Color3.FromHexString('#2C3338');
    this.material.specularColor.setAll(0.04);
    scene.setRenderingAutoClearDepthStencil(2, true, true, true);
    for (const side of [-1, 1]) this.buildHand(side);
    this.applyPose(sampleHandPose('Idle', 0));
  }

  get animationName(): HandAnimation { return this.animation; }
  get usingProductionAsset(): boolean { return this.assetRoot.isEnabled() && this.assetReady; }

  private buildHand(side: number): void {
    const sideName = side < 0 ? 'L' : 'R';
    const palm = new TransformNode(`hand_${sideName}`, this.scene); palm.parent = this.greyRoot;
    this.palms.push(palm);
    const piece = (name: string, width: number, height: number, depth: number, parent: TransformNode, x: number, y: number, z: number): void => {
      const m = MeshBuilder.CreateBox(`GREYBOX-hand-${sideName}-${name}`, { width, height, depth }, this.scene);
      m.parent = parent; m.position.set(x, y, z); m.material = this.material;
      m.isPickable = false; m.checkCollisions = false; m.renderingGroupId = 2;
      m.metadata = { provisional: true, firstPersonViewmodel: true };
    };
    piece('forearm', 0.065, 0.045, 0.24, palm, 0, 0, -0.16);
    piece('palm', 0.09, 0.033, 0.11, palm, 0, 0, 0);
    const fingers: TransformNode[] = [];
    for (let i = 0; i < 4; i++) {
      const joint = new TransformNode(`finger_${sideName}_${i}`, this.scene); joint.parent = palm;
      joint.position.set((i - 1.5) * 0.021, 0, 0.05);
      piece(`finger-${i}`, 0.016, 0.024, i === 0 || i === 3 ? 0.075 : 0.09, joint, 0, 0, 0.035);
      fingers.push(joint);
    }
    const thumb = new TransformNode(`thumb_${sideName}`, this.scene); thumb.parent = palm;
    thumb.position.set(-side * 0.055, 0, 0.005); thumb.rotation.y = -side * 0.65;
    piece('thumb', 0.022, 0.026, 0.06, thumb, 0, 0, 0.02); fingers.push(thumb);
    this.fingers.push(fingers);
  }

  play(name: HandAnimation): void {
    if (this.disposed) return;
    this.animation = name; this.elapsed = 0; this.root.metadata.animation = name;
    for (const group of this.groups) group.stop(true);
    this.activeGroup = this.groups.find((group) => group.name === name) ?? null;
    const production = this.assetReady && (this.activeGroup !== null || name === 'Idle');
    this.assetRoot.setEnabled(production); this.greyRoot.setEnabled(!production);
    if (this.activeGroup) {
      // Sample through update(), so pausing the game also freezes the viewmodel.
      this.activeGroup.start(name === 'Idle', 1); this.activeGroup.pause();
      this.activeGroup.goToFrame(this.activeGroup.from);
    }
    this.applyPose(sampleHandPose(name, 0));
  }

  update(dt: number): void {
    if (this.disposed) return;
    if (Number.isFinite(dt) && dt > 0) this.elapsed += Math.min(dt, 0.25);
    const duration = HAND_DURATIONS[this.animation];
    if (this.animation !== 'Idle' && this.elapsed >= duration) { this.play('Idle'); return; }
    this.applyPose(sampleHandPose(this.animation, this.elapsed));
    if (this.activeGroup) {
      const progress = this.animation === 'Idle' ? (this.elapsed % duration) / duration : Math.min(1, this.elapsed / duration);
      this.activeGroup.goToFrame(this.activeGroup.from + (this.activeGroup.to - this.activeGroup.from) * progress);
    }
  }

  private applyPose(value: FirstPersonPose): void {
    [value.left, value.right].forEach((hand, index) => {
      this.palms[index]!.position.copyFrom(Vector3.FromArray(hand.position));
      this.palms[index]!.rotation.copyFrom(Vector3.FromArray(hand.rotation));
      this.fingers[index]!.forEach((joint, finger) => {
        // Leave the index finger extended while pressing a console.
        joint.rotation.x = this.animation === 'PressTerminal' && index === 1 && finger === 1 ? 0 : hand.curl * 0.95;
      });
    });
  }

  setVisible(visible: boolean): void { if (!this.disposed) this.root.setEnabled(visible); }

  async loadAsset(path?: string): Promise<void> {
    if (path === undefined || this.disposed) return;
    if (!isHandAssetPath(path)) throw new Error(`Hands asset must be the local ${HAND_ASSET_PATH}`);
    const serial = ++this.loadSerial;
    await import('@babylonjs/loaders/glTF');
    const { LoadAssetContainerAsync } = await import('@babylonjs/core/Loading/sceneLoader');
    const container = await LoadAssetContainerAsync(`${import.meta.env.BASE_URL}${path}`, this.scene);
    if (this.disposed || serial !== this.loadSerial) { container.dispose(); return; }
    for (const group of this.groups) group.dispose();
    for (const node of this.assetRoot.getChildren()) node.dispose();
    this.container?.dispose();
    this.container = container;
    const instance = container.instantiateModelsToScene((name) => name);
    for (const node of instance.rootNodes) node.parent = this.assetRoot;
    for (const mesh of this.assetRoot.getChildMeshes()) {
      mesh.isPickable = false; mesh.checkCollisions = false; mesh.renderingGroupId = 2;
      mesh.metadata = { ...mesh.metadata, firstPersonViewmodel: true };
    }
    this.groups = instance.animationGroups;
    this.assetReady = true;
    this.root.metadata.assetPath = path; this.root.metadata.provisional = false;
    this.play(this.animation);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; ++this.loadSerial;
    for (const group of this.groups) group.dispose();
    this.root.dispose(); this.container?.dispose(); this.material.dispose();
  }
}
