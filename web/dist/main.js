// ../node_modules/fflate/esm/browser.js
var u8 = Uint8Array;
var u16 = Uint16Array;
var i32 = Int32Array;
var fleb = new u8([
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  0,
  1,
  1,
  1,
  1,
  2,
  2,
  2,
  2,
  3,
  3,
  3,
  3,
  4,
  4,
  4,
  4,
  5,
  5,
  5,
  5,
  0,
  /* unused */
  0,
  0,
  /* impossible */
  0
]);
var fdeb = new u8([
  0,
  0,
  0,
  0,
  1,
  1,
  2,
  2,
  3,
  3,
  4,
  4,
  5,
  5,
  6,
  6,
  7,
  7,
  8,
  8,
  9,
  9,
  10,
  10,
  11,
  11,
  12,
  12,
  13,
  13,
  /* unused */
  0,
  0
]);
var clim = new u8([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]);
var freb = function(eb, start) {
  var b = new u16(31);
  for (var i = 0; i < 31; ++i) {
    b[i] = start += 1 << eb[i - 1];
  }
  var r = new i32(b[30]);
  for (var i = 1; i < 30; ++i) {
    for (var j = b[i]; j < b[i + 1]; ++j) {
      r[j] = j - b[i] << 5 | i;
    }
  }
  return { b, r };
};
var _a = freb(fleb, 2);
var fl = _a.b;
var revfl = _a.r;
fl[28] = 258, revfl[258] = 28;
var _b = freb(fdeb, 0);
var fd = _b.b;
var revfd = _b.r;
var rev = new u16(32768);
for (i = 0; i < 32768; ++i) {
  x = (i & 43690) >> 1 | (i & 21845) << 1;
  x = (x & 52428) >> 2 | (x & 13107) << 2;
  x = (x & 61680) >> 4 | (x & 3855) << 4;
  rev[i] = ((x & 65280) >> 8 | (x & 255) << 8) >> 1;
}
var x;
var i;
var hMap = function(cd, mb, r) {
  var s = cd.length;
  var i = 0;
  var l = new u16(mb);
  for (; i < s; ++i) {
    if (cd[i])
      ++l[cd[i] - 1];
  }
  var le = new u16(mb);
  for (i = 1; i < mb; ++i) {
    le[i] = le[i - 1] + l[i - 1] << 1;
  }
  var co;
  if (r) {
    co = new u16(1 << mb);
    var rvb = 15 - mb;
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        var sv = i << 4 | cd[i];
        var r_1 = mb - cd[i];
        var v = le[cd[i] - 1]++ << r_1;
        for (var m = v | (1 << r_1) - 1; v <= m; ++v) {
          co[rev[v] >> rvb] = sv;
        }
      }
    }
  } else {
    co = new u16(s);
    for (i = 0; i < s; ++i) {
      if (cd[i]) {
        co[i] = rev[le[cd[i] - 1]++] >> 15 - cd[i];
      }
    }
  }
  return co;
};
var flt = new u8(288);
for (i = 0; i < 144; ++i)
  flt[i] = 8;
var i;
for (i = 144; i < 256; ++i)
  flt[i] = 9;
var i;
for (i = 256; i < 280; ++i)
  flt[i] = 7;
var i;
for (i = 280; i < 288; ++i)
  flt[i] = 8;
var i;
var fdt = new u8(32);
for (i = 0; i < 32; ++i)
  fdt[i] = 5;
var i;
var flrm = /* @__PURE__ */ hMap(flt, 9, 1);
var fdrm = /* @__PURE__ */ hMap(fdt, 5, 1);
var max = function(a) {
  var m = a[0];
  for (var i = 1; i < a.length; ++i) {
    if (a[i] > m)
      m = a[i];
  }
  return m;
};
var bits = function(d, p, m) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8) >> (p & 7) & m;
};
var bits16 = function(d, p) {
  var o = p / 8 | 0;
  return (d[o] | d[o + 1] << 8 | d[o + 2] << 16) >> (p & 7);
};
var shft = function(p) {
  return (p + 7) / 8 | 0;
};
var slc = function(v, s, e) {
  if (s == null || s < 0)
    s = 0;
  if (e == null || e > v.length)
    e = v.length;
  return new u8(v.subarray(s, e));
};
var ec = [
  "unexpected EOF",
  "invalid block type",
  "invalid length/literal",
  "invalid distance",
  "stream finished",
  "no stream handler",
  ,
  "no callback",
  "invalid UTF-8 data",
  "extra field too long",
  "date not in range 1980-2099",
  "filename too long",
  "stream finishing",
  "invalid zip data"
  // determined by unknown compression method
];
var err = function(ind, msg, nt) {
  var e = new Error(msg || ec[ind]);
  e.code = ind;
  if (Error.captureStackTrace)
    Error.captureStackTrace(e, err);
  if (!nt)
    throw e;
  return e;
};
var inflt = function(dat, st, buf, dict) {
  var sl = dat.length, dl = dict ? dict.length : 0;
  if (!sl || st.f && !st.l)
    return buf || new u8(0);
  var noBuf = !buf;
  var resize = noBuf || st.i != 2;
  var noSt = st.i;
  if (noBuf)
    buf = new u8(sl * 3);
  var cbuf = function(l2) {
    var bl = buf.length;
    if (l2 > bl) {
      var nbuf = new u8(Math.max(bl * 2, l2));
      nbuf.set(buf);
      buf = nbuf;
    }
  };
  var final = st.f || 0, pos = st.p || 0, bt = st.b || 0, lm = st.l, dm = st.d, lbt = st.m, dbt = st.n;
  var tbts = sl * 8;
  do {
    if (!lm) {
      final = bits(dat, pos, 1);
      var type = bits(dat, pos + 1, 3);
      pos += 3;
      if (!type) {
        var s = shft(pos) + 4, l = dat[s - 4] | dat[s - 3] << 8, t = s + l;
        if (t > sl) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + l);
        buf.set(dat.subarray(s, t), bt);
        st.b = bt += l, st.p = pos = t * 8, st.f = final;
        continue;
      } else if (type == 1)
        lm = flrm, dm = fdrm, lbt = 9, dbt = 5;
      else if (type == 2) {
        var hLit = bits(dat, pos, 31) + 257, hcLen = bits(dat, pos + 10, 15) + 4;
        var tl = hLit + bits(dat, pos + 5, 31) + 1;
        pos += 14;
        var ldt = new u8(tl);
        var clt = new u8(19);
        for (var i = 0; i < hcLen; ++i) {
          clt[clim[i]] = bits(dat, pos + i * 3, 7);
        }
        pos += hcLen * 3;
        var clb = max(clt), clbmsk = (1 << clb) - 1;
        var clm = hMap(clt, clb, 1);
        for (var i = 0; i < tl; ) {
          var r = clm[bits(dat, pos, clbmsk)];
          pos += r & 15;
          var s = r >> 4;
          if (s < 16) {
            ldt[i++] = s;
          } else {
            var c = 0, n = 0;
            if (s == 16)
              n = 3 + bits(dat, pos, 3), pos += 2, c = ldt[i - 1];
            else if (s == 17)
              n = 3 + bits(dat, pos, 7), pos += 3;
            else if (s == 18)
              n = 11 + bits(dat, pos, 127), pos += 7;
            while (n--)
              ldt[i++] = c;
          }
        }
        var lt = ldt.subarray(0, hLit), dt = ldt.subarray(hLit);
        lbt = max(lt);
        dbt = max(dt);
        lm = hMap(lt, lbt, 1);
        dm = hMap(dt, dbt, 1);
      } else
        err(1);
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
    }
    if (resize)
      cbuf(bt + 131072);
    var lms = (1 << lbt) - 1, dms = (1 << dbt) - 1;
    var lpos = pos;
    for (; ; lpos = pos) {
      var c = lm[bits16(dat, pos) & lms], sym = c >> 4;
      pos += c & 15;
      if (pos > tbts) {
        if (noSt)
          err(0);
        break;
      }
      if (!c)
        err(2);
      if (sym < 256)
        buf[bt++] = sym;
      else if (sym == 256) {
        lpos = pos, lm = null;
        break;
      } else {
        var add = sym - 254;
        if (sym > 264) {
          var i = sym - 257, b = fleb[i];
          add = bits(dat, pos, (1 << b) - 1) + fl[i];
          pos += b;
        }
        var d = dm[bits16(dat, pos) & dms], dsym = d >> 4;
        if (!d)
          err(3);
        pos += d & 15;
        var dt = fd[dsym];
        if (dsym > 3) {
          var b = fdeb[dsym];
          dt += bits16(dat, pos) & (1 << b) - 1, pos += b;
        }
        if (pos > tbts) {
          if (noSt)
            err(0);
          break;
        }
        if (resize)
          cbuf(bt + 131072);
        var end = bt + add;
        if (bt < dt) {
          var shift = dl - dt, dend = Math.min(dt, end);
          if (shift + bt < 0)
            err(3);
          for (; bt < dend; ++bt)
            buf[bt] = dict[shift + bt];
        }
        for (; bt < end; ++bt)
          buf[bt] = buf[bt - dt];
      }
    }
    st.l = lm, st.p = lpos, st.b = bt, st.f = final;
    if (lm)
      final = 1, st.m = lbt, st.d = dm, st.n = dbt;
  } while (!final);
  return bt != buf.length && noBuf ? slc(buf, 0, bt) : buf.subarray(0, bt);
};
var et = /* @__PURE__ */ new u8(0);
var b2 = function(d, b) {
  return d[b] | d[b + 1] << 8;
};
var b4 = function(d, b) {
  return (d[b] | d[b + 1] << 8 | d[b + 2] << 16 | d[b + 3] << 24) >>> 0;
};
var b8 = function(d, b) {
  return b4(d, b) + b4(d, b + 4) * 4294967296;
};
function inflateSync(data, opts) {
  return inflt(data, { i: 2 }, opts && opts.out, opts && opts.dictionary);
}
var td = typeof TextDecoder != "undefined" && /* @__PURE__ */ new TextDecoder();
var tds = 0;
try {
  td.decode(et, { stream: true });
  tds = 1;
} catch (e) {
}
var dutf8 = function(d) {
  for (var r = "", i = 0; ; ) {
    var c = d[i++];
    var eb = (c > 127) + (c > 223) + (c > 239);
    if (i + eb > d.length)
      return { s: r, r: slc(d, i - 1) };
    if (!eb)
      r += String.fromCharCode(c);
    else if (eb == 3) {
      c = ((c & 15) << 18 | (d[i++] & 63) << 12 | (d[i++] & 63) << 6 | d[i++] & 63) - 65536, r += String.fromCharCode(55296 | c >> 10, 56320 | c & 1023);
    } else if (eb & 1)
      r += String.fromCharCode((c & 31) << 6 | d[i++] & 63);
    else
      r += String.fromCharCode((c & 15) << 12 | (d[i++] & 63) << 6 | d[i++] & 63);
  }
};
function strFromU8(dat, latin1) {
  if (latin1) {
    var r = "";
    for (var i = 0; i < dat.length; i += 16384)
      r += String.fromCharCode.apply(null, dat.subarray(i, i + 16384));
    return r;
  } else if (td) {
    return td.decode(dat);
  } else {
    var _a2 = dutf8(dat), s = _a2.s, r = _a2.r;
    if (r.length)
      err(8);
    return s;
  }
}
var slzh = function(d, b) {
  return b + 30 + b2(d, b + 26) + b2(d, b + 28);
};
var zh = function(d, b, z) {
  var fnl = b2(d, b + 28), fn = strFromU8(d.subarray(b + 46, b + 46 + fnl), !(b2(d, b + 8) & 2048)), es = b + 46 + fnl, bs = b4(d, b + 20);
  var _a2 = z && bs == 4294967295 ? z64e(d, es) : [bs, b4(d, b + 24), b4(d, b + 42)], sc = _a2[0], su = _a2[1], off = _a2[2];
  return [b2(d, b + 10), sc, su, fn, es + b2(d, b + 30) + b2(d, b + 32), off];
};
var z64e = function(d, b) {
  for (; b2(d, b) != 1; b += 4 + b2(d, b + 2))
    ;
  return [b8(d, b + 12), b8(d, b + 4), b8(d, b + 20)];
};
function unzipSync(data, opts) {
  var files = {};
  var e = data.length - 22;
  for (; b4(data, e) != 101010256; --e) {
    if (!e || data.length - e > 65558)
      err(13);
  }
  ;
  var c = b2(data, e + 8);
  if (!c)
    return {};
  var o = b4(data, e + 16);
  var z = o == 4294967295 || c == 65535;
  if (z) {
    var ze = b4(data, e - 12);
    z = b4(data, ze) == 101075792;
    if (z) {
      c = b4(data, ze + 32);
      o = b4(data, ze + 48);
    }
  }
  var fltr = opts && opts.filter;
  for (var i = 0; i < c; ++i) {
    var _a2 = zh(data, o, z), c_2 = _a2[0], sc = _a2[1], su = _a2[2], fn = _a2[3], no = _a2[4], off = _a2[5], b = slzh(data, off);
    o = no;
    if (!fltr || fltr({
      name: fn,
      size: sc,
      originalSize: su,
      compression: c_2
    })) {
      if (!c_2)
        files[fn] = slc(data, b, b + sc);
      else if (c_2 == 8)
        files[fn] = inflateSync(data.subarray(b, b + sc), { out: new u8(su) });
      else
        err(14, "unknown compression type " + c_2);
    }
  }
  return files;
}

