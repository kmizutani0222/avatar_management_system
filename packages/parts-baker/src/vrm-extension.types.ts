export interface GltfNode {
  name?: string;
  mesh?: number;
  children?: number[];
}

export interface GltfMesh {
  name?: string;
  extras?: { targetNames?: string[] };
  primitives?: Array<{ targets?: unknown[] }>;
}

export interface GltfJson {
  asset?: { generator?: string; version?: string };
  nodes?: GltfNode[];
  meshes?: GltfMesh[];
  extensionsUsed?: string[];
  extensions?: Record<string, unknown>;
}

export interface MorphTargetBind {
  node: number;
  index: number;
  weight: number;
}
