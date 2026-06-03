import { randomUUID } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

// A tiny hidden marker written inside a work folder. It holds a UUID that
// stays with the folder across rename / move / cross-volume copy / remount,
// so a "like" keyed by this id never gets lost when the path changes.
const WORK_ID_FILE = ".open-gallery-id";

function workIdPath(sourcePath) {
  return path.join(sourcePath, WORK_ID_FILE);
}

// Returns the stable id for a work, or null if it has never been marked.
// Resilient: a missing or unreadable marker just means "no id yet".
export async function readWorkId(sourcePath) {
  try {
    const raw = await readFile(workIdPath(sourcePath), "utf8");
    return raw.trim() || null;
  } catch {
    return null;
  }
}

// Returns the existing id, or creates and persists a new one inside the folder.
export async function ensureWorkId(sourcePath) {
  const existing = await readWorkId(sourcePath);

  if (existing) {
    return existing;
  }

  const id = randomUUID();
  await writeFile(workIdPath(sourcePath), id, "utf8");
  return id;
}
