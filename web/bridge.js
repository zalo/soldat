// web/bridge.js — WASM import bridge for OpenSoldat web port
// Provides implementations for all `external 'env'` WASM imports.

// ============================================================
// Filesystem Bridge (replaces PhysFS)
// ============================================================

// Global reference to WASM instance — set by main.js after instantiation
let globalWasmInstance = null;
export function setGlobalWasmInstance(inst) { globalWasmInstance = inst; }

export function createFilesystemBridge(memory, fileMap) {
  // fileMap: Map<string, Uint8Array> from unzipped .smod
  // openFiles: tracks open file handles (PHYSFS_File is a pointer/integer in Pascal)
  const openFiles = new Map();
  let nextHandle = 1;
  // Track last opened filename for stb image lookup
  let lastOpenedFilename = '';

  function readString(ptr) {
    const view = new Uint8Array(memory.buffer);
    let end = ptr;
    while (view[end] !== 0) end++;
    return new TextDecoder().decode(view.subarray(ptr, end));
  }

  function lookupFile(name) {
    // Direct match
    let result = fileMap.get(name) || fileMap.get(name.toLowerCase());
    if (result) return result;

    // Normalize backslashes
    const normalized = name.replace(/\\/g, '/');
    result = fileMap.get(normalized) || fileMap.get(normalized.toLowerCase());
    if (result) return result;

    // Try alternate extensions (.bmp <-> .png)
    const altExts = [['.bmp', '.png'], ['.png', '.bmp']];
    for (const [from, to] of altExts) {
      if (normalized.toLowerCase().endsWith(from)) {
        const alt = normalized.substring(0, normalized.length - from.length) + to;
        result = fileMap.get(alt) || fileMap.get(alt.toLowerCase());
        if (result) return result;
      }
    }

    return null;
  }

  return {
    physfs_init: () => 1,
    physfs_deinit: () => 0,

    physfs_mount: (newDirPtr, mountPointPtr, appendToPath) => {
      // No-op for web — all files are in the flat fileMap
      return 1;
    },

    physfs_open_read: (filenamePtr) => {
      const name = readString(filenamePtr);
      const data = lookupFile(name);
      if (!data) {
        console.warn('[PhysFS] open_read MISS:', name);
        return 0;
      }
      lastOpenedFilename = name;
      const handle = nextHandle++;
      openFiles.set(handle, { data, pos: 0, name });
      return handle;
    },

    // Expose last opened filename for stb image lookup
    getLastOpenedFilename: () => lastOpenedFilename,

    physfs_exists: (filenamePtr) => {
      const name = readString(filenamePtr);
      const found = lookupFile(name) ? 1 : 0;
      if (!found) console.warn('[PhysFS] MISS:', name);
      return found;
    },

    physfs_eof: (handle) => {
      const f = openFiles.get(handle);
      return (!f || f.pos >= f.data.length) ? 1 : 0;
    },

    physfs_eof: (handle) => {
      const f = openFiles.get(handle);
      return (!f || f.pos >= f.data.length) ? 1 : 0;
    },

    physfs_read: (handle, bufferPtr, objSize, objCount) => {
      const f = openFiles.get(handle);
      if (!f) return BigInt(-1);
      const totalBytes = objSize * objCount;
      const available = f.data.length - f.pos;
      const toRead = Math.min(totalBytes, available);
      const view = new Uint8Array(memory.buffer);
      view.set(f.data.subarray(f.pos, f.pos + toRead), bufferPtr);
      f.pos += toRead;
      return BigInt(Math.floor(toRead / objSize));
    },

    physfs_close: (handle) => {
      openFiles.delete(handle);
      return BigInt(1);
    },

    physfs_get_last_error: () => 0,

    physfs_file_length: (handle) => {
      const f = openFiles.get(handle);
      return BigInt(f ? f.data.length : -1);
    },

    physfs_remove_from_search_path: (oldDirPtr) => 1,

    physfs_free_list: (listPtr) => {},

    physfs_enumerate_files: (dirPtr) => {
      // Returns PPChar: pointer to null-terminated array of C string pointers.
      // We allocate everything in WASM memory via web_alloc.
      const dir = readString(dirPtr).replace(/\\/g, '/').toLowerCase().replace(/\/$/, '');
      const matches = [];
      for (const path of fileMap.keys()) {
        const lower = path.toLowerCase();
        const parts = lower.split('/');
        const fileDir = parts.slice(0, -1).join('/');
        if (fileDir === dir) {
          matches.push(parts[parts.length - 1]); // just the filename
        }
      }
      if (matches.length === 0) return 0;

      // Need web_alloc — check if instance is available
      const alloc = globalWasmInstance?.exports?.web_alloc;
      if (!alloc) return 0;

      // Allocate array of pointers + strings
      const ptrArraySize = (matches.length + 1) * 4; // +1 for null terminator
      const ptrArrayPtr = alloc(ptrArraySize);
      const dv = new DataView(memory.buffer);

      for (let i = 0; i < matches.length; i++) {
        const strBytes = new TextEncoder().encode(matches[i]);
        const strPtr = alloc(strBytes.length + 1);
        new Uint8Array(memory.buffer).set(strBytes, strPtr);
        new Uint8Array(memory.buffer)[strPtr + strBytes.length] = 0;
        dv.setUint32(ptrArrayPtr + i * 4, strPtr, true);
      }
      dv.setUint32(ptrArrayPtr + matches.length * 4, 0, true); // null terminator

      return ptrArrayPtr;
    },
  };
}

