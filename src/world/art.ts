// Production art layer (owner: Claude). Presentation only.
// It dresses the meshes that VisualLibrary loads from public/visual-assets.json: baked
// lighting, reflection probes, practical-light states, flashlight shadows, post-processing,
// sliding doors and diegetic screens. It never reads input, never changes collision or
// interaction proxies, and no story event waits on anything in this file.
import {
  Axis, Color3, Color4, DefaultRenderingPipeline, DynamicTexture, Effect, HDRCubeTexture,
  DirectionalLight, ImageProcessingConfiguration, InstancedMesh, Material, Mesh, PBRMaterial, ParticleSystem, ProceduralTexture,
  MeshBuilder, RawTexture, Scene, ShadowGenerator, Space, SphericalHarmonics, SphericalPolynomial, SpotLight, StandardMaterial,
  Texture, TransformNode, Vector3, Constants,
} from '@babylonjs/core';
import type { AbstractMesh, HemisphericLight, Light, Node, PointLight } from '@babylonjs/core';
import type { ZoneId } from '../game/contracts';
import type { LightProfile, WorldProjection } from '../game/projection';
import type { Settings } from '../save/save';
import { PLACEMENTS, zoneAt } from './layout';
import bakeStats from '../content/lightmap-stats.json';
import type { VisualLibrary } from './visuals';

const BASE = import.meta.env.BASE_URL;
const ZONES: ZoneId[] = ['AIRLOCK', 'HUB', 'INSIGHT', 'OPPORTUNITY', 'RELAY', 'OBSERVATION'];
/** Lightmaps store irradiance / LM_SCALE, gamma encoded (assets/blender/scripts/build_station.py). */
const LM_SCALE = 2.0;
/** Extra gain on baked light, tuned by eye against the Cycles previews. */
const LM_GAIN = 9.0;
/** The mixed irradiance texture stores value / MIX_RANGE so an 8-bit fallback target cannot clip. */
const MIX_RANGE = 4.0;
/** Mean baked colour per zone and layer, written by the bake. Small parts without lightmap UVs use it. */
const STATS = bakeStats as Record<string, { p: number[]; e: number[] } | undefined>;

/** How much main power each zone has in each story lighting profile. Emergency light is always on. */
const POWER: Record<LightProfile, Record<ZoneId, number>> = {
  DARK: { AIRLOCK: 0, HUB: 0, INSIGHT: 0, OPPORTUNITY: 0, RELAY: 0, OBSERVATION: 0 },
  BACKUP: { AIRLOCK: 0.8, HUB: 0.7, INSIGHT: 0.2, OPPORTUNITY: 0.5, RELAY: 0.12, OBSERVATION: 0.1 },
  OPPORTUNITY: { AIRLOCK: 0.9, HUB: 0.85, INSIGHT: 0.5, OPPORTUNITY: 1, RELAY: 0.3, OBSERVATION: 0.2 },
  INSIGHT: { AIRLOCK: 1, HUB: 1, INSIGHT: 1, OPPORTUNITY: 1, RELAY: 0.85, OBSERVATION: 0.5 },
  PRESERVED: { AIRLOCK: 1.1, HUB: 1.15, INSIGHT: 1.1, OPPORTUNITY: 1.1, RELAY: 1.2, OBSERVATION: 1 },
};
/** On-screen brightness of emissive surfaces at full power (bloom picks up values above ~0.7). */
const GLOW: Record<string, { level: number; powered: boolean }> = {
  emit_main: { level: 2.6, powered: true },
  emit_strip: { level: 2.2, powered: true },
  emit_e: { level: 1.9, powered: false },
  screen_crt: { level: 1.0, powered: false },
  screen_wave: { level: 1.0, powered: false },
  screen_board: { level: 0.9, powered: false },
  screen_term: { level: 1.15, powered: false },
};

Effect.ShadersStore.voraxLightmixFragmentShader = `
precision highp float;
varying vec2 vUV;
uniform sampler2D mapP;
uniform sampler2D mapE;
uniform vec3 levelP;
uniform vec3 levelE;
void main(void) {
  vec3 p = pow(texture2D(mapP, vUV).rgb, vec3(2.2));
  vec3 e = pow(texture2D(mapE, vUV).rgb, vec3(2.2));
  gl_FragColor = vec4(p * levelP + e * levelE, 1.0);
}`;

interface ZoneArt {
  mapP: Texture | null;
  mapE: Texture | null;
  mix: ProceduralTexture | null;
  /** 1x1 texture holding the zone's mean baked light, for parts without lightmap UVs. */
  tint: RawTexture;
  probe: HDRCubeTexture | null;
  materials: Map<string, PBRMaterial>;
  glow: { key: string; mat: PBRMaterial }[];
  power: number;
  target: number;
  applied: number;
  meshes: AbstractMesh[];
}
interface DoorArt {
  marker: Node;
  panels: { node: TransformNode; dir: number; rest: number }[];
  status: StandardMaterial | null;
  t: number;
}
interface ScreenArt { zone: ZoneId; kind: string; texture: DynamicTexture; animated: boolean }

