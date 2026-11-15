import { describe, expect, it } from 'vitest';
import { NullEngine, Scene, UniversalCamera, Vector3 } from '@babylonjs/core';
import { FirstPersonHands, HAND_ANIMATIONS, HAND_ASSET_PATH, HAND_DURATIONS, isHandAssetPath, sampleHandPose } from '../../src/player/hands';

describe('replaceable first-person hand contract', () => {
  it('attaches non-colliding viewmodels to the camera and restores Idle without gating gameplay', () => {
    const engine = new NullEngine();
    const scene = new Scene(engine);
    const camera = new UniversalCamera('test-camera', Vector3.Zero(), scene);
    const hands = new FirstPersonHands(camera, scene);
    try {
      expect(hands.root.parent).toBe(camera);
      const meshes = hands.root.getChildMeshes();
      expect(meshes.length).toBeGreaterThanOrEqual(12);
      for (const mesh of meshes) {
        expect(mesh.isPickable).toBe(false);
        expect(mesh.checkCollisions).toBe(false);
        expect(mesh.renderingGroupId).toBe(2);
      }
      hands.play('Reach');
      for (let i = 0; i < 9; i++) hands.update(1 / 60);
      expect(hands.animationName).toBe('Reach');
      expect(scene.getTransformNodeByName('hand_R')!.position.z).toBeGreaterThan(0.48);
      for (let i = 0; i < 60; i++) hands.update(1 / 60);
      expect(hands.animationName).toBe('Idle');
      hands.setVisible(false);
      expect(hands.root.isEnabled()).toBe(false);
      expect(hands.usingProductionAsset).toBe(false);
      hands.dispose();
      expect(camera.isDisposed()).toBe(false);
      expect(scene.getTransformNodeByName('fp-hands-root')).toBeNull();
    } finally { hands.dispose(); scene.dispose(); engine.dispose(); }
  });

  it('has the seven agreed clips and finite visual durations', () => {
    expect(HAND_ANIMATIONS).toEqual(['Awaken', 'StandUp', 'Idle', 'Reach', 'PressTerminal', 'OperateSwitch', 'OperateDoor']);
    for (const name of HAND_ANIMATIONS) expect(HAND_DURATIONS[name]).toBeGreaterThan(0);
    expect(HAND_DURATIONS.Awaken).toBeGreaterThanOrEqual(3);
    expect(HAND_DURATIONS.StandUp).toBeGreaterThanOrEqual(3);
  });

  it('raises a visible palm during awakening and plants it before standing', () => {
    const before = sampleHandPose('Awaken', 0);
    const raised = sampleHandPose('Awaken', HAND_DURATIONS.Awaken * 0.66);
    const planted = sampleHandPose('StandUp', HAND_DURATIONS.StandUp * 0.28);
    expect(raised.right.position[1] - before.right.position[1]).toBeGreaterThan(0.4);
    expect(planted.left.rotation[0]).toBeGreaterThan(1.2);
    expect(planted.left.curl).toBe(0);
    expect(planted.right.curl).toBe(0);
    // At the default 75-degree vertical FOV, support palms must appear above
    // the 720p caption panel, rather than animating entirely below the view.
    const support = sampleHandPose('StandUp', 1.2);
    for (const hand of [support.left, support.right]) {
      const screenY = 360 - hand.position[1] / hand.position[2] / Math.tan(75 * Math.PI / 360) * 360;
      expect(screenY).toBeLessThan(450);
    }
  });

  it('extends the right hand for a terminal press and returns to a resting pose', () => {
    const rest = sampleHandPose('Idle', 0);
    const pressed = sampleHandPose('PressTerminal', HAND_DURATIONS.PressTerminal * 0.58);
    const returned = sampleHandPose('PressTerminal', HAND_DURATIONS.PressTerminal);
    expect(pressed.right.position[2] - rest.right.position[2]).toBeGreaterThan(0.25);
    expect(returned).toEqual(rest);
    expect(sampleHandPose('StandUp', HAND_DURATIONS.StandUp)).toEqual(rest);
  });

  it('clamps invalid clip times to finite poses and accepts only the local rig path', () => {
    for (const name of HAND_ANIMATIONS) for (const time of [NaN, Infinity, -99, 0, 99]) {
      const sampled = sampleHandPose(name, time);
      for (const hand of [sampled.left, sampled.right]) {
        for (const value of [...hand.position, ...hand.rotation, hand.curl]) expect(Number.isFinite(value)).toBe(true);
      }
    }
    expect(isHandAssetPath(HAND_ASSET_PATH)).toBe(true);
    for (const value of ['https://example.com/hands.glb', 'assets/models/../player-hands.glb', '/assets/models/player-hands.glb', undefined, 7]) expect(isHandAssetPath(value)).toBe(false);
  });
});