// ============================================================
// GL Bridge (replaces dglOpenGL + SDL_GL)
// ============================================================

export function createGLBridge(memory, canvas) {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
  });
  if (!gl) throw new Error('WebGL2 not supported');

  // Handle translation: GL integer IDs <-> WebGL objects
  const objects = {
    textures:      [null],
    buffers:       [null],
    framebuffers:  [null],
    renderbuffers: [null],
    shaders:       [null],
    programs:      [null],
    uniformLocs:   [null],
    shaderTypes:   new Map(),
  };

  function allocObj(arr, obj) {
    const id = arr.length;
    arr.push(obj);
    return id;
  }

  function readString(ptr) {
    const view = new Uint8Array(memory.buffer);
    let end = ptr;
    while (view[end] !== 0) end++;
    return new TextDecoder().decode(view.subarray(ptr, end));
  }

  const memView = () => new DataView(memory.buffer);

  // GLSL 1.20 -> ES 3.00 runtime conversion
  function convertGLSL(source, isFragment) {
    let s = source;
    s = s.replace('#version 120', '#version 300 es\nprecision mediump float;');
    s = s.replace(/attribute /g, 'in ');
    s = s.replace(/varying /g, isFragment ? 'in ' : 'out ');
    s = s.replace(/texture2D\s*\(/g, 'texture(');
    s = s.replace(/gl_FragColor/g, 'fragColor');
    if (isFragment && s.includes('fragColor') && !s.includes('out vec4 fragColor')) {
      s = s.replace(/(precision mediump float;\n)/, '$1out vec4 fragColor;\n');
    }
    return s;
  }

  return {
    // --- State ---
    glEnable:     (cap) => {
      const valid = [0x0BE2,0x0B44,0x0B71,0x0BD0,0x8037,0x80A0,0x0C11,0x0B90,0x8C89,0x809E];
      if (valid.includes(cap)) {
        gl.enable(cap);
      } else {
        if (!createGLBridge._enableWarn) createGLBridge._enableWarn = {};
        if (!createGLBridge._enableWarn[cap]) {
          console.log('[GL] glEnable SKIP: 0x' + cap.toString(16));
          createGLBridge._enableWarn[cap] = true;
        }
      }
    },
    glDisable:    (cap) => {
      const valid = [0x0BE2,0x0B44,0x0B71,0x0BD0,0x8037,0x80A0,0x0C11,0x0B90,0x8C89,0x809E];
      if (valid.includes(cap)) gl.disable(cap);
    },
    glBlendFunc:  (s, d) => gl.blendFunc(s, d),
    glClearColor: (r, g, b, a) => {
      gl.clearColor(r, g, b, a);
      if (!createGLBridge._logged) { console.log('[GL] glClearColor', r, g, b, a); createGLBridge._logged = true; }
    },
    glClear:      (mask) => {
      // Flush any accumulated GL errors that could poison subsequent draw calls
      while (gl.getError() !== 0) {}
      gl.clear(mask);
      if (!createGLBridge._loggedClear) { console.log('[GL] glClear', mask); createGLBridge._loggedClear = true; }
    },
    glGetError:   () => gl.getError(),
    glViewport:   (x, y, w, h) => gl.viewport(x, y, w, h),
    glScissor:    (x, y, w, h) => gl.scissor(x, y, w, h),
    glPixelStorei:(pname, param) => gl.pixelStorei(pname, param),
    glGetIntegerv:(pname, ptr) => {
      const val = gl.getParameter(pname);
      memView().setInt32(ptr, Array.isArray(val) ? val[0] : (val | 0), true);
    },
    glGetString: () => 0,
    glFinish:    () => gl.finish(),
    glHint:      (target, mode) => {
      // Only GL_FRAGMENT_SHADER_DERIVATIVE_HINT (0x8B8B) is valid in WebGL2
      if (target === 0x8B8B) gl.hint(target, mode);
    },

    // --- Textures ---
    glGenTextures: (count, ptr) => {
      const dv = memView();
      for (let i = 0; i < count; i++) {
        const id = allocObj(objects.textures, gl.createTexture());
        dv.setUint32(ptr + i * 4, id, true);
        if (id <= 5 || id % 50 === 0) console.log(`[GL] glGenTextures: id=${id}`);
      }
    },
    glDeleteTextures: (count, ptr) => {
      const dv = memView();
      for (let i = 0; i < count; i++) {
        const id = dv.getUint32(ptr + i * 4, true);
        if (objects.textures[id]) gl.deleteTexture(objects.textures[id]);
        objects.textures[id] = null;
      }
    },
    glBindTexture:  (target, id) => gl.bindTexture(target, objects.textures[id] || null),
    glTexImage2D:   (target, level, internalformat, w, h, border, format, type, ptr) => {
      // Map legacy GL formats to WebGL2 equivalents
      let ifmt = internalformat, fmt = format;
      let channels = 4;
      if (internalformat === 0x1906 || format === 0x1906) {
        // GL_ALPHA → GL_R8/GL_RED (1 component)
        ifmt = gl.R8; fmt = gl.RED; channels = 1;
      } else if (internalformat === 0x190A || format === 0x190A) {
        // GL_LUMINANCE_ALPHA → GL_RG8/GL_RG (2 components, used for font atlas)
        ifmt = gl.RG8; fmt = gl.RG; channels = 2;
      } else if (fmt === gl.RGB) {
        channels = 3;
      } else if (fmt === gl.RED || fmt === gl.LUMINANCE) {
        channels = 1;
      } else if (fmt === gl.RG) {
        channels = 2;
      }
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      if (ptr === 0) {
        // For LA/Alpha formats, allocate as RGBA even with null data
        if (internalformat === 0x190A || format === 0x190A || internalformat === 0x1906 || format === 0x1906) {
          gl.texImage2D(target, level, gl.RGBA8, w, h, border, gl.RGBA, type, null);
        } else {
          gl.texImage2D(target, level, ifmt, w, h, border, fmt, type, null);
        }
      } else if (internalformat === 0x190A || format === 0x190A) {
        // GL_LUMINANCE_ALPHA (2 bytes per pixel) → expand to RGBA (4 bytes)
        // (L, A) → (L, L, L, A)
        const src = new Uint8Array(memory.buffer, ptr, w * h * 2);
        const rgba = new Uint8Array(w * h * 4);
        for (let i = 0; i < w * h; i++) {
          const L = src[i * 2], A = src[i * 2 + 1];
          rgba[i * 4] = L; rgba[i * 4 + 1] = L; rgba[i * 4 + 2] = L; rgba[i * 4 + 3] = A;
        }
        gl.texImage2D(target, level, gl.RGBA8, w, h, border, gl.RGBA, type, rgba);
      } else if (internalformat === 0x1906 || format === 0x1906) {
        // GL_ALPHA (1 byte per pixel) → expand to RGBA: (0, 0, 0, A)
        const src = new Uint8Array(memory.buffer, ptr, w * h);
        const rgba = new Uint8Array(w * h * 4);
        for (let i = 0; i < w * h; i++) {
          rgba[i * 4 + 3] = src[i];
        }
        gl.texImage2D(target, level, gl.RGBA8, w, h, border, gl.RGBA, type, rgba);
      } else {
        gl.texImage2D(target, level, ifmt, w, h, border, fmt, type,
          new Uint8Array(memory.buffer, ptr, w * h * channels));
      }
    },
    glTexSubImage2D: (target, level, xoff, yoff, w, h, format, type, ptr) => {
      if (ptr === 0) return;
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      if (format === 0x190A) {
        // GL_LUMINANCE_ALPHA → expand to RGBA
        const src = new Uint8Array(memory.buffer, ptr, w * h * 2);
        const rgba = new Uint8Array(w * h * 4);
        for (let i = 0; i < w * h; i++) {
          const L = src[i * 2], A = src[i * 2 + 1];
          rgba[i * 4] = L; rgba[i * 4 + 1] = L; rgba[i * 4 + 2] = L; rgba[i * 4 + 3] = A;
        }
        gl.texSubImage2D(target, level, xoff, yoff, w, h, gl.RGBA, type, rgba);
      } else if (format === 0x1906) {
        // GL_ALPHA → expand to RGBA
        const src = new Uint8Array(memory.buffer, ptr, w * h);
        const rgba = new Uint8Array(w * h * 4);
        for (let i = 0; i < w * h; i++) { rgba[i * 4 + 3] = src[i]; }
        gl.texSubImage2D(target, level, xoff, yoff, w, h, gl.RGBA, type, rgba);
      } else {
        let fmt = format, channels = 4;
        if (fmt === gl.RGB) channels = 3;
        else if (fmt === gl.RED) channels = 1;
        else if (fmt === gl.RG) channels = 2;
        gl.texSubImage2D(target, level, xoff, yoff, w, h, fmt, type,
          new Uint8Array(memory.buffer, ptr, w * h * channels));
      }
    },
    glTexParameteri:  (target, pname, param) => gl.texParameteri(target, pname, param),
    glActiveTexture:  (texture) => gl.activeTexture(texture),
    glGenerateMipmap: (target) => gl.generateMipmap(target),
    glReadPixels:     (x, y, w, h, format, type, ptr) => {
      gl.readPixels(x, y, w, h, format, type, new Uint8Array(memory.buffer, ptr, w * h * 4));
    },

    // --- Buffers ---
    glGenBuffers: (count, ptr) => {
      const dv = memView();
      for (let i = 0; i < count; i++)
        dv.setUint32(ptr + i * 4, allocObj(objects.buffers, gl.createBuffer()), true);
    },
    glDeleteBuffers: (count, ptr) => {
      const dv = memView();
      for (let i = 0; i < count; i++) {
        const id = dv.getUint32(ptr + i * 4, true);
        if (objects.buffers[id]) gl.deleteBuffer(objects.buffers[id]);
        objects.buffers[id] = null;
      }
    },
    glBindBuffer: (target, id) => gl.bindBuffer(target, objects.buffers[id] || null),
    glBufferData: (target, size, ptr, usage) => {
      if (ptr === 0) gl.bufferData(target, size, usage);
      else gl.bufferData(target, new Uint8Array(memory.buffer, ptr, size), usage);
    },
    glBufferSubData: (target, offset, size, ptr) => {
      gl.bufferSubData(target, offset, new Uint8Array(memory.buffer, ptr, size));
    },

    // --- Shaders ---
    glCreateShader: (type) => {
      const id = allocObj(objects.shaders, gl.createShader(type));
      objects.shaderTypes.set(id, type);
      return id;
    },
    glDeleteShader: (id) => {
      gl.deleteShader(objects.shaders[id]);
      objects.shaders[id] = null;
      objects.shaderTypes.delete(id);
    },
    glShaderSource: (id, count, stringPtrPtr, lengthPtr) => {
      const dv = memView();
      const strPtr = dv.getUint32(stringPtrPtr, true);
      let source;
      if (lengthPtr === 0) {
        source = readString(strPtr);
      } else {
        const len = dv.getInt32(lengthPtr, true);
        source = len < 0 ? readString(strPtr)
          : new TextDecoder().decode(new Uint8Array(memory.buffer, strPtr, len));
      }
      const type = objects.shaderTypes.get(id);
      source = convertGLSL(source, type === gl.FRAGMENT_SHADER);
      gl.shaderSource(objects.shaders[id], source);
    },
    glCompileShader: (id) => {
      gl.compileShader(objects.shaders[id]);
      const ok = gl.getShaderParameter(objects.shaders[id], gl.COMPILE_STATUS);
      if (!ok) console.error('[GL] Shader compile FAILED:', gl.getShaderInfoLog(objects.shaders[id]));
      else console.log('[GL] Shader compiled OK, id=' + id);
    },
    glGetShaderiv:   (id, pname, ptr) => {
      const val = gl.getShaderParameter(objects.shaders[id], pname);
      memView().setInt32(ptr, val === true ? 1 : (val === false ? 0 : val), true);
    },
    glGetShaderInfoLog: (id, maxLen, lenPtr, bufPtr) => {
      const log = gl.getShaderInfoLog(objects.shaders[id]) || '';
      const encoded = new TextEncoder().encode(log.substring(0, maxLen - 1));
      const mem = new Uint8Array(memory.buffer);
      mem.set(encoded, bufPtr);
      mem[bufPtr + encoded.length] = 0;
      if (lenPtr) memView().setInt32(lenPtr, encoded.length, true);
    },

    // --- Programs ---
    glCreateProgram: () => allocObj(objects.programs, gl.createProgram()),
    glDeleteProgram: (id) => {
      gl.deleteProgram(objects.programs[id]);
      objects.programs[id] = null;
    },
    glAttachShader:  (p, s) => gl.attachShader(objects.programs[p], objects.shaders[s]),
    glDetachShader:  (p, s) => gl.detachShader(objects.programs[p], objects.shaders[s]),
    glLinkProgram:   (id) => {
      gl.linkProgram(objects.programs[id]);
      const ok = gl.getProgramParameter(objects.programs[id], gl.LINK_STATUS);
      if (!ok) console.error('[GL] Program link FAILED:', gl.getProgramInfoLog(objects.programs[id]));
      else console.log('[GL] Program linked OK, id=' + id);
    },
    glUseProgram:    (id) => gl.useProgram(id === 0 ? null : objects.programs[id]),
    glGetProgramiv:  (id, pname, ptr) => {
      const val = gl.getProgramParameter(objects.programs[id], pname);
      memView().setInt32(ptr, val === true ? 1 : (val === false ? 0 : val), true);
    },
    glGetProgramInfoLog: (id, maxLen, lenPtr, bufPtr) => {
      const log = gl.getProgramInfoLog(objects.programs[id]) || '';
      const encoded = new TextEncoder().encode(log.substring(0, maxLen - 1));
      const mem = new Uint8Array(memory.buffer);
      mem.set(encoded, bufPtr);
      mem[bufPtr + encoded.length] = 0;
      if (lenPtr) memView().setInt32(lenPtr, encoded.length, true);
    },
    glBindAttribLocation:  (p, idx, namePtr) => {
      gl.bindAttribLocation(objects.programs[p], idx, readString(namePtr));
    },
    glGetUniformLocation: (p, namePtr) => {
      const loc = gl.getUniformLocation(objects.programs[p], readString(namePtr));
      if (!loc) return -1;
      return allocObj(objects.uniformLocs, loc);
    },

    // --- Uniforms ---
    glUniform1i: (l, v) => { if (l >= 0) gl.uniform1i(objects.uniformLocs[l], v); },
    glUniform1f: (l, v) => { if (l >= 0) gl.uniform1f(objects.uniformLocs[l], v); },
    glUniform2f: (l, a, b) => { if (l >= 0) gl.uniform2f(objects.uniformLocs[l], a, b); },
    glUniform3f: (l, a, b, c) => { if (l >= 0) gl.uniform3f(objects.uniformLocs[l], a, b, c); },
    glUniform4f: (l, a, b, c, d) => { if (l >= 0) gl.uniform4f(objects.uniformLocs[l], a, b, c, d); },
    glUniformMatrix3fv: (l, count, transpose, ptr) => {
      if (l < 0) return;
      const data = new Float32Array(memory.buffer, ptr, 9 * count);
      gl.uniformMatrix3fv(objects.uniformLocs[l], transpose !== 0, data);
    },

    // --- Vertex Attributes ---
    glEnableVertexAttribArray:  (idx) => gl.enableVertexAttribArray(idx),
    glDisableVertexAttribArray: (idx) => gl.disableVertexAttribArray(idx),
    glVertexAttribPointer: (idx, size, type, normalized, stride, offset) => {
      gl.vertexAttribPointer(idx, size, type, normalized !== 0, stride, offset);
    },

    // --- Drawing ---
    glDrawArrays:   (mode, first, count) => gl.drawArrays(mode, first, count),
    glDrawElements: (mode, count, type, offset) => gl.drawElements(mode, count, type, offset),

    // --- Framebuffers ---
    glGenFramebuffers: (count, ptr) => {
      const dv = memView();
      for (let i = 0; i < count; i++)
        dv.setUint32(ptr + i * 4, allocObj(objects.framebuffers, gl.createFramebuffer()), true);
    },
    glDeleteFramebuffers: (count, ptr) => {
      const dv = memView();
      for (let i = 0; i < count; i++) {
        const id = dv.getUint32(ptr + i * 4, true);
        if (objects.framebuffers[id]) gl.deleteFramebuffer(objects.framebuffers[id]);
        objects.framebuffers[id] = null;
      }
    },
    glBindFramebuffer: (target, id) => {
      gl.bindFramebuffer(target, id === 0 ? null : objects.framebuffers[id]);
    },
    glFramebufferTexture2D: (target, attachment, texTarget, texId, level) => {
      gl.framebufferTexture2D(target, attachment, texTarget, objects.textures[texId], level);
    },
    glBlitFramebuffer: (sx0, sy0, sx1, sy1, dx0, dy0, dx1, dy1, mask, filter) => {
      gl.blitFramebuffer(sx0, sy0, sx1, sy1, dx0, dy0, dx1, dy1, mask, filter);
    },
    glGenRenderbuffers: (count, ptr) => {
      const dv = memView();
      for (let i = 0; i < count; i++)
        dv.setUint32(ptr + i * 4, allocObj(objects.renderbuffers, gl.createRenderbuffer()), true);
    },
    glBindRenderbuffer: (target, id) => {
      gl.bindRenderbuffer(target, id === 0 ? null : objects.renderbuffers[id]);
    },
    glRenderbufferStorageMultisample: (target, samples, fmt, w, h) => {
      gl.renderbufferStorageMultisample(target, samples, fmt, w, h);
    },
    glFramebufferRenderbuffer: (target, attachment, rbtarget, rbId) => {
      gl.framebufferRenderbuffer(target, attachment, rbtarget, objects.renderbuffers[rbId]);
    },

    // --- Fixed pipeline no-ops (referenced but unused on WebGL2) ---
    glTexEnvf:           () => {},
    glEnableClientState: () => {},
    glDisableClientState:() => {},
    glVertexPointer:     () => {},
    glTexCoordPointer:   () => {},
    glColorPointer:      () => {},
    glLoadMatrixf:       () => {},
    glMatrixMode:        () => {},

    // Expose gl context for external use
    _getContext: () => gl,
  };
}