// ../node_modules/idb-keyval/dist/index.js
function promisifyRequest(request) {
  return new Promise((resolve, reject) => {
    request.oncomplete = request.onsuccess = () => resolve(request.result);
    request.onabort = request.onerror = () => reject(request.error);
  });
}
function createStore(dbName, storeName) {
  let dbp;
  const getDB = () => {
    if (dbp)
      return dbp;
    const request = indexedDB.open(dbName);
    request.onupgradeneeded = () => request.result.createObjectStore(storeName);
    dbp = promisifyRequest(request);
    dbp.then((db) => {
      db.onclose = () => dbp = void 0;
    }, () => {
    });
    return dbp;
  };
  return (txMode, callback) => getDB().then((db) => callback(db.transaction(storeName, txMode).objectStore(storeName)));
}
var defaultGetStoreFunc;
function defaultGetStore() {
  if (!defaultGetStoreFunc) {
    defaultGetStoreFunc = createStore("keyval-store", "keyval");
  }
  return defaultGetStoreFunc;
}
function get(key, customStore = defaultGetStore()) {
  return customStore("readonly", (store) => promisifyRequest(store.get(key)));
}
function set(key, value, customStore = defaultGetStore()) {
  return customStore("readwrite", (store) => {
    store.put(value, key);
    return promisifyRequest(store.transaction);
  });
}

// ../assets.js
var ASSET_VERSION = "v0.4";
var ASSET_URL = "./soldat.smod";
var SMOD_CACHE_KEY = "soldat-smod-" + ASSET_VERSION;
var IMAGE_EXTENSIONS = [".png", ".bmp", ".jpg", ".jpeg", ".gif"];
async function loadAssets(onProgress) {
  let smodBytes;
  const cached = await get(SMOD_CACHE_KEY);
  if (cached) {
    onProgress(0.5, "Loading from cache...");
    smodBytes = new Uint8Array(cached);
  } else {
    onProgress(0, "Downloading assets...");
    const response = await fetch(ASSET_URL);
    const contentLength = parseInt(response.headers.get("Content-Length") || "0", 10);
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (contentLength > 0) {
        onProgress(
          received / contentLength * 0.5,
          `Downloading... ${(received / 1024 / 1024).toFixed(1)}MB`
        );
      }
    }
    smodBytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      smodBytes.set(chunk, offset);
      offset += chunk.length;
    }
    onProgress(0.55, "Caching download...");
    try {
      await set(SMOD_CACHE_KEY, smodBytes.buffer);
    } catch (e) {
      console.warn("Failed to cache smod in IndexedDB:", e);
    }
  }
  onProgress(0.6, "Extracting assets...");
  const files = unzipSync(smodBytes);
  const fileMap = /* @__PURE__ */ new Map();
  for (const [path, data] of Object.entries(files)) {
    if (data.length > 0) {
      fileMap.set(path, data);
    }
  }
  onProgress(0.7, "Decoding images...");
  const imageMap = /* @__PURE__ */ new Map();
  const imageEntries = [...fileMap.entries()].filter(
    ([path]) => IMAGE_EXTENSIONS.some((ext) => path.toLowerCase().endsWith(ext))
  );
  const BATCH_SIZE = 50;
  for (let i = 0; i < imageEntries.length; i += BATCH_SIZE) {
    const batch = imageEntries.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async ([path, data]) => {
      try {
        const blob = new Blob([data]);
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext("2d");
        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        imageMap.set(path, {
          width: bitmap.width,
          height: bitmap.height,
          pixels: new Uint8Array(imageData.data.buffer)
        });
        bitmap.close();
      } catch (e) {
        console.warn(`[assets] Failed to decode image: ${path}`, e.message);
      }
    });
    await Promise.all(promises);
    onProgress(
      0.7 + 0.25 * (i + batch.length) / imageEntries.length,
      `Decoding images... ${i + batch.length}/${imageEntries.length}`
    );
  }
  console.log(`[assets] Decoded ${imageMap.size}/${imageEntries.length} images`);
  onProgress(1, `Ready! (${fileMap.size} files, ${imageMap.size} images)`);
  return { fileMap, imageMap };
}

