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

/**
 * The auth callbacks paste this straight onto the origin — `${origin}${next}`
 * — and that is a different trap from the one above. "@example.invalid" does
 * not start with a slash, so it never looks like a path, but glued to the
 * origin it makes `https://jobamooz.com@example.invalid`, where our name is
 * the username and the host is theirs. Both callbacks shipped without this
 * for a while; the check below is what says they cannot again.
 */
test("a destination glued onto the origin cannot change the host", () => {
  const origin = "https://jobamooz.com";
  const hostOf = (value: string) =>
    new URL(origin + (safeNext(value) || "/dashboard")).host;

  assert.equal(hostOf("@evil.example"), "jobamooz.com");
  assert.equal(hostOf(".evil.example"), "jobamooz.com");
  assert.equal(hostOf("https://evil.example"), "jobamooz.com");
  assert.equal(hostOf("//evil.example"), "jobamooz.com");
  assert.equal(hostOf("/\evil.example"), "jobamooz.com");

  // And a real destination still survives the trip.
  assert.equal(origin + (safeNext("/dashboard/sessions") || "/dashboard"),
    "https://jobamooz.com/dashboard/sessions");
});
