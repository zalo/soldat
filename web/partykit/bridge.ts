// web/partykit/bridge.ts — Server-side WASM imports (filesystem, logging, clock)

export function createServerBridge(
  memory: { buffer: ArrayBuffer },
  bundledAssets: Map<string, Uint8Array>
) {
  function readString(ptr: number): string {
    const view = new Uint8Array(memory.buffer);
    let end = ptr;
    while (view[end] !== 0) end++;
    return new TextDecoder().decode(view.subarray(ptr, end));
  }

  return {
    // Filesystem — reads from bundled assets
    physfs_init: () => 1,
    physfs_deinit: () => 0,
    physfs_mount: () => 1,
    physfs_open_read: (filenamePtr: number) => {
      // Simplified: return 0 (null) — server loads files via fs_read_file
      return 0;
    },
    physfs_exists: (filenamePtr: number) => {
      const name = readString(filenamePtr);
      return (bundledAssets.has(name) || bundledAssets.has(name.toLowerCase())) ? 1 : 0;
    },
    physfs_eof: () => 1,
    physfs_read: () => -1,
    physfs_close: () => 1,
    physfs_get_last_error: () => 0,
    physfs_file_length: () => -1,
    physfs_remove_from_search_path: () => 1,
    physfs_free_list: () => {},
    physfs_enumerate_files: () => 0,

    // Server-specific imports
    fs_read_file: (namePtr: number, outPtr: number, maxSize: number): number => {
      const name = readString(namePtr);
      const data = bundledAssets.get(name) || bundledAssets.get(name.toLowerCase());
      if (!data) return -1;
      const toCopy = Math.min(data.length, maxSize);
      new Uint8Array(memory.buffer).set(data.subarray(0, toCopy), outPtr);
      return toCopy;
    },

    log_message: (ptr: number, len: number): void => {
      console.log('[soldat-server]',
        new TextDecoder().decode(new Uint8Array(memory.buffer, ptr, len)));
    },

    get_time_ms: (): number => Date.now(),
  };
}