// ../bridge.js?v=4
var globalWasmInstance = null;
function setGlobalWasmInstance(inst) {
  globalWasmInstance = inst;
}
function createFilesystemBridge(memory, fileMap) {
  const openFiles = /* @__PURE__ */ new Map();
  let nextHandle = 1;
  let lastOpenedFilename = "";
  function readString(ptr) {
    const view = new Uint8Array(memory.buffer);
    let end = ptr;
    while (view[end] !== 0) end++;
    return new TextDecoder().decode(view.subarray(ptr, end));
  }
  function lookupFile(name) {
    let result = fileMap.get(name) || fileMap.get(name.toLowerCase());
    if (result) return result;
    const normalized = name.replace(/\\/g, "/");
    result = fileMap.get(normalized) || fileMap.get(normalized.toLowerCase());
    if (result) return result;
    const altExts = [[".bmp", ".png"], [".png", ".bmp"]];
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
      return 1;
    },
    physfs_open_read: (filenamePtr) => {
      const name = readString(filenamePtr);
      const data = lookupFile(name);
      if (!data) {
        console.warn("[PhysFS] open_read MISS:", name);
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
      if (!found) console.warn("[PhysFS] MISS:", name);
      return found;
    },
    physfs_eof: (handle) => {
      const f = openFiles.get(handle);
      return !f || f.pos >= f.data.length ? 1 : 0;
    },
    physfs_eof: (handle) => {
      const f = openFiles.get(handle);
      return !f || f.pos >= f.data.length ? 1 : 0;
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
    physfs_free_list: (listPtr) => {
    },
    physfs_enumerate_files: (dirPtr) => {
      const dir = readString(dirPtr).replace(/\\/g, "/").toLowerCase().replace(/\/$/, "");
      const matches = [];
      for (const path of fileMap.keys()) {
        const lower = path.toLowerCase();
        const parts = lower.split("/");
        const fileDir = parts.slice(0, -1).join("/");
        if (fileDir === dir) {
          matches.push(parts[parts.length - 1]);
        }
      }
      if (matches.length === 0) return 0;
      const alloc = globalWasmInstance?.exports?.web_alloc;
      if (!alloc) return 0;
      const ptrArraySize = (matches.length + 1) * 4;
      const ptrArrayPtr = alloc(ptrArraySize);
      const dv = new DataView(memory.buffer);
      for (let i = 0; i < matches.length; i++) {
        const strBytes = new TextEncoder().encode(matches[i]);
        const strPtr = alloc(strBytes.length + 1);
        new Uint8Array(memory.buffer).set(strBytes, strPtr);
        new Uint8Array(memory.buffer)[strPtr + strBytes.length] = 0;
        dv.setUint32(ptrArrayPtr + i * 4, strPtr, true);
      }
      dv.setUint32(ptrArrayPtr + matches.length * 4, 0, true);
      return ptrArrayPtr;
    }
  };
}
function createGLBridge(memory, canvas) {
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false
  });
  if (!gl) throw new Error("WebGL2 not supported");
  const objects = {
    textures: [null],
    buffers: [null],
    framebuffers: [null],
    renderbuffers: [null],
    shaders: [null],
    programs: [null],
    uniformLocs: [null],
    shaderTypes: /* @__PURE__ */ new Map()
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
  function convertGLSL(source, isFragment) {
    let s = source;
    s = s.replace("#version 120", "#version 300 es\nprecision mediump float;");
    s = s.replace(/attribute /g, "in ");
    s = s.replace(/varying /g, isFragment ? "in " : "out ");
    s = s.replace(/texture2D\s*\(/g, "texture(");
    s = s.replace(/gl_FragColor/g, "fragColor");
    if (isFragment && s.includes("fragColor") && !s.includes("out vec4 fragColor")) {
      s = s.replace(/(precision mediump float;\n)/, "$1out vec4 fragColor;\n");
    }
    return s;
  }
  return {
    // --- State ---
    glEnable: (cap) => {
      const valid = [3042, 2884, 2929, 3024, 32823, 32928, 3089, 2960, 35977, 32926];
      if (valid.includes(cap)) {
        gl.enable(cap);
      } else {
        if (!createGLBridge._enableWarn) createGLBridge._enableWarn = {};
        if (!createGLBridge._enableWarn[cap]) {
          console.log("[GL] glEnable SKIP: 0x" + cap.toString(16));
          createGLBridge._enableWarn[cap] = true;
        }
      }
    },
    glDisable: (cap) => {
      const valid = [3042, 2884, 2929, 3024, 32823, 32928, 3089, 2960, 35977, 32926];
      if (valid.includes(cap)) gl.disable(cap);
    },
    glBlendFunc: (s, d) => gl.blendFunc(s, d),
    glClearColor: (r, g, b, a) => {
      gl.clearColor(r, g, b, a);
      if (!createGLBridge._logged) {
        console.log("[GL] glClearColor", r, g, b, a);
        createGLBridge._logged = true;
      }
    },
    glClear: (mask) => {
      while (gl.getError() !== 0) {
      }
      gl.clear(mask);
      if (!createGLBridge._loggedClear) {
        console.log("[GL] glClear", mask);
        createGLBridge._loggedClear = true;
      }
    },
    glGetError: () => gl.getError(),
    glViewport: (x, y, w, h) => gl.viewport(x, y, w, h),
    glScissor: (x, y, w, h) => gl.scissor(x, y, w, h),
    glPixelStorei: (pname, param) => gl.pixelStorei(pname, param),
    glGetIntegerv: (pname, ptr) => {
      const val = gl.getParameter(pname);
      memView().setInt32(ptr, Array.isArray(val) ? val[0] : val | 0, true);
    },
    glGetString: () => 0,
    glFinish: () => gl.finish(),
    glHint: (target, mode) => {
      if (target === 35723) gl.hint(target, mode);
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
    glBindTexture: (target, id) => gl.bindTexture(target, objects.textures[id] || null),
    glTexImage2D: (target, level, internalformat, w, h, border, format, type, ptr) => {
      let ifmt = internalformat, fmt = format;
      let channels = 4;
      if (internalformat === 6406 || format === 6406) {
        ifmt = gl.R8;
        fmt = gl.RED;
        channels = 1;
      } else if (internalformat === 6410 || format === 6410) {
        ifmt = gl.RG8;
        fmt = gl.RG;
        channels = 2;
      } else if (fmt === gl.RGB) {
        channels = 3;
      } else if (fmt === gl.RED || fmt === gl.LUMINANCE) {
        channels = 1;
      } else if (fmt === gl.RG) {
        channels = 2;
      }
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      if (ptr === 0) {
        if (internalformat === 6410 || format === 6410 || internalformat === 6406 || format === 6406) {
          gl.texImage2D(target, level, gl.RGBA8, w, h, border, gl.RGBA, type, null);
        } else {
          gl.texImage2D(target, level, ifmt, w, h, border, fmt, type, null);
        }
      } else if (internalformat === 6410 || format === 6410) {
        const src = new Uint8Array(memory.buffer, ptr, w * h * 2);
        const rgba = new Uint8Array(w * h * 4);
        for (let i = 0; i < w * h; i++) {
          const L = src[i * 2], A = src[i * 2 + 1];
          rgba[i * 4] = L;
          rgba[i * 4 + 1] = L;
          rgba[i * 4 + 2] = L;
          rgba[i * 4 + 3] = A;
        }
        gl.texImage2D(target, level, gl.RGBA8, w, h, border, gl.RGBA, type, rgba);
      } else if (internalformat === 6406 || format === 6406) {
        const src = new Uint8Array(memory.buffer, ptr, w * h);
        const rgba = new Uint8Array(w * h * 4);
        for (let i = 0; i < w * h; i++) {
          rgba[i * 4 + 3] = src[i];
        }
        gl.texImage2D(target, level, gl.RGBA8, w, h, border, gl.RGBA, type, rgba);
      } else {
        gl.texImage2D(
          target,
          level,
          ifmt,
          w,
          h,
          border,
          fmt,
          type,
          new Uint8Array(memory.buffer, ptr, w * h * channels)
        );
      }
    },
    glTexSubImage2D: (target, level, xoff, yoff, w, h, format, type, ptr) => {
      if (ptr === 0) return;
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      if (format === 6410) {
        const src = new Uint8Array(memory.buffer, ptr, w * h * 2);
        const rgba = new Uint8Array(w * h * 4);
        for (let i = 0; i < w * h; i++) {
          const L = src[i * 2], A = src[i * 2 + 1];
          rgba[i * 4] = L;
          rgba[i * 4 + 1] = L;
          rgba[i * 4 + 2] = L;
          rgba[i * 4 + 3] = A;
        }
        gl.texSubImage2D(target, level, xoff, yoff, w, h, gl.RGBA, type, rgba);
      } else if (format === 6406) {
        const src = new Uint8Array(memory.buffer, ptr, w * h);
        const rgba = new Uint8Array(w * h * 4);
        for (let i = 0; i < w * h; i++) {
          rgba[i * 4 + 3] = src[i];
        }
        gl.texSubImage2D(target, level, xoff, yoff, w, h, gl.RGBA, type, rgba);
      } else {
        let fmt = format, channels = 4;
        if (fmt === gl.RGB) channels = 3;
        else if (fmt === gl.RED) channels = 1;
        else if (fmt === gl.RG) channels = 2;
        gl.texSubImage2D(
          target,
          level,
          xoff,
          yoff,
          w,
          h,
          fmt,
          type,
          new Uint8Array(memory.buffer, ptr, w * h * channels)
        );
      }
    },
    glTexParameteri: (target, pname, param) => gl.texParameteri(target, pname, param),
    glActiveTexture: (texture) => gl.activeTexture(texture),
    glGenerateMipmap: (target) => gl.generateMipmap(target),
    glReadPixels: (x, y, w, h, format, type, ptr) => {
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
        source = len < 0 ? readString(strPtr) : new TextDecoder().decode(new Uint8Array(memory.buffer, strPtr, len));
      }
      const type = objects.shaderTypes.get(id);
      source = convertGLSL(source, type === gl.FRAGMENT_SHADER);
      gl.shaderSource(objects.shaders[id], source);
    },
    glCompileShader: (id) => {
      gl.compileShader(objects.shaders[id]);
      const ok = gl.getShaderParameter(objects.shaders[id], gl.COMPILE_STATUS);
      if (!ok) console.error("[GL] Shader compile FAILED:", gl.getShaderInfoLog(objects.shaders[id]));
      else console.log("[GL] Shader compiled OK, id=" + id);
    },
    glGetShaderiv: (id, pname, ptr) => {
      const val = gl.getShaderParameter(objects.shaders[id], pname);
      memView().setInt32(ptr, val === true ? 1 : val === false ? 0 : val, true);
    },
    glGetShaderInfoLog: (id, maxLen, lenPtr, bufPtr) => {
      const log = gl.getShaderInfoLog(objects.shaders[id]) || "";
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
    glAttachShader: (p, s) => gl.attachShader(objects.programs[p], objects.shaders[s]),
    glDetachShader: (p, s) => gl.detachShader(objects.programs[p], objects.shaders[s]),
    glLinkProgram: (id) => {
      gl.linkProgram(objects.programs[id]);
      const ok = gl.getProgramParameter(objects.programs[id], gl.LINK_STATUS);
      if (!ok) console.error("[GL] Program link FAILED:", gl.getProgramInfoLog(objects.programs[id]));
      else console.log("[GL] Program linked OK, id=" + id);
    },
    glUseProgram: (id) => gl.useProgram(id === 0 ? null : objects.programs[id]),
    glGetProgramiv: (id, pname, ptr) => {
      const val = gl.getProgramParameter(objects.programs[id], pname);
      memView().setInt32(ptr, val === true ? 1 : val === false ? 0 : val, true);
    },
    glGetProgramInfoLog: (id, maxLen, lenPtr, bufPtr) => {
      const log = gl.getProgramInfoLog(objects.programs[id]) || "";
      const encoded = new TextEncoder().encode(log.substring(0, maxLen - 1));
      const mem = new Uint8Array(memory.buffer);
      mem.set(encoded, bufPtr);
      mem[bufPtr + encoded.length] = 0;
      if (lenPtr) memView().setInt32(lenPtr, encoded.length, true);
    },
    glBindAttribLocation: (p, idx, namePtr) => {
      gl.bindAttribLocation(objects.programs[p], idx, readString(namePtr));
    },
    glGetUniformLocation: (p, namePtr) => {
      const loc = gl.getUniformLocation(objects.programs[p], readString(namePtr));
      if (!loc) return -1;
      return allocObj(objects.uniformLocs, loc);
    },
    // --- Uniforms ---
    glUniform1i: (l, v) => {
      if (l >= 0) gl.uniform1i(objects.uniformLocs[l], v);
    },
    glUniform1f: (l, v) => {
      if (l >= 0) gl.uniform1f(objects.uniformLocs[l], v);
    },
    glUniform2f: (l, a, b) => {
      if (l >= 0) gl.uniform2f(objects.uniformLocs[l], a, b);
    },
    glUniform3f: (l, a, b, c) => {
      if (l >= 0) gl.uniform3f(objects.uniformLocs[l], a, b, c);
    },
    glUniform4f: (l, a, b, c, d) => {
      if (l >= 0) gl.uniform4f(objects.uniformLocs[l], a, b, c, d);
    },
    glUniformMatrix3fv: (l, count, transpose, ptr) => {
      if (l < 0) return;
      const data = new Float32Array(memory.buffer, ptr, 9 * count);
      gl.uniformMatrix3fv(objects.uniformLocs[l], transpose !== 0, data);
    },
    // --- Vertex Attributes ---
    glEnableVertexAttribArray: (idx) => gl.enableVertexAttribArray(idx),
    glDisableVertexAttribArray: (idx) => gl.disableVertexAttribArray(idx),
    glVertexAttribPointer: (idx, size, type, normalized, stride, offset) => {
      gl.vertexAttribPointer(idx, size, type, normalized !== 0, stride, offset);
    },
    // --- Drawing ---
    glDrawArrays: (mode, first, count) => gl.drawArrays(mode, first, count),
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
    glTexEnvf: () => {
    },
    glEnableClientState: () => {
    },
    glDisableClientState: () => {
    },
    glVertexPointer: () => {
    },
    glTexCoordPointer: () => {
    },
    glColorPointer: () => {
    },
    glLoadMatrixf: () => {
    },
    glMatrixMode: () => {
    },
    // Expose gl context for external use
    _getContext: () => gl
  };
}
function createAudioBridge(memory) {
  let audioCtx = null;
  const samples = [null];
  const activeSources = /* @__PURE__ */ new Map();
  let listenerX = 0, listenerY = 0;
  function ensureContext() {
    if (!audioCtx) audioCtx = new AudioContext();
    return audioCtx;
  }
  return {
    al_init: () => {
      ensureContext();
      return 1;
    },
    al_resume: () => {
      if (audioCtx && audioCtx.state === "suspended") audioCtx.resume();
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
            channelData[i] = view.getInt16((i * channels + ch) * 2, true) / 32768;
          }
        } else if (bitsPerSample === 8) {
          for (let i = 0; i < numSamples; i++) {
            channelData[i] = (raw[i * channels + ch] - 128) / 128;
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
      if (existing) {
        try {
          existing.source.stop();
        } catch (e) {
        }
      }
      const source = ctx.createBufferSource();
      source.buffer = samples[sampleId];
      const gain = ctx.createGain();
      const dx = emitterX - listenerX;
      const dy = emitterY - listenerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const attenuation = Math.max(0, 1 - dist / 1500);
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
      if (existing) {
        try {
          existing.source.stop();
        } catch (e) {
        }
        activeSources.delete(channel);
      }
    },
    al_set_volume: (channel, volume) => {
      const existing = activeSources.get(channel);
      if (existing) existing.gain.gain.value = volume;
    },
    al_set_listener: (x, y) => {
      listenerX = x;
      listenerY = y;
    }
  };
}

// ../input.js?v=4
var SDL_SCANCODES = {
  "KeyA": 4,
  "KeyB": 5,
  "KeyC": 6,
  "KeyD": 7,
  "KeyE": 8,
  "KeyF": 9,
  "KeyG": 10,
  "KeyH": 11,
  "KeyI": 12,
  "KeyJ": 13,
  "KeyK": 14,
  "KeyL": 15,
  "KeyM": 16,
  "KeyN": 17,
  "KeyO": 18,
  "KeyP": 19,
  "KeyQ": 20,
  "KeyR": 21,
  "KeyS": 22,
  "KeyT": 23,
  "KeyU": 24,
  "KeyV": 25,
  "KeyW": 26,
  "KeyX": 27,
  "KeyY": 28,
  "KeyZ": 29,
  "Digit1": 30,
  "Digit2": 31,
  "Digit3": 32,
  "Digit4": 33,
  "Digit5": 34,
  "Digit6": 35,
  "Digit7": 36,
  "Digit8": 37,
  "Digit9": 38,
  "Digit0": 39,
  "Enter": 40,
  "Escape": 41,
  "Backspace": 42,
  "Tab": 43,
  "Space": 44,
  "Minus": 45,
  "Equal": 46,
  "BracketLeft": 47,
  "BracketRight": 48,
  "Semicolon": 51,
  "Quote": 52,
  "Backquote": 53,
  "Comma": 54,
  "Period": 55,
  "Slash": 56,
  "F1": 58,
  "F2": 59,
  "F3": 60,
  "F4": 61,
  "F5": 62,
  "F6": 63,
  "F7": 64,
  "F8": 65,
  "F9": 66,
  "F10": 67,
  "F11": 68,
  "F12": 69,
  "ArrowRight": 79,
  "ArrowLeft": 80,
  "ArrowDown": 81,
  "ArrowUp": 82,
  "ShiftLeft": 225,
  "ShiftRight": 229,
  "ControlLeft": 224,
  "ControlRight": 228,
  "AltLeft": 226,
  "AltRight": 230
};
var MOUSE_LEFT = 301;
var MOUSE_RIGHT = 303;
function createInputBridge(memory, canvas) {
  let keyStatePtr = 0;
  let mouseDeltaPtr = 0;
  let moveStickPtr = 0;
  let aimStickPtr = 0;
  const isTouchDevice = "ontouchstart" in window && navigator.maxTouchPoints > 0;
  document.addEventListener("keydown", (e) => {
    if (!keyStatePtr) return;
    const sc = SDL_SCANCODES[e.code];
    if (sc !== void 0) {
      new Uint8Array(memory.buffer)[keyStatePtr + sc] = 1;
      e.preventDefault();
    }
  });
  document.addEventListener("keyup", (e) => {
    if (!keyStatePtr) return;
    const sc = SDL_SCANCODES[e.code];
    if (sc !== void 0) {
      new Uint8Array(memory.buffer)[keyStatePtr + sc] = 0;
      e.preventDefault();
    }
  });
  if (!isTouchDevice) {
    canvas.addEventListener("click", () => {
      if (!document.pointerLockElement) canvas.requestPointerLock();
    });
    document.addEventListener("mousemove", (e) => {
      if (document.pointerLockElement !== canvas || !mouseDeltaPtr) return;
      const dv = new DataView(memory.buffer);
      dv.setFloat32(mouseDeltaPtr, dv.getFloat32(mouseDeltaPtr, true) + e.movementX, true);
      dv.setFloat32(mouseDeltaPtr + 4, dv.getFloat32(mouseDeltaPtr + 4, true) + e.movementY, true);
    });
    document.addEventListener("mousedown", (e) => {
      if (document.pointerLockElement !== canvas || !keyStatePtr) return;
      const mem = new Uint8Array(memory.buffer);
      if (e.button === 0) mem[keyStatePtr + MOUSE_LEFT] = 1;
      if (e.button === 2) mem[keyStatePtr + MOUSE_RIGHT] = 1;
    });
    document.addEventListener("mouseup", (e) => {
      if (!keyStatePtr) return;
      const mem = new Uint8Array(memory.buffer);
      if (e.button === 0) mem[keyStatePtr + MOUSE_LEFT] = 0;
      if (e.button === 2) mem[keyStatePtr + MOUSE_RIGHT] = 0;
    });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }
  if (isTouchDevice) {
    document.getElementById("touch-controls").classList.add("visible");
    setupJoystick("stick-left-zone", "stick-left-knob", (sx, sy) => {
      if (!moveStickPtr) return;
      const view = new Int8Array(memory.buffer);
      view[moveStickPtr] = sx;
      view[moveStickPtr + 1] = sy;
    });
    setupJoystick("stick-right-zone", "stick-right-knob", (sx, sy) => {
      if (!aimStickPtr) return;
      const view = new Int8Array(memory.buffer);
      view[aimStickPtr] = sx;
      view[aimStickPtr + 1] = sy;
    });
    setupTouchButtons();
  }
  function setupJoystick(zoneId, knobId, onMove) {
    const zone = document.getElementById(zoneId);
    const knob = document.getElementById(knobId);
    const maxRadius = 50;
    let activeTouch = null;
    zone.addEventListener("touchstart", (e) => {
      e.preventDefault();
      if (activeTouch !== null) return;
      activeTouch = e.changedTouches[0].identifier;
      handleMove(e.changedTouches[0]);
    }, { passive: false });
    zone.addEventListener("touchmove", (e) => {
      e.preventDefault();
      for (const t of e.changedTouches) {
        if (t.identifier === activeTouch) {
          handleMove(t);
          break;
        }
      }
    }, { passive: false });
    const endTouch = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === activeTouch) {
          activeTouch = null;
          knob.style.transform = "translate(-50%, -50%)";
          onMove(0, 0);
          break;
        }
      }
    };
    zone.addEventListener("touchend", endTouch);
    zone.addEventListener("touchcancel", endTouch);
    function handleMove(touch) {
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = touch.clientX - cx;
      let dy = touch.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxRadius) {
        dx = dx / dist * maxRadius;
        dy = dy / dist * maxRadius;
      }
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      onMove(Math.round(dx / maxRadius * 127), Math.round(dy / maxRadius * 127));
    }
  }
  function setupTouchButtons() {
    const btnMap = {
      "btn-fire": MOUSE_LEFT,
      // mouse1 → +fire
      "btn-jump": 44,
      // Space → +jet (button activates jets; jumping is stick-up)
      "btn-reload": 21,
      // R → +reload
      "btn-throw": 10,
      // G → +throwgrenade
      "btn-wpn-next": 20
      // Q → +changeweapon
    };
    for (const [id, scancode] of Object.entries(btnMap)) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.addEventListener("touchstart", (e) => {
        e.preventDefault();
        el.classList.add("pressed");
        if (keyStatePtr) new Uint8Array(memory.buffer)[keyStatePtr + scancode] = 1;
      }, { passive: false });
      const release = () => {
        el.classList.remove("pressed");
        if (keyStatePtr) new Uint8Array(memory.buffer)[keyStatePtr + scancode] = 0;
      };
      el.addEventListener("touchend", release);
      el.addEventListener("touchcancel", release);
    }
  }
  return {
    input_set_pointers: (keyState, mouseDelta, moveStick, aimStick) => {
      keyStatePtr = keyState;
      mouseDeltaPtr = mouseDelta;
      moveStickPtr = moveStick;
      aimStickPtr = aimStick;
    },
    input_is_touch_device: () => isTouchDevice ? 1 : 0,
    input_get_canvas_size: (wPtr, hPtr) => {
      const dv = new DataView(memory.buffer);
      dv.setInt32(wPtr, canvas.width, true);
      dv.setInt32(hPtr, canvas.height, true);
    }
  };
}

