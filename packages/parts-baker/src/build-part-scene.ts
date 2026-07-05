import * as THREE from 'three';
import { AvatarBodyType, type PartPreviewMeta } from '@ams/shared-types';
import { getAttachPosition } from './attach-points';

function createPartMesh(bodyType: AvatarBodyType, preview: PartPreviewMeta): THREE.Mesh {
  const [ax, ay, az] = getAttachPosition(preview.attachTo, bodyType);
  const [ox, oy, oz] = preview.offset;
  const [sx, sy, sz] = preview.scale;
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
  mesh.position.set(ax + ox, ay + oy, az + oz);
  mesh.scale.set(sx, sy, sz);
  return mesh;
}

/** Export a single procedural part mesh as GLB (no body base). */
export function buildPartOnlyScene(
  preview: PartPreviewMeta,
  bodyType: AvatarBodyType = AvatarBodyType.HUMANOID_VRM,
): THREE.Scene {
  const scene = new THREE.Scene();
  scene.add(createPartMesh(bodyType, preview));
  return scene;
}
