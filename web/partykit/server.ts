// web/partykit/server.ts — PartyKit server: loads soldatserver.wasm, manages rooms
import type * as Party from 'partykit/server';
import { createServerBridge } from './bridge';

export default class SoldatServer implements Party.Server {
  wasm!: WebAssembly.Instance;
  memory!: WebAssembly.Memory;
  interval: ReturnType<typeof setInterval> | null = null;
  connIdMap: Map<string, number> = new Map();
  nextConnId: number = 1;

  constructor(readonly room: Party.Room) {}

  async onStart() {
    // Load bundled map/config assets (to be populated with actual game data)
    const bundledAssets = new Map<string, Uint8Array>();

    // Memory proxy — updated after instantiation
    let memoryRef: WebAssembly.Memory | null = null;
    const memoryProxy = {
      get buffer() { return memoryRef ? memoryRef.buffer : new ArrayBuffer(0); }
    };

    const bridge = createServerBridge(memoryProxy, bundledAssets);

    // WASI stubs
    const wasi = {
      wasi_snapshot_preview1: {
        args_get: () => 0,
        args_sizes_get: (countPtr: number, sizePtr: number) => {
          const dv = new DataView(this.memory.buffer);
          dv.setUint32(countPtr, 0, true);
          dv.setUint32(sizePtr, 0, true);
          return 0;
        },
        environ_get: () => 0,
        environ_sizes_get: (countPtr: number, sizePtr: number) => {
          const dv = new DataView(this.memory.buffer);
          dv.setUint32(countPtr, 0, true);
          dv.setUint32(sizePtr, 0, true);
          return 0;
        },
        fd_close: () => 0,
        fd_fdstat_get: () => 0,
        fd_filestat_get: () => 0,
        fd_filestat_set_size: () => 0,
        fd_prestat_get: () => 8,
        fd_prestat_dir_name: () => 8,
        fd_read: () => 0,
        fd_seek: () => 0,
        fd_tell: () => 0,
        fd_write: (fd: number, iovs: number, iovsLen: number, nwrittenPtr: number) => {
          const dv = new DataView(this.memory.buffer);
          let written = 0;
          for (let i = 0; i < iovsLen; i++) {
            const ptr = dv.getUint32(iovs + i * 8, true);
            const len = dv.getUint32(iovs + i * 8 + 4, true);
            console.log('[soldat-server]',
              new TextDecoder().decode(new Uint8Array(this.memory.buffer, ptr, len)));
            written += len;
          }
          dv.setUint32(nwrittenPtr, written, true);
          return 0;
        },
        path_create_directory: () => 0,
        path_filestat_get: () => 0,
        path_open: () => 0,
        path_readlink: () => 0,
        path_remove_directory: () => 0,
        path_rename: () => 0,
        path_unlink_file: () => 0,
        proc_exit: (code: number) => { console.log('proc_exit(' + code + ')'); },
        random_get: (bufPtr: number, bufLen: number) => {
          // Cloudflare Workers have crypto.getRandomValues
          const buf = new Uint8Array(this.memory.buffer, bufPtr, bufLen);
          crypto.getRandomValues(buf);
          return 0;
        },
      }
    };

    // Catch-all proxy for undefined env imports
    const envProxy = new Proxy(bridge as Record<string, Function>, {
      get(target, prop: string) {
        if (prop in target) return target[prop];
        return (..._args: unknown[]) => 0;
      }
    });

    // Instantiate WASM
    // Note: In PartyKit deployment, soldatserver.wasm is imported as a module
    // via the "file" loader. For local dev, we fetch it.
    let wasmModule: WebAssembly.Module;
    try {
      // Try importing as bundled module (deployment)
      const mod = await import('./soldatserver.wasm');
      wasmModule = mod.default;
    } catch {
      // Fallback: fetch for local dev
      const resp = await fetch('/soldatserver.wasm');
      wasmModule = await WebAssembly.compile(await resp.arrayBuffer());
    }

    this.wasm = new WebAssembly.Instance(wasmModule, {
      ...wasi,
      env: envProxy,
    });
    this.memory = this.wasm.exports.memory as WebAssembly.Memory;
    memoryRef = this.memory;

    // Initialize server game state
    if ((this.wasm.exports as any)._initialize) {
      (this.wasm.exports as any)._initialize();
    }
    if ((this.wasm.exports as any).server_init) {
      (this.wasm.exports as any).server_init();
    }
  }

  async onConnect(conn: Party.Connection) {
    const connId = this.nextConnId++;
    this.connIdMap.set(conn.id, connId);

    if ((this.wasm.exports as any).server_on_connect) {
      (this.wasm.exports as any).server_on_connect(connId);
    }

    // Start game loop when first player connects
    if (!this.interval) {
      this.interval = setInterval(() => {
        if ((this.wasm.exports as any).server_tick) {
          (this.wasm.exports as any).server_tick();
        }
        this.flushOutboundMessages();
      }, 1000 / 60);
    }
  }

  async onMessage(message: string | ArrayBuffer, sender: Party.Connection) {
    const connId = this.connIdMap.get(sender.id);
    if (connId === undefined) return;

    let bytes: Uint8Array;
    if (message instanceof ArrayBuffer) {
      bytes = new Uint8Array(message);
    } else {
      bytes = new TextEncoder().encode(message);
    }

    if ((this.wasm.exports as any).server_on_message) {
      const alloc = (this.wasm.exports as any).wasiAlloc || (this.wasm.exports as any).alloc_buffer;
      if (alloc) {
        const ptr = alloc(bytes.length);
        new Uint8Array(this.memory.buffer).set(bytes, ptr);
        (this.wasm.exports as any).server_on_message(connId, ptr, bytes.length);
      }
    }
  }

  async onClose(conn: Party.Connection) {
    const connId = this.connIdMap.get(conn.id);
    if (connId !== undefined) {
      if ((this.wasm.exports as any).server_on_disconnect) {
        (this.wasm.exports as any).server_on_disconnect(connId);
      }
      this.connIdMap.delete(conn.id);
    }

    // Stop tick loop if no players
    if (this.connIdMap.size === 0 && this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  private flushOutboundMessages() {
    const getOutbound = (this.wasm.exports as any).server_get_outbound;
    if (!getOutbound) return;

    const alloc = (this.wasm.exports as any).wasiAlloc || (this.wasm.exports as any).alloc_buffer;
    if (!alloc) return;

    const maxSize = 65536;
    const outPtr = alloc(maxSize);
    const bytesWritten = getOutbound(outPtr, maxSize);
    if (bytesWritten <= 0) return;

    // Parse outbound message queue:
    // Format: [targetConnId: i32][payloadLen: i32][payload bytes]...
    let offset = 0;
    while (offset + 8 <= bytesWritten) {
      const dv = new DataView(this.memory.buffer, outPtr + offset);
      const targetConnId = dv.getInt32(0, true);
      const payloadLen = dv.getInt32(4, true);
      offset += 8;

      if (offset + payloadLen > bytesWritten) break;
      const payload = new Uint8Array(this.memory.buffer, outPtr + offset, payloadLen).slice();
      offset += payloadLen;

      if (targetConnId === 0) {
        this.room.broadcast(payload);
      } else {
        for (const [partyId, cId] of this.connIdMap) {
          if (cId === targetConnId) {
            const targetConn = this.room.getConnection(partyId);
            if (targetConn) targetConn.send(payload);
            break;
          }
        }
      }
    }
  }
}