// ../node_modules/partysocket/dist/ws.js
if (!globalThis.EventTarget || !globalThis.Event)
  console.error(`
  PartySocket requires a global 'EventTarget' class to be available!
  You can polyfill this global by adding this to your code before any partysocket imports: 
  
  \`\`\`
  import 'partysocket/event-target-polyfill';
  \`\`\`
  Please file an issue at https://github.com/partykit/partykit if you're still having trouble.
`);
var ErrorEvent = class extends Event {
  message;
  error;
  constructor(error, target) {
    super("error", target);
    this.message = error.message;
    this.error = error;
  }
};
var CloseEvent = class extends Event {
  code;
  reason;
  wasClean = true;
  constructor(code = 1e3, reason = "", target) {
    super("close", target);
    this.code = code;
    this.reason = reason;
  }
};
var Events = {
  Event,
  ErrorEvent,
  CloseEvent
};
function assert(condition, msg) {
  if (!condition) throw new Error(msg);
}
function cloneEventBrowser(e) {
  return new e.constructor(e.type, e);
}
function cloneEventNode(e) {
  if ("data" in e) return new MessageEvent(e.type, e);
  if ("code" in e || "reason" in e)
    return new CloseEvent(e.code || 1999, e.reason || "unknown reason", e);
  if ("error" in e) return new ErrorEvent(e.error, e);
  return new Event(e.type, e);
}
var isNode = typeof process !== "undefined" && typeof process.versions?.node !== "undefined";
var isReactNative = typeof navigator !== "undefined" && navigator.product === "ReactNative";
var cloneEvent = isNode || isReactNative ? cloneEventNode : cloneEventBrowser;
var DEFAULT = {
  maxReconnectionDelay: 1e4,
  minReconnectionDelay: 1e3 + Math.random() * 4e3,
  minUptime: 5e3,
  reconnectionDelayGrowFactor: 1.3,
  connectionTimeout: 4e3,
  maxRetries: Number.POSITIVE_INFINITY,
  maxEnqueuedMessages: Number.POSITIVE_INFINITY,
  startClosed: false,
  debug: false
};
var didWarnAboutMissingWebSocket = false;
var ReconnectingWebSocket = class ReconnectingWebSocket2 extends EventTarget {
  _ws;
  _retryCount = -1;
  _uptimeTimeout;
  _connectTimeout;
  _shouldReconnect = true;
  _connectLock = false;
  _binaryType = "blob";
  _closeCalled = false;
  _messageQueue = [];
  _debugLogger = console.log.bind(console);
  _url;
  _protocols;
  _options;
  constructor(url, protocols, options = {}) {
    super();
    this._url = url;
    this._protocols = protocols;
    this._options = options;
    if (this._options.startClosed) this._shouldReconnect = false;
    if (this._options.debugLogger)
      this._debugLogger = this._options.debugLogger;
    this._connect();
  }
  static get CONNECTING() {
    return 0;
  }
  static get OPEN() {
    return 1;
  }
  static get CLOSING() {
    return 2;
  }
  static get CLOSED() {
    return 3;
  }
  get CONNECTING() {
    return ReconnectingWebSocket2.CONNECTING;
  }
  get OPEN() {
    return ReconnectingWebSocket2.OPEN;
  }
  get CLOSING() {
    return ReconnectingWebSocket2.CLOSING;
  }
  get CLOSED() {
    return ReconnectingWebSocket2.CLOSED;
  }
  get binaryType() {
    return this._ws ? this._ws.binaryType : this._binaryType;
  }
  set binaryType(value) {
    this._binaryType = value;
    if (this._ws) this._ws.binaryType = value;
  }
  /**
   * Returns the number or connection retries
   */
  get retryCount() {
    return Math.max(this._retryCount, 0);
  }
  /**
   * The number of bytes of data that have been queued using calls to send() but not yet
   * transmitted to the network. This value resets to zero once all queued data has been sent.
   * This value does not reset to zero when the connection is closed; if you keep calling send(),
   * this will continue to climb. Read only
   */
  get bufferedAmount() {
    return this._messageQueue.reduce((acc, message) => {
      if (typeof message === "string") acc += message.length;
      else if (message instanceof Blob) acc += message.size;
      else acc += message.byteLength;
      return acc;
    }, 0) + (this._ws ? this._ws.bufferedAmount : 0);
  }
  /**
   * The extensions selected by the server. This is currently only the empty string or a list of
   * extensions as negotiated by the connection
   */
  get extensions() {
    return this._ws ? this._ws.extensions : "";
  }
  /**
   * A string indicating the name of the sub-protocol the server selected;
   * this will be one of the strings specified in the protocols parameter when creating the
   * WebSocket object
   */
  get protocol() {
    return this._ws ? this._ws.protocol : "";
  }
  /**
   * The current state of the connection; this is one of the Ready state constants
   */
  get readyState() {
    if (this._ws) return this._ws.readyState;
    return this._options.startClosed ? ReconnectingWebSocket2.CLOSED : ReconnectingWebSocket2.CONNECTING;
  }
  /**
   * The URL as resolved by the constructor
   */
  get url() {
    return this._ws ? this._ws.url : "";
  }
  /**
   * Whether the websocket object is now in reconnectable state
   */
  get shouldReconnect() {
    return this._shouldReconnect;
  }
  /**
   * An event listener to be called when the WebSocket connection's readyState changes to CLOSED
   */
  onclose = null;
  /**
   * An event listener to be called when an error occurs
   */
  onerror = null;
  /**
   * An event listener to be called when a message is received from the server
   */
  onmessage = null;
  /**
   * An event listener to be called when the WebSocket connection's readyState changes to OPEN;
   * this indicates that the connection is ready to send and receive data
   */
  onopen = null;
  /**
   * Closes the WebSocket connection or connection attempt, if any. If the connection is already
   * CLOSED, this method does nothing
   */
  close(code = 1e3, reason) {
    this._closeCalled = true;
    this._shouldReconnect = false;
    this._clearTimeouts();
    if (!this._ws) {
      this._debug("close enqueued: no ws instance");
      return;
    }
    if (this._ws.readyState === this.CLOSED) {
      this._debug("close: already closed");
      return;
    }
    this._ws.close(code, reason);
  }
  /**
   * Closes the WebSocket connection or connection attempt and connects again.
   * Resets retry counter;
   */
  reconnect(code, reason) {
    this._shouldReconnect = true;
    this._closeCalled = false;
    this._retryCount = -1;
    if (!this._ws || this._ws.readyState === this.CLOSED) this._connect();
    else {
      this._disconnect(code, reason);
      this._connect();
    }
  }
  /**
   * Enqueue specified data to be transmitted to the server over the WebSocket connection
   */
  send(data) {
    if (this._ws && this._ws.readyState === this.OPEN) {
      this._debug("send", data);
      this._ws.send(data);
    } else {
      const { maxEnqueuedMessages = DEFAULT.maxEnqueuedMessages } = this._options;
      if (this._messageQueue.length < maxEnqueuedMessages) {
        this._debug("enqueue", data);
        this._messageQueue.push(data);
      }
    }
  }
  _debug(...args) {
    if (this._options.debug) this._debugLogger("RWS>", ...args);
  }
  _getNextDelay() {
    const {
      reconnectionDelayGrowFactor = DEFAULT.reconnectionDelayGrowFactor,
      minReconnectionDelay = DEFAULT.minReconnectionDelay,
      maxReconnectionDelay = DEFAULT.maxReconnectionDelay
    } = this._options;
    let delay = 0;
    if (this._retryCount > 0) {
      delay = minReconnectionDelay * reconnectionDelayGrowFactor ** (this._retryCount - 1);
      if (delay > maxReconnectionDelay) delay = maxReconnectionDelay;
    }
    this._debug("next delay", delay);
    return delay;
  }
  _wait() {
    return new Promise((resolve) => {
      setTimeout(resolve, this._getNextDelay());
    });
  }
  _getNextProtocols(protocolsProvider) {
    if (!protocolsProvider) return Promise.resolve(null);
    if (typeof protocolsProvider === "string" || Array.isArray(protocolsProvider))
      return Promise.resolve(protocolsProvider);
    if (typeof protocolsProvider === "function") {
      const protocols = protocolsProvider();
      if (!protocols) return Promise.resolve(null);
      if (typeof protocols === "string" || Array.isArray(protocols))
        return Promise.resolve(protocols);
      if (protocols.then) return protocols;
    }
    throw Error("Invalid protocols");
  }
  _getNextUrl(urlProvider) {
    if (typeof urlProvider === "string") return Promise.resolve(urlProvider);
    if (typeof urlProvider === "function") {
      const url = urlProvider();
      if (typeof url === "string") return Promise.resolve(url);
      if (url.then) return url;
    }
    throw Error("Invalid URL");
  }
  _connect() {
    if (this._connectLock || !this._shouldReconnect) return;
    this._connectLock = true;
    const {
      maxRetries = DEFAULT.maxRetries,
      connectionTimeout = DEFAULT.connectionTimeout
    } = this._options;
    if (this._retryCount >= maxRetries) {
      this._debug("max retries reached", this._retryCount, ">=", maxRetries);
      this._connectLock = false;
      return;
    }
    this._retryCount++;
    this._debug("connect", this._retryCount);
    this._removeListeners();
    this._wait().then(
      () => Promise.all([
        this._getNextUrl(this._url),
        this._getNextProtocols(this._protocols || null)
      ])
    ).then(([url, protocols]) => {
      if (this._closeCalled) {
        this._connectLock = false;
        return;
      }
      if (!this._options.WebSocket && typeof WebSocket === "undefined" && !didWarnAboutMissingWebSocket) {
        console.error(`\u203C\uFE0F No WebSocket implementation available. You should define options.WebSocket. 

For example, if you're using node.js, run \`npm install ws\`, and then in your code:

import PartySocket from 'partysocket';
import WS from 'ws';

const partysocket = new PartySocket({
  host: "127.0.0.1:1999",
  room: "test-room",
  WebSocket: WS
});

`);
        didWarnAboutMissingWebSocket = true;
      }
      const WS = this._options.WebSocket || WebSocket;
      this._debug("connect", {
        url,
        protocols
      });
      this._ws = protocols ? new WS(url, protocols) : new WS(url);
      this._ws.binaryType = this._binaryType;
      this._connectLock = false;
      this._addListeners();
      this._connectTimeout = setTimeout(
        () => this._handleTimeout(),
        connectionTimeout
      );
    }).catch((err2) => {
      this._connectLock = false;
      this._handleError(new Events.ErrorEvent(Error(err2.message), this));
    });
  }
  _handleTimeout() {
    this._debug("timeout event");
    this._handleError(new Events.ErrorEvent(Error("TIMEOUT"), this));
  }
  _disconnect(code = 1e3, reason) {
    this._clearTimeouts();
    if (!this._ws) return;
    this._removeListeners();
    try {
      if (this._ws.readyState === this.OPEN || this._ws.readyState === this.CONNECTING)
        this._ws.close(code, reason);
      this._handleClose(new Events.CloseEvent(code, reason, this));
    } catch (_error) {
    }
  }
  _acceptOpen() {
    this._debug("accept open");
    this._retryCount = 0;
  }
  _handleOpen = (event) => {
    this._debug("open event");
    const { minUptime = DEFAULT.minUptime } = this._options;
    clearTimeout(this._connectTimeout);
    this._uptimeTimeout = setTimeout(() => this._acceptOpen(), minUptime);
    assert(this._ws, "WebSocket is not defined");
    this._ws.binaryType = this._binaryType;
    this._messageQueue.forEach((message) => {
      this._ws?.send(message);
    });
    this._messageQueue = [];
    if (this.onopen) this.onopen(event);
    this.dispatchEvent(cloneEvent(event));
  };
  _handleMessage = (event) => {
    this._debug("message event");
    if (this.onmessage) this.onmessage(event);
    this.dispatchEvent(cloneEvent(event));
  };
  _handleError = (event) => {
    this._debug("error event", event.message);
    this._disconnect(void 0, event.message === "TIMEOUT" ? "timeout" : void 0);
    if (this.onerror) this.onerror(event);
    this._debug("exec error listeners");
    this.dispatchEvent(cloneEvent(event));
    this._connect();
  };
  _handleClose = (event) => {
    this._debug("close event");
    this._clearTimeouts();
    if (this._shouldReconnect) this._connect();
    if (this.onclose) this.onclose(event);
    this.dispatchEvent(cloneEvent(event));
  };
  _removeListeners() {
    if (!this._ws) return;
    this._debug("removeListeners");
    this._ws.removeEventListener("open", this._handleOpen);
    this._ws.removeEventListener("close", this._handleClose);
    this._ws.removeEventListener("message", this._handleMessage);
    this._ws.removeEventListener("error", this._handleError);
  }
  _addListeners() {
    if (!this._ws) return;
    this._debug("addListeners");
    this._ws.addEventListener("open", this._handleOpen);
    this._ws.addEventListener("close", this._handleClose);
    this._ws.addEventListener("message", this._handleMessage);
    this._ws.addEventListener("error", this._handleError);
  }
  _clearTimeouts() {
    clearTimeout(this._connectTimeout);
    clearTimeout(this._uptimeTimeout);
  }
};

