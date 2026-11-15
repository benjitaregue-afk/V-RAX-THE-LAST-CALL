// Provisional visuals only. The layout, collision and interaction never depend on these meshes.
import { MeshBuilder, StandardMaterial, Color3, TransformNode, Scene, AbstractMesh } from '@babylonjs/core';
import { MODEL_IDS } from './layout';
import type { ModelId, Placement } from './layout';

export type VisualManifest = Partial<Record<ModelId | 'environment' | 'hands', string>>;
export async function readVisualManifest(): Promise<VisualManifest> {
  const response = await fetch(`${import.meta.env.BASE_URL}visual-assets.json`);
  if (!response.ok) throw new Error('Visual manifest could not be loaded');
  const input: unknown = await response.json();
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid visual manifest');
  return parseVisualManifest(input);
}

export function parseVisualManifest(input: unknown): VisualManifest {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid visual manifest');
  const out: VisualManifest = {};
  for (const id of [...MODEL_IDS, 'environment', 'hands'] as const) {
    const path = (input as Record<string, unknown>)[id];
    if (path === undefined) continue;
    if (typeof path !== 'string' || !/^assets\/models\/[\w/-]+\.glb$/.test(path) || path.includes('..')) throw new Error(`Invalid visual path for ${id}`);
    out[id] = path;
  }
  return out;
}

export class VisualLibrary {
  readonly anchors = new Map<string, TransformNode>();
  readonly meshes: AbstractMesh[] = [];
  readonly greyMaterial: StandardMaterial;
  readonly environment: TransformNode;
  constructor(private scene: Scene) {
    this.environment = new TransformNode('anchor:environment', scene);
    this.environment.metadata = { modelId: 'environment', provisional: true };
    this.anchors.set('environment', this.environment);
    this.greyMaterial = new StandardMaterial('PROVISIONAL-grey', scene);
    this.greyMaterial.diffuseColor = Color3.FromHexString('#56616A');
    this.greyMaterial.specularColor.setAll(0.08);
  }
  create(p: Placement): void {
    const anchor = new TransformNode(`anchor:${p.id}`, this.scene);
    anchor.position.set(p.x, p.y, p.z); anchor.rotation.y = p.yaw;
    anchor.metadata = { provisional: true, modelId: p.model, placementId: p.id };
    this.anchors.set(p.id, anchor);
    const footprint = p.colliders[0];
    const mesh = MeshBuilder.CreateBox(`GREYBOX:${p.id}`, {
      width: footprint?.w ?? (p.model === 'lamp' ? 0.7 : 0.65),
      depth: footprint?.d ?? 0.55, height: p.height,
    }, this.scene);
    mesh.parent = anchor; mesh.position.y = p.height / 2;
    if (p.model === 'lamp' || p.model === 'tray' || p.model === 'arm') mesh.position.y = -0.12;
    mesh.material = this.greyMaterial; mesh.isPickable = false;
    mesh.receiveShadows = true; this.meshes.push(mesh);
  }
  setDoorOpen(id: string, open: boolean): void {
    const anchor=this.anchors.get(id); if(!anchor)return;
    const leaves=anchor.getDescendants().filter(n=>/door__leaf_[LR]$/.test(n.name));
    anchor.setEnabled(leaves.length ? true : !open);
    for(const leaf of leaves)leaf.setEnabled(!open);
  }
  async replace(manifest: VisualManifest, warn: (text: string) => void): Promise<void> {
    if (!Object.keys(manifest).length) return;
    await import('@babylonjs/loaders/glTF');
    const { LoadAssetContainerAsync } = await import('@babylonjs/core/Loading/sceneLoader');
    for (const id of [...MODEL_IDS, 'environment'] as const) {
      const path = manifest[id]; if (!path) continue;
      try {
        const container = await LoadAssetContainerAsync(`${import.meta.env.BASE_URL}${path}`, this.scene);
        for (const anchor of this.anchors.values()) {
          if (anchor.metadata.modelId !== id) continue;
          const grey = anchor.getChildMeshes();
          const instance = container.instantiateModelsToScene((name) => `${anchor.name}:${name}`);
          for (const node of instance.rootNodes) node.parent = anchor;
          for (const mesh of anchor.getChildMeshes()) { mesh.isPickable = false; mesh.checkCollisions = false; mesh.receiveShadows = true; }
          for (const mesh of grey) mesh.dispose();
          anchor.metadata.provisional = false;
        }
        // Keep source container alive for shared geometry; scene disposal owns resources.
      } catch { warn(`Optional ${id} visual unavailable; using provisional geometry.`); }
    }
  }
}
