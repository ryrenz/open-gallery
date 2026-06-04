import test from "node:test";
import assert from "node:assert/strict";

import {
  galleryPrefix,
  groupGallerySummaries,
  pickCharacterCovers,
  sortGalleriesByPrefixGroup,
} from "../lib/gallery.js";

function createGallery(name, dirCreatedAt = 0, imageCount = 12) {
  return {
    slug: `gallery-${name}`,
    title: name,
    originalTitle: name,
    sourceType: "folder",
    sourcePath: `/tmp/${name}`,
    dirCreatedAt,
    updatedAt: dirCreatedAt,
    imageCount,
    coverIndex: 0,
    previewShape: "Quick read",
  };
}

test("packs distinct single-work characters into blocks of ten", () => {
  // 20 distinct characters (one work each) pack 10 per Vol → 2 Vols.
  const galleries = Array.from({ length: 20 }, (_, index) =>
    createGallery(`Char${String(index).padStart(2, "0")} Set`, 1_000 - index),
  );
  const groups = groupGallerySummaries(galleries);

  assert.equal(groups.length, 2);
  assert.equal(groups[0].slug, "group-001");
  assert.equal(groups[0].title, "Vol. 01");
  assert.equal(groups[0].galleryCount, 10);
  assert.equal(groups[0].characterCount, 10);
  assert.equal(groups[0].coverGalleries.length, 10);
  assert.equal(groups[0].imageCount, 120);
  assert.equal(groups[1].title, "Vol. 02");
  assert.equal(groups[1].galleryCount, 10);
});

test("keeps blocks at the minimum size without merging", () => {
  // 18 single-work characters → 10 + 8 (both at least the minimum of 8).
  const galleries = Array.from({ length: 18 }, (_, index) =>
    createGallery(`Char${String(index).padStart(2, "0")} Set`, 1_000 - index),
  );
  const groups = groupGallerySummaries(galleries);
  assert.deepEqual(groups.map((group) => group.galleryCount), [10, 8]);
});

test("merges a too-small trailing block into the previous one", () => {
  // 11 single-work characters → 10 + 1; the trailing 1 folds back → one block of 11.
  const galleries = Array.from({ length: 11 }, (_, index) =>
    createGallery(`Char${String(index).padStart(2, "0")} Set`, 1_000 - index),
  );
  const groups = groupGallerySummaries(galleries);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].galleryCount, 11);
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

test("keeps a character's works together and shows one cover per character", () => {
  // "Multi" has 4 works; plus 8 single-work characters. Packing keeps Multi
  // whole and fills to ~10 works.
  const galleries = [
    createGallery("Multi A", 100),
    createGallery("Multi B", 99),
    createGallery("Multi C", 98),
    createGallery("Multi D", 97),
    ...Array.from({ length: 6 }, (_, i) => createGallery(`Solo${i} X`, 50 - i)),
  ];

  const groups = groupGallerySummaries(galleries);

  // Multi(4) + 6 solos = 10 works / 7 characters → one Vol.
  assert.equal(groups.length, 1);
  const vol1 = groups[0];
  assert.equal(vol1.galleryCount, 10);
  assert.equal(vol1.characterCount, 7);
  assert.equal(vol1.coverGalleries.length, 7);

  // One cover for "Multi" (its newest, "Multi A"), but all 4 works in the list.
  const multiCovers = vol1.coverGalleries.filter(
    (g) => galleryPrefix(g.originalTitle) === "multi",
  );
  assert.equal(multiCovers.length, 1);
  assert.equal(multiCovers[0].slug, "gallery-Multi A");
  const multiWorks = vol1.galleries.filter(
    (g) => galleryPrefix(g.originalTitle) === "multi",
  );
  assert.equal(multiWorks.length, 4);
});

test("pickCharacterCovers returns one newest cover per character up to the limit", () => {
  const galleries = [
    createGallery("Aaa 1", 100),
    createGallery("Aaa 2", 90), // same character, older — should be dropped
    createGallery("Bbb 1", 80),
    createGallery("Ccc 1", 70),
  ];

  assert.deepEqual(
    pickCharacterCovers(galleries).map((g) => g.slug),
    ["gallery-Aaa 1", "gallery-Bbb 1", "gallery-Ccc 1"],
  );
  assert.equal(pickCharacterCovers(galleries, 2).length, 2);
});

test("an oversized single character forms its own block over the limit", () => {
  // 13 works, all the same character → one Vol over the 10-work target, with a
  // single cover.
  const galleries = Array.from({ length: 13 }, (_, i) => createGallery(`Big ${i}`, 100 - i));
  const groups = groupGallerySummaries(galleries);

  assert.equal(groups.length, 1);
  assert.equal(groups[0].galleryCount, 13);
  assert.equal(groups[0].characterCount, 1);
  assert.equal(groups[0].coverGalleries.length, 1);
});
