import test from "node:test";
import assert from "node:assert/strict";

import {
  galleryPrefix,
  groupGallerySummaries,
  sortGalleriesByPrefixGroup,
} from "../lib/gallery.js";

function createGallery(index, imageCount = 12) {
  return {
    slug: `gallery-${index}`,
    title: `Gallery ${index}`,
    sourceType: "folder",
    sourcePath: `/tmp/gallery-${index}`,
    updatedAt: 1_000 - index,
    imageCount,
    coverIndex: 0,
    previewShape: "Quick read",
  };
}

test("groupGallerySummaries chunks galleries into blocks of ten", () => {
  const galleries = Array.from({ length: 20 }, (_, index) => createGallery(index + 1));
  const groups = groupGallerySummaries(galleries);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].slug, "group-001");
  assert.equal(groups[0].title, "Vol. 01");
  assert.equal(groups[0].galleryCount, 10);
  assert.equal(groups[0].imageCount, 120);
  assert.equal(groups[0].galleries[0].slug, "gallery-1");
  assert.equal(groups[1].slug, "group-002");
  assert.equal(groups[1].title, "Vol. 02");
  assert.equal(groups[1].galleryCount, 10);
});

test("galleryPrefix takes the first word before a space or symbol", () => {
  assert.equal(galleryPrefix("Rimuru Tempest Barista"), "rimuru");
  assert.equal(galleryPrefix("利姆露 咖啡师"), "利姆露");
  assert.equal(galleryPrefix("C.C."), "c");
  assert.equal(galleryPrefix("Motion Image Collection 51212"), "motion");
});

test("sortGalleriesByPrefixGroup keeps same-prefix works together and pulls the newest group to the front", () => {
  // The dummy display titles all have distinct prefixes; grouping must use the
  // raw originalTitle, so Yukino A stays with Yukino B (not split off by date).
  const galleries = [
    { originalTitle: "Yukino A", title: "x", dirCreatedAt: 10 },
    { originalTitle: "Yukino B", title: "y", dirCreatedAt: 90 },
    { originalTitle: "Aerith X", title: "z", dirCreatedAt: 50 },
    { originalTitle: "Zelda Q", title: "w", dirCreatedAt: 100 },
  ];

  // Zelda is newest (100) so its group leads; Yukino's group rank is 90 (its
  // newest member), so Yukino A (10) still beats Aerith X (50). Same-prefix
  // works stay adjacent.
  const ordered = sortGalleriesByPrefixGroup(galleries).map((g) => g.originalTitle);
  assert.deepEqual(ordered, ["Zelda Q", "Yukino B", "Yukino A", "Aerith X"]);
});

test("groupGallerySummaries keeps the final partial block", () => {
  const galleries = Array.from({ length: 13 }, (_, index) =>
    createGallery(index + 1, index < 10 ? 10 : 5),
  );
  const groups = groupGallerySummaries(galleries);

  assert.equal(groups.length, 2);
  assert.equal(groups[1].slug, "group-002");
  assert.equal(groups[1].title, "Vol. 02");
  assert.equal(groups[1].startIndex, 11);
  assert.equal(groups[1].endIndex, 13);
  assert.equal(groups[1].galleryCount, 3);
  assert.equal(groups[1].imageCount, 15);
  assert.deepEqual(
    groups[1].galleries.map((gallery) => gallery.slug),
    ["gallery-11", "gallery-12", "gallery-13"],
  );
});
