// web/partykit/server.ts — PartyKit server: loads soldatserver.wasm, manages rooms
import type * as Party from 'partykit/server';
import { createServerBridge } from './bridge';
import { unzipSync } from 'fflate';
// @ts-ignore — imported as WebAssembly.Module by esbuild file loader
import wasmModule from './soldatserver.wasm';

export default class SoldatServer implements Party.Server {
  wasm!: WebAssembly.Instance;
  memory!: WebAssembly.Memory;
  interval: ReturnType<typeof setInterval> | null = null;
  connIdMap: Map<string, number> = new Map();
  nextConnId: number = 1;

  constructor(readonly room: Party.Room) {}

  async onStart() {
    // Skip smod loading for now — causes onStart to exceed CPU limits
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
          const dv = new DataView(memoryProxy.buffer);
          dv.setUint32(countPtr, 0, true);
          dv.setUint32(sizePtr, 0, true);
          return 0;
        },
        environ_get: () => 0,
        environ_sizes_get: (countPtr: number, sizePtr: number) => {
          const dv = new DataView(memoryProxy.buffer);
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
            const dv = new DataView(memoryProxy.buffer);
            let written = 0;
            for (let i = 0; i < iovsLen; i++) {
              const ptr = dv.getUint32(iovs + i * 8, true);
              const len = dv.getUint32(iovs + i * 8 + 4, true);
              console.log('[soldat-server]',
                new TextDecoder().decode(new Uint8Array(memoryProxy.buffer, ptr, len)));
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
          const dv = new DataView(memoryProxy.buffer);
          dv.setBigUint64(resultPtr, ns, true);
          return 0;
        },
        poll_oneoff: () => 0,
        sched_yield: () => 0,
        proc_exit: (code: number) => {
          console.log('[soldat-server] proc_exit(' + code + ')');
          // Don't throw — let WASM return naturally. The _start function
          // won't actually return to the caller since proc_exit is __noreturn__,
          // but WASM will trap with unreachable after this returns.
          // We catch that trap in the _start try/catch.
        },
        random_get: (bufPtr: number, bufLen: number) => {
          // Cloudflare Workers have crypto.getRandomValues
          const buf = new Uint8Array(memoryProxy.buffer, bufPtr, bufLen);
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

    // Instantiate WASM — wasmModule imported as WebAssembly.Module at top of file
    console.log('[soldat-server] Instantiating WASM...');
    this.wasm = new WebAssembly.Instance(wasmModule, {
      ...wasi,
      env: envProxy,
    });
    this.memory = this.wasm.exports.memory as WebAssembly.Memory;
    memoryRef = this.memory;
    console.log('[soldat-server] WASM ready. Exports:', Object.keys(this.wasm.exports).filter(k => k.startsWith('server_') || k === 'alloc_buffer').join(', '));
  }

  initialized = false;

  private initServer() {
    if (this.initialized) return;
    this.initialized = true;
    // Skip _start — it exceeds the CPU time limit in Workers runtime.
    // Server runs without full initialization (no map loaded, etc.)
    // TODO: Find a way to initialize the server within CPU limits
    // (e.g., compile as reactor, or split init into smaller steps)
    console.log('[soldat-server] Server stub ready (no _start — CPU limit)');
  }

  async onConnect(conn: Party.Connection) {
    // Minimal handler — just track connection
    const connId = this.nextConnId++;
    this.connIdMap.set(conn.id, connId);
    conn.send('connected:' + connId);

    // Skip WASM call for now — RTL not initialized
    // if ((this.wasm.exports as any).server_on_connect) {
    //   (this.wasm.exports as any).server_on_connect(connId);
    // }

    // Start game loop when first player connects
    // Disabled: WASM not initialized
    // if (!this.interval) {
    //   this.interval = setInterval(() => {
    //     if ((this.wasm.exports as any).server_tick) {
    //       (this.wasm.exports as any).server_tick();
    //     }
    //     this.flushOutboundMessages();
    //   }, 1000 / 60);
    // }
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
      const dv = new DataView(memoryProxy.buffer, outPtr + offset);
      const targetConnId = dv.getInt32(0, true);
      const payloadLen = dv.getInt32(4, true);
      offset += 8;

      if (offset + payloadLen > bytesWritten) break;
      const payload = new Uint8Array(memoryProxy.buffer, outPtr + offset, payloadLen).slice();
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
