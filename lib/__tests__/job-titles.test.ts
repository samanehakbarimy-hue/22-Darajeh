import { test } from "node:test";
import assert from "node:assert/strict";
import { JOB_TITLE_PAIRS, canonicalTitle } from "@/lib/job-titles";
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

test("a title nobody listed still gets the field's tools", () => {
  const suggested = skillsFor("یک عنوان کاملاً دلخواه", ["نفت و گاز"]);
  assert.ok(suggested.includes("PV Elite"), "freehand title fell back to nothing");
});

test("a title leads, and the field only fills in behind it", () => {
  const suggested = skillsFor("AI Engineer", ["نفت و گاز"]);
  assert.equal(suggested[0], "Python", "the field displaced the title");
  assert.ok(suggested.includes("PV Elite"), "the field was dropped entirely");
});
