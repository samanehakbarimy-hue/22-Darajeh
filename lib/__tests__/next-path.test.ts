import { test } from "node:test";
import assert from "node:assert/strict";

import { safeNext } from "../next-path.ts";

/**
 * The destination a visitor is sent to after signing in comes out of the URL,
 * which means it comes from whoever wrote the link. Getting this wrong is not
 * visible on screen: the redirect works perfectly, it just works for someone
 * else.
 */

test("a path on this site is kept", () => {
  assert.equal(safeNext("/specialists/abc/book"), "/specialists/abc/book");
  assert.equal(safeNext("/dashboard"), "/dashboard");
  assert.equal(safeNext("/specialists?field=oil"), "/specialists?field=oil");
});

test("another site is refused however it is dressed up", () => {
  // Starts with a slash, and is a complete URL to somewhere else.
  assert.equal(safeNext("//evil.example"), "");
  assert.equal(safeNext("/\\evil.example"), "");
  assert.equal(safeNext("https://evil.example"), "");
  assert.equal(safeNext("http://evil.example"), "");
});

test("nothing at all is not a destination", () => {
  assert.equal(safeNext(""), "");
  assert.equal(safeNext("   "), "");
  assert.equal(safeNext(null), "");
  assert.equal(safeNext(undefined), "");
});
