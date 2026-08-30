import { test } from "node:test";
import assert from "node:assert/strict";

import {
  ceilToman,
  displayToman,
  floorToman,
  formatUsdApprox,
  roundToman,
} from "../rates.ts";

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

/**
 * What a person reads is not what is stored.
 *
 * price_usd keeps its cents and the conversion is done at full precision;
 * everything below is about the sentence that comes out the other end, which
 * is allowed to be — and has to be — coarser than the arithmetic behind it.
 */

test("dollars are shown whole, never to the cent", () => {
  // $33.98 is a conversion artefact: somebody typed 7,000,000 toman and this
  // fell out of dividing by a rate that will be different next week.
  assert.equal(formatUsdApprox(33.98), "حدود ۳۴ دلار");
  assert.equal(formatUsdApprox(4.25), "حدود ۴ دلار");
  assert.equal(formatUsdApprox(9.71), "حدود ۱۰ دلار");
});

test("a price never rounds away to nothing", () => {
  // Rounding 0.4 to zero would publish a free session, which is a different
  // product and belongs to the 22-minute call.
  assert.equal(formatUsdApprox(0.4), "حدود ۱ دلار");
});

test("the price a seeker reads is the one the job would have written", () => {
  // Not a second rounding rule. A price rendered on the profile goes through
  // display_toman, the same arithmetic the nightly job stores with, so what a
  // specialist confirms on save is what their public page shows.
  assert.equal(displayToman(33.98, 206_010), 7_000_000);
  assert.equal(displayToman(4.25, 206_010), 900_000);
  assert.equal(displayToman(9.71, 206_010), 2_000_000);
});

test("toman is rounded to something a person would say", () => {
  // roundToman is for figures with no stored counterpart to contradict --
  // suggestions, and the amount somebody asked for.
  assert.equal(roundToman(7_000_219.8), 7_000_000);
  assert.equal(roundToman(1_048_730), 1_000_000); // .. hundred thousands above a million
  assert.equal(roundToman(875_543), 900_000); // .. fifty thousands below it
  assert.equal(roundToman(47_300), 50_000); // .. ten thousands below that
});

/**
 * A limit is not a price. It is a number somebody has to type a figure inside
 * of, so it may only ever be rounded inward — a ceiling quoted higher than it
 * really is sends people straight back into the error that quoted it.
 */
test("a quoted limit is always one the rule would accept", () => {
  const ceiling = 2.67 * 206_010; // 550,046.7 — the resume-review band, senior
  assert.ok(floorToman(ceiling) <= ceiling);
  assert.equal(floorToman(ceiling), 550_000);

  const floor = 2.04 * 206_010; // 420,260.4
  assert.ok(ceilToman(floor) >= floor);
  assert.equal(ceilToman(floor), 450_000);
});

test("a price already round is left where it is", () => {
  for (const amount of [50_000, 900_000, 1_100_000, 7_000_000]) {
    assert.equal(roundToman(amount), amount);
    assert.equal(floorToman(amount), amount);
    assert.equal(ceilToman(amount), amount);
  }
});