function loadTexture(scene: Scene, url: string): Promise<Texture | null> {
  return new Promise((resolve) => {
    const t: Texture = new Texture(url, scene, true, false, Texture.BILINEAR_SAMPLINGMODE, () => resolve(t), () => { t.dispose(); resolve(null); });
  });
}
function loadProbe(scene: Scene, url: string): Promise<HDRCubeTexture | null> {
  return new Promise((resolve) => {
    const t: HDRCubeTexture = new HDRCubeTexture(url, scene, 128, false, true, false, true, () => resolve(t), () => { t.dispose(); resolve(null); });
  });
}
const sourceOf = (mesh: AbstractMesh): Mesh | null => (mesh instanceof InstancedMesh ? mesh.sourceMesh : mesh instanceof Mesh ? mesh : null);

export class ArtDirector {
  /** True once production visuals are in place. While false the provisional greybox look is kept. */
  active = false;
  private zones = new Map<ZoneId, ZoneArt>();
  private library = new Map<string, PBRMaterial>();
  private doors: DoorArt[] = [];
  private screens: ScreenArt[] = [];
  private spinners: { node: TransformNode; axis: Vector3; speed: number; space: Space; needsPulse: boolean }[] = [];
  private coreGlow: PBRMaterial | StandardMaterial | null = null;
  private flash: SpotLight | null = null;
  private flashShadow: ShadowGenerator | null = null;
  private pipeline: DefaultRenderingPipeline | null = null;
  private dust: ParticleSystem | null = null;
  private dustAnchor = new Vector3(0, 1.4, -6);
  private casters: AbstractMesh[] = [];
  private shipMeshes: AbstractMesh[] = [];
  private searchShadow: ShadowGenerator | null = null;
  private shafts: { zone: ZoneId; material: StandardMaterial; x: number; z: number }[] = [];
  private lmMeshes: AbstractMesh[] = [];
  private profile: LightProfile = 'DARK';
  private powerScale = 1;
  private projection: WorldProjection | null = null;
  private settings: Settings | null = null;
  private lastTime = 0;
  private screenClock = 0;

  private badge: HTMLElement | null = null;

  constructor(private readonly scene: Scene, private readonly visuals: VisualLibrary) {
    // Decorative note while the station art streams in; it never blocks input and removes itself.
    if (typeof document !== 'undefined') {
      const badge = document.createElement('div');
      badge.textContent = 'LOADING STATION ART…'; badge.setAttribute('aria-hidden', 'true');
      badge.style.cssText = 'position:fixed;left:14px;bottom:12px;z-index:5;font:600 11px ui-monospace,Menlo,monospace;letter-spacing:.14em;color:#e0a35a;opacity:.75;pointer-events:none';
      document.body.append(badge); this.badge = badge;
      window.setTimeout(() => { this.badge?.remove(); this.badge = null; }, 60_000);
    }
    for (const id of ZONES) {
      const tint = RawTexture.CreateRGBATexture(new Uint8Array([0, 0, 0, 255]), 1, 1, scene, false, false, Texture.NEAREST_SAMPLINGMODE);
      tint.level = MIX_RANGE;
      this.zones.set(id, { mapP: null, mapE: null, mix: null, tint, probe: null, materials: new Map(), glow: [], power: 0, target: 0, applied: -1, meshes: [] });
    }
  }

  // ------------------------------------------------------------------ setup

  async finalize(): Promise<void> {
    try { await this.dress(); } finally { this.badge?.remove(); this.badge = null; }
  }

  private async dress(): Promise<void> {
    const shell = this.visuals.environment.getChildMeshes(false).filter((m) => /(ENV|DET)_[A-Z]+/.test(m.name));
    if (!shell.length) return;
    await Promise.all(ZONES.map(async (id) => {
      const z = this.zones.get(id)!;
      const name = id.toLowerCase();
      [z.mapP, z.mapE, z.probe] = await Promise.all([
        loadTexture(this.scene, `${BASE}assets/lightmaps/${name}_p.jpg`),
        loadTexture(this.scene, `${BASE}assets/lightmaps/${name}_e.jpg`),
        loadProbe(this.scene, `${BASE}assets/env/${name}.hdr`),
      ]);
      if (z.mapP && z.mapE) {
        const float = this.scene.getEngine().getCaps().textureHalfFloatRender;
        const mix = new ProceduralTexture(`lightmix:${id}`, z.mapP.getSize().width, 'voraxLightmix', this.scene, null, false, false, float ? Constants.TEXTURETYPE_HALF_FLOAT : Constants.TEXTURETYPE_UNSIGNED_BYTE);
        mix.setTexture('mapP', z.mapP); mix.setTexture('mapE', z.mapE);
        mix.setColor3('levelP', Color3.Black()); mix.setColor3('levelE', Color3.Black());
        mix.refreshRate = 0; mix.coordinatesIndex = 1; mix.gammaSpace = false; mix.level = MIX_RANGE;
        mix.wrapU = mix.wrapV = Texture.CLAMP_ADDRESSMODE;
        z.mix = mix;
      }
      if (z.probe) { // diffuse light comes from the bake; the probe keeps only its reflections
        const flat = new SphericalHarmonics();
        flat.l00.setAll(1); flat.preScaled = true;
        const poly = SphericalPolynomial.FromHarmonics(flat);
        poly.xx.setAll(1); poly.yy.setAll(1); poly.zz.setAll(1);
        for (const v of [poly.x, poly.y, poly.z, poly.xy, poly.yz, poly.zx]) v.setAll(0);
        z.probe.sphericalPolynomial = poly;
      }
    }));
    for (const mesh of shell) this.adoptShell(mesh);
    for (const [id, anchor] of this.visuals.anchors) if (id !== 'environment') this.adoptProp(id, anchor);
    for (const mesh of this.scene.meshes) if (/^(label:|sign-)/.test(mesh.name)) mesh.setEnabled(false); // provisional text planes
    for (const light of this.scene.lights) if (light.name === 'PROVISIONAL-zone-fill') (light as Light).excludedMeshes = this.lmMeshes;
    this.setupFlashlight();
    this.setupAtmosphere();
    this.setupShafts();
    this.setupExterior();
    this.setupScreens();
    this.active = true;
    this.applySettings();
    if (this.projection) this.sync(this.projection);
    for (const z of this.zones.values()) { z.power = z.target; z.applied = -1; }
    // Development-only handle for art review screenshots (scripts/art-shots.mjs). Not in production builds.
    if (import.meta.env.DEV) (window as unknown as Record<string, unknown>).__voraxArt = { scene: this.scene, art: this };
  }

