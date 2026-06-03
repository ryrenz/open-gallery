import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const STORE_PATH = path.join(process.cwd(), ".gallery-likes.json");

async function readStore() {
  try {
    const raw = await readFile(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    return { likes: Array.isArray(parsed?.likes) ? parsed.likes : [] };
  } catch {
    return { likes: [] };
  }
}

async function writeStore(store) {
  await writeFile(STORE_PATH, JSON.stringify(store, null, 2), "utf8");
}

// Likes are global (shared by everyone) and keyed by a work's stable id
// (see lib/work-id.js), not by its path-derived slug, so renaming or moving
// a work never drops its like.
export async function getLikedIds() {
  const store = await readStore();
  return store.likes;
}

export async function getLikedIdSet() {
  return new Set(await getLikedIds());
}

export async function setLikeId(id, liked) {
  const store = await readStore();
  const set = new Set(store.likes);

  if (liked) {
    set.add(id);
  } else {
    set.delete(id);
  }

  store.likes = Array.from(set);
  await writeStore(store);

  return liked;
}
