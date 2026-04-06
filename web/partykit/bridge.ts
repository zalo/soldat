// web/partykit/bridge.ts — Server-side WASM imports (filesystem, logging, clock)

export function createServerBridge(
  memory: { buffer: ArrayBuffer },
  bundledAssets: Map<string, Uint8Array>
) {
  // Open file handles
  const openFiles = new Map<number, { data: Uint8Array; pos: number; name: string }>();
  let nextHandle = 1;

  function readString(ptr: number): string {
    const view = new Uint8Array(memory.buffer);
    let end = ptr;
    while (view[end] !== 0) end++;
    return new TextDecoder().decode(view.subarray(ptr, end));
  }

  function lookupFile(name: string): Uint8Array | undefined {
    let result = bundledAssets.get(name);
    if (result) return result;
    result = bundledAssets.get(name.toLowerCase());
    if (result) return result;
    // Normalize backslashes
    const normalized = name.replace(/\\/g, '/');
    result = bundledAssets.get(normalized) || bundledAssets.get(normalized.toLowerCase());
    return result;
  }

  return {
    // PhysFS filesystem — reads from bundled assets
    physfs_init: () => 1,
    physfs_deinit: () => 0,
    physfs_mount: () => 1,

    physfs_open_read: (filenamePtr: number) => {
      const name = readString(filenamePtr);
      const data = lookupFile(name);
      if (!data) return 0; // null = not found
      const handle = nextHandle++;
      openFiles.set(handle, { data, pos: 0, name });
      return handle;
    },

    physfs_exists: (filenamePtr: number) => {
      const name = readString(filenamePtr);
      return lookupFile(name) ? 1 : 0;
    },

    physfs_eof: (handle: number) => {
      const f = openFiles.get(handle);
      return (!f || f.pos >= f.data.length) ? 1 : 0;
    },

    physfs_read: (handle: number, bufferPtr: number, objSize: number, objCount: number): bigint => {
      const f = openFiles.get(handle);
      if (!f) return BigInt(-1);
      const totalBytes = objSize * objCount;
      const available = f.data.length - f.pos;
      const toRead = Math.min(totalBytes, available);
      new Uint8Array(memory.buffer).set(f.data.subarray(f.pos, f.pos + toRead), bufferPtr);
      f.pos += toRead;
      return BigInt(Math.floor(toRead / objSize));
    },

    physfs_close: (handle: number): bigint => {
      openFiles.delete(handle);
      return BigInt(1);
    },

    physfs_get_last_error: () => 0,

    physfs_file_length: (handle: number): bigint => {
      const f = openFiles.get(handle);
      return BigInt(f ? f.data.length : -1);
    },

    physfs_remove_from_search_path: () => 1,
    physfs_free_list: () => {},

    physfs_enumerate_files: (dirPtr: number) => {
      // Return 0 (null pointer) — simplified enumeration
      return 0;
    },

    // Server-specific imports
    fs_read_file: (namePtr: number, outPtr: number, maxSize: number): number => {
      const name = readString(namePtr);
      const data = lookupFile(name);
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

    // web_stop: called from Pascal to abort _start cleanly
    web_stop: () => {
      throw new Error('web_stop: server_init completed — game state preserved');
    },
  };
}
