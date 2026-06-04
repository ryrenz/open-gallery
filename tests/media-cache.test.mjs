import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

async function loadMediaCacheModule(cacheKey) {
  const moduleUrl = pathToFileURL(path.join(process.cwd(), "lib/media-cache.js")).href;
  return import(`${moduleUrl}?${cacheKey}`);
}

test("media cache returns cached bytes and invalidates when the source file becomes newer", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "open-gallery-media-cache-"));
  const cacheRoot = path.join(tempRoot, "cache");
  const sourcePath = path.join(tempRoot, "cover.jpg");

  process.env.GALLERY_MEDIA_CACHE_DIR = cacheRoot;

  await fs.writeFile(sourcePath, "source-v1");

  const mediaCacheModule = await loadMediaCacheModule(`media-cache-${Date.now()}`);
  const cacheKey = mediaCacheModule.buildCacheKey({
    slug: "sample-gallery",
    index: 0,
    mode: "cover",
    width: 560,
    quality: 70,
  });

  assert.equal(await mediaCacheModule.getCachedMedia(cacheKey, sourcePath), null);

  const transformed = Buffer.from("cached-cover");
  await mediaCacheModule.setCachedMedia(cacheKey, transformed);

  const cached = await mediaCacheModule.getCachedMedia(cacheKey, sourcePath);
  assert.equal(cached?.toString(), "cached-cover");

  const nextTimestamp = new Date(Date.now() + 1_000);
  await fs.utimes(sourcePath, nextTimestamp, nextTimestamp);

  assert.equal(await mediaCacheModule.getCachedMedia(cacheKey, sourcePath), null);
});

test("media cache evicts oldest files when over the size cap", async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "open-gallery-media-evict-"));
  const cacheRoot = path.join(tempRoot, "cache");
  await fs.mkdir(cacheRoot, { recursive: true });

  process.env.GALLERY_MEDIA_CACHE_DIR = cacheRoot;
  process.env.GALLERY_MEDIA_CACHE_MAX_BYTES = "1000"; // cap; target = 900

  // 5 files * 300 bytes = 1500 bytes, mtimes increasing 0..4 (0 = oldest).
  const names = ["a.jpg", "b.jpg", "c.jpg", "d.jpg", "e.jpg"];
  const baseSeconds = Math.floor(Date.now() / 1000);
  for (let i = 0; i < names.length; i += 1) {
    const filePath = path.join(cacheRoot, names[i]);
    await fs.writeFile(filePath, Buffer.alloc(300, 1));
    const when = new Date((baseSeconds + i) * 1000);
    await fs.utimes(filePath, when, when);
  }

  // A non-.jpg file must be ignored by eviction.
  await fs.writeFile(path.join(cacheRoot, "scratch.tmp"), Buffer.alloc(300, 1));

  try {
    const mediaCacheModule = await loadMediaCacheModule(`media-evict-${Date.now()}`);
    await mediaCacheModule.maybeEvictCache();

    const remaining = await fs.readdir(cacheRoot);
    const jpgs = remaining.filter((name) => name.endsWith(".jpg")).sort();

    // Oldest two (a, b) evicted to get under the 900-byte target; c/d/e survive.
    assert.deepEqual(jpgs, ["c.jpg", "d.jpg", "e.jpg"]);
    // The .tmp file is never touched by eviction.
    assert.ok(remaining.includes("scratch.tmp"));
  } finally {
    delete process.env.GALLERY_MEDIA_CACHE_MAX_BYTES;
  }
});
