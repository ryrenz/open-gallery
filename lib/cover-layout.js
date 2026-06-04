// How to split `count` cover tiles into rows so they fill a rectangle with no
// gaps. Composite counts get the most-square exact factorization (e.g. 8 → two
// rows of 4, 10 → two rows of 5, 9 → three rows of 3). Primes (3/5/7/11…) can't
// form an equal rectangle, so they split into two balanced rows that each
// flex-fill the width (e.g. 5 → [3, 2], 7 → [4, 3]). Returns an array of
// per-row tile counts; the sum always equals `count`.
export function coverRowSizes(count) {
  if (count <= 0) {
    return [];
  }
  if (count <= 2) {
    return [count];
  }

  // Largest divisor ≤ √count gives the factor pair closest to square; use it as
  // the row count (fewer rows, more columns → portrait-ish tiles in the frame).
  let rows = 1;
  for (let candidate = 2; candidate <= Math.floor(Math.sqrt(count)); candidate += 1) {
    if (count % candidate === 0) {
      rows = candidate;
    }
  }

  if (rows > 1) {
    return Array(rows).fill(count / rows);
  }

  // Prime: two balanced rows, the shorter one stretches to fill.
  const top = Math.ceil(count / 2);
  return [top, count - top];
}
