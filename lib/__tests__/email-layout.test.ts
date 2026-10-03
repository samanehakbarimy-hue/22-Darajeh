import { test } from "node:test";
import assert from "node:assert/strict";
import { emailLayout, whenLine } from "@/lib/email/layout";

test("a session time reads the way a person writes it, on Tehran's clock", () => {
  // 13:30 UTC is 17:00 in Tehran.
  assert.equal(whenLine("2026-10-07T13:30:00Z"), "چهارشنبه ۱۵ مهر ۱۴۰۵، ساعت ۱۷:۰۰");
});

test("every email carries the logo, a greeting and a sign-off", () => {
  const html = emailLayout({ heading: "عنوان", body: "متن" });
  assert.match(html, /<img src="https:\/\/jobamooz\.com\/logo-mark\.png"/);
  assert.ok(html.includes("سلام،"));
  assert.ok(html.includes("jobamooz.com</a>"));
});

test("the greeting uses the reader's name when there is one", () => {
  assert.ok(emailLayout({ greetingName: "سارا", heading: "ع", body: "م" }).includes("سلام سارا،"));
  // A blank name must not leave a dangling space before the comma.
  assert.ok(emailLayout({ greetingName: "  ", heading: "ع", body: "م" }).includes("سلام،"));
});

test("a link is repeated as text only when asked for", () => {
  const action = { label: "باز کردن", href: "https://jobamooz.com/x" };
  const plain = emailLayout({ heading: "ع", body: "م", action });
  const withText = emailLayout({ heading: "ع", body: "م", action, showLinkAsText: true });
  assert.equal(plain.split("https://jobamooz.com/x").length - 1, 1);
  assert.equal(withText.split("https://jobamooz.com/x").length - 1, 2);
});
