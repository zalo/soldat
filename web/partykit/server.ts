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
    // Load server-only asset bundle (maps, configs, anims — 3.2MB)
    const bundledAssets = new Map<string, Uint8Array>();
    try {
      // Fetch server smod from the static serve (same origin)
      const origin = this.room.env?.PARTYKIT_HOST
        ? `https://${this.room.env.PARTYKIT_HOST}`
        : 'http://127.0.0.1:1999';
      const smodResp = await fetch(`${origin}/partykit/soldat-server.smod`).catch(() => null);
      if (smodResp && smodResp.ok) {
        const { unzipSync } = await import('fflate');
        const smodBytes = new Uint8Array(await smodResp.arrayBuffer());
        const files = unzipSync(smodBytes);
        for (const [path, data] of Object.entries(files)) {
          if (data.length > 0) bundledAssets.set(path, data as Uint8Array);
        }
        console.log(`[soldat-server] Loaded ${bundledAssets.size} assets from server smod`);
      } else {
        console.warn('[soldat-server] Could not fetch server smod — server will run without assets');
      }
    } catch (e) {
      console.warn('[soldat-server] Failed to load server smod:', e);
    }

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
        fd_fdstat_get: () => 8, // EBADF — no valid fds (prevents infinite loop in FPC RTL init)
        fd_fdstat_set_flags: () => 0,
        fd_filestat_get: () => 8,
        fd_filestat_set_size: () => 0,
        fd_filestat_set_times: () => 0,
        fd_prestat_get: () => 8, // EBADF — no preopened directories
        fd_prestat_dir_name: () => 8,
        fd_read: () => 0,
        fd_readdir: () => 0,
        fd_seek: () => 0,
        fd_sync: () => 0,
        fd_tell: () => 0,
        fd_write: (fd: number, iovs: number, iovsLen: number, nwrittenPtr: number) => {
          try {
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
          } catch { /* memory may be detached during shutdown */ }
          return 0;
        },
        path_create_directory: () => 0,
        path_filestat_get: () => 0,
        path_filestat_set_times: () => 0,
        path_open: () => 0,
        path_readlink: () => 0,
        path_remove_directory: () => 0,
        path_rename: () => 0,
        path_unlink_file: () => 0,
        clock_time_get: (id: number, precision: bigint, resultPtr: number) => {
          // Return nanoseconds since epoch
          const ns = BigInt(Date.now()) * BigInt(1000000);
          const dv = new DataView(this.memory.buffer);
          dv.setBigUint64(resultPtr, ns, true);
          return 0;
        },
        poll_oneoff: () => 0,
        sched_yield: () => 0,
        proc_exit: (code: number) => {
          console.log('[soldat-server] proc_exit(' + code + ')');
          throw new Error('web_stop: server_init completed');
        },
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
    console.log('[soldat-server] Loading WASM...');
    let wasmModule: WebAssembly.Module;
    try {
      const mod = await import('./soldatserver.wasm');
      wasmModule = mod.default;
      console.log('[soldat-server] WASM loaded via import');
    } catch {
      const resp = await fetch(`${origin}/partykit/soldatserver.wasm`);
      if (!resp.ok) throw new Error(`Failed to fetch soldatserver.wasm: ${resp.status}`);
      wasmModule = await WebAssembly.compile(await resp.arrayBuffer());
      console.log('[soldat-server] WASM loaded via fetch');
    }

    console.log('[soldat-server] Instantiating WASM...');
    try {
      const { instance } = await WebAssembly.instantiate(wasmModule, {
        ...wasi,
        env: envProxy,
      });
      this.wasm = instance;
      console.log('[soldat-server] WASM instantiated OK');
    } catch (e: any) {
      console.error('[soldat-server] WASM instantiation FAILED:', e.message);
      throw e;
    }
    this.memory = this.wasm.exports.memory as WebAssembly.Memory;
    memoryRef = this.memory;
    console.log('[soldat-server] WASM instantiated, calling _start...');

    // Initialize server game state
    // _start runs: RTL init → unit init → main block (server_init + web_stop throw)
    try {
      (this.wasm.exports as any)._start();
    } catch (e: any) {
      if (e.message && (e.message.includes('web_stop') || e.message.includes('proc_exit') || e.message.includes('unreachable'))) {
        console.log('[soldat-server] Server initialized (caught:', e.message.substring(0, 60), ')');
      } else {
        console.error('[soldat-server] _start FAILED:', e.message);
        throw e;
      }
    }

    console.log('[soldat-server] Server ready. Exports:', Object.keys(this.wasm.exports).filter(k => k.startsWith('server_') || k === 'alloc_buffer').join(', '));
  }

  async onConnect(conn: Party.Connection) {
    const connId = this.nextConnId++;
    this.connIdMap.set(conn.id, connId);
    console.log(`[soldat-server] onConnect: connId=${connId}, partyId=${conn.id}`);

    if ((this.wasm.exports as any).server_on_connect) {
      (this.wasm.exports as any).server_on_connect(connId);
    } else {
      console.warn('[soldat-server] server_on_connect export not found!');
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

    console.log(`[soldat-server] onMessage: connId=${connId}, ${bytes.length} bytes, MsgID=${bytes[0]}`);
    if ((this.wasm.exports as any).server_on_message) {
      const alloc = (this.wasm.exports as any).alloc_buffer;
      if (alloc) {
        const ptr = alloc(bytes.length);
        new Uint8Array(this.memory.buffer).set(bytes, ptr);
        (this.wasm.exports as any).server_on_message(connId, ptr, bytes.length);
      } else {
        console.warn('[soldat-server] alloc_buffer export not found!');
      }
    } else {
      console.warn('[soldat-server] server_on_message export not found!');
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
