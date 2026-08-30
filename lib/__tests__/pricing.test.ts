import { test } from "node:test";
import assert from "node:assert/strict";

import { displayToman } from "../rates.ts";

/**
 * The toman figure is a rendering of a dollar price, recomputed daily. The
 * whole point of rounding it hard is that an ordinary day's market movement
 * changes nothing on screen and writes nothing to the database.
 */

test("a price is rounded to the nearest fifty thousand", () => {
  // 1,048,730 -> 1,050,000, the example this was specified with.
  assert.equal(displayToman(1_048_730 / 206_010, 206_010), 1_050_000);

  assert.equal(displayToman(1, 1_020_000), 1_000_000); // .. down
  assert.equal(displayToman(1, 1_030_000), 1_050_000); // .. and up
  assert.equal(displayToman(1, 1_025_000), 1_050_000); // .. exact half goes up
});

test("a small move in the rate leaves the number alone", () => {
  // $5 at 206,010 is 1,030,050 — comfortably inside the step that rounds to
  // 1,050,000, with room either side.
  const usd = 5;
  const monday = displayToman(usd, 206_010);
  assert.equal(monday, 1_050_000);

  // About 1.7% either side, which is an ordinary week in this market.
  for (const rate of [205_500, 206_010, 207_500, 209_000]) {
    assert.equal(
      displayToman(usd, rate),
      monday,
      `${rate} should not have moved the displayed price`,
    );
  }
});

/**
 * The honest limit of the promise above.
 *
 * Rounding buys stability everywhere except at the boundary, and a price that
 * happens to sit on one will flip on a small move — $4.25 lands on 875,543,
 * almost exactly between the 850,000 and 900,000 steps.
 *
 * That is not what the rule guarantees, and this test exists so nobody reads
 * the previous one as a promise it does not make. What is guaranteed is that
 * nothing is *written* when the rounded figure does not change, which is the
 * job's job and is checked against the database rather than here.
 */
test("a price sitting on a boundary is the exception, and is expected to move", () => {
  const onTheLine = 4.25;
  assert.equal(displayToman(onTheLine, 205_000), 850_000);
  assert.equal(displayToman(onTheLine, 206_010), 900_000);
});

test("a real move does change it", () => {
  const usd = 4.25;
  assert.notEqual(displayToman(usd, 206_010), displayToman(usd, 230_000));
});

test("nothing is ever priced below one step", () => {
  // A fraction of a dollar must not render as 0 تومان, which would read as
  // free — and free is the 22-minute call's job, not a paid session's.
  assert.equal(displayToman(0.01, 206_010), 50_000);
});

test("no rate means no toman figure, rather than a made-up one", () => {
  assert.equal(displayToman(4.25, null), null);
  assert.equal(displayToman(4.25, 0), null);
});
