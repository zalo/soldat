// web/assets.js — Download, unzip, cache, and pre-decode image assets
import { unzipSync } from './lib/fflate.js';
import { get, set, del } from './lib/idb-keyval.js';

const ASSET_VERSION = 'v0.4.1'; // bumped to invalidate corrupted caches
const ASSET_URL = './soldat.smod';
const SMOD_CACHE_KEY = 'soldat-smod-' + ASSET_VERSION;

const IMAGE_EXTENSIONS = ['.png', '.bmp', '.jpg', '.jpeg', '.gif'];

export async function loadAssets(onProgress) {
  let smodBytes;

  // Check IndexedDB cache for the raw smod archive
  const cached = await get(SMOD_CACHE_KEY);
  if (cached) {
    onProgress(0.5, 'Loading from cache...');
    smodBytes = new Uint8Array(cached);
  } else {
    // Download with progress
    onProgress(0, 'Downloading assets...');
    const response = await fetch(ASSET_URL);
    const contentLength = parseInt(response.headers.get('Content-Length') || '0', 10);
    const reader = response.body.getReader();
    const chunks = [];
    let received = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      if (contentLength > 0) {
        onProgress(received / contentLength * 0.5,
          `Downloading... ${(received / 1024 / 1024).toFixed(1)}MB`);
      }
    }

    smodBytes = new Uint8Array(received);
    let offset = 0;
    for (const chunk of chunks) {
      smodBytes.set(chunk, offset);
      offset += chunk.length;
    }

    onProgress(0.55, 'Caching download...');
    try {
      await set(SMOD_CACHE_KEY, smodBytes.buffer);
    } catch (e) {
      console.warn('Failed to cache smod in IndexedDB:', e);
    }
  }

  // Unzip — with cache recovery on corruption
  onProgress(0.6, 'Extracting assets...');
  let files;
  try {
    files = unzipSync(smodBytes);
  } catch (e) {
    if (cached) {
      // Cached data is corrupted — clear and re-download
      console.warn('Cached smod corrupted, re-downloading:', e.message);
      await del(SMOD_CACHE_KEY).catch(() => {});
      onProgress(0, 'Cache invalid, re-downloading...');
      const response = await fetch(ASSET_URL);
      smodBytes = new Uint8Array(await response.arrayBuffer());
      onProgress(0.55, 'Caching fresh download...');
      try { await set(SMOD_CACHE_KEY, smodBytes.buffer); } catch {}
      files = unzipSync(smodBytes);
    } else {
      throw e;
    }
  }

  // Build file map
  const fileMap = new Map();
  for (const [path, data] of Object.entries(files)) {
    if (data.length > 0) {
      fileMap.set(path, data);
    }
  }

  // Pre-decode all image files to RGBA pixel data
  onProgress(0.7, 'Decoding images...');
  const imageMap = new Map(); // path -> { width, height, pixels: Uint8Array }
  const imageEntries = [...fileMap.entries()].filter(([path]) =>
    IMAGE_EXTENSIONS.some(ext => path.toLowerCase().endsWith(ext))
  );

  // Decode images in batches to avoid memory pressure
  const BATCH_SIZE = 50;
  for (let i = 0; i < imageEntries.length; i += BATCH_SIZE) {
    const batch = imageEntries.slice(i, i + BATCH_SIZE);
    const promises = batch.map(async ([path, data]) => {
      try {
        const blob = new Blob([data]);
        const bitmap = await createImageBitmap(blob);
        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmap, 0, 0);
        const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);
        imageMap.set(path, {
          width: bitmap.width,
          height: bitmap.height,
          pixels: new Uint8Array(imageData.data.buffer),
        });
        bitmap.close();
      } catch (e) {
        // Some files may not be valid images
        console.warn(`[assets] Failed to decode image: ${path}`, e.message);
      }
    });
    await Promise.all(promises);
    onProgress(0.7 + 0.25 * (i + batch.length) / imageEntries.length,
      `Decoding images... ${i + batch.length}/${imageEntries.length}`);
  }

  console.log(`[assets] Decoded ${imageMap.size}/${imageEntries.length} images`);
  onProgress(1.0, `Ready! (${fileMap.size} files, ${imageMap.size} images)`);
  return { fileMap, imageMap };
}
