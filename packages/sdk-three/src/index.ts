import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, VRMUtils, type VRM } from '@pixiv/three-vrm';
import type { Object3D, Texture } from 'three';
import type { AmsClient } from '@ams/sdk-web';
import {
  applyVrmRestPose,
  createVrmLocomotionState,
  updateVrmLocomotion,
  type LocomotionInput,
  type VrmLocomotionState,
} from './vrm-locomotion';
import {
  findSwayNodes,
  loadGlbFromArrayBuffer,
  updateGlbRuntime,
  type LoadedAmsGlb,
  type UpdateGlbOptions,
} from './glb-loader';

export interface AmsModelClient {
  fetchModel(id: string): Promise<ArrayBuffer>;
  getAvatar?(id: string): Promise<{ format?: string }>;
}

export interface LoadAmsVrmOptions {
  /** Rotate legacy VRM0 models into VRM1 coordinate convention. Safe to leave enabled. */
  rotateVrm0?: boolean;
  /** Remove unused vertices after load. */
  removeUnnecessaryVertices?: boolean;
  /** Combine skeletons after load. */
  combineSkeletons?: boolean;
}

export interface LoadedAmsVrm {
  avatarId?: string;
  vrm: VRM;
  gltf: GLTF;
  objectUrl: string;
  /** Remove from parent, dispose geometries/materials/textures, and revoke Blob URL. */
  dispose(): void;
}

export type LoadedAmsModel = LoadedAmsVrm | LoadedAmsGlb;

export type ExpressionValues = Record<string, number>;

export interface UpdateVrmOptions {
  expressions?: ExpressionValues;
  /** Usually a camera or target Object3D. Assigned to vrm.lookAt.target when present. */
  lookAtTarget?: Object3D;
  locomotion?: LocomotionInput;
  locomotionState?: VrmLocomotionState;
}

function createObjectUrl(buffer: ArrayBuffer, mime: string): string {
  return URL.createObjectURL(new Blob([buffer], { type: mime }));
}

function disposeTexture(value: unknown): void {
  const maybeTexture = value as Partial<Texture> | undefined;
  if (maybeTexture?.isTexture && typeof maybeTexture.dispose === 'function') {
    maybeTexture.dispose();
  }
}

function disposeObject3D(root: Object3D): void {
  root.traverse((object) => {
    const mesh = object as Object3D & {
      geometry?: { dispose?: () => void };
      material?: unknown;
    };

    mesh.geometry?.dispose?.();

    const materials = Array.isArray(mesh.material)
      ? mesh.material
      : mesh.material
        ? [mesh.material]
        : [];

    for (const material of materials) {
      const record = material as Record<string, unknown> & { dispose?: () => void };
      for (const value of Object.values(record)) {
        disposeTexture(value);
      }
      record.dispose?.();
    }
  });
}

export async function loadVrmFromArrayBuffer(
  buffer: ArrayBuffer,
  options: LoadAmsVrmOptions = {},
): Promise<LoadedAmsVrm> {
  const objectUrl = createObjectUrl(buffer, 'model/vrm');
  const loader = new GLTFLoader();
  loader.register((parser) => new VRMLoaderPlugin(parser));

  try {
    const gltf = await loader.loadAsync(objectUrl);
    const vrm = gltf.userData.vrm as VRM | undefined;
    if (!vrm) {
      throw new Error('AMS model is not a VRM file');
    }

    if (options.removeUnnecessaryVertices ?? true) {
      VRMUtils.removeUnnecessaryVertices(gltf.scene);
    }
    if (options.combineSkeletons ?? true) {
      VRMUtils.combineSkeletons(gltf.scene);
    }
    if (options.rotateVrm0 ?? true) {
      VRMUtils.rotateVRM0(vrm);
    }

    return {
      vrm,
      gltf,
      objectUrl,
      dispose() {
        vrm.scene.removeFromParent();
        disposeObject3D(vrm.scene);
        URL.revokeObjectURL(objectUrl);
      },
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export async function loadAmsVrm(
  client: AmsModelClient,
  avatarId: string,
  options?: LoadAmsVrmOptions,
): Promise<LoadedAmsVrm> {
  const loaded = await loadVrmFromArrayBuffer(await client.fetchModel(avatarId), options);
  return { ...loaded, avatarId };
}

/** Load VRM or GLB based on avatar metadata (falls back to VRM loader probe). */
export async function loadAmsModel(
  client: AmsModelClient,
  avatarId: string,
  options?: LoadAmsVrmOptions,
): Promise<LoadedAmsModel> {
  const format = client.getAvatar ? (await client.getAvatar(avatarId)).format : undefined;
  const buffer = await client.fetchModel(avatarId);

  if (format === 'glb') {
    return loadGlbFromArrayBuffer(buffer).then((loaded) => ({ ...loaded, avatarId }));
  }

  try {
    return await loadVrmFromArrayBuffer(buffer, options).then((loaded) => ({ ...loaded, avatarId }));
  } catch {
    return loadGlbFromArrayBuffer(buffer).then((loaded) => ({ ...loaded, avatarId }));
  }
}

export function isLoadedVrm(model: LoadedAmsModel): model is LoadedAmsVrm {
  return 'vrm' in model;
}

export function isLoadedGlb(model: LoadedAmsModel): model is LoadedAmsGlb {
  return 'swayNodes' in model;
}

export function setExpression(vrm: VRM, name: string, value: number, update = true): void {
  vrm.expressionManager?.setValue(name, value);
  if (update) vrm.expressionManager?.update();
}

export function applyExpressions(vrm: VRM, expressions: ExpressionValues, update = true): void {
  for (const [name, value] of Object.entries(expressions)) {
    vrm.expressionManager?.setValue(name, value);
  }
  if (update) vrm.expressionManager?.update();
}

export function updateVrmRuntime(
  vrm: VRM,
  deltaSeconds: number,
  options: UpdateVrmOptions = {},
): void {
  if (options.locomotion && options.locomotionState) {
    updateVrmLocomotion(vrm, options.locomotionState, deltaSeconds, options.locomotion);
  }

  if (options.expressions) {
    applyExpressions(vrm, options.expressions, false);
  }

  const lookAt = vrm.lookAt as { target?: Object3D | null } | undefined;
  if (lookAt && options.lookAtTarget) {
    lookAt.target = options.lookAtTarget;
  }

  vrm.expressionManager?.update();
  vrm.update(deltaSeconds);
}

export {
  applyVrmRestPose,
  createVrmLocomotionState,
  updateVrmLocomotion,
  hasVrmHumanoid,
  hasDirectionInput,
  DEFAULT_LOCOMOTION_INPUT,
  type LocomotionInput,
  type LocomotionMode,
  type VrmLocomotionState,
} from './vrm-locomotion';

export {
  loadGlbFromArrayBuffer,
  loadAmsGlb,
  findSwayNodes,
  updateGlbRuntime,
  type LoadedAmsGlb,
  type UpdateGlbOptions,
} from './glb-loader';

export type { VRM, GLTF, AmsClient };
