// Binary delivery checks: do not accept a static mesh or empty clips as an animated rig.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HAND_ANIMATIONS } from '../../src/player/hands';

interface Accessor { bufferView: number; byteOffset?: number; componentType: number; count: number; type: string }
interface Gltf {
  accessors: Accessor[];
  bufferViews: { byteOffset?: number; byteLength: number; byteStride?: number }[];
  skins: { joints: number[] }[];
  nodes: { mesh?: number; skin?: number }[];
  meshes: { primitives: { attributes: Record<string, number>; indices: number; material: number }[] }[];
  animations: { name: string; channels: unknown[]; samplers: { input: number; output: number }[] }[];
}
function delivered() {
  const data = readFileSync(new URL('../../public/assets/models/player-hands.glb', import.meta.url));
  expect(data.readUInt32LE(0)).toBe(0x46546c67);
  const length = data.readUInt32LE(12);
  const gltf = JSON.parse(data.subarray(20, 20 + length).toString()) as Gltf;
  const binary = data.subarray(28 + length);
  function values(index: number): number[][] {
    const a = gltf.accessors[index]!; const v = gltf.bufferViews[a.bufferView]!;
    const width = ({ SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 } as Record<string, number>)[a.type]!;
    const bytes = ({ 5121: 1, 5123: 2, 5125: 4, 5126: 4 } as Record<number, number>)[a.componentType]!;
    expect(bytes).toBeGreaterThan(0);
    const offset = (v.byteOffset ?? 0) + (a.byteOffset ?? 0); const stride = v.byteStride ?? width * bytes;
    return Array.from({ length: a.count }, (_, row) => Array.from({ length: width }, (_, c) => {
      const at = offset + row * stride + c * bytes;
      return a.componentType === 5126 ? binary.readFloatLE(at) : a.componentType === 5123 ? binary.readUInt16LE(at) : a.componentType === 5121 ? binary.readUInt8(at) : binary.readUInt32LE(at);
    }));
  }
  return { gltf, values };
}

describe('delivered articulated hands', () => {
  it('has skinned geometry with valid normalized joint weights', () => {
    const { gltf, values } = delivered();
    expect(gltf.skins.length).toBeGreaterThan(0);
    const skinned = gltf.nodes.filter((n) => n.mesh !== undefined && n.skin !== undefined);
    expect(skinned.length).toBeGreaterThan(0);
    let vertexCount = 0;
    for (const node of skinned) for (const p of gltf.meshes[node.mesh!]!.primitives) {
      const joints = values(p.attributes.JOINTS_0!); const weights = values(p.attributes.WEIGHTS_0!);
      expect(joints.length).toBe(weights.length); vertexCount += joints.length;
      for (let i = 0; i < weights.length; i++) {
        expect(weights[i]!.every((v) => Number.isFinite(v) && v >= 0)).toBe(true);
        expect(weights[i]!.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 3);
        expect(joints[i]!.every((v) => v >= 0 && v < gltf.skins[node.skin!]!.joints.length)).toBe(true);
      }
    }
    expect(vertexCount).toBeGreaterThan(1000);
  });

  it('contains actual time-varying joint channels for every requested clip', () => {
    const { gltf, values } = delivered();
    for (const name of HAND_ANIMATIONS) {
      const clip = gltf.animations.find((a) => a.name === name);
      expect(clip, name).toBeDefined(); expect(clip!.channels.length, name).toBeGreaterThan(5);
      let changing = false;
      for (const sampler of clip!.samplers) {
        const time = values(sampler.input).flat(); const output = values(sampler.output);
        expect(time.length, name).toBeGreaterThan(1);
        expect(time.at(-1)! - time[0]!, name).toBeGreaterThan(0);
        expect(output.flat().every(Number.isFinite), name).toBe(true);
        changing ||= output.some((v) => v.some((x, i) => Math.abs(x - output[0]![i]!) > 1e-5));
      }
      expect(changing, name).toBe(true);
    }
  });
});
