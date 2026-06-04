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
  assert.deepEqual(coverRowSizes(7), [4, 3]);
  assert.deepEqual(coverRowSizes(8), [4, 4]);
  assert.deepEqual(coverRowSizes(9), [3, 3, 3]);
  assert.deepEqual(coverRowSizes(10), [5, 5]);

  // No tile is ever dropped or left as a gap: row sizes always sum to the count.
  for (let count = 0; count <= 12; count += 1) {
    assert.equal(
      coverRowSizes(count).reduce((total, size) => total + size, 0),
      count,
    );
  }
});
