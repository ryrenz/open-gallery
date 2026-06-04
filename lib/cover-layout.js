// How to split `count` cover tiles into rows so they fill a rectangle with no
// gaps and without getting too narrow. Uses ~√count rows and distributes the
// tiles as evenly as possible (rows differ by at most one tile, the fuller rows
// first); each row then flex-fills the width. This keeps the column count low
// in the portrait card — e.g. 8 → [3, 3, 2], 10 → [4, 3, 3], 9 → [3, 3, 3],
// 5 → [3, 2] — instead of cramming a single wide row (10 → [5, 5] looked
// crushed). Returns per-row tile counts; the sum always equals `count`.
export function coverRowSizes(count) {
  if (count <= 0) {
    return [];
  }
  if (count <= 2) {
    return [count];
  }

  // ~√count rows, but always enough rows to cap columns at 4 (a Vol can reach
  // a dozen-plus characters when a long single-work tail merges in).
  const rows = Math.max(Math.round(Math.sqrt(count)), Math.ceil(count / 4));
  const base = Math.floor(count / rows);
  const extra = count % rows; // the first `extra` rows get one more tile

  return Array.from({ length: rows }, (_, index) => base + (index < extra ? 1 : 0));
}