  /** Art review only: shows a lighting profile without changing the story state. */
  preview(profile: LightProfile): void { if (this.projection) this.sync({ ...this.projection, lightProfile: profile }); }

  private zoneMaterial(zone: ZoneId, base: PBRMaterial, baked: boolean): PBRMaterial {
    const z = this.zones.get(zone)!;
    const key = `${base.name}${baked ? '+lm' : ''}`;
    const cached = z.materials.get(key);
    if (cached) return cached;
    const mat = base.clone(`${base.name}@${zone}${baked ? '+lm' : ''}`) as PBRMaterial;
    mat.usePhysicalLightFalloff = false;
    mat.maxSimultaneousLights = 4;
    // Baked irradiance rides the ambient-occlusion slot: it multiplies albedo and leaves dynamic lights alone.
    mat.ambientTexture = baked && z.mix ? z.mix : z.tint;
    mat.ambientTextureStrength = 1; mat.useAmbientInGrayScale = false;
    if (z.probe) mat.reflectionTexture = z.probe;
    const glow = GLOW[base.name];
    if (glow) {
      mat.emissiveIntensity = glow.level;
      if (base.name.startsWith('screen_')) mat.emissiveColor = Color3.White();
      z.glow.push({ key: base.name, mat });
    }
    z.materials.set(key, mat);
    return mat;
  }

  private adoptShell(mesh: AbstractMesh): void {
    const match = /(ENV|DET)_([A-Z]+)/.exec(mesh.name);
    const source = sourceOf(mesh);
    if (!match || !source || !(source.material instanceof PBRMaterial)) return;
    const zone = match[2] as ZoneId;
    const z = this.zones.get(zone);
    if (!z) return;
    const base = source.material;
    if (!this.library.has(base.name)) this.library.set(base.name, base);
    source.material = this.zoneMaterial(zone, base, match[1] === 'ENV');
    source.receiveShadows = true;
    z.meshes.push(mesh);
    if (match[1] === 'ENV') this.lmMeshes.push(mesh);
    if (!/^(emit_|screen_|glass)/.test(base.name)) this.casters.push(mesh);
  }

  private adoptProp(id: string, anchor: TransformNode): void {
    const zone = (zoneAt(anchor.position.x, anchor.position.z) ?? 'HUB') as ZoneId;
    const nodes = anchor.getDescendants(false);
    for (const node of nodes) {
      if (!(node instanceof InstancedMesh) && !(node instanceof Mesh)) continue;
      const source = sourceOf(node);
      if (!source || !(source.material instanceof PBRMaterial) || source.material.name.includes('@')) continue;
      const library = this.library.get(source.material.name.replace(/^ref_/, ''));
      if (library) source.material = this.zoneMaterial(zone, library, false);
      else { source.material.usePhysicalLightFalloff = false; source.material.maxSimultaneousLights = 4; }
      source.receiveShadows = true;
      if (id === 'rescue-one') { // outside the hull: no fog, lit by its own key light
        source.applyFog = false; this.shipMeshes.push(node, source);
      } else this.casters.push(node);
    }
    if (id.startsWith('door-visual:')) this.adoptDoor(nodes);
    for (const node of nodes) {
      if (!(node instanceof TransformNode)) continue;
      if (/fan__blades$/.test(node.name)) this.spinners.push({ node, axis: Axis.Z, speed: 1.4, space: Space.LOCAL, needsPulse: false });
      if (/relay__ring$/.test(node.name)) this.spinners.push({ node, axis: Axis.Y, speed: 0.55, space: Space.WORLD, needsPulse: true });
      if (/relay__ring2$/.test(node.name)) this.spinners.push({ node, axis: Axis.Y, speed: -0.8, space: Space.WORLD, needsPulse: true });
      if (/relay__core/.test(node.name) && node instanceof InstancedMesh) {
        const material = node.sourceMesh.material;
        if (material instanceof PBRMaterial) this.coreGlow = material;
      }
    }
  }

