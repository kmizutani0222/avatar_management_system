/** Browser APIs used by three.js GLTFExporter in Node.js */
export function ensureGltfExportPolyfills(): void {
  if (typeof globalThis.FileReader === 'undefined') {
    class NodeFileReader {
      result: ArrayBuffer | null = null;
      onloadend: (() => void) | null = null;
      onerror: ((event: unknown) => void) | null = null;

      readAsArrayBuffer(blob: Blob) {
        blob
          .arrayBuffer()
          .then((buffer) => {
            this.result = buffer;
            this.onloadend?.();
          })
          .catch((error) => {
            this.onerror?.(error);
          });
      }
    }

    globalThis.FileReader = NodeFileReader as unknown as typeof FileReader;
  }
}
