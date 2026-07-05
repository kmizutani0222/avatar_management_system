import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { Object3D } from 'three';

export interface LoadedAmsGlb {
  avatarId?: string;
  gltf: GLTF;
  scene: Object3D;
  /** Nodes tagged with amsSway during AMS bake (tail/back accessories). */
  swayNodes: Object3D[];
  objectUrl: string;
  dispose(): void;
}

export interface UpdateGlbOptions {
  /** Procedural tail/back sway for amsSway nodes. */
  sway?: boolean;
}

function createObjectUrl(buffer: ArrayBuffer): string {
  return URL.createObjectURL(new Blob([buffer], { type: 'model/gltf-binary' }));
}

function disposeTexture(value: unknown): void {
  const maybeTexture = value as { isTexture?: boolean; dispose?: () => void };
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

/** Collect nodes baked with extras.amsSway === true. */
export function findSwayNodes(root: Object3D): Object3D[] {
  const nodes: Object3D[] = [];
  root.traverse((object) => {
    if (object.userData?.amsSway === true) {
      nodes.push(object);
      return;
    }
    const name = object.name.toLowerCase();
    if (name.includes('tail') || name.includes('しっぽ')) {
      nodes.push(object);
    }
  });
  return nodes;
}

export async function loadGlbFromArrayBuffer(buffer: ArrayBuffer): Promise<LoadedAmsGlb> {
  const objectUrl = createObjectUrl(buffer);
  const loader = new GLTFLoader();

  try {
    const gltf = await loader.loadAsync(objectUrl);
    const swayNodes = findSwayNodes(gltf.scene);

    return {
      gltf,
      scene: gltf.scene,
      swayNodes,
      objectUrl,
      dispose() {
        gltf.scene.removeFromParent();
        disposeObject3D(gltf.scene);
        URL.revokeObjectURL(objectUrl);
      },
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export async function loadAmsGlb(
  client: { fetchModel(id: string): Promise<ArrayBuffer> },
  avatarId: string,
): Promise<LoadedAmsGlb> {
  const loaded = await loadGlbFromArrayBuffer(await client.fetchModel(avatarId));
  return { ...loaded, avatarId };
}

let swayPhase = 0;

/** Simple procedural sway for GLB tail/back parts (quadruped / mascot). */
export function updateGlbRuntime(
  loaded: Pick<LoadedAmsGlb, 'swayNodes'>,
  deltaSeconds: number,
  options: UpdateGlbOptions = {},
): void {
  if (options.sway === false || loaded.swayNodes.length === 0) return;

  swayPhase += deltaSeconds * 2.2;
  for (let i = 0; i < loaded.swayNodes.length; i++) {
    const node = loaded.swayNodes[i];
    const phase = swayPhase + i * 0.7;
    node.rotation.x = Math.sin(phase) * 0.18;
    node.rotation.z = Math.sin(phase * 0.85) * 0.08;
  }
}

export type { GLTF };
