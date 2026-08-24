import { test } from "node:test";
import assert from "node:assert/strict";

import { spellToman, roundEnteredPrice, MAX_PRICE_TOMAN } from "../rates.ts";
import { suggestedRange } from "../seniority.ts";
import { sessionTiming } from "../persian.ts";

/**
 * These cover the arithmetic that decides what people are shown and charged,
 * and the clock that decides whether a session has happened. Both are pure,
 * both have been wrong before, and neither shows its mistakes on screen —
 * a price off by a factor of ten still renders beautifully.
 */

test("a price is said out loud the way a person would read it", () => {
  assert.equal(spellToman(500_000), "۵۰۰ هزار تومان");
  assert.equal(spellToman(1_000_000), "۱ میلیون تومان");
  assert.equal(spellToman(22_020_000), "۲۲ میلیون و ۲۰ هزار تومان");
  assert.equal(spellToman(1_500_000_000), "۱ میلیارد و ۵۰۰ میلیون تومان");
  assert.equal(spellToman(0), "");
});

test("entered prices lose the digits nobody chose", () => {
  // The slip that reached a live profile: ۲۲٬۰۲۰٬۲۱۳.
  assert.equal(roundEnteredPrice(22_020_213), 22_020_000);
  assert.equal(roundEnteredPrice(550_000), 550_000);
});

test("the ceiling sits far above anything the site suggests", () => {
  const dearest = suggestedRange("principal", 1, 202_195);
  assert.ok(dearest, "the top band should produce a suggestion");
  assert.ok(
    MAX_PRICE_TOMAN > dearest.high * 10,
    "the ceiling must catch typos, not opinions about price",
  );
});

test("a suggestion needs both a band and a rate", () => {
  assert.equal(suggestedRange("senior", 1, null), null, "no rate, no dollars");
  assert.equal(suggestedRange(null, 1, 202_195), null, "no band, no factor");
  assert.equal(suggestedRange("senior", 0, 202_195), null, "no time, no price");
});

test("seniority moves the price in the right direction", () => {
  const rate = 202_195;
  const mid = suggestedRange("mid", 1, rate)!;
  const senior = suggestedRange("senior", 1, rate)!;
  const principal = suggestedRange("principal", 1, rate)!;

  assert.ok(mid.low < senior.low && senior.low < principal.low);
  assert.ok(mid.low < mid.high, "the floor must sit under the ceiling");
});

test("a session in progress counts as live, not past", () => {
  const now = Date.parse("2026-08-23T12:00:00Z");
  const at = (mins: number) => new Date(now + mins * 60_000).toISOString();

  assert.equal(sessionTiming(at(60), at(82), now), "upcoming");
  // The trap: keyed on the start, this would read "past" five minutes in and
  // take the join link away while two people were trying to meet.
  assert.equal(sessionTiming(at(-5), at(17), now), "live");
  assert.equal(sessionTiming(at(-30), at(-8), now), "past");
});

test("a slot with no recorded end still ends", () => {
  const now = Date.parse("2026-08-23T12:00:00Z");
  const at = (mins: number) => new Date(now + mins * 60_000).toISOString();

  assert.equal(sessionTiming(at(-5), null, now), "live", "22 minutes assumed");
  assert.equal(sessionTiming(at(-30), null, now), "past");
});
