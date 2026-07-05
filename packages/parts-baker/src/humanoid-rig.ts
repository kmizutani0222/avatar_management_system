import * as THREE from 'three';
import { HUMANOID_BASE } from './attach-points';
import type { ExpressionMorphSettings, PartPreviewMeta } from '@ams/shared-types';
import { createExpressionHeadMesh } from './expression-morphs';

/**
 * VRM 1.0 humanoid bone names → world positions (T-pose).
 * Node names in the exported GLB match these keys exactly so the
 * VRMC_vrm extension can reference them by name.
 */
export const HUMANOID_BONE_WORLD: Record<string, [number, number, number]> = {
  hips: [0, 0.7, 0],
  spine: [0, 0.85, 0],
  chest: [0, 1.0, 0],
  neck: [0, 1.35, 0],
  head: [0, 1.5, 0],
  leftShoulder: [0.15, 1.2, 0],
  leftUpperArm: [0.25, 1.2, 0],
  leftLowerArm: [0.5, 1.2, 0],
  leftHand: [0.72, 1.2, 0],
  rightShoulder: [-0.15, 1.2, 0],
  rightUpperArm: [-0.25, 1.2, 0],
  rightLowerArm: [-0.5, 1.2, 0],
  rightHand: [-0.72, 1.2, 0],
  leftUpperLeg: [0.12, 0.65, 0],
  leftLowerLeg: [0.12, 0.35, 0],
  leftFoot: [0.12, 0.07, 0],
  rightUpperLeg: [-0.12, 0.65, 0],
  rightLowerLeg: [-0.12, 0.35, 0],
  rightFoot: [-0.12, 0.07, 0],
};

/** Which bone each attach point parents to (root stays on the scene). */
export const ATTACH_TO_BONE: Record<PartPreviewMeta['attachTo'], string | null> = {
  head: 'head',
  body: 'spine',
  back: 'chest',
  root: null,
};

function bone(name: string, parent: THREE.Object3D): THREE.Group {
  const group = new THREE.Group();
  group.name = name;
  const [wx, wy, wz] = HUMANOID_BONE_WORLD[name];
  const parentWorld = new THREE.Vector3();
  parent.getWorldPosition(parentWorld);
  group.position.set(wx - parentWorld.x, wy - parentWorld.y, wz - parentWorld.z);
  parent.add(group);
  group.updateMatrixWorld(true);
  return group;
}

function skinMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(HUMANOID_BASE.skinColor) });
}

function bodyMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: new THREE.Color(HUMANOID_BASE.bodyColor) });
}

function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position: [number, number, number] = [0, 0, 0],
  rotationZ = 0,
): void {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...position);
  mesh.rotation.z = rotationZ;
  parent.add(mesh);
}

/**
 * Rigged humanoid base body: a VRM-standard bone hierarchy (named Groups)
 * with body meshes parented to the corresponding bones, in T-pose.
 */
export function buildHumanoidRigScene(
  expressionSettings?: ExpressionMorphSettings,
): THREE.Scene {
  const scene = new THREE.Scene();

  const hips = bone('hips', scene);
  const spine = bone('spine', hips);
  const chest = bone('chest', spine);
  const neck = bone('neck', chest);
  const head = bone('head', neck);

  const leftShoulder = bone('leftShoulder', chest);
  const leftUpperArm = bone('leftUpperArm', leftShoulder);
  const leftLowerArm = bone('leftLowerArm', leftUpperArm);
  const leftHand = bone('leftHand', leftLowerArm);

  const rightShoulder = bone('rightShoulder', chest);
  const rightUpperArm = bone('rightUpperArm', rightShoulder);
  const rightLowerArm = bone('rightLowerArm', rightUpperArm);
  const rightHand = bone('rightHand', rightLowerArm);

  const leftUpperLeg = bone('leftUpperLeg', hips);
  const leftLowerLeg = bone('leftLowerLeg', leftUpperLeg);
  const leftFoot = bone('leftFoot', leftLowerLeg);

  const rightUpperLeg = bone('rightUpperLeg', hips);
  const rightLowerLeg = bone('rightLowerLeg', rightUpperLeg);
  const rightFoot = bone('rightFoot', rightLowerLeg);

  head.add(createExpressionHeadMesh(skinMaterial(), expressionSettings));
  addMesh(spine, new THREE.CapsuleGeometry(0.2, 0.5, 8, 16), bodyMaterial(), [0, 0.05, 0]);

  const armGeo = () => new THREE.CapsuleGeometry(0.06, 0.2, 6, 12);
  addMesh(leftUpperArm, armGeo(), bodyMaterial(), [0.12, 0, 0], Math.PI / 2);
  addMesh(leftLowerArm, armGeo(), bodyMaterial(), [0.11, 0, 0], Math.PI / 2);
  addMesh(leftHand, new THREE.SphereGeometry(0.05, 8, 8), skinMaterial());
  addMesh(rightUpperArm, armGeo(), bodyMaterial(), [-0.12, 0, 0], Math.PI / 2);
  addMesh(rightLowerArm, armGeo(), bodyMaterial(), [-0.11, 0, 0], Math.PI / 2);
  addMesh(rightHand, new THREE.SphereGeometry(0.05, 8, 8), skinMaterial());

  const legGeo = () => new THREE.CapsuleGeometry(0.07, 0.2, 6, 12);
  addMesh(leftUpperLeg, legGeo(), skinMaterial(), [0, -0.15, 0]);
  addMesh(leftLowerLeg, legGeo(), skinMaterial(), [0, -0.14, 0]);
  addMesh(leftFoot, new THREE.BoxGeometry(0.1, 0.06, 0.2), skinMaterial(), [0, -0.03, 0.04]);
  addMesh(rightUpperLeg, legGeo(), skinMaterial(), [0, -0.15, 0]);
  addMesh(rightLowerLeg, legGeo(), skinMaterial(), [0, -0.14, 0]);
  addMesh(rightFoot, new THREE.BoxGeometry(0.1, 0.06, 0.2), skinMaterial(), [0, -0.03, 0.04]);

  return scene;
}
