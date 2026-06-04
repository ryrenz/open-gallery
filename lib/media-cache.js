import { createHash, randomBytes } from "node:crypto";
import { mkdir, readdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

// Cap the on-disk media cache (covers + details share this dir) and evict the
// oldest files when it grows past the cap. Eviction is by file mtime, not true
// access-time LRU: bumping atime on every cache hit would mean an extra write
// per read on slow/external drives. For a gallery, recently-written cache
// entries correlate well with recently-viewed ones, so mtime ordering is fine.
const DEFAULT_MAX_CACHE_BYTES = 8 * 1024 * 1024 * 1024; // 8 GiB
const EVICTION_INTERVAL_MS = 60_000;
const EVICTION_TARGET_RATIO = 0.9;

let lastEvictionAt = 0;
let evictionInFlight = false;

function getMediaCacheRoot() {
  return process.env.GALLERY_MEDIA_CACHE_DIR || path.join(process.cwd(), ".next/cache/gallery-media");
}

function getMaxCacheBytes() {
  const configured = Number(process.env.GALLERY_MEDIA_CACHE_MAX_BYTES);
  return Number.isFinite(configured) && configured > 0
    ? Math.floor(configured)
    : DEFAULT_MAX_CACHE_BYTES;
}

// Throttled, best-effort eviction. Scans the cache dir at most once per
// EVICTION_INTERVAL_MS and only when triggered by a write. Swallows all errors
// so it can never break a media response.
export async function maybeEvictCache() {
  const now = Date.now();

  if (evictionInFlight || now - lastEvictionAt < EVICTION_INTERVAL_MS) {
    return;
  }

  lastEvictionAt = now;
  evictionInFlight = true;

  try {
    const root = getMediaCacheRoot();

    let entries;
    try {
      entries = await readdir(root);
    } catch (error) {
      if (error?.code === "ENOENT") {
        return;
      }
      throw error;
    }

    const files = [];
    let totalBytes = 0;

    for (const name of entries) {
      if (!name.endsWith(".jpg")) {
        continue; // skip in-progress *.tmp and anything else
      }

      try {
        const fileStat = await stat(path.join(root, name));
        if (fileStat.isFile()) {
          files.push({ name, size: fileStat.size, mtimeMs: fileStat.mtimeMs });
          totalBytes += fileStat.size;
        }
      } catch {
        // File vanished between readdir and stat; ignore.
      }
    }

    const cap = getMaxCacheBytes();
    if (totalBytes <= cap) {
      return;
    }

    files.sort((left, right) => left.mtimeMs - right.mtimeMs); // oldest first
    const target = cap * EVICTION_TARGET_RATIO;

    for (const file of files) {
      if (totalBytes <= target) {
        break;
      }
      try {
        await unlink(path.join(root, file.name));
        totalBytes -= file.size;
      } catch {
        // Already gone or locked; ignore.
      }
    }
  } catch (error) {
    console.error("[media-cache] eviction failed:", error?.message);
  } finally {
    evictionInFlight = false;
  }
}

function normalizeNumber(value) {
  return Number.isFinite(value) ? Math.floor(value) : "default";
}

export function buildCacheKey({ slug, index, mode, width, quality }) {
  const rawKey = JSON.stringify({
    slug,
    index,
    mode,
    width: normalizeNumber(width),
    quality: normalizeNumber(quality),
  });

  return createHash("sha1").update(rawKey).digest("hex");
}

function getCacheFilePath(cacheKey) {
  return path.join(getMediaCacheRoot(), `${cacheKey}.jpg`);
}

export async function getCachedMedia(cacheKey, sourcePath) {
  const cacheFilePath = getCacheFilePath(cacheKey);

  let cacheStat;
  try {
    cacheStat = await stat(cacheFilePath);
  } catch (error) {
    if (error?.code === "ENOENT") {
      return null;
    }
    throw error;
  }

  const sourceStat = await stat(sourcePath);

  if (cacheStat.mtimeMs < sourceStat.mtimeMs) {
    return null;
  }

  return readFile(cacheFilePath);
}

export async function setCachedMedia(cacheKey, buffer) {
  const cacheFilePath = getCacheFilePath(cacheKey);
  const tmpPath = `${cacheFilePath}.${randomBytes(4).toString("hex")}.tmp`;
  await mkdir(path.dirname(cacheFilePath), { recursive: true });
  await writeFile(tmpPath, buffer);
  await rename(tmpPath, cacheFilePath);

  // Fire-and-forget: keep the cache under its size cap without blocking writes.
  maybeEvictCache().catch(() => {});
}