  private adoptDoor(nodes: Node[]): void {
    const marker = nodes.find((n) => /door__leaf_L$/.test(n.name));
    if (!marker) return;
    const panels: DoorArt['panels'] = [];
    for (const node of nodes) {
      const m = /door__panel_([LR])$/.exec(node.name);
      if (m && node instanceof TransformNode) panels.push({ node, dir: m[1] === 'L' ? -1 : 1, rest: node.position.x });
    }
    let status: StandardMaterial | null = null;
    const lamp = nodes.find((n) => /door__status$/.test(n.name));
    if (lamp instanceof InstancedMesh) { // each door needs its own lamp colour, so it cannot stay an instance
      const own = lamp.sourceMesh.clone(`${lamp.name}:own`, lamp.parent);
      own.position.copyFrom(lamp.position); own.scaling.copyFrom(lamp.scaling);
      if (lamp.rotationQuaternion) own.rotationQuaternion = lamp.rotationQuaternion.clone();
      status = new StandardMaterial(`${lamp.name}:lamp`, this.scene);
      status.disableLighting = true; status.emissiveColor = new Color3(1, 0.2, 0.05);
      own.material = status; own.isPickable = false; own.checkCollisions = false;
      lamp.dispose();
    }
    this.doors.push({ marker, panels, status, t: marker.isEnabled(false) ? 0 : 1 });
  }

