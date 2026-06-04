import test from "node:test";
import assert from "node:assert/strict";

import { coverRowSizes } from "../lib/cover-layout.js";

test("coverRowSizes fills composites evenly and splits primes into balanced rows", () => {
  assert.deepEqual(coverRowSizes(1), [1]);
  assert.deepEqual(coverRowSizes(2), [2]);
  assert.deepEqual(coverRowSizes(3), [2, 1]);
  assert.deepEqual(coverRowSizes(4), [2, 2]);
  assert.deepEqual(coverRowSizes(5), [3, 2]);
  assert.deepEqual(coverRowSizes(6), [3, 3]);
  assert.deepEqual(coverRowSizes(7), [3, 2, 2]);
  assert.deepEqual(coverRowSizes(8), [3, 3, 2]);
  assert.deepEqual(coverRowSizes(9), [3, 3, 3]);
  assert.deepEqual(coverRowSizes(10), [4, 3, 3]);
  // No row ever exceeds 4 columns (tiles stay reasonably wide), even for the
  // rare large Vol; and row sizes differ by at most one (balanced).
  for (let count = 1; count <= 24; count += 1) {
    const sizes = coverRowSizes(count);
    assert.ok(Math.max(...sizes) <= 4, `count ${count} exceeded 4 columns`);
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1, `count ${count} unbalanced`);
  }

  // No tile is ever dropped or left as a gap: row sizes always sum to the count.
  for (let count = 0; count <= 12; count += 1) {
    assert.equal(
      coverRowSizes(count).reduce((total, size) => total + size, 0),
      count,
    );
  }
});