// ../node_modules/partysocket/dist/index.js
var valueIsNotNil = (keyValuePair) => keyValuePair[1] !== null && keyValuePair[1] !== void 0;
function generateUUID() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  let d = Date.now();
  let d2 = performance?.now && performance.now() * 1e3 || 0;
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
    let r = Math.random() * 16;
    if (d > 0) {
      r = (d + r) % 16 | 0;
      d = Math.floor(d / 16);
    } else {
      r = (d2 + r) % 16 | 0;
      d2 = Math.floor(d2 / 16);
    }
    return (c === "x" ? r : r & 3 | 8).toString(16);
  });
}
function getPartyInfo(partySocketOptions, defaultProtocol, defaultParams = {}) {
  const {
    host: rawHost,
    path: rawPath,
    protocol: rawProtocol,
    room,
    party,
    basePath,
    prefix,
    query
  } = partySocketOptions;
  let host = rawHost.replace(/^(http|https|ws|wss):\/\//, "");
  if (host.endsWith("/")) host = host.slice(0, -1);
  if (rawPath?.startsWith("/"))
    throw new Error("path must not start with a slash");
  const name = party ?? "main";
  const path = rawPath ? `/${rawPath}` : "";
  const protocol = rawProtocol || (host.startsWith("localhost:") || host.startsWith("127.0.0.1:") || host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172.") && host.split(".")[1] >= "16" && host.split(".")[1] <= "31" || host.startsWith("[::ffff:7f00:1]:") ? defaultProtocol : `${defaultProtocol}s`);
  const baseUrl = `${protocol}://${host}/${basePath || `${prefix || "parties"}/${name}/${room}`}${path}`;
  const makeUrl = (query2 = {}) => `${baseUrl}?${new URLSearchParams([...Object.entries(defaultParams), ...Object.entries(query2).filter(valueIsNotNil)])}`;
  const urlProvider = typeof query === "function" ? async () => makeUrl(await query()) : makeUrl(query);
  return {
    host,
    path,
    room,
    name,
    protocol,
    partyUrl: baseUrl,
    urlProvider
  };
}
var PartySocket = class extends ReconnectingWebSocket {
  _pk;
  _pkurl;
  name;
  room;
  host;
  path;
  basePath;
  constructor(partySocketOptions) {
    const wsOptions = getWSOptions(partySocketOptions);
    super(wsOptions.urlProvider, wsOptions.protocols, wsOptions.socketOptions);
    this.partySocketOptions = partySocketOptions;
    this.setWSProperties(wsOptions);
    if (!partySocketOptions.startClosed && !this.room && !this.basePath) {
      this.close();
      throw new Error(
        "Either room or basePath must be provided to connect. Use startClosed: true to create a socket and set them via updateProperties before calling reconnect()."
      );
    }
    if (!partySocketOptions.disableNameValidation) {
      if (partySocketOptions.party?.includes("/"))
        console.warn(
          `PartySocket: party name "${partySocketOptions.party}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`
        );
      if (partySocketOptions.room?.includes("/"))
        console.warn(
          `PartySocket: room name "${partySocketOptions.room}" contains forward slash which may cause routing issues. Consider using a name without forward slashes or set disableNameValidation: true to bypass this warning.`
        );
    }
  }
  updateProperties(partySocketOptions) {
    const wsOptions = getWSOptions({
      ...this.partySocketOptions,
      ...partySocketOptions,
      host: partySocketOptions.host ?? this.host,
      room: partySocketOptions.room ?? this.room,
      path: partySocketOptions.path ?? this.path,
      basePath: partySocketOptions.basePath ?? this.basePath
    });
    this._url = wsOptions.urlProvider;
    this._protocols = wsOptions.protocols;
    this._options = wsOptions.socketOptions;
    this.setWSProperties(wsOptions);
  }
  setWSProperties(wsOptions) {
    const { _pk, _pkurl, name, room, host, path, basePath } = wsOptions;
    this._pk = _pk;
    this._pkurl = _pkurl;
    this.name = name;
    this.room = room;
    this.host = host;
    this.path = path;
    this.basePath = basePath;
  }
  reconnect(code, reason) {
    if (!this.host)
      throw new Error(
        "The host must be set before connecting, use `updateProperties` method to set it or pass it to the constructor."
      );
    if (!this.room && !this.basePath)
      throw new Error(
        "The room (or basePath) must be set before connecting, use `updateProperties` method to set it or pass it to the constructor."
      );
    super.reconnect(code, reason);
  }
  get id() {
    return this._pk;
  }
  /**
   * Exposes the static PartyKit room URL without applying query parameters.
   * To access the currently connected WebSocket url, use PartySocket#url.
   */
  get roomUrl() {
    return this._pkurl;
  }
  static async fetch(options, init) {
    const party = getPartyInfo(options, "http");
    const url = typeof party.urlProvider === "string" ? party.urlProvider : await party.urlProvider();
    return (options.fetch ?? fetch)(url, init);
  }
};
function getWSOptions(partySocketOptions) {
  const {
    id,
    host: _host,
    path: _path,
    party: _party,
    room: _room,
    protocol: _protocol,
    query: _query,
    protocols,
    ...socketOptions
  } = partySocketOptions;
  const _pk = id || generateUUID();
  const party = getPartyInfo(partySocketOptions, "ws", { _pk });
  return {
    _pk,
    _pkurl: party.partyUrl,
    name: party.name,
    room: party.room,
    host: party.host,
    path: party.path,
    basePath: partySocketOptions.basePath,
    protocols,
    socketOptions,
    urlProvider: party.urlProvider
  };
}

// ../network.js
function createNetworkBridge(memory) {
  let socket = null;
  const incomingQueue = [];
  let connectionState = 0;
  function readString(ptr) {
    const view = new Uint8Array(memory.buffer);
    let end = ptr;
    while (view[end] !== 0) end++;
    return new TextDecoder().decode(view.subarray(ptr, end));
  }
  return {
    ws_connect: (hostPtr, roomPtr) => {
      const host = readString(hostPtr);
      const room = readString(roomPtr);
      connectionState = 1;
      socket = new PartySocket({ host, room });
      socket.binaryType = "arraybuffer";
      socket.addEventListener("open", () => {
        connectionState = 2;
        history.replaceState(null, "", "#room=" + encodeURIComponent(room));
      });
      socket.addEventListener("message", (e) => {
        if (e.data instanceof ArrayBuffer) {
          incomingQueue.push(e.data);
        } else if (typeof e.data === "string") {
          incomingQueue.push(new TextEncoder().encode(e.data).buffer);
        }
      });
      socket.addEventListener("close", () => {
        connectionState = 3;
      });
      socket.addEventListener("error", () => {
        connectionState = 3;
      });
      return 1;
    },
    ws_send: (dataPtr, size, flags) => {
      if (!socket || connectionState !== 2) return 0;
      socket.send(new Uint8Array(memory.buffer, dataPtr, size).slice());
      return 1;
    },
    ws_recv: (outPtr, maxSize) => {
      if (incomingQueue.length === 0) return 0;
      const msg = incomingQueue.shift();
      const bytes = new Uint8Array(msg);
      const toCopy = Math.min(bytes.length, maxSize);
      new Uint8Array(memory.buffer).set(bytes.subarray(0, toCopy), outPtr);
      return toCopy;
    },
    ws_get_state: () => connectionState,
    ws_disconnect: () => {
      if (socket) {
        socket.close();
        socket = null;
      }
      connectionState = 0;
    }
  };
}
function getRoomFromURL() {
  const match = location.hash.match(/room=([^&]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ../main.js
var progressFill = document.getElementById("progress-bar-fill");
var progressText = document.getElementById("progress-text");
var progressDetail = document.getElementById("progress-detail");
function updateProgress(pct, msg) {
  progressFill.style.width = pct * 100 + "%";
  if (msg.includes("...") && msg.length > 30) {
    const parts = msg.split("...");
    progressText.textContent = parts[0] + "...";
    progressDetail.textContent = parts.slice(1).join("...").trim();
  } else {
    progressText.textContent = msg;
    progressDetail.textContent = "";
  }
}
async function main() {
  const { fileMap, imageMap } = await loadAssets(updateProgress);
  updateProgress(1, "Initializing WebGL...");
  const canvas = document.getElementById("game-canvas");
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  updateProgress(1, "Loading game...");
  const wasmResp = await fetch("soldat.wasm?v=" + Date.now());
  const wasmBytes = await wasmResp.arrayBuffer();
  let memory = null;
  const memoryProxy = new Proxy({}, {
    get(target, prop) {
      if (prop === "buffer") return memory.buffer;
      return void 0;
    }
  });
  const fsBridge = createFilesystemBridge(memoryProxy, fileMap);
  const glBridge = createGLBridge(memoryProxy, canvas);
  const audioBridge = createAudioBridge(memoryProxy);
  const inputBridge = createInputBridge(memoryProxy, canvas);
  const netBridge = createNetworkBridge(memoryProxy);
  const perfStart = performance.now();
  const sdlBridge = {
    sdl_get_performance_counter: () => {
      return BigInt(Math.round((performance.now() - perfStart) * 1e3));
    },
    sdl_get_performance_frequency: () => {
      return BigInt(1e6);
    }
  };
  const controlBridge = {
    web_stop: () => {
      throw new Error("web_stop: _start completed \u2014 game state preserved");
    }
  };
  const envImports = {
    ...fsBridge,
    ...glBridge,
    ...audioBridge,
    ...inputBridge,
    ...netBridge,
    ...sdlBridge,
    ...controlBridge
  };
  const envProxy = new Proxy(envImports, {
    get(target, prop) {
      if (prop in target) return target[prop];
      return (...args) => 0;
    }
  });
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
        const now = BigInt(Math.round(performance.now() * 1e6));
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
      fd_write: (fd2, iovs, iovsLen, nwrittenPtr) => {
        const dv = new DataView(memory.buffer);
        const mem = new Uint8Array(memory.buffer);
        let written = 0;
        for (let i = 0; i < iovsLen; i++) {
          const ptr = dv.getUint32(iovs + i * 8, true);
          const len = dv.getUint32(iovs + i * 8 + 4, true);
          const chunk = new TextDecoder().decode(mem.subarray(ptr, ptr + len));
          console.log("[soldat]", chunk);
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
        console.log("proc_exit(" + code + ")");
        throw new WebAssembly.RuntimeError("proc_exit(" + code + ")");
      },
      random_get: (bufPtr, bufLen) => {
        crypto.getRandomValues(new Uint8Array(memory.buffer, bufPtr, bufLen));
        return 0;
      }
    }
  };
  const imageByContent = /* @__PURE__ */ new Map();
  for (const [path, fileData] of fileMap.entries()) {
    const img = imageMap.get(path);
    if (img) {
      const header = Array.from(fileData.subarray(0, Math.min(16, fileData.length))).map((b) => b.toString(16).padStart(2, "0")).join("");
      const key = fileData.length + ":" + header;
      imageByContent.set(key, img);
    }
  }
  console.log(`[soldat] Image content lookup: ${imageByContent.size} entries`);
  const stbModule = {
    stbi_xload_mem: (bufferPtr, len, wPtr, hPtr, fPtr, delaysPtr) => {
      const dv = new DataView(memory.buffer);
      const data = new Uint8Array(memory.buffer, bufferPtr, Math.min(len, 16));
      const header = Array.from(data).map((b) => b.toString(16).padStart(2, "0")).join("");
      const key = len + ":" + header;
      const img = imageByContent.get(key);
      if (!stbModule._totalCalls) stbModule._totalCalls = 0;
      stbModule._totalCalls++;
      if (!img) {
        if (!stbModule._missCount) stbModule._missCount = 0;
        stbModule._missCount++;
        if (stbModule._missCount <= 10) {
          console.warn(`[stb] MISS #${stbModule._missCount}: len=${len} key=${key.substring(0, 40)}`);
        }
        dv.setInt32(wPtr, 0, true);
        dv.setInt32(hPtr, 0, true);
        dv.setInt32(fPtr, 0, true);
        return 0;
      }
      if (!stbModule._hitCount) stbModule._hitCount = 0;
      stbModule._hitCount++;
      const pixelSize = img.width * img.height * 4;
      if (img.pixels.length < pixelSize) {
        console.error(`[stb] HIT #${stbModule._hitCount}: ${img.width}x${img.height} PIXEL SIZE MISMATCH: have ${img.pixels.length}, need ${pixelSize}`);
        dv.setInt32(wPtr, 0, true);
        dv.setInt32(hPtr, 0, true);
        dv.setInt32(fPtr, 0, true);
        return 0;
      }
      dv.setInt32(wPtr, img.width, true);
      dv.setInt32(hPtr, img.height, true);
      dv.setInt32(fPtr, 1, true);
      if (delaysPtr) dv.setInt32(delaysPtr, 0, true);
      if (!stbModule._bumpPtr) {
        stbModule._bumpPtr = memory.buffer.byteLength;
      }
      const needed = stbModule._bumpPtr + pixelSize;
      const currentSize = memory.buffer.byteLength;
      if (needed > currentSize) {
        const pagesToGrow = Math.ceil((needed - currentSize) / 65536);
        wasmInstance.exports.memory.grow(pagesToGrow);
      }
      const outPtr = stbModule._bumpPtr;
      stbModule._bumpPtr += pixelSize;
      stbModule._bumpPtr = stbModule._bumpPtr + 15 & ~15;
      console.log(`[stb] HIT #${stbModule._hitCount}: ${img.width}x${img.height} ptr=${outPtr} end=${outPtr + pixelSize}/${memory.buffer.byteLength}`);
      new Uint8Array(memory.buffer).set(img.pixels.subarray(0, pixelSize), outPtr);
      return outPtr;
    },
    stbi_image_free: (dataPtr) => {
    },
    stbi_write_png: () => 0,
    stbir_resize_uint8: (inPtr, inW, inH, inStride, outPtr, outW, outH, outStride, numChannels) => {
      console.log(`[stb] resize: ${inW}x${inH} -> ${outW}x${outH} ch=${numChannels} inStride=${inStride} outStride=${outStride}`);
      const src = new Uint8Array(memory.buffer);
      const dst = new Uint8Array(memory.buffer);
      for (let y = 0; y < outH; y++) {
        const sy = Math.floor(y * inH / outH);
        for (let x = 0; x < outW; x++) {
          const sx = Math.floor(x * inW / outW);
          for (let c = 0; c < numChannels; c++) {
            dst[outPtr + (y * outW + x) * numChannels + c] = src[inPtr + (sy * inW + sx) * numChannels + c];
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
    stbi_write_hdr: () => 0
  };
  const ftBridge = /* @__PURE__ */ (() => {
    const faces = /* @__PURE__ */ new Map();
    let nextFaceId = 1;
    function walloc(size) {
      return wasmInstance.exports.web_alloc(size);
    }
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
    const FACE = {
      num_faces: 0,
      // FT_Long = i32 on wasm32
      face_index: 4,
      face_flags: 8,
      style_flags: 12,
      num_glyphs: 16,
      family_name: 20,
      // pointer
      style_name: 24,
      // pointer
      num_fixed_sizes: 28,
      available_sizes: 32,
      // pointer
      num_charmaps: 36,
      charmaps: 40,
      // pointer
      // generic: 2 pointers (data + finalizer) = 8 bytes
      generic_data: 44,
      generic_finalizer: 48,
      // bbox: 4 x FT_Pos (i32) = 16 bytes
      bbox: 52,
      units_per_EM: 68,
      // FT_UShort = u16
      ascender: 70,
      // FT_Short = i16
      descender: 72,
      height: 74,
      max_advance_width: 76,
      max_advance_height: 78,
      underline_position: 80,
      underline_thickness: 82,
      glyph: 84,
      // pointer to GlyphSlotRec
      size: 88
      // pointer to SizeRec
    };
    const FACE_SIZE = 256;
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
      bitmap_buffer: 88,
      // pointer
      bitmap_num_grays: 92,
      // u16
      bitmap_pixel_mode: 94,
      // u8
      bitmap_palette_mode: 95,
      bitmap_palette: 96,
      bitmap_left: 100,
      bitmap_top: 104
    };
    const SLOT_SIZE = 256;
    const SIZE_METRICS = {
      // FT_SizeRec: face(4) + generic(8) + metrics...
      x_ppem: 12,
      // after face(4) + generic(8)
      y_ppem: 14,
      x_scale: 16,
      y_scale: 20,
      ascender: 24,
      descender: 28,
      height: 32,
      max_advance: 36
    };
    const SIZE_SIZE = 64;
    return {
      FT_Init_FreeType: (alibPtr) => {
        const libPtr = walloc(4);
        wu32(alibPtr, libPtr);
        return 0;
      },
      FT_Done_FreeType: (lib) => 0,
      FT_New_Face: (lib, filenamePtr, faceIndex, afacePtr) => {
        const facePtr = walloc(FACE_SIZE);
        const slotPtr = walloc(SLOT_SIZE);
        const sizePtr = walloc(SIZE_SIZE);
        const mem = new Uint8Array(memory.buffer);
        mem.fill(0, facePtr, facePtr + FACE_SIZE);
        mem.fill(0, slotPtr, slotPtr + SLOT_SIZE);
        mem.fill(0, sizePtr, sizePtr + SIZE_SIZE);
        w32(facePtr + FACE.face_flags, 81);
        w32(facePtr + FACE.num_glyphs, 65536);
        wu16(facePtr + FACE.units_per_EM, 2048);
        w16(facePtr + FACE.ascender, 1900);
        w16(facePtr + FACE.descender, -500);
        w16(facePtr + FACE.height, 2400);
        w16(facePtr + FACE.max_advance_width, 1200);
        wu32(facePtr + FACE.glyph, slotPtr);
        wu32(facePtr + FACE.size, sizePtr);
        wu32(slotPtr + SLOT.face, facePtr);
        wu32(sizePtr + 0, facePtr);
        const canvas2 = new OffscreenCanvas(256, 256);
        const ctx = canvas2.getContext("2d");
        faces.set(facePtr, { canvas: canvas2, ctx, fontSize: 16, fontFamily: "sans-serif" });
        wu32(afacePtr, facePtr);
        console.log(`[FT] New face at ${facePtr}, slot=${slotPtr}, size=${sizePtr}`);
        return 0;
      },
      FT_New_Memory_Face: (lib, fileBase, fileSize, faceIndex, afacePtr) => {
        return ftBridge.FT_New_Face(lib, 0, faceIndex, afacePtr);
      },
      FT_Done_Face: (facePtr) => {
        faces.delete(facePtr);
        return 0;
      },
      FT_Select_Charmap: (facePtr, encoding) => 0,
      FT_Request_Size: (facePtr, reqPtr) => {
        const dv = new DataView(memory.buffer);
        const height = dv.getInt32(reqPtr + 8, true);
        const face = faces.get(facePtr);
        if (face) {
          face.fontSize = Math.max(1, Math.round(height / 64));
          const sizePtr = dv.getUint32(facePtr + FACE.size, true);
          if (sizePtr) {
            const px = face.fontSize;
            wu16(sizePtr + SIZE_METRICS.x_ppem, px);
            wu16(sizePtr + SIZE_METRICS.y_ppem, px);
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
        return charcode > 0 ? charcode : 0;
      },
      FT_Load_Glyph: (facePtr, glyphIndex, loadFlags) => {
        const face = faces.get(facePtr);
        if (!face) return 1;
        const ch = String.fromCodePoint(glyphIndex > 0 ? glyphIndex : 32);
        const px = face.fontSize;
        const { canvas: canvas2, ctx } = face;
        const cSize = Math.max(px * 2, 64);
        if (canvas2.width < cSize) {
          canvas2.width = cSize;
          canvas2.height = cSize;
        }
        ctx.clearRect(0, 0, canvas2.width, canvas2.height);
        ctx.font = `${px}px sans-serif`;
        ctx.textBaseline = "alphabetic";
        ctx.fillStyle = "white";
        const m = ctx.measureText(ch);
        const ascent = Math.ceil(m.actualBoundingBoxAscent || Math.round(px * 0.8));
        const descent = Math.ceil(m.actualBoundingBoxDescent || Math.round(px * 0.2));
        const bboxLeft = Math.ceil(m.actualBoundingBoxLeft || 0);
        const bboxRight = Math.ceil(m.actualBoundingBoxRight || Math.ceil(m.width) || 1);
        const glyphW = bboxLeft + bboxRight;
        const glyphH = ascent + descent;
        const bearingX = -bboxLeft;
        const bearingY = ascent;
        const advance = Math.round(m.width);
        ctx.fillText(ch, bboxLeft, ascent);
        const readW = Math.min(glyphW + 1, canvas2.width);
        const readH = Math.min(glyphH + 1, canvas2.height);
        const imgData = ctx.getImageData(0, 0, readW, readH);
        const bitmapW = Math.min(glyphW, readW);
        const bitmapH = Math.min(glyphH, readH);
        const bitmapSize = bitmapW * bitmapH;
        let bitmapPtr = 0;
        if (bitmapSize > 0) {
          bitmapPtr = walloc(bitmapSize);
          const dst = new Uint8Array(memory.buffer);
          for (let y = 0; y < bitmapH; y++) {
            for (let x = 0; x < bitmapW; x++) {
              const srcIdx = (y * imgData.width + x) * 4;
              dst[bitmapPtr + y * bitmapW + x] = imgData.data[srcIdx + 3];
            }
          }
        }
        const dv = new DataView(memory.buffer);
        const slotPtr = dv.getUint32(facePtr + FACE.glyph, true);
        w32(slotPtr + SLOT.metrics_width, bitmapW * 64);
        w32(slotPtr + SLOT.metrics_height, bitmapH * 64);
        w32(slotPtr + SLOT.metrics_horiBearingX, bearingX * 64);
        w32(slotPtr + SLOT.metrics_horiBearingY, bearingY * 64);
        w32(slotPtr + SLOT.metrics_horiAdvance, advance * 64);
        w32(slotPtr + SLOT.advance_x, advance * 64);
        w32(slotPtr + SLOT.advance_y, 0);
        wu32(slotPtr + SLOT.format, 1651078259);
        wu32(slotPtr + SLOT.bitmap_rows, bitmapH);
        wu32(slotPtr + SLOT.bitmap_width, bitmapW);
        w32(slotPtr + SLOT.bitmap_pitch, bitmapW);
        wu32(slotPtr + SLOT.bitmap_buffer, bitmapPtr);
        wu16(slotPtr + SLOT.bitmap_num_grays, 256);
        w8(slotPtr + SLOT.bitmap_pixel_mode, 2);
        w32(slotPtr + SLOT.bitmap_left, bearingX);
        w32(slotPtr + SLOT.bitmap_top, bearingY);
        return 0;
      },
      FT_Get_Kerning: (facePtr, leftGlyph, rightGlyph, kernMode, akernPtr) => {
        w32(akernPtr, 0);
        w32(akernPtr + 4, 0);
        return 0;
      }
    };
  })();
  Object.assign(envImports, ftBridge);
  let wasmInstance = null;
  const { instance } = await WebAssembly.instantiate(wasmBytes, {
    ...wasi,
    env: envProxy,
    "stb.so": stbModule
  });
  memory = instance.exports.memory;
  wasmInstance = instance;
  setGlobalWasmInstance(instance);
  const samplePaths = [...fileMap.keys()].slice(0, 20);
  console.log("[soldat] Asset file map: " + fileMap.size + " files. Sample:", samplePaths);
  console.log("[soldat] Calling _start (RTL init + StartGame)...");
  try {
    instance.exports._start();
  } catch (e) {
    if (e.message && e.message.includes("web_stop")) {
      console.log("[soldat] _start completed \u2014 game state preserved for web_tick");
    } else if (e.message && e.message.includes("proc_exit")) {
      console.warn("[soldat] _start ended via proc_exit \u2014 unit finalizers may have run!");
    } else {
      throw e;
    }
  }
  document.getElementById("loading").style.display = "none";
  canvas.style.display = "block";
  const resumeAudio = () => {
    audioBridge.al_resume();
    document.removeEventListener("click", resumeAudio);
    document.removeEventListener("touchstart", resumeAudio);
  };
  document.addEventListener("click", resumeAudio);
  document.addEventListener("touchstart", resumeAudio);
  function handleResize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (instance.exports.web_resize)
      instance.exports.web_resize(canvas.width, canvas.height);
  }
  window.addEventListener("resize", handleResize);
  handleResize();
  function joinRoom(roomName) {
    if (!instance.exports.join_room) return;
    const encoder = new TextEncoder();
    const roomBytes = encoder.encode(roomName);
    const ptr = instance.exports.web_alloc(roomBytes.length + 1);
    new Uint8Array(memory.buffer).set(roomBytes, ptr);
    new Uint8Array(memory.buffer)[ptr + roomBytes.length] = 0;
    instance.exports.join_room(ptr);
    document.getElementById("lobby").style.display = "none";
  }
  const room = getRoomFromURL();
  const lobbyEl = document.getElementById("lobby");
  if (room) {
    joinRoom(room);
  } else {
    lobbyEl.style.display = "flex";
    document.getElementById("btn-create-game").addEventListener("click", () => {
      const roomName = "game-" + Math.random().toString(36).substring(2, 8);
      window.location.hash = "#room=" + roomName;
      joinRoom(roomName);
    });
    document.getElementById("btn-join").addEventListener("click", () => {
      const roomName = document.getElementById("input-room").value.trim();
      if (roomName) {
        window.location.hash = "#room=" + roomName;
        joinRoom(roomName);
      }
    });
    document.getElementById("btn-offline").addEventListener("click", () => {
      lobbyEl.style.display = "none";
    });
  }
  let tickCount = 0;
  function frame() {
    if (instance.exports.web_tick) {
      try {
        instance.exports.web_tick();
      } catch (e) {
        if (tickCount < 5) console.error("web_tick error:", e.message);
      }
      tickCount++;
      if (tickCount <= 3 || tickCount % 300 === 0) {
        console.log(`[soldat] web_tick #${tickCount}`);
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
main().catch((e) => {
  progressText.textContent = "Error: " + e.message;
  console.error(e);
});
//# sourceMappingURL=main.js.map
