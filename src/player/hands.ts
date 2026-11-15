// Authored first-person embodiment. Imported joint animation stays visual-only;
// a missing model keeps the original procedural recovery path playable.
import {
  Animation, AnimationGroup, AssetContainer, Camera, Color3, InstancedMesh, MeshBuilder, PBRMaterial, PointLight, Quaternion, Scene,
  StandardMaterial, TransformNode, Vector3,
} from '@babylonjs/core';

export const HAND_ANIMATIONS = ['Awaken', 'StandUp', 'Idle', 'Reach', 'PressTerminal', 'OperateSwitch', 'OperateDoor', 'Walk', 'Sprint', 'Inspect'] as const;
export type HandAnimation = (typeof HAND_ANIMATIONS)[number];
export const HAND_ASSET_PATH = 'assets/models/player-hands.glb';
/** Seconds. Clip completion is only visual: no gameplay event depends on it. */
export const HAND_DURATIONS: Readonly<Record<HandAnimation, number>> = Object.freeze({
  Awaken: 3.2, StandUp: 3, Idle: 1.8, Reach: 0.72, PressTerminal: 0.9, OperateSwitch: 1.1, OperateDoor: 0.8, Walk: 1.12, Sprint: 0.72, Inspect: 1.4,
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
const CLIPS: Readonly<Record<Exclude<HandAnimation, 'Idle' | 'Walk' | 'Sprint'>, readonly KeyPose[]>> = {
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
  Inspect: [
    frame(0, idle.left, idle.right),
    frame(0.18, idle.left, pose([0.26, -0.34, 0.45], [-0.16, 0.22, 0.16], 0.3)),
    frame(0.5, idle.left, pose([0.13, -0.12, 0.66], [0.18, -0.2, -0.12], 0.12)),
    frame(0.72, idle.left, pose([0.13, -0.12, 0.66], [0.22, -0.1, 0.02], 0.15)),
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
  if (isLoop(name)) {
    const phase = time / HAND_DURATIONS[name] * Math.PI * 2;
    const lift = Math.sin(phase) * (name === 'Sprint' ? 0.019 : name === 'Walk' ? 0.009 : 0.004);
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


type LoopAnimation = 'Idle' | 'Walk' | 'Sprint';
function isLoop(name: HandAnimation): name is LoopAnimation { return name === 'Idle' || name === 'Walk' || name === 'Sprint'; }
const isInteraction = (name: HandAnimation): boolean => ['Reach', 'PressTerminal', 'OperateSwitch', 'OperateDoor', 'Inspect'].includes(name);
const clamp = (n: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, n));
/** Smooth endpoint velocity for authored-pose crossfades. */
export function handBlendWeight(elapsed: number, duration = 0.18): number {
  const t = clamp(Number.isFinite(elapsed) ? elapsed / duration : 0, 0, 1);
  return t * t * (3 - 2 * t);
}
/** Small camera-space guidance; an interaction never stretches an arm to a remote target. */
export function handTargetBias(local: Vector3 | null, envelope: number): { position: Vector3; rotation: Vector3 } {
  if (!local || ![local.x, local.y, local.z].every(Number.isFinite) || local.z <= 0.05) return { position: Vector3.Zero(), rotation: Vector3.Zero() };
  const w = clamp(envelope, 0, 1);
  return {
    position: new Vector3(clamp(local.x * 0.08, -0.07, 0.07) * w, clamp(local.y * 0.08, -0.05, 0.05) * w, clamp((local.z - 0.75) * 0.025, -0.015, 0.035) * w),
    rotation: new Vector3(clamp(-Math.atan2(local.y, local.z) * 0.24, -0.13, 0.13) * w, clamp(Math.atan2(local.x, local.z) * 0.28, -0.18, 0.18) * w, 0),
  };
}

type PoseValue = number | Vector3 | Quaternion;
interface Channel { target: Record<string, unknown>; property: string; rest: PoseValue }
interface Track { channel: Channel; animation: Animation }
type AuthoredPose = Map<Channel, PoseValue>;
interface Transition { name: HandAnimation; group: AnimationGroup | null; elapsed: number; clock: number; fallback: FirstPersonPose }
const copyValue = (value: PoseValue): PoseValue => typeof value === 'number' ? value : value.clone();
function blendValue(a: PoseValue, b: PoseValue, t: number): PoseValue {
  if (typeof a === 'number' && typeof b === 'number') return mix(a, b, t);
  if (a instanceof Quaternion && b instanceof Quaternion) return Quaternion.Slerp(a, b, t);
  if (a instanceof Vector3 && b instanceof Vector3) return Vector3.Lerp(a, b, t);
  return copyValue(b);
}

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
  private channels: Channel[] = [];
  private tracks = new Map<AnimationGroup, Track[]>();
  private transition: Transition | null = null;
  private fallbackPose = sampleHandPose('Idle', 0);
  private locomotion: LoopAnimation = 'Idle';
  private reduced = false;
  private motionAmount = 1;
  private target: Vector3 | null = null;
  private clearance = Infinity;
  private nearWall = 0;
  private container: AssetContainer | null = null;
  private disposed = false;
  private loadSerial = 0;
  private assetReady = false;
  private handLights: PointLight[] = [];
  private litMeshes: import('@babylonjs/core').AbstractMesh[] = [];
  private removeLightObserver: () => void = () => {};

  constructor(private readonly camera: Camera, private readonly scene: Scene) {
    this.root = new TransformNode('fp-hands-root', scene);
    this.root.parent = camera;
    this.root.metadata = { provisional: true, assetPath: null, animation: 'Idle', blend: 1 };
    this.greyRoot = new TransformNode('fp-hands-greybox', scene); this.greyRoot.parent = this.root;
    this.assetRoot = new TransformNode('fp-hands-production', scene); this.assetRoot.parent = this.root;
    this.assetRoot.setEnabled(false);
    this.material = new StandardMaterial('PROVISIONAL-hand-grey', scene);
    this.material.diffuseColor = Color3.FromHexString('#879198');
    this.material.emissiveColor = Color3.FromHexString('#2C3338');
    this.material.specularColor.setAll(0.04);
    scene.setRenderingAutoClearDepthStencil(2, true, true, true);
    for (const side of [-1, 1]) this.buildHand(side);
    this.applyPose(this.fallbackPose);
    const observer = scene.onNewLightAddedObservable.add((light) => {
      if (!light.name.startsWith('fp-hands-') && this.litMeshes.length) light.excludedMeshes.push(...this.litMeshes);
    });
    this.removeLightObserver = () => { scene.onNewLightAddedObservable.remove(observer); };
  }

  get animationName(): HandAnimation { return this.animation; }
  get usingProductionAsset(): boolean { return this.assetRoot.isEnabled() && this.assetReady; }
  get blendProgress(): number { return this.transition ? handBlendWeight(this.transition.clock) : 1; }
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

  setMotion(speed: number, sprinting: boolean, reduced: boolean): void {
    if (this.disposed) return;
    this.reduced = reduced;
    const moving = Number.isFinite(speed) && speed > (this.locomotion === 'Idle' ? 0.15 : 0.08);
    const desired: LoopAnimation = moving ? sprinting ? 'Sprint' : 'Walk' : 'Idle';
    this.locomotion = desired;
    if (isLoop(this.animation) && desired !== this.animation) this.play(desired);
  }

  setClearance(distance: number): void {
    this.clearance = Number.isFinite(distance) ? Math.max(0, distance) : Infinity;
  }

  setInteractionTarget(worldTarget: Vector3 | null): void {
    if (this.disposed) return;
    this.target = worldTarget ? Vector3.TransformCoordinates(worldTarget, this.camera.getViewMatrix()) : null;
  }

  play(name: HandAnimation): void {
    if (this.disposed || (name === this.animation && isLoop(name))) return;
    this.transition = { name: this.animation, group: this.activeGroup, elapsed: this.elapsed, clock: 0, fallback: this.fallbackPose };
    this.animation = name; this.elapsed = 0; this.root.metadata.animation = name;
    this.activeGroup = this.groups.find((group) => group.name === name) ?? null;
    // An incomplete optional export uses its closest authored gesture, preserving the rig.
    if (this.assetReady && !this.activeGroup) this.activeGroup = this.groups.find((g) => g.name === (name === 'Inspect' ? 'Reach' : 'Idle')) ?? null;
    this.assetRoot.setEnabled(this.assetReady); this.greyRoot.setEnabled(!this.assetReady);
    this.root.metadata.blend = 0;
    this.sampleAndApply(0);
  }

  private sampleGroup(group: AnimationGroup | null, name: HandAnimation, elapsed: number): AuthoredPose {
    const values: AuthoredPose = new Map();
    if (!group) return values;
    const duration = HAND_DURATIONS[name];
    const progress = isLoop(name) ? (elapsed % duration) / duration : clamp(elapsed / duration, 0, 1);
    const at = group.from + (group.to - group.from) * progress;
    for (const { channel, animation } of this.tracks.get(group) ?? []) {
      const value: unknown = animation.evaluate(at);
      if (typeof value === 'number' || value instanceof Vector3 || value instanceof Quaternion) values.set(channel, value);
    }
    return values;
  }

  private sampleAndApply(dt: number): void {
    const incoming = this.sampleGroup(this.activeGroup, this.animation, this.elapsed);
    // Reduced-intensity locomotion keeps the authored rhythm with a smaller excursion.
    const amountGoal = this.reduced ? 0.35 : 1;
    this.motionAmount += (amountGoal - this.motionAmount) * (1 - Math.exp(-dt * 10));
    if (this.animation === 'Walk' || this.animation === 'Sprint') {
      const idleGroup = this.groups.find((g) => g.name === 'Idle') ?? null;
      const resting = this.sampleGroup(idleGroup, 'Idle', this.elapsed);
      for (const channel of this.channels) incoming.set(channel, blendValue(resting.get(channel) ?? channel.rest, incoming.get(channel) ?? channel.rest, this.motionAmount));
    }
    let fallback = sampleHandPose(this.animation, this.elapsed);
    const weight = this.transition ? handBlendWeight(this.transition.clock) : 1;
    const outgoing = this.transition ? this.sampleGroup(this.transition.group, this.transition.name, this.transition.elapsed) : null;
    for (const channel of this.channels) {
      const b = incoming.get(channel) ?? channel.rest;
      const a = outgoing?.get(channel) ?? channel.rest;
      const value = outgoing ? blendValue(a, b, weight) : b;
      const current = channel.target[channel.property];
      if (current instanceof Vector3 && value instanceof Vector3) current.copyFrom(value);
      else if (current instanceof Quaternion && value instanceof Quaternion) current.copyFrom(value);
      else channel.target[channel.property] = copyValue(value);
    }
    if (this.transition) {
      fallback = { left: blendHand(this.transition.fallback.left, fallback.left, weight), right: blendHand(this.transition.fallback.right, fallback.right, weight) };
    }
    this.fallbackPose = fallback;
    this.applyPose(fallback);
    const envelope = isInteraction(this.animation) ? Math.sin(Math.PI * clamp(this.elapsed / HAND_DURATIONS[this.animation], 0, 1)) : 0;
    const bias = handTargetBias(this.target, envelope);
    const wallGoal = isLoop(this.animation) ? clamp((0.75 - this.clearance) / 0.45, 0, 1) : 0;
    this.nearWall += (wallGoal - this.nearWall) * (1 - Math.exp(-dt * 12));
    bias.position.y -= this.nearWall * 0.15;
    bias.position.z -= this.nearWall * 0.32;
    this.assetRoot.position.copyFrom(bias.position); this.assetRoot.rotation.copyFrom(bias.rotation);
    this.greyRoot.position.copyFrom(bias.position); this.greyRoot.rotation.copyFrom(bias.rotation);
    this.root.metadata.nearWall = this.nearWall;
    this.root.metadata.blend = weight;
    this.root.metadata.contextOffset = bias.position.asArray();
  }

  update(dt: number): void {
    if (this.disposed) return;
    const step = Number.isFinite(dt) && dt > 0 ? Math.min(dt, 0.1) : 0;
    this.elapsed += step;
    if (this.transition) { this.transition.clock += step; this.transition.elapsed += step; }
    const duration = HAND_DURATIONS[this.animation];
    if (!isLoop(this.animation) && this.elapsed >= duration) { this.play(this.locomotion); this.target = null; }
    this.sampleAndApply(step);
    if (this.transition && this.transition.clock >= 0.18) this.transition = null;
  }

  private applyPose(value: FirstPersonPose): void {
    [value.left, value.right].forEach((hand, index) => {
      this.palms[index]!.position.copyFrom(Vector3.FromArray(hand.position));
      this.palms[index]!.rotation.copyFrom(Vector3.FromArray(hand.rotation));
      this.fingers[index]!.forEach((joint, finger) => {
        joint.rotation.x = this.animation === 'PressTerminal' && index === 1 && finger === 1 ? 0 : hand.curl * 0.95;
      });
    });
  }

  setVisible(visible: boolean): void {
    if (this.disposed) return;
    this.root.setEnabled(visible);
    for (const light of this.handLights) light.setEnabled(visible && this.assetReady);
  }

  private prepareChannels(): void {
    this.channels = []; this.tracks.clear();
    const channels = new Map<object, Map<string, Channel>>();
    for (const group of this.groups) {
      group.stop(true);
      const tracks: Track[] = [];
      for (const { animation, target } of group.targetedAnimations) {
        // glTF skeleton channels animate local TRS on the joint's transform node.
        const property = animation.targetProperty;
        if (!['position', 'rotationQuaternion', 'scaling', 'rotation'].includes(property)) continue;
        const object = target as Record<string, unknown>;
        const value = object[property];
        if (!(value instanceof Vector3) && !(value instanceof Quaternion) && typeof value !== 'number') continue;
        let properties = channels.get(object);
        if (!properties) { properties = new Map(); channels.set(object, properties); }
        let channel = properties.get(property);
        if (!channel) { channel = { target: object, property, rest: copyValue(value) }; properties.set(property, channel); this.channels.push(channel); }
        tracks.push({ channel, animation });
      }
      this.tracks.set(group, tracks);
    }
  }

  private prepareLighting(): void {
    for (const light of this.handLights) light.dispose();
    const meshes = this.assetRoot.getChildMeshes();
    this.litMeshes = [...new Set(meshes.flatMap((mesh) => mesh instanceof InstancedMesh ? [mesh, mesh.sourceMesh] : [mesh]))];
    for (const mesh of this.litMeshes) {
      mesh.applyFog = false;
      if (mesh.material instanceof PBRMaterial) {
        mesh.material.usePhysicalLightFalloff = false;
        mesh.material.maxSimultaneousLights = 2;
      }
    }
    for (const light of this.scene.lights) light.excludedMeshes.push(...this.litMeshes);
    const key = new PointLight('fp-hands-key', new Vector3(0.25, 0.18, 0.18), this.scene);
    key.parent = this.camera; key.intensity = 6; key.range = 2; key.diffuse = new Color3(0.88, 0.93, 1); key.renderPriority = 100;
    const fill = new PointLight('fp-hands-fill', new Vector3(-0.3, -0.05, 0.15), this.scene);
    fill.parent = this.camera; fill.intensity = 1.2; fill.range = 2; fill.diffuse = new Color3(1, 0.78, 0.56); fill.renderPriority = 99;
    this.handLights = [key, fill];
    for (const light of this.handLights) { light.includedOnlyMeshes = this.litMeshes; light.setEnabled(this.root.isEnabled()); }
  }

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
    this.prepareChannels(); this.prepareLighting();
    this.assetReady = true;
    this.root.metadata.assetPath = path; this.root.metadata.provisional = false;
    this.activeGroup = this.groups.find((g) => g.name === this.animation) ?? this.groups.find((g) => g.name === 'Idle') ?? null;
    this.transition = null;
    this.assetRoot.setEnabled(true); this.greyRoot.setEnabled(false);
    this.sampleAndApply(0);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true; ++this.loadSerial;
    this.removeLightObserver();
    for (const light of this.handLights) light.dispose();
    for (const group of this.groups) group.dispose();
    this.root.dispose(); this.container?.dispose(); this.material.dispose();
  }
}
