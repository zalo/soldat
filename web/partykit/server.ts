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
  _startTime: number = Date.now();
  connIdMap: Map<string, number> = new Map();
  nextConnId: number = 1;

  constructor(readonly room: Party.Room) {}

  async onStart() {
    // Load server smod (3.2MB) — contains maps, weapons, configs needed by game server
    const bundledAssets = new Map<string, Uint8Array>();
    try {
      let smodBytes: Uint8Array | null = null;

      // Try reading from filesystem (works in local dev with miniflare/workerd)
      try {
        const fs = await import('node:fs');
        const path = await import('node:path');
        // Try multiple paths — bundled location varies
        const candidates = [
          path.resolve(process.cwd(), 'soldat-server.smod'),
          path.resolve(process.cwd(), 'web/partykit/soldat-server.smod'),
          path.resolve(process.cwd(), '..', 'web', 'partykit', 'soldat-server.smod'),
        ];
        // __dirname may not be defined in workerd
        try { candidates.unshift(path.resolve(__dirname, 'soldat-server.smod')); } catch {}
        for (const p of candidates) {
          try {
            if (fs.existsSync(p)) {
              smodBytes = new Uint8Array(fs.readFileSync(p));
              console.log(`[soldat-server] Loaded smod from ${p} (${smodBytes.length} bytes)`);
              break;
            }
          } catch {}
        }
      } catch (e: any) {
        console.warn(`[soldat-server] fs not available: ${e?.message?.substring(0, 60)}`);
      }

      // Fallback: fetch from known URLs (production)
      if (!smodBytes) {
        const urls = [
          'https://opensoldat.zalo.partykit.dev/soldat-server.smod',
          'https://soldat.sels.tech/soldat-server.smod',
        ];
        for (const url of urls) {
          try {
            const resp = await fetch(url);
            if (resp.ok) {
              smodBytes = new Uint8Array(await resp.arrayBuffer());
              console.log(`[soldat-server] Fetched smod from ${url} (${smodBytes.length} bytes)`);
              break;
            }
          } catch {}
        }
      }

      if (smodBytes && smodBytes.length > 100) {
        const files = unzipSync(smodBytes);
        for (const [fpath, data] of Object.entries(files)) {
          bundledAssets.set(fpath, data);
        }
        console.log(`[soldat-server] Loaded ${bundledAssets.size} assets from smod`);
      } else {
        console.warn('[soldat-server] No smod data loaded — map will not work!');
      }
    } catch (e: any) {
      console.error('[soldat-server] Failed to load smod:', e?.message?.substring(0, 100));
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
          // Return nanoseconds since process start (monotonic)
          // Using epoch time causes GetTickCount64 overflow → Trunc crash
          if (!this._startTime) this._startTime = Date.now();
          const ns = BigInt(Date.now() - this._startTime) * BigInt(1000000);
          const dv = new DataView(memoryProxy.buffer);
          dv.setBigUint64(resultPtr, ns, true);
          return 0;
        },
        poll_oneoff: () => 0,
        sched_yield: () => 0,
        proc_exit: (code: number) => {
          console.log('[soldat-server] proc_exit(' + code + ')');
          // MUST throw to abort before FPC unit finalizers run.
          // Finalizers destroy Players list, weapons, map data etc.
          // Throwing here preserves the initialized game state for
          // subsequent server_tick/server_on_message calls.
          throw new Error('proc_exit(' + code + ')');
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
    // Run a few ticks to initialize timing before any connections
    for (let i = 0; i < 10; i++) {
      try { (this.wasm.exports as any).server_tick(); } catch {}
    }
    console.log('[soldat-server] WASM ready. Exports:', Object.keys(this.wasm.exports).filter(k => k.startsWith('server_') || k === 'alloc_buffer').join(', '));
  }

  initialized = false;

  private initServer() {
    if (this.initialized) return;
    this.initialized = true;
    console.log('[soldat-server] Calling _start...');
    try {
      (this.wasm.exports as any)._start();
    } catch {
      // Expected: _start ends with proc_exit → unreachable trap
    }
    console.log('[soldat-server] Server initialized');
  }

  async onConnect(conn: Party.Connection) {
    this.initServer();

    const connId = this.nextConnId++;
    this.connIdMap.set(conn.id, connId);
    console.log(`[soldat-server] Player connected: ${connId}`);

    if ((this.wasm.exports as any).server_on_connect) {
      try {
        (this.wasm.exports as any).server_on_connect(connId);
        this.flushOutboundMessages();
      } catch (e: any) {
        console.error('[soldat-server] server_on_connect error:', e?.message?.substring(0, 80));
      }
    }

    // Start game loop when first player connects
    if (!this.interval) {
      this.interval = setInterval(() => {
        try {
          if ((this.wasm.exports as any).server_tick) {
            (this.wasm.exports as any).server_tick();
          }
          this.flushOutboundMessages();
        } catch (e: any) {
          console.error('[soldat-server] tick error:', e?.message?.substring(0, 60));
        }
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

    try {
      if ((this.wasm?.exports as any)?.server_on_message) {
        const alloc = (this.wasm.exports as any).alloc_buffer;
        if (alloc) {
          const ptr = alloc(bytes.length);
          new Uint8Array(this.memory.buffer).set(bytes, ptr);
          (this.wasm.exports as any).server_on_message(connId, ptr, bytes.length);
        }
      }
      // Flush immediately after processing
      this.flushOutboundMessages();
    } catch (e: any) {
      // Send error to client for debugging
      const errMsg = `SERVER_ERROR:${e?.message?.substring(0, 200) || 'unknown'}`;
      try { sender.send(errMsg); } catch {}
      console.error('[soldat-server] onMessage error:', errMsg);
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

  outboundPtr: number = 0;

  private flushOutboundMessages() {
    const getOutbound = (this.wasm.exports as any).server_get_outbound;
    if (!getOutbound) return;

    const alloc = (this.wasm.exports as any).alloc_buffer;
    if (!alloc) return;
    const maxSize = 65536;
    const outPtr = alloc(maxSize);
    let bytesWritten = 0;
    try {
      bytesWritten = getOutbound(outPtr, maxSize);
    } catch (e: any) {
      console.error('[flush] getOutbound error:', e?.message?.substring(0, 60));
      return;
    }
    if (bytesWritten <= 0) return;
    if (bytesWritten > 100 || !this._flushCount) {
      this._flushCount = (this._flushCount || 0) + 1;
      console.log(`[flush] ${bytesWritten} bytes to send, connMap size=${this.connIdMap.size}`);
    }

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

      const msgId = payload.length > 0 ? payload[0] : -1;
      if (targetConnId === 0) {
        this.room.broadcast(payload);
      } else {
        let sent = false;
        for (const [partyId, cId] of this.connIdMap) {
          if (cId === targetConnId) {
            const targetConn = this.room.getConnection(partyId);
            if (targetConn) {
              targetConn.send(payload);
              sent = true;
            } else {
              console.warn(`[flush] conn ${targetConnId} not found via getConnection`);
            }
            break;
          }
        }
        if (!sent) {
          console.warn(`[flush] no mapping for connId=${targetConnId} msgId=${msgId}, map size=${this.connIdMap.size}, keys=[${[...this.connIdMap.values()].join(',')}]`);
        }
      }
    }
  }

  // HTTP request handler — proxy smod download from GitHub with CORS
  async onRequest(req: Party.Request) {
    const url = new URL(req.url);
    if (url.pathname === '/parties/main/assets/soldat.smod' || url.pathname.endsWith('/soldat.smod')) {
      const ghUrl = 'https://github.com/opensoldat/base/releases/download/v0.4/soldat.smod';
      const upstream = await fetch(ghUrl, { redirect: 'follow' });
      if (!upstream.ok) {
        return new Response('Failed to fetch smod', { status: 502 });
      }
      return new Response(upstream.body, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Length': upstream.headers.get('Content-Length') || '',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=86400',
        },
      });
    }
    return new Response('Not found', { status: 404 });
  }
}
