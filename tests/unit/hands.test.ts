import { describe, expect, it } from 'vitest';
import { NullEngine, Scene, UniversalCamera, Vector3 } from '@babylonjs/core';
import { FirstPersonHands, HAND_ANIMATIONS, HAND_ASSET_PATH, HAND_DURATIONS, handBlendWeight, handTargetBias, isHandAssetPath, sampleHandPose } from '../../src/player/hands';

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

  it('keeps the seven agreed clips and adds authored locomotion/inspection durations', () => {
    expect(HAND_ANIMATIONS.slice(0, 7)).toEqual(['Awaken', 'StandUp', 'Idle', 'Reach', 'PressTerminal', 'OperateSwitch', 'OperateDoor']);
    expect(HAND_ANIMATIONS.slice(7)).toEqual(['Walk', 'Sprint', 'Inspect']);
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

  it('eases transitions, keeps contextual reach bounded, and rejects targets behind the camera', () => {
    expect(handBlendWeight(0)).toBe(0);
    expect(handBlendWeight(0.09)).toBeCloseTo(0.5);
    expect(handBlendWeight(0.18)).toBe(1);
    expect(handBlendWeight(NaN)).toBe(0);
    const far = handTargetBias(new Vector3(200, 100, 20), 1);
    expect(far.position.x).toBeCloseTo(0.07);
    expect(far.position.y).toBeCloseTo(0.05);
    expect(far.position.z).toBeCloseTo(0.035);
    expect(far.rotation.y).toBeLessThanOrEqual(0.18);
    expect(handTargetBias(new Vector3(1, 1, -1), 1).position.length()).toBe(0);
    expect(handTargetBias(new Vector3(1, 1, 1), 0).position.length()).toBe(0);
  });

  it('changes locomotion smoothly without interrupting gestures or advancing on pause', () => {
    const engine = new NullEngine(); const scene = new Scene(engine);
    const camera = new UniversalCamera('camera', Vector3.Zero(), scene);
    const hands = new FirstPersonHands(camera, scene);
    try {
      hands.setMotion(1.8, false, false);
      expect(hands.animationName).toBe('Walk');
      expect(hands.blendProgress).toBe(0);
      hands.update(0.09);
      const halfway = hands.blendProgress;
      hands.update(0);
      expect(hands.blendProgress).toBe(halfway);
      hands.setMotion(3.2, true, false);
      expect(hands.animationName).toBe('Sprint');
      hands.play('PressTerminal');
      hands.setMotion(0, false, true);
      expect(hands.animationName).toBe('PressTerminal');
      for (let i = 0; i < 65; i++) hands.update(1 / 60);
      expect(hands.animationName).toBe('Idle');
      hands.play('Awaken'); hands.setMotion(0, false, true);
      expect(hands.animationName).toBe('Awaken');
    } finally { hands.dispose(); scene.dispose(); engine.dispose(); }
  });

  it('retracts near walls gradually and eases back after clearance returns', () => {
    const engine = new NullEngine(); const scene = new Scene(engine);
    const hands = new FirstPersonHands(new UniversalCamera('camera', Vector3.Zero(), scene), scene);
    try {
      hands.setClearance(0.3);
      hands.update(1 / 60);
      const first = hands.root.metadata.nearWall as number;
      expect(first).toBeGreaterThan(0); expect(first).toBeLessThan(1);
      for (let i = 0; i < 30; i++) hands.update(1 / 60);
      expect(hands.root.metadata.nearWall).toBeGreaterThan(0.9);
      hands.setClearance(Infinity);
      for (let i = 0; i < 30; i++) hands.update(1 / 60);
      expect(hands.root.metadata.nearWall).toBeLessThan(0.1);
    } finally { hands.dispose(); scene.dispose(); engine.dispose(); }
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
