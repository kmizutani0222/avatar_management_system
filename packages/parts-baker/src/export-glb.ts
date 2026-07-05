import * as THREE from 'three';
import { ensureGltfExportPolyfills } from './node-polyfills';

export function exportSceneToGlb(scene: THREE.Scene): Promise<Buffer> {
  ensureGltfExportPolyfills();

  // Dynamic import after polyfills — GLTFExporter uses FileReader at module load in some paths
  return import('three/examples/jsm/exporters/GLTFExporter.js').then(({ GLTFExporter }) => {
    const exporter = new GLTFExporter();

    return new Promise((resolve, reject) => {
      exporter.parse(
        scene,
        (result) => {
          if (result instanceof ArrayBuffer) {
            resolve(Buffer.from(result));
            return;
          }
          reject(new Error('Expected binary GLB export'));
        },
        (error) => reject(error instanceof Error ? error : new Error(String(error))),
        { binary: true },
      );
    });
  });
}
