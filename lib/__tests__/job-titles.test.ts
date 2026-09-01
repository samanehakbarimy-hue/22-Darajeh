import { test } from "node:test";
import assert from "node:assert/strict";
import {
  JOB_TITLE_PAIRS,
  JOB_FIELDS,
  TITLES_BY_FIELD,
  canonicalTitle,
  fieldOfTitle,
} from "@/lib/job-titles";
import { TITLES_WITH_SKILLS, skillsFor } from "@/lib/skills";

test("every job title suggests its own tools", () => {
  const missing = JOB_TITLE_PAIRS.map(([, en]) => en).filter(
    (en) => !TITLES_WITH_SKILLS.includes(en),
  );
  assert.deepEqual(
    missing,
    [],
    `titles with no tools: ${missing.join(", ")}`,
  );
});

test("no tool list is orphaned from the titles", () => {
  const known = new Set(JOB_TITLE_PAIRS.map(([, en]) => en));
  const orphans = TITLES_WITH_SKILLS.filter((t) => !known.has(t));
  assert.deepEqual(orphans, [], `tools for titles nobody can pick: ${orphans.join(", ")}`);
});

test("both languages of a title reach the same tools", () => {
  for (const [fa, en] of JOB_TITLE_PAIRS) {
    assert.equal(canonicalTitle(fa), en, `«${fa}» did not resolve to ${en}`);
    assert.deepEqual(
      skillsFor(fa, []),
      skillsFor(en, []),
      `«${fa}» and "${en}" suggest different tools`,
    );
  }
});

test("no title is written twice, in either language", () => {
  // «مهندس قابلیت اطمینان» meant Site Reliability Engineer and, when
  // manufacturing arrived, Reliability Engineer too. Identical strings, so
  // canonicalTitle returned whichever came first and the other title was
  // unreachable — the kind of thing that reads fine and is simply wrong.
  for (const lang of [0, 1] as const) {
    const seen = new Map<string, string>();
    for (const pair of JOB_TITLE_PAIRS) {
      const key = pair[lang].toLowerCase();
      const clash = seen.get(key);
      assert.equal(
        clash,
        undefined,
        `«${pair[lang]}» is used by both ${clash} and ${pair[1]}`,
      );
      seen.set(key, pair[1]);
    }
  }
});

test("every field is listed, and every title sits in exactly one", () => {
  assert.deepEqual(
    Object.keys(TITLES_BY_FIELD).sort(),
    JOB_FIELDS.map((f) => f.key).sort(),
    "TITLES_BY_FIELD and JOB_FIELDS disagree about which fields exist",
  );

  for (const [fa, en] of JOB_TITLE_PAIRS) {
    const owners = JOB_FIELDS.filter(({ key }) =>
      TITLES_BY_FIELD[key].some(([, title]) => title === en),
    ).map(({ key }) => key);
    assert.equal(owners.length, 1, `${en} is in fields: ${owners.join(", ")}`);
    assert.equal(fieldOfTitle(fa), owners[0], `«${fa}» resolved to no field`);
    assert.equal(fieldOfTitle(en), owners[0], `${en} resolved to no field`);
  }
});

test("a title nobody listed belongs to no field", () => {
  assert.equal(fieldOfTitle("یک عنوان کاملاً دلخواه"), null);
  assert.equal(fieldOfTitle(null), null);
});

test("a title nobody listed still gets the field's tools", () => {
  const suggested = skillsFor("یک عنوان کاملاً دلخواه", ["نفت و گاز"]);
  assert.ok(suggested.includes("PV Elite"), "freehand title fell back to nothing");
});

test("a title leads, and the field only fills in behind it", () => {
  const suggested = skillsFor("AI Engineer", ["نفت و گاز"]);
  assert.equal(suggested[0], "Python", "the field displaced the title");
  assert.ok(suggested.includes("PV Elite"), "the field was dropped entirely");
});