  private setupFlashlight(): void {
    const camera = this.scene.activeCamera ?? this.scene.getCameraByName('first-person');
    if (!camera) return;
    const flash = new SpotLight('VORAX-flashlight', new Vector3(0.24, -0.2, 0.05), new Vector3(-0.03, 0.02, 1), 1.0, 1.4, this.scene);
    flash.parent = camera;
    flash.range = 24; flash.intensity = 2.1; flash.diffuse = new Color3(1, 0.95, 0.84); flash.specular = new Color3(1, 0.95, 0.84);
    flash.innerAngle = 0.4; flash.shadowMinZ = 0.12; flash.shadowMaxZ = 26; flash.renderPriority = 5;
    const cookie = new DynamicTexture('flashlight-cookie', 256, this.scene, true);
    const ctx = cookie.getContext() as CanvasRenderingContext2D;
    const g = ctx.createRadialGradient(128, 128, 4, 128, 128, 128);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.28, '#f2ead8'); g.addColorStop(0.5, '#b9ae98'); g.addColorStop(0.62, '#d6ccb6'); g.addColorStop(0.8, '#5f574a'); g.addColorStop(1, '#000000');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 256, 256); cookie.update();
    cookie.wrapU = cookie.wrapV = Texture.CLAMP_ADDRESSMODE;
    flash.projectionTexture = cookie;
    this.flash = flash;
    // The provisional flashlight stays as the on/off switch (F key) but must not occupy a light slot.
    const off = new Mesh('art:no-light-target', this.scene); off.setEnabled(false);
    const provisional = this.scene.getLightByName('PROVISIONAL-flashlight');
    if (provisional) { provisional.intensity = 0; provisional.includedOnlyMeshes = [off]; }
  }

  /** Space beyond the observation window: a painted star field and a planet limb, plus the ship's key light. */
  private setupExterior(): void {
    // r3: the service boom sits outside the sealed window, beyond the cabin fog.
    // Dedicated materials and lights keep the existing interior lightmaps untouched.
    const exteriorNodes = this.visuals.environment.getChildMeshes(false).filter((m) => /SM_EXT_/.test(m.name));
    const exterior = [...new Set(exteriorNodes.flatMap((m) => { const source = sourceOf(m); return source ? [m, source] : [m]; }))];
    for (const mesh of exterior) {
      mesh.applyFog = false;
      const source = sourceOf(mesh);
      if (source) {
        source.applyFog = false;
        if (source.material instanceof PBRMaterial) {
          source.material.usePhysicalLightFalloff = false;
          source.material.maxSimultaneousLights = 2;
        }
      }
    }
    if (exterior.length) {
      const key = new DirectionalLight('exterior-cold-key', new Vector3(0.35, -0.45, 0.84), this.scene);
      key.intensity = 10; key.diffuse = new Color3(0.61, 0.75, 1); key.includedOnlyMeshes = exterior; key.renderPriority = 30;
      const planet = new DirectionalLight('exterior-planet-fill', new Vector3(0.3, 0.86, 0.42), this.scene);
      planet.intensity = 0.45; planet.diffuse = new Color3(1, 0.36, 0.18); planet.includedOnlyMeshes = exterior; planet.renderPriority = 29;
      for (const name of ['PROVISIONAL-zone-fill', 'VORAX-flashlight', 'RescueOne-searchlight']) {
        const light = this.scene.getLightByName(name);
        if (light) light.excludedMeshes.push(...exterior);
      }
    }
    const W = 2048, H = 1024;
    const texture = new DynamicTexture('space-backdrop', { width: W, height: H }, this.scene, true);
    const ctx = texture.getContext() as CanvasRenderingContext2D;
    ctx.fillStyle = '#000003'; ctx.fillRect(0, 0, W, H);
    let seed = 20261115;
    const rnd = (): number => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
    for (let i = 0; i < 1500; i++) {
      const x = rnd() * W, y = rnd() * H, m = rnd() ** 3.2;
      const hue = rnd();
      ctx.fillStyle = `rgba(${hue > 0.8 ? 255 : 215},${hue < 0.12 ? 205 : 228},${hue < 0.2 ? 190 : 255},${(0.25 + 0.75 * m).toFixed(2)})`;
      ctx.beginPath(); ctx.arc(x, y, 0.5 + 1.6 * m, 0, Math.PI * 2); ctx.fill();
    }
    // A fictional rust-coloured world below the station; painted, not a photograph.
    const cx = W * 0.36, cy = H * 1.84, r = H * 1.32;
    const body = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.55, r * 0.2, cx, cy, r);
    body.addColorStop(0, '#b0603a'); body.addColorStop(0.55, '#6e3220'); body.addColorStop(1, '#170806');
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    for (let k = 0; k < 7; k++) {
      ctx.strokeStyle = `rgba(255,${150 + k * 8},${110 + k * 14},${(0.2 - k * 0.026).toFixed(3)})`;
      ctx.lineWidth = 3 + k * 3; ctx.beginPath(); ctx.arc(cx, cy, r + k * 2.5, 0, Math.PI * 2); ctx.stroke();
    }
    texture.update();
    const material = new StandardMaterial('space-backdrop', this.scene);
    material.disableLighting = true; material.emissiveTexture = texture; material.fogEnabled = false;
    const plane = MeshBuilder.CreatePlane('space-backdrop', { width: 210, height: 105 }, this.scene);
    plane.position.set(0, 14, 96); plane.material = material; plane.isPickable = false; plane.applyFog = false;
    if (this.shipMeshes.length) {
      const key = new DirectionalLight('rescue-key', new Vector3(0.45, -0.5, 0.74), this.scene);
      key.intensity = 2.6; key.diffuse = new Color3(1, 0.93, 0.84); key.includedOnlyMeshes = this.shipMeshes;
    }
  }

  /** Soft additive light columns under the ceiling lamps: cheap haze that makes the air readable. */
  private setupShafts(): void {
    const size = 128;
    const texture = new DynamicTexture('shaft-cone', { width: size, height: size }, this.scene, true);
    const ctx = texture.getContext() as CanvasRenderingContext2D;
    ctx.clearRect(0, 0, size, size);
    for (let y = 0; y < size; y++) { // a cone painted row by row: narrow and bright at the lamp, wide and faint at the floor
      const t = y / (size - 1);
      const half = (0.07 + 0.42 * t) * size;
      const a = 0.85 * (1 - t) ** 1.6;
      const g = ctx.createLinearGradient(size / 2 - half, 0, size / 2 + half, 0);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${a.toFixed(3)})`); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, y, size, 1);
    }
    texture.update(); texture.hasAlpha = true;
    for (const p of PLACEMENTS) {
      if (p.model !== 'lamp') continue;
      const material = new StandardMaterial(`shaft:${p.id}`, this.scene);
      material.disableLighting = true; material.emissiveColor = new Color3(1, 0.72, 0.42);
      material.opacityTexture = texture; material.alphaMode = Constants.ALPHA_ADD; material.backFaceCulling = false;
      material.fogEnabled = false; material.disableDepthWrite = true; material.alpha = 0;
      const height = p.y - 0.15;
      const plane = MeshBuilder.CreatePlane(`shaft:${p.id}`, { width: 3.4, height }, this.scene);
      plane.position.set(p.x, height / 2 + 0.02, p.z); plane.billboardMode = Mesh.BILLBOARDMODE_Y;
      plane.material = material; plane.isPickable = false;
      this.shafts.push({ zone: p.zone, material, x: p.x, z: p.z });
    }
  }

  private setupAtmosphere(): void {
    const scene = this.scene;
    scene.clearColor = new Color4(0, 0, 0, 1);
    scene.fogMode = Scene.FOGMODE_EXP2;
    scene.fogDensity = 0.03;
    scene.fogColor = new Color3(0.02, 0.019, 0.017);
    const camera = scene.activeCamera ?? scene.getCameraByName('first-person');
    if (!camera) return;
    const pipeline = new DefaultRenderingPipeline('vorax-post', true, scene, [camera]);
    pipeline.fxaaEnabled = true;
    pipeline.bloomEnabled = true; pipeline.bloomThreshold = 0.8; pipeline.bloomWeight = 0.38; pipeline.bloomKernel = 72; pipeline.bloomScale = 0.5;
    pipeline.imageProcessingEnabled = true;
    const ip = pipeline.imageProcessing;
    ip.toneMappingEnabled = true; ip.toneMappingType = ImageProcessingConfiguration.TONEMAPPING_ACES;
    ip.exposure = 1.3; ip.contrast = 1.15;
    ip.vignetteEnabled = true; ip.vignetteWeight = 2.4; ip.vignetteStretch = 0.4; ip.vignetteColor = new Color4(0, 0, 0, 0);
    pipeline.grainEnabled = true; pipeline.grain.intensity = 6; pipeline.grain.animated = true;
    pipeline.chromaticAberrationEnabled = true; pipeline.chromaticAberration.aberrationAmount = 7; pipeline.chromaticAberration.radialIntensity = 0.9;
    this.pipeline = pipeline;

    const mote = new DynamicTexture('dust-mote', 32, scene, false);
    const ctx = mote.getContext() as CanvasRenderingContext2D;
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.4, 'rgba(255,255,255,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 32, 32); mote.update();
    const dust = new ParticleSystem('vorax-dust', 140, scene);
    dust.particleTexture = mote; dust.emitter = this.dustAnchor;
    dust.minEmitBox = new Vector3(-3.5, -1.2, -3.5); dust.maxEmitBox = new Vector3(3.5, 1.7, 3.5);
    dust.minSize = 0.01; dust.maxSize = 0.032; dust.minLifeTime = 5; dust.maxLifeTime = 11; dust.emitRate = 18;
    dust.blendMode = ParticleSystem.BLENDMODE_ADD;
    dust.color1 = new Color4(1, 0.82, 0.58, 0.2); dust.color2 = new Color4(0.62, 0.8, 0.9, 0.12); dust.colorDead = new Color4(0, 0, 0, 0);
    dust.direction1 = new Vector3(-0.04, -0.01, -0.04); dust.direction2 = new Vector3(0.04, 0.03, 0.04);
    dust.minEmitPower = 0.2; dust.maxEmitPower = 0.6; dust.gravity = new Vector3(0, -0.004, 0); dust.updateSpeed = 0.012;
    dust.preWarmCycles = 120; dust.start();
    this.dust = dust;
  }

  // ------------------------------------------------------------------ screens

  private setupScreens(): void {
    for (const [zone, z] of this.zones) {
      for (const { key, mat } of z.glow) {
        if (!key.startsWith('screen_')) continue;
        const texture = new DynamicTexture(`${key}@${zone}`, { width: 512, height: 320 }, this.scene, true);
        mat.emissiveTexture = texture; mat.albedoColor = Color3.Black();
        this.screens.push({ zone, kind: key, texture, animated: key === 'screen_wave' });
      }
    }
    this.redrawScreens(0, true);
  }

  private redrawScreens(time: number, all: boolean): void {
    const here = zoneAt(this.dustAnchor.x, this.dustAnchor.z);
    for (const s of this.screens) {
      if (!all && !(s.animated && s.zone === here)) continue;
      const ctx = s.texture.getContext() as CanvasRenderingContext2D;
      const mono = (px: number) => `600 ${px}px ui-monospace, "SF Mono", Menlo, Consolas, monospace`;
      ctx.fillStyle = '#020604'; ctx.fillRect(0, 0, 512, 320);
      const lines = (rows: string[], color: string, px = 24, top = 44): void => {
        ctx.fillStyle = color; ctx.font = mono(px); ctx.textAlign = 'left';
        rows.forEach((row, i) => ctx.fillText(row, 26, top + i * (px + 8), 460));
      };
      const powered = this.profile !== 'DARK';
      if (s.kind === 'screen_crt') {
        if (s.zone === 'AIRLOCK') lines(['VORAX LOCAL ARCHIVE', 'FICTIONAL SHIP SYSTEM', '', 'W A S D ..... MOVE', 'MOUSE ....... LOOK', 'E ........... INTERACT', 'F ........... LIGHT', 'J ........... JOURNAL'], '#63ff8f');
        else lines(['ARCHIVE INDEX  (FICTION)', '', 'REC 2003-032A ..... EAST', 'REC 2018-042A ..... WEST', 'RELAY QUEUE ....... NORTH', '', powered ? 'BUS: BACKUP' : 'BUS: OFFLINE', 'REQUEST REPEATED'], '#63ff8f');
      } else if (s.kind === 'screen_wave') {
        ctx.strokeStyle = 'rgba(70,200,215,0.18)'; ctx.lineWidth = 1;
        for (let x = 0; x <= 512; x += 64) { ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, 280); ctx.stroke(); }
        for (let y = 40; y <= 280; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(512, y); ctx.stroke(); }
        ctx.strokeStyle = '#59e3ef'; ctx.lineWidth = 2.5; ctx.beginPath();
        for (let x = 0; x <= 512; x += 4) {
          const u = x * 0.045 + time * 2.2;
          const y = 160 + Math.sin(u) * 26 * Math.sin(x * 0.012 + time * 0.35) + Math.sin(u * 3.1) * 9;
          if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = '#59e3ef'; ctx.font = mono(17); ctx.textAlign = 'left';
        ctx.fillText('SHIP STRUCTURE SENSOR — ILLUSTRATIVE, FICTION', 16, 26, 480);
        ctx.fillText('NOT MISSION DATA', 16, 306, 480);
      } else if (s.kind === 'screen_board') {
        ctx.fillStyle = '#ffb04a'; ctx.font = mono(26); ctx.textAlign = 'left';
        ctx.fillText('SHIP STATUS  (FICTIONAL SYSTEM)', 22, 40, 470);
        const rows: [string, string][] = [['EMERGENCY BUS', powered ? 'BACKUP ONLINE' : 'OFFLINE'], ['AIRLOCK 01', 'SEALED'], ['ARCHIVE HUB', powered ? 'OPEN' : 'NO POWER'], ['LIFEBOATS', 'LAUNCHED'], ['CREW ABOARD', '1'], ['DISTRESS BEACON', this.profile === 'PRESERVED' ? 'TRANSMITTING' : 'SILENT']];
        rows.forEach(([a, b], i) => {
          const y = 86 + i * 38;
          ctx.fillStyle = 'rgba(255,176,74,0.16)'; ctx.fillRect(22, y - 24, 468, 30);
          ctx.fillStyle = '#ffc878'; ctx.font = mono(21); ctx.textAlign = 'left'; ctx.fillText(a, 32, y, 240);
          ctx.textAlign = 'right'; ctx.fillStyle = /OFFLINE|NO POWER|SILENT/.test(b) ? '#ff6a3d' : '#ffe2a8'; ctx.fillText(b, 480, y, 220);
        });
      } else {
        const info: Record<string, [string, string, string]> = {
          INSIGHT: ['LISTENING STATION', 'NASA RECORD 2018-042A', 'PZ-01'],
          OPPORTUNITY: ['WITNESS IN STONE', 'NASA RECORD 2003-032A', 'PZ-02'],
          RELAY: ['RELAY — LOCAL QUEUE', 'FICTIONAL ARCHIVE SYSTEM', 'PZ-03'],
        };
        const [title, sub, puzzle] = info[s.zone] ?? ['ARCHIVE TERMINAL', 'FICTIONAL SYSTEM', ''];
        const state = this.projection?.puzzles[puzzle as keyof WorldProjection['puzzles']] ?? 'locked';
        ctx.textAlign = 'center';
        ctx.fillStyle = '#7fe9f2'; ctx.font = mono(34); ctx.fillText(title, 256, 96, 480);
        ctx.font = mono(21); ctx.fillText(sub, 256, 138, 480);
        ctx.strokeStyle = '#7fe9f2'; ctx.lineWidth = 2; ctx.strokeRect(96, 178, 320, 62);
        ctx.font = mono(26);
        ctx.fillStyle = state === 'solved' ? '#9dffb8' : state === 'available' ? '#ffd27a' : '#7fe9f2';
        ctx.fillText(state === 'solved' ? 'RECORD RESTORED' : state === 'available' ? 'PRESS  E  TO INSPECT' : 'WAITING FOR POWER', 256, 218, 300);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      for (let y = 0; y < 320; y += 4) ctx.fillRect(0, y, 512, 1);
      s.texture.update(false);
    }
  }

  // ------------------------------------------------------------------ state from the game

  configure(settings: Settings): void { this.settings = { ...settings }; this.applySettings(); }

  private applySettings(): void {
    if (!this.active || !this.settings) return;
    const low = this.settings.quality === 'low';
    const calm = this.settings.reducedIntensity;
    if (this.pipeline) {
      this.pipeline.bloomEnabled = !low;
      this.pipeline.grainEnabled = !low && !calm;
      this.pipeline.chromaticAberrationEnabled = !low && !calm;
      this.pipeline.imageProcessing.exposure = 1.3 * this.settings.brightness;
    }
    if (this.dust) { if (low) this.dust.stop(); else this.dust.start(); }
    if (this.flash) {
      if (low && this.flashShadow) { this.flashShadow.dispose(); this.flashShadow = null; }
      if (!low && !this.flashShadow) {
        const shadow = new ShadowGenerator(1024, this.flash);
        shadow.usePercentageCloserFiltering = true; shadow.filteringQuality = ShadowGenerator.QUALITY_MEDIUM;
        shadow.bias = 0.0006; shadow.normalBias = 0.012;
        shadow.getShadowMap()!.renderList = this.casters;
        this.flashShadow = shadow;
      }
    }
  }

  sync(projection: WorldProjection): void {
    const changed = projection.lightProfile !== this.profile || projection.puzzles !== this.projection?.puzzles;
    this.projection = projection; this.profile = projection.lightProfile;
    for (const [id, z] of this.zones) z.target = POWER[this.profile][id];
    if (this.active && changed) this.redrawScreens(this.lastTime, true);
  }

  /** Called from ArchiveWorld.applyLight while production art is active. */
  light(power: number, ambient: HemisphericLight, fill: PointLight, accent: SpotLight): void {
    this.powerScale = power;
    ambient.setEnabled(false);
    accent.setEnabled(false);
    fill.intensity = 0.55 * Math.min(1.2, power);
  }

  // ------------------------------------------------------------------ per frame

  update(time: number, x: number, z: number, reduced: boolean): void {
    if (!this.active) return;
    const dt = Math.min(0.1, Math.max(0, time - this.lastTime));
    this.lastTime = time;
    this.dustAnchor.set(x, 1.4, z);
    const provisional = this.scene.getLightByName('PROVISIONAL-flashlight');
    if (provisional && this.flash) this.flash.setEnabled(provisional.isEnabled());
    // Rescue One's searchlight throws the window mullions across the deck.
    const search = this.scene.getLightByName('RescueOne-searchlight');
    if (search instanceof SpotLight && search.intensity > 0 && !this.searchShadow && this.settings?.quality !== 'low') {
      search.shadowMinZ = 4; search.shadowMaxZ = 70;
      const shadow = new ShadowGenerator(1024, search);
      shadow.usePercentageCloserFiltering = true; shadow.bias = 0.0005; shadow.normalBias = 0.02;
      shadow.getShadowMap()!.renderList = this.zones.get('OBSERVATION')!.meshes.filter((m) => this.casters.includes(m));
      this.searchShadow = shadow;
    }

    const surge = this.powerScale;
    for (const [id, zone] of this.zones) {
      // a brown-out falls fast, power returns slowly
      const goal = zone.target * (this.profile === 'DARK' ? 1 : surge);
      const rate = goal < zone.power ? 9 : 1.6;
      zone.power += (goal - zone.power) * (1 - Math.exp(-dt * rate));
      let level = zone.power;
      if (!reduced && level > 0.05) { // tired ballasts: slow, shallow dips, never a strobe
        const n = Math.sin(time * 1.7 + id.length) * Math.sin(time * 0.37 + id.length * 2.1);
        if (n > 0.86) level *= 0.86 + 0.14 * Math.sin(time * 9);
      }
      if (Math.abs(level - zone.applied) < 0.004) continue;
      zone.applied = level;
      const emergency = 3.2 * (1.3 - 0.5 * Math.min(1, level)); // emergency fixtures read stronger when main power is out
      const k = (LM_SCALE * LM_GAIN) / MIX_RANGE;
      if (zone.mix) {
        zone.mix.setColor3('levelP', new Color3(level * k, level * k, level * k));
        zone.mix.setColor3('levelE', new Color3(emergency * k, emergency * k, emergency * k));
        zone.mix.resetRefreshCounter();
      }
      const mean = STATS[id];
      if (mean) { // same mix for parts that have no lightmap UVs
        const g = (LM_GAIN / MIX_RANGE) * 255 * 0.55; // unbaked parts sit a little under the room mean
        zone.tint.update(new Uint8Array([0, 1, 2].map((c) => Math.min(255, Math.round((mean.p[c]! * level + mean.e[c]! * emergency) * g))).concat(255)));
      }
      if (zone.probe) zone.probe.level = 0.08 + 0.92 * Math.min(1.2, level);
      for (const mat of zone.materials.values()) mat.markAsDirty(Material.TextureDirtyFlag);

      for (const { key, mat } of zone.glow) {
        const g = GLOW[key]!;
        mat.emissiveIntensity = g.powered ? g.level * Math.max(0.015, level) : g.level;
      }
    }

    const haze = this.settings?.quality === 'low' ? 0 : 0.16;
    for (const shaft of this.shafts) { // fade out when the camera walks into the column
      const near = Math.min(1, Math.max(0, (Math.hypot(shaft.x - x, shaft.z - z) - 0.7) / 1.6));
      shaft.material.alpha = haze * near * Math.min(1.2, this.zones.get(shaft.zone)!.power);
    }
    for (const door of this.doors) {
      const open = !door.marker.isEnabled(false);
      const goal = open ? 1 : 0;
      if (door.t !== goal) door.t = Math.max(0, Math.min(1, door.t + Math.sign(goal - door.t) * dt / 1.5));
      const e = door.t * door.t * (3 - 2 * door.t);
      for (const p of door.panels) p.node.position.x = p.rest + p.dir * 1.02 * e;
      if (door.status) {
        const pulse = 0.55 + 0.45 * Math.sin(time * 1.6);
        if (door.t >= 1) door.status.emissiveColor.set(0.1, 0.8, 0.5);
        else if (open) door.status.emissiveColor.set(0.9, 0.75, 0.2);
        else door.status.emissiveColor.set(1.0 * pulse, 0.12 * pulse, 0.03 * pulse);
      }
    }
    const pulse = this.projection?.pulseActive ?? true;
    for (const s of this.spinners) s.node.rotate(s.axis, s.speed * dt * (s.needsPulse && !pulse ? 0.15 : 1), s.space);
    if (this.coreGlow instanceof PBRMaterial) this.coreGlow.emissiveIntensity = pulse ? 2.2 + 1.4 * Math.max(0, Math.sin(time * 2.1)) ** 4 : 1.1;

    this.screenClock += dt;
    if (this.screenClock > 0.11) { this.screenClock = 0; this.redrawScreens(time, false); }
  }
}