// ============================================================
// Audio Bridge (replaces OpenAL)
// ============================================================

export function createAudioBridge(memory) {
  let audioCtx = null;
  const samples = [null]; // 1-based IDs
  const activeSources = new Map(); // channel -> { source, gain }
  let listenerX = 0, listenerY = 0;

  function ensureContext() {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
  }

  return {
    al_init: () => { ensureContext(); return 1; },

    al_resume: () => {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
    },

    al_load_sample: (dataPtr, dataSize, channels, bitsPerSample, freq) => {
      const ctx = ensureContext();
      const raw = new Uint8Array(memory.buffer, dataPtr, dataSize).slice();
      const numSamples = Math.floor(raw.length / (bitsPerSample / 8) / channels);
      const audioBuffer = ctx.createBuffer(channels, numSamples, freq);

      for (let ch = 0; ch < channels; ch++) {
        const channelData = audioBuffer.getChannelData(ch);
        if (bitsPerSample === 16) {
          const view = new DataView(raw.buffer, raw.byteOffset, raw.byteLength);
          for (let i = 0; i < numSamples; i++) {
            channelData[i] = view.getInt16((i * channels + ch) * 2, true) / 32768.0;
          }
        } else if (bitsPerSample === 8) {
          for (let i = 0; i < numSamples; i++) {
            channelData[i] = (raw[i * channels + ch] - 128) / 128.0;
          }
        }
      }

      const id = samples.length;
      samples.push(audioBuffer);
      return id;
    },

    al_play_sound: (sampleId, emitterX, emitterY, volume, channel) => {
      const ctx = ensureContext();
      if (!samples[sampleId]) return -1;

      const existing = activeSources.get(channel);
      if (existing) { try { existing.source.stop(); } catch (e) {} }

      const source = ctx.createBufferSource();
      source.buffer = samples[sampleId];
      const gain = ctx.createGain();

      const dx = emitterX - listenerX;
      const dy = emitterY - listenerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const attenuation = Math.max(0, 1.0 - dist / 1500.0);
      gain.gain.value = volume * attenuation;

      source.connect(gain);
      gain.connect(ctx.destination);
      source.start();

      source.onended = () => {
        if (activeSources.get(channel)?.source === source)
          activeSources.delete(channel);
      };

      activeSources.set(channel, { source, gain });
      return channel;
    },

    al_stop_sound: (channel) => {
      const existing = activeSources.get(channel);
      if (existing) { try { existing.source.stop(); } catch (e) {} activeSources.delete(channel); }
    },

    al_set_volume: (channel, volume) => {
      const existing = activeSources.get(channel);
      if (existing) existing.gain.gain.value = volume;
    },

    al_set_listener: (x, y) => { listenerX = x; listenerY = y; },
  };
}
