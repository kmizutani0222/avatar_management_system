import type { VRM } from '@pixiv/three-vrm';
import { MathUtils, Vector3 } from 'three';

export type LocomotionMode = 'idle' | 'walk' | 'run' | 'jump';

export interface LocomotionInput {
  mode: LocomotionMode;
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jumpPressed: boolean;
}

export interface VrmLocomotionState {
  mode: LocomotionMode;
  phase: number;
  jumpElapsed: number;
  position: Vector3;
  heading: number;
}

export const DEFAULT_LOCOMOTION_INPUT: LocomotionInput = {
  mode: 'idle',
  forward: false,
  backward: false,
  left: false,
  right: false,
  jumpPressed: false,
};

export function createVrmLocomotionState(): VrmLocomotionState {
  return {
    mode: 'idle',
    phase: 0,
    jumpElapsed: -1,
    position: new Vector3(0, 0, 0),
    heading: 0,
  };
}

export function hasVrmHumanoid(vrm: VRM): boolean {
  return Boolean(vrm.humanoid?.getNormalizedBoneNode('hips'));
}

export function resolveVrmSceneRotationY(options?: {
  sourceType?: string;
  assetGenerator?: string;
}): number {
  // AMS parts-baked VRM already faces the viewer; external uploads need a 180° Y flip.
  if (options?.sourceType === 'parts') return 0;
  if (options?.assetGenerator?.includes('AMS Parts Baker')) return 0;
  return Math.PI;
}

/** Rotate upper arms down from the default T-pose. */
export function applyVrmRestPose(vrm: VRM): void {
  const humanoid = vrm.humanoid;
  if (!humanoid) return;

  const leftUpper = humanoid.getNormalizedBoneNode('leftUpperArm');
  const rightUpper = humanoid.getNormalizedBoneNode('rightUpperArm');
  const leftLower = humanoid.getNormalizedBoneNode('leftLowerArm');
  const rightLower = humanoid.getNormalizedBoneNode('rightLowerArm');

  if (leftUpper) leftUpper.rotation.set(0, 0, 1.32);
  if (rightUpper) rightUpper.rotation.set(0, 0, -1.32);
  if (leftLower) leftLower.rotation.set(0, 0, 0.08);
  if (rightLower) rightLower.rotation.set(0, 0, -0.08);
}

function boneRot(
  vrm: VRM,
  name: Parameters<NonNullable<VRM['humanoid']>['getNormalizedBoneNode']>[0],
  x: number,
  y: number,
  z: number,
): void {
  const node = vrm.humanoid?.getNormalizedBoneNode(name);
  if (node) node.rotation.set(x, y, z);
}

function applyLegCycle(
  vrm: VRM,
  phase: number,
  amplitude: number,
  kneeAmp: number,
): void {
  const left = Math.sin(phase);
  const right = Math.sin(phase + Math.PI);

  boneRot(vrm, 'leftUpperLeg', left * amplitude, 0, 0);
  boneRot(vrm, 'rightUpperLeg', right * amplitude, 0, 0);
  boneRot(vrm, 'leftLowerLeg', Math.max(0, -left) * kneeAmp, 0, 0);
  boneRot(vrm, 'rightLowerLeg', Math.max(0, -right) * kneeAmp, 0, 0);
}

function applyArmSwing(vrm: VRM, phase: number, amplitude: number): void {
  const left = Math.sin(phase + Math.PI) * amplitude;
  const right = Math.sin(phase) * amplitude;

  boneRot(vrm, 'leftUpperArm', left, 0, 1.32);
  boneRot(vrm, 'rightUpperArm', right, 0, -1.32);
  boneRot(vrm, 'leftLowerArm', Math.max(0, left) * 0.35, 0, 0.08);
  boneRot(vrm, 'rightLowerArm', Math.max(0, right) * 0.35, 0, -0.08);
}

function applyIdlePose(vrm: VRM, phase: number): void {
  applyVrmRestPose(vrm);
  const sway = Math.sin(phase * 0.8) * 0.015;
  boneRot(vrm, 'spine', sway, 0, 0);
  boneRot(vrm, 'chest', -sway * 0.5, 0, 0);
}

