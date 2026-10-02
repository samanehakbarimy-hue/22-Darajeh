import { test } from "node:test";
import assert from "node:assert/strict";
import { jsonLd, truncate } from "@/lib/seo";

test("a short description is left alone", () => {
  assert.equal(truncate("  مهندس   تجهیزات ثابت  "), "مهندس تجهیزات ثابت");
});

test("a long one stops at a word, with an ellipsis, inside the limit", () => {
  const long = "مهندس تجهیزات ثابت در پتروپارس ".repeat(12);
  const out = truncate(long, 155);
  assert.ok(out.length <= 155);
  assert.ok(out.endsWith("…"));
  assert.ok(!out.slice(0, -1).endsWith(" "), "no space before the ellipsis");
  // Every word that survived is a whole word from the original.
  for (const word of out.slice(0, -1).split(" ")) {
    assert.ok(long.includes(word));
  }
});

test("structured data cannot close its own script tag", () => {
  const out = jsonLd({ name: "</script><script>alert(1)</script>" });
  assert.ok(!out.includes("</script>"));
  assert.ok(!out.includes("<"));
  // And it is still the same data.
  assert.equal(JSON.parse(out).name, "</script><script>alert(1)</script>");
});
