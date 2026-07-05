import * as THREE from 'three';
import type { AvatarBodyType, PartPreviewMeta } from '@ams/shared-types';
import { getAttachPosition, HUMANOID_BASE, MASCOT_BASE } from './attach-points';

function createPartMesh(preview: PartPreviewMeta): THREE.Mesh {
  const [ax, ay, az] = getAttachPosition(preview.attachTo);
  const [ox, oy, oz] = preview.offset;
  const [sx, sy, sz] = preview.scale;
  const position = new THREE.Vector3(ax + ox, ay + oy, az + oz);
  const scale = new THREE.Vector3(sx, sy, sz);
  const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(preview.color) });

  let geometry: THREE.BufferGeometry;
  switch (preview.geometry) {
    case 'sphere':
      geometry = new THREE.SphereGeometry(0.2, 16, 16);
      break;
    case 'capsule':
      geometry = new THREE.CapsuleGeometry(0.15, 0.4, 8, 16);
      break;
    case 'cylinder':
      geometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 12);
      break;
    default:
      geometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
      break;
  }

  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(position);
  mesh.scale.copy(scale);
  return mesh;
}

function addHumanoidBase(group: THREE.Group) {
  const { skinColor, bodyColor } = HUMANOID_BASE;
  const skin = new THREE.Color(skinColor);
  const body = new THREE.Color(bodyColor);

  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.22, 16, 16),
    new THREE.MeshStandardMaterial({ color: skin }),
  );
  head.position.set(0, 1.5, 0);
  group.add(head);

  const torso = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.2, 0.5, 8, 16),
    new THREE.MeshStandardMaterial({ color: body }),
  );
  torso.position.set(0, 0.9, 0);
  group.add(torso);

  for (const [x, rotZ] of [
    [-0.35, 0.3],
    [0.35, -0.3],
  ] as const) {
    const arm = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.06, 0.35, 6, 12),
      new THREE.MeshStandardMaterial({ color: body }),
    );
    arm.position.set(x, 0.95, 0);
    arm.rotation.z = rotZ;
    group.add(arm);
  }

  for (const x of [-0.12, 0.12]) {
    const leg = new THREE.Mesh(
      new THREE.CapsuleGeometry(0.07, 0.45, 6, 12),
      new THREE.MeshStandardMaterial({ color: skin }),
    );
    leg.position.set(x, 0.35, 0);
    group.add(leg);
  }
}

function addMascotBase(group: THREE.Group) {
  const { bodyColor, headColor } = MASCOT_BASE;
  const body = new THREE.Color(bodyColor);
  const head = new THREE.Color(headColor);

  const bodyMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.35, 20, 20),
    new THREE.MeshStandardMaterial({ color: body }),
  );
  bodyMesh.position.set(0, 0.75, 0);
  bodyMesh.scale.set(1.2, 1.2, 1.2);
  group.add(bodyMesh);

  const headMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.25, 16, 16),
    new THREE.MeshStandardMaterial({ color: head }),
  );
  headMesh.position.set(0, 1.35, 0);
  group.add(headMesh);

  for (const x of [-0.15, 0.15]) {
    const foot = new THREE.Mesh(
      new THREE.SphereGeometry(0.1, 12, 12),
      new THREE.MeshStandardMaterial({ color: body }),
    );
    foot.position.set(x, 0.25, 0);
    group.add(foot);
  }
}

export function buildPartsScene(
  bodyType: AvatarBodyType,
  parts: PartPreviewMeta[],
): THREE.Scene {
  const scene = new THREE.Scene();
  const avatar = new THREE.Group();

  if (bodyType === 'humanoid_vrm') {
    addHumanoidBase(avatar);
  } else {
    addMascotBase(avatar);
  }

  for (const preview of parts) {
    avatar.add(createPartMesh(preview));
  }

  scene.add(avatar);
  return scene;
}