function applyJumpPose(vrm: VRM, t: number): number {
  applyVrmRestPose(vrm);

  if (t < 0.15) {
    const crouch = t / 0.15;
    boneRot(vrm, 'leftUpperLeg', 0.55 * crouch, 0, 0);
    boneRot(vrm, 'rightUpperLeg', 0.55 * crouch, 0, 0);
    boneRot(vrm, 'leftLowerLeg', 0.75 * crouch, 0, 0);
    boneRot(vrm, 'rightLowerLeg', 0.75 * crouch, 0, 0);
    return 0;
  }

  if (t < 0.55) {
    const lift = (t - 0.15) / 0.4;
    boneRot(vrm, 'leftUpperLeg', 0.55 * (1 - lift), 0, 0);
    boneRot(vrm, 'rightUpperLeg', 0.55 * (1 - lift), 0, 0);
    boneRot(vrm, 'leftLowerLeg', 0.15 * (1 - lift), 0, 0);
    boneRot(vrm, 'rightLowerLeg', 0.15 * (1 - lift), 0, 0);
    boneRot(vrm, 'leftUpperArm', -0.65 * lift, 0, 1.32);
    boneRot(vrm, 'rightUpperArm', -0.65 * lift, 0, -1.32);
    return Math.sin(((t - 0.15) / 0.4) * Math.PI) * 0.38;
  }

  const land = (t - 0.55) / 0.2;
  boneRot(vrm, 'leftUpperLeg', 0.35 * (1 - land), 0, 0);
  boneRot(vrm, 'rightUpperLeg', 0.35 * (1 - land), 0, 0);
  boneRot(vrm, 'leftLowerLeg', 0.45 * (1 - land), 0, 0);
  boneRot(vrm, 'rightLowerLeg', 0.45 * (1 - land), 0, 0);
  return 0;
}

export function hasDirectionInput(input: LocomotionInput): boolean {
  return input.forward || input.backward || input.left || input.right;
}

/**
 * Procedural idle / walk / run / jump on VRM humanoid bones.
 * Walk and run play only while a direction key is held.
 */
export function updateVrmLocomotion(
  vrm: VRM,
  state: VrmLocomotionState,
  delta: number,
  input: LocomotionInput,
): void {
  if (!hasVrmHumanoid(vrm)) return;

  const hasDirection = hasDirectionInput(input);

  if (input.jumpPressed && state.jumpElapsed < 0 && state.mode !== 'jump') {
    state.jumpElapsed = 0;
    state.mode = 'jump';
  } else if (state.jumpElapsed < 0) {
    if (hasDirection) {
      state.mode = input.mode === 'run' ? 'run' : 'walk';
    } else {
      state.mode = 'idle';
    }
  }

  if (state.jumpElapsed >= 0) {
    state.jumpElapsed += delta;
    const jumpY = applyJumpPose(vrm, state.jumpElapsed);
    state.position.y = jumpY;
    if (state.jumpElapsed > 0.75) {
      state.jumpElapsed = -1;
      state.mode = hasDirection ? (input.mode === 'run' ? 'run' : 'walk') : 'idle';
      state.position.y = 0;
    }
    return;
  }

  let moveX = 0;
  let moveZ = 0;
  if (input.forward) moveZ -= 1;
  if (input.backward) moveZ += 1;
  if (input.left) moveX -= 1;
  if (input.right) moveX += 1;

  const moveLen = Math.hypot(moveX, moveZ);
  if (moveLen > 0) {
    moveX /= moveLen;
    moveZ /= moveLen;
    state.heading = Math.atan2(moveX, moveZ);
  }

  const animating = state.mode === 'walk' || state.mode === 'run';
  const speed = state.mode === 'run' ? 2.8 : state.mode === 'walk' ? 1.4 : 0;

  if (animating) {
    const cycleSpeed = state.mode === 'run' ? 11 : 7;
    state.phase += delta * cycleSpeed;
    applyLegCycle(vrm, state.phase, state.mode === 'run' ? 0.62 : 0.48, state.mode === 'run' ? 0.72 : 0.55);
    applyArmSwing(vrm, state.phase, state.mode === 'run' ? 0.42 : 0.28);
    boneRot(vrm, 'spine', state.mode === 'run' ? 0.12 : 0.04, 0, 0);
    boneRot(vrm, 'chest', state.mode === 'run' ? 0.06 : 0.02, 0, 0);
    state.position.y = Math.abs(Math.sin(state.phase)) * (state.mode === 'run' ? 0.035 : 0.02);

    if (speed > 0 && moveLen > 0) {
      state.position.x += moveX * speed * delta;
      state.position.z += moveZ * speed * delta;
    }
  } else {
    state.phase += delta;
    applyIdlePose(vrm, state.phase);
    state.position.y = MathUtils.damp(state.position.y, 0, 8, delta);
  }
}
