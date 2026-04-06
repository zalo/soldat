// web/main.js — Entry point: loads assets, instantiates WASM, runs game loop
import { loadAssets } from './assets.js';
import { createFilesystemBridge, createGLBridge, createAudioBridge, setGlobalWasmInstance } from './bridge.js?v=4';
import { createInputBridge } from './input.js?v=4';
import { createNetworkBridge, getRoomFromURL } from './network.js';

const progressFill = document.getElementById('progress-bar-fill');
const progressText = document.getElementById('progress-text');
const progressDetail = document.getElementById('progress-detail');

function updateProgress(pct, msg) {
  progressFill.style.width = (pct * 100) + '%';
  // Split detail from main message at "..."
  if (msg.includes('...') && msg.length > 30) {
    const parts = msg.split('...');
    progressText.textContent = parts[0] + '...';
    progressDetail.textContent = parts.slice(1).join('...').trim();
  } else {
    progressText.textContent = msg;
    progressDetail.textContent = '';
  }
}

async function main() {
  // 1. Load and cache game assets
  const { fileMap, imageMap } = await loadAssets(updateProgress);

  // 2. Setup canvas and WebGL
  updateProgress(1.0, 'Initializing WebGL...');
  const canvas = document.getElementById('game-canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // 3. Load WASM module
  updateProgress(1.0, 'Loading game...');
  const wasmResp = await fetch('soldat.wasm?v=' + Date.now());
  const wasmBytes = await wasmResp.arrayBuffer();

  // 4. Build bridge imports
  // Memory proxy — points to the WASM module's memory once instantiated
  let memory = null;
  const memoryProxy = new Proxy({}, {
    get(target, prop) {
      if (prop === 'buffer') return memory.buffer;
      return undefined;
    }
  });

  const fsBridge = createFilesystemBridge(memoryProxy, fileMap);
  const glBridge = createGLBridge(memoryProxy, canvas);
  const audioBridge = createAudioBridge(memoryProxy);
  const inputBridge = createInputBridge(memoryProxy, canvas);
  const netBridge = createNetworkBridge(memoryProxy);

  // SDL timing imports (microsecond precision via performance.now)
  const perfStart = performance.now();
  const sdlBridge = {
    sdl_get_performance_counter: () => {
      // Return microseconds as i64 — FPC expects Int64
      return BigInt(Math.round((performance.now() - perfStart) * 1000));
    },
    sdl_get_performance_frequency: () => {
      return BigInt(1000000); // microseconds
    },
  };

  // web_stop: called from Pascal to abort _start without running unit finalizers
  const controlBridge = {
    web_stop: () => {
      throw new Error('web_stop: _start completed — game state preserved');
    },
  };

  // Merge all bridge imports into env
  const envImports = {
    ...fsBridge,
    ...glBridge,
    ...audioBridge,
    ...inputBridge,
    ...netBridge,
    ...sdlBridge,
    ...controlBridge,
  };

  // Catch-all proxy for undefined imports (Steam/GNS stubs, etc.)
  const envProxy = new Proxy(envImports, {
    get(target, prop) {
      if (prop in target) return target[prop];
      // Return a no-op stub that returns 0
      return (...args) => 0;
    }
  });

  // WASI stubs for FPC wasm32 runtime
  const wasi = {
    wasi_snapshot_preview1: {
      args_get: () => 0,
      args_sizes_get: (countPtr, sizePtr) => {
        const dv = new DataView(memory.buffer);
        dv.setUint32(countPtr, 0, true);
        dv.setUint32(sizePtr, 0, true);
        return 0;
      },
      environ_get: () => 0,
      environ_sizes_get: (countPtr, sizePtr) => {
        const dv = new DataView(memory.buffer);
        dv.setUint32(countPtr, 0, true);
        dv.setUint32(sizePtr, 0, true);
        return 0;
      },
      clock_time_get: (clockId, precision, timePtr) => {
        // Return current time in nanoseconds
        const now = BigInt(Math.round(performance.now() * 1_000_000));
        const dv = new DataView(memory.buffer);
        dv.setBigUint64(timePtr, now, true);
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
      fd_write: (fd, iovs, iovsLen, nwrittenPtr) => {
        const dv = new DataView(memory.buffer);
        const mem = new Uint8Array(memory.buffer);
        let written = 0;
        for (let i = 0; i < iovsLen; i++) {
          const ptr = dv.getUint32(iovs + i * 8, true);
          const len = dv.getUint32(iovs + i * 8 + 4, true);
          const chunk = new TextDecoder().decode(mem.subarray(ptr, ptr + len));
          console.log('[soldat]', chunk);
          written += len;
        }
        dv.setUint32(nwrittenPtr, written, true);
        return 0;
      },
      fd_filestat_set_times: () => 0,
      fd_readdir: () => 0,
      path_create_directory: () => 0,
      path_filestat_get: () => 0,
      path_filestat_set_times: () => 0,
      path_open: () => 0,
      path_readlink: () => 0,
      path_remove_directory: () => 0,
      path_rename: () => 0,
      path_unlink_file: () => 0,
      poll_oneoff: () => 0,
      proc_exit: (code) => {
        console.log('proc_exit(' + code + ')');
        // Throw to abort _start without letting FPC finalize the runtime.
        // We catch this in the caller.
        throw new WebAssembly.RuntimeError('proc_exit(' + code + ')');
      },
      random_get: (bufPtr, bufLen) => {
        crypto.getRandomValues(new Uint8Array(memory.buffer, bufPtr, bufLen));
        return 0;
      },
    }
  };

  // Build a content-based lookup for stbi: hash first 32 bytes + length → decoded image
  const imageByContent = new Map();
  for (const [path, fileData] of fileMap.entries()) {
    const img = imageMap.get(path);
    if (img) {
      // Key: length + first 16 bytes as hex
      const header = Array.from(fileData.subarray(0, Math.min(16, fileData.length)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      const key = fileData.length + ':' + header;
      imageByContent.set(key, img);
    }
  }
  console.log(`[soldat] Image content lookup: ${imageByContent.size} entries`);

  // STB image decoder — uses pre-decoded imageMap via content matching
  const stbModule = {
    stbi_xload_mem: (bufferPtr, len, wPtr, hPtr, fPtr, delaysPtr) => {
      const dv = new DataView(memory.buffer);
      const data = new Uint8Array(memory.buffer, bufferPtr, Math.min(len, 16));

      // Build content key from the WASM memory data
      const header = Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('');
      const key = len + ':' + header;
      const img = imageByContent.get(key);

      if (!stbModule._totalCalls) stbModule._totalCalls = 0;
      stbModule._totalCalls++;

      if (!img) {
        if (!stbModule._missCount) stbModule._missCount = 0;
        stbModule._missCount++;
        if (stbModule._missCount <= 10) {
          console.warn(`[stb] MISS #${stbModule._missCount}: len=${len} key=${key.substring(0,40)}`);
        }
        dv.setInt32(wPtr, 0, true);
        dv.setInt32(hPtr, 0, true);
        dv.setInt32(fPtr, 0, true);
        return 0;
      }
      if (!stbModule._hitCount) stbModule._hitCount = 0;
      stbModule._hitCount++;
      // Verify pixel data size matches dimensions
      const pixelSize = img.width * img.height * 4;
      if (img.pixels.length < pixelSize) {
        console.error(`[stb] HIT #${stbModule._hitCount}: ${img.width}x${img.height} PIXEL SIZE MISMATCH: have ${img.pixels.length}, need ${pixelSize}`);
        dv.setInt32(wPtr, 0, true);
        dv.setInt32(hPtr, 0, true);
        dv.setInt32(fPtr, 0, true);
        return 0;
      }
      // Write dimensions
      dv.setInt32(wPtr, img.width, true);
      dv.setInt32(hPtr, img.height, true);
      dv.setInt32(fPtr, 1, true); // 1 frame (not animated)
      if (delaysPtr) dv.setInt32(delaysPtr, 0, true);

      // Grow WASM memory if needed and allocate at the end
      // Use a simple bump allocator in high memory to avoid FPC heap conflicts
      if (!stbModule._bumpPtr) {
        // Start allocating at the current end of memory
        stbModule._bumpPtr = memory.buffer.byteLength;
      }
      // Ensure enough memory
      const needed = stbModule._bumpPtr + pixelSize;
      const currentSize = memory.buffer.byteLength;
      if (needed > currentSize) {
        const pagesToGrow = Math.ceil((needed - currentSize) / 65536);
        wasmInstance.exports.memory.grow(pagesToGrow);
      }
      const outPtr = stbModule._bumpPtr;
      stbModule._bumpPtr += pixelSize;
      // Align to 16 bytes
      stbModule._bumpPtr = (stbModule._bumpPtr + 15) & ~15;

      console.log(`[stb] HIT #${stbModule._hitCount}: ${img.width}x${img.height} ptr=${outPtr} end=${outPtr+pixelSize}/${memory.buffer.byteLength}`);
      new Uint8Array(memory.buffer).set(img.pixels.subarray(0, pixelSize), outPtr);
      return outPtr;
    },

    stbi_image_free: (dataPtr) => {
      // No-op: pixel data is in the JS bump allocator region, not FPC heap.
      // Calling FreeMem on bump pointers would corrupt the heap.
    },

    stbi_write_png: () => 0,
    stbir_resize_uint8: (inPtr, inW, inH, inStride, outPtr, outW, outH, outStride, numChannels) => {
      console.log(`[stb] resize: ${inW}x${inH} -> ${outW}x${outH} ch=${numChannels} inStride=${inStride} outStride=${outStride}`);
      // Nearest-neighbor resize
      const src = new Uint8Array(memory.buffer);
      const dst = new Uint8Array(memory.buffer);
      for (let y = 0; y < outH; y++) {
        const sy = Math.floor(y * inH / outH);
        for (let x = 0; x < outW; x++) {
          const sx = Math.floor(x * inW / outW);
          for (let c = 0; c < numChannels; c++) {
            dst[outPtr + (y * outW + x) * numChannels + c] =
              src[inPtr + (sy * inW + sx) * numChannels + c];
          }
        }
      }
      return 1;
    },
    stbi_load: () => 0,
    stbi_xload_file: () => 0,
    stbi_load_from_memory: () => 0,
    stbi_write_bmp: () => 0,
    stbi_write_tga: () => 0,
    stbi_write_hdr: () => 0,
  };

  // FreeType implementation via Canvas 2D
  // Rasterizes glyphs using OffscreenCanvas and writes results into WASM memory
  // structures that match FT_FaceRec/FT_GlyphSlotRec layout.
  const ftBridge = (() => {
    const faces = new Map(); // facePtr → { canvas, ctx, fontSize, fontFamily }
    let nextFaceId = 1;

    // Allocate WASM memory via web_alloc (FPC heap)
    function walloc(size) {
      return wasmInstance.exports.web_alloc(size);
    }

    // Write i32 at WASM address
    function w32(ptr, val) {
      new DataView(memory.buffer).setInt32(ptr, val, true);
    }
    function wu32(ptr, val) {
      new DataView(memory.buffer).setUint32(ptr, val, true);
    }
    function w16(ptr, val) {
      new DataView(memory.buffer).setInt16(ptr, val, true);
    }
    function wu16(ptr, val) {
      new DataView(memory.buffer).setUint16(ptr, val, true);
    }
    function w8(ptr, val) {
      new Uint8Array(memory.buffer)[ptr] = val;
    }

    // FT_FaceRec field offsets (wasm32 — all pointers are 4 bytes)
    // Must match the Pascal record layout exactly
    const FACE = {
      num_faces: 0,        // FT_Long = i32 on wasm32
      face_index: 4,
      face_flags: 8,
      style_flags: 12,
      num_glyphs: 16,
      family_name: 20,     // pointer
      style_name: 24,      // pointer
      num_fixed_sizes: 28,
      available_sizes: 32, // pointer
      num_charmaps: 36,
      charmaps: 40,        // pointer
      // generic: 2 pointers (data + finalizer) = 8 bytes
      generic_data: 44,
      generic_finalizer: 48,
      // bbox: 4 x FT_Pos (i32) = 16 bytes
      bbox: 52,
      units_per_EM: 68,    // FT_UShort = u16
      ascender: 70,        // FT_Short = i16
      descender: 72,
      height: 74,
      max_advance_width: 76,
      max_advance_height: 78,
      underline_position: 80,
      underline_thickness: 82,
      glyph: 84,           // pointer to GlyphSlotRec
      size: 88,            // pointer to SizeRec
    };
    const FACE_SIZE = 256; // generous allocation

    // FT_GlyphSlotRec field offsets
    const SLOT = {
      lib: 0,
      face: 4,
      next: 8,
      glyph_index: 12,
      // generic: 8 bytes
      generic: 16,
      // metrics: 8 x FT_Pos (i32) = 32 bytes
      metrics_width: 24,
      metrics_height: 28,
      metrics_horiBearingX: 32,
      metrics_horiBearingY: 36,
      metrics_horiAdvance: 40,
      metrics_vertBearingX: 44,
      metrics_vertBearingY: 48,
      metrics_vertAdvance: 52,
      linearHoriAdvance: 56,
      linearVertAdvance: 60,
      // advance: FT_Vector = 2 x FT_Pos = 8 bytes
      advance_x: 64,
      advance_y: 68,
      format: 72,
      // bitmap: FT_Bitmap
      bitmap_rows: 76,
      bitmap_width: 80,
      bitmap_pitch: 84,
      bitmap_buffer: 88,   // pointer
      bitmap_num_grays: 92, // u16
      bitmap_pixel_mode: 94, // u8
      bitmap_palette_mode: 95,
      bitmap_palette: 96,
      bitmap_left: 100,
      bitmap_top: 104,
    };
    const SLOT_SIZE = 256;

    // FT_SizeRec + FT_Size_Metrics
    const SIZE_METRICS = {
      // FT_SizeRec: face(4) + generic(8) + metrics...
      x_ppem: 12,   // after face(4) + generic(8)
      y_ppem: 14,
      x_scale: 16,
      y_scale: 20,
      ascender: 24,
      descender: 28,
      height: 32,
      max_advance: 36,
    };
    const SIZE_SIZE = 64;

    return {
      FT_Init_FreeType: (alibPtr) => {
        const libPtr = walloc(4);
        wu32(alibPtr, libPtr);
        return 0; // FT_Err_Ok
      },

      FT_Done_FreeType: (lib) => 0,

      FT_New_Face: (lib, filenamePtr, faceIndex, afacePtr) => {
        // Allocate FT_FaceRec + FT_GlyphSlotRec + FT_SizeRec in WASM memory
        const facePtr = walloc(FACE_SIZE);
        const slotPtr = walloc(SLOT_SIZE);
        const sizePtr = walloc(SIZE_SIZE);
        const mem = new Uint8Array(memory.buffer);

        // Zero out
        mem.fill(0, facePtr, facePtr + FACE_SIZE);
        mem.fill(0, slotPtr, slotPtr + SLOT_SIZE);
        mem.fill(0, sizePtr, sizePtr + SIZE_SIZE);

        // Set face flags
        w32(facePtr + FACE.face_flags, 0x51); // SCALABLE | HORIZONTAL | KERNING
        w32(facePtr + FACE.num_glyphs, 65536);
        wu16(facePtr + FACE.units_per_EM, 2048);
        w16(facePtr + FACE.ascender, 1900);
        w16(facePtr + FACE.descender, -500);
        w16(facePtr + FACE.height, 2400);
        w16(facePtr + FACE.max_advance_width, 1200);

        // Link glyph slot and size
        wu32(facePtr + FACE.glyph, slotPtr);
        wu32(facePtr + FACE.size, sizePtr);
        wu32(slotPtr + SLOT.face, facePtr);
        wu32(sizePtr + 0, facePtr); // SizeRec.face

        // Store face info for JS side
        const canvas = new OffscreenCanvas(256, 256);
        const ctx = canvas.getContext('2d');
        faces.set(facePtr, { canvas, ctx, fontSize: 16, fontFamily: 'sans-serif' });

        wu32(afacePtr, facePtr);
        console.log(`[FT] New face at ${facePtr}, slot=${slotPtr}, size=${sizePtr}`);
        return 0;
      },

      FT_New_Memory_Face: (lib, fileBase, fileSize, faceIndex, afacePtr) => {
        // Same as FT_New_Face but for memory-loaded fonts
        // We don't have the actual font data, just use default
        return ftBridge.FT_New_Face(lib, 0, faceIndex, afacePtr);
      },

      FT_Done_Face: (facePtr) => {
        faces.delete(facePtr);
        return 0;
      },

      FT_Select_Charmap: (facePtr, encoding) => 0,

      FT_Request_Size: (facePtr, reqPtr) => {
        const dv = new DataView(memory.buffer);
        // FT_Size_RequestRec: type(4) + width(4) + height(4) + hRes(4) + vRes(4)
        const height = dv.getInt32(reqPtr + 8, true); // height in 26.6 or units
        const face = faces.get(facePtr);
        if (face) {
          // Height is in 1/64th points for FT_SIZE_REQUEST_TYPE_NOMINAL
          face.fontSize = Math.max(1, Math.round(height / 64));
          // Update size metrics in WASM memory
          const sizePtr = dv.getUint32(facePtr + FACE.size, true);
          if (sizePtr) {
            const px = face.fontSize;
            wu16(sizePtr + SIZE_METRICS.x_ppem, px);
            wu16(sizePtr + SIZE_METRICS.y_ppem, px);
            // ascender/descender in 26.6 fixed point
            w32(sizePtr + SIZE_METRICS.ascender, Math.round(px * 0.9 * 64));
            w32(sizePtr + SIZE_METRICS.descender, Math.round(-px * 0.25 * 64));
            w32(sizePtr + SIZE_METRICS.height, Math.round(px * 1.2 * 64));
            w32(sizePtr + SIZE_METRICS.max_advance, Math.round(px * 0.6 * 64));
          }
        }
        return 0;
      },

      FT_Set_Char_Size: (facePtr, charW, charH, hRes, vRes) => 0,
      FT_Set_Pixel_Sizes: (facePtr, pixW, pixH) => 0,

      FT_Get_Char_Index: (facePtr, charcode) => {
        // Return charcode as glyph index (identity mapping)
        return charcode > 0 ? charcode : 0;
      },

      FT_Load_Glyph: (facePtr, glyphIndex, loadFlags) => {
        const face = faces.get(facePtr);
        if (!face) return 1;

        const ch = String.fromCodePoint(glyphIndex > 0 ? glyphIndex : 32);
        const px = face.fontSize;
        const { canvas, ctx } = face;

        // Resize canvas if needed
        const cSize = Math.max(px * 2, 64);
        if (canvas.width < cSize) {
          canvas.width = cSize;
          canvas.height = cSize;
        }

        // Measure and render glyph using alphabetic baseline
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.font = `${px}px sans-serif`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = 'white';
        const m = ctx.measureText(ch);

        // actualBoundingBox values are relative to the alphabetic baseline
        const ascent = Math.ceil(m.actualBoundingBoxAscent || Math.round(px * 0.8));
        const descent = Math.ceil(m.actualBoundingBoxDescent || Math.round(px * 0.2));
        const bboxLeft = Math.ceil(m.actualBoundingBoxLeft || 0);
        const bboxRight = Math.ceil(m.actualBoundingBoxRight || Math.ceil(m.width) || 1);

        const glyphW = bboxLeft + bboxRight;
        const glyphH = ascent + descent;
        const bearingX = -bboxLeft; // negative = glyph extends left of origin
        const bearingY = ascent;     // FreeType bitmap_top = distance from baseline to top of bitmap
        const advance = Math.round(m.width);

        // Render: place baseline at y=ascent so top of glyph starts at y=0
        ctx.fillText(ch, bboxLeft, ascent);

        // Read pixel data
        const readW = Math.min(glyphW + 1, canvas.width);
        const readH = Math.min(glyphH + 1, canvas.height);
        const imgData = ctx.getImageData(0, 0, readW, readH);
        const bitmapW = Math.min(glyphW, readW);
        const bitmapH = Math.min(glyphH, readH);

        // Extract grayscale alpha channel
        const bitmapSize = bitmapW * bitmapH;
        let bitmapPtr = 0;
        if (bitmapSize > 0) {
          bitmapPtr = walloc(bitmapSize);
          const dst = new Uint8Array(memory.buffer);
          for (let y = 0; y < bitmapH; y++) {
            for (let x = 0; x < bitmapW; x++) {
              // Use alpha channel (or red channel for white-on-transparent)
              const srcIdx = (y * imgData.width + x) * 4;
              dst[bitmapPtr + y * bitmapW + x] = imgData.data[srcIdx + 3]; // alpha
            }
          }
        }

        // Write to GlyphSlotRec
        const dv = new DataView(memory.buffer);
        const slotPtr = dv.getUint32(facePtr + FACE.glyph, true);

        // Metrics in 26.6 fixed point (multiply by 64)
        w32(slotPtr + SLOT.metrics_width, bitmapW * 64);
        w32(slotPtr + SLOT.metrics_height, bitmapH * 64);
        w32(slotPtr + SLOT.metrics_horiBearingX, bearingX * 64);
        w32(slotPtr + SLOT.metrics_horiBearingY, bearingY * 64);
        w32(slotPtr + SLOT.metrics_horiAdvance, advance * 64);
        w32(slotPtr + SLOT.advance_x, advance * 64);
        w32(slotPtr + SLOT.advance_y, 0);

        // Format = BITMAP
        wu32(slotPtr + SLOT.format, 0x62697473);

        // Bitmap
        wu32(slotPtr + SLOT.bitmap_rows, bitmapH);
        wu32(slotPtr + SLOT.bitmap_width, bitmapW);
        w32(slotPtr + SLOT.bitmap_pitch, bitmapW);
        wu32(slotPtr + SLOT.bitmap_buffer, bitmapPtr);
        wu16(slotPtr + SLOT.bitmap_num_grays, 256);
        w8(slotPtr + SLOT.bitmap_pixel_mode, 2); // FT_PIXEL_MODE_GRAY

        // Bearing
        w32(slotPtr + SLOT.bitmap_left, bearingX);
        w32(slotPtr + SLOT.bitmap_top, bearingY);

        return 0;
      },

      FT_Get_Kerning: (facePtr, leftGlyph, rightGlyph, kernMode, akernPtr) => {
        // No kerning data from Canvas 2D — return zero
        w32(akernPtr, 0);     // x
        w32(akernPtr + 4, 0); // y
        return 0;
      },
    };
  })();

  // Add FreeType bridge to env imports (after definition)
  Object.assign(envImports, ftBridge);

  // Forward reference for stb module callbacks
  let wasmInstance = null;

  // 5. Instantiate WASM
  const { instance } = await WebAssembly.instantiate(wasmBytes, {
    ...wasi,
    env: envProxy,
    'stb.so': stbModule,
  });
  memory = instance.exports.memory;
  wasmInstance = instance;
  setGlobalWasmInstance(instance);

  // 6. Initialize game
  // _start runs: RTL init → unit init sections → main block (calls StartGame)
  // → Halt(0) → proc_exit. We throw in proc_exit to prevent RTL finalization,
  // keeping the runtime alive for web_tick calls.
  // Debug: show sample of file paths in the smod archive
  const samplePaths = [...fileMap.keys()].slice(0, 20);
  console.log('[soldat] Asset file map: ' + fileMap.size + ' files. Sample:', samplePaths);

  console.log('[soldat] Calling _start (RTL init + StartGame)...');
  try {
    instance.exports._start();
  } catch (e) {
    if (e.message && e.message.includes('web_stop')) {
      console.log('[soldat] _start completed — game state preserved for web_tick');
    } else if (e.message && e.message.includes('proc_exit')) {
      console.warn('[soldat] _start ended via proc_exit — unit finalizers may have run!');
    } else {
      throw e;
    }
  }

  // 7. Hide loading, show canvas and lobby
  document.getElementById('loading').style.display = 'none';
  canvas.style.display = 'block';

  // Resume audio on first interaction
  const resumeAudio = () => {
    audioBridge.al_resume();
    document.removeEventListener('click', resumeAudio);
    document.removeEventListener('touchstart', resumeAudio);
  };
  document.addEventListener('click', resumeAudio);
  document.addEventListener('touchstart', resumeAudio);

  // Handle resize — also fire once on start to sync dimensions
  function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (instance.exports.web_resize)
      instance.exports.web_resize(canvas.width, canvas.height);
  }
  window.addEventListener('resize', handleResize);
  handleResize();

  // Helper: call join_room WASM export with a string
  function joinRoom(roomName) {
    if (!instance.exports.join_room) return;
    const encoder = new TextEncoder();
    const roomBytes = encoder.encode(roomName);
    const ptr = instance.exports.web_alloc(roomBytes.length + 1);
    new Uint8Array(memory.buffer).set(roomBytes, ptr);
    new Uint8Array(memory.buffer)[ptr + roomBytes.length] = 0;
    instance.exports.join_room(ptr);
    document.getElementById('lobby').style.display = 'none';
  }

  // 8. Lobby flow
  const room = getRoomFromURL();
  const lobbyEl = document.getElementById('lobby');

  if (room) {
    // Auto-join from URL hash
    joinRoom(room);
  } else {
    // Show lobby
    lobbyEl.style.display = 'flex';

    document.getElementById('btn-create-game').addEventListener('click', () => {
      const roomName = 'game-' + Math.random().toString(36).substring(2, 8);
      window.location.hash = '#room=' + roomName;
      joinRoom(roomName);
    });

    document.getElementById('btn-join').addEventListener('click', () => {
      const roomName = document.getElementById('input-room').value.trim();
      if (roomName) {
        window.location.hash = '#room=' + roomName;
        joinRoom(roomName);
      }
    });

    document.getElementById('btn-offline').addEventListener('click', () => {
      lobbyEl.style.display = 'none';
      // Spawn local player for offline mode
      if (instance.exports.web_spawn_offline) {
        instance.exports.web_spawn_offline();
      }
    });
  }

  // 9. Game loop via requestAnimationFrame
  let tickCount = 0;
  function frame() {
    if (instance.exports.web_tick) {
      try {
        instance.exports.web_tick();
      } catch (e) {
        if (tickCount < 5) console.error('web_tick error:', e.message);
        // Don't stop on WASM traps — some sprites have bad texture pointers
        // that will resolve once all textures are properly loaded
      }
      tickCount++;
      if (tickCount <= 3 || tickCount % 300 === 0) {
        console.log(`[soldat] web_tick #${tickCount}`);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Expose game state for testing/debugging
  window._soldat = {
    getMySprite: () => instance.exports.web_get_my_sprite?.() ?? -1,
    getMapChangeCounter: () => instance.exports.web_get_map_change_counter?.() ?? 0,
    getRequestingGame: () => instance.exports.web_get_requesting_game?.() ?? 0,
    getConnectionState: () => instance.exports.web_get_connection_state?.() ?? 0,
    joinRoom: joinRoom,
    spawnOffline: () => instance.exports.web_spawn_offline?.(),
    tickCount: () => tickCount,
  };
}

main().catch((e) => {
  progressText.textContent = 'Error: ' + e.message;
  console.error(e);
});
