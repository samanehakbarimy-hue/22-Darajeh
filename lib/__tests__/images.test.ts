import { test } from "node:test";
import assert from "node:assert/strict";
import { looksLikePhoto } from "@/lib/images";

// The upload path decodes only what these say is a photo. Everything else is
// refused before sharp -- and its HEIF/AVIF decoder -- ever sees a byte.
const bytes = (...b: number[]) => new Uint8Array([...b, ...new Array(16).fill(0)]);

test("JPEG, PNG and WebP are photos", () => {
  assert.equal(looksLikePhoto(bytes(0xff, 0xd8, 0xff, 0xe0)), true);
  assert.equal(looksLikePhoto(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)), true);
  const webp = new Uint8Array(20);
  webp.set([0x52, 0x49, 0x46, 0x46], 0);
  webp.set([0x57, 0x45, 0x42, 0x50], 8);
  assert.equal(looksLikePhoto(webp), true);
});

test("HEIF/AVIF, PDF, and a RIFF that is not WebP are refused", () => {
  // ftypavif / ftypheic: the box header sharp would hand to libheif.
  const avif = new Uint8Array(24);
  avif.set([0, 0, 0, 0x1c, 0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66], 0);
  assert.equal(looksLikePhoto(avif), false);
  assert.equal(looksLikePhoto(bytes(0x25, 0x50, 0x44, 0x46)), false);
  const wav = new Uint8Array(20);
  wav.set([0x52, 0x49, 0x46, 0x46], 0);
  wav.set([0x57, 0x41, 0x56, 0x45], 8);
  assert.equal(looksLikePhoto(wav), false);
  assert.equal(looksLikePhoto(new Uint8Array(4)), false);
});
