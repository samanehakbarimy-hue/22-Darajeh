import { test } from "node:test";
import assert from "node:assert/strict";
import { destinationFromConfirmLink } from "@/lib/next-path";

const HERE = "https://jobamooz.com";

test("the destination inside our own callback URL is unwrapped", () => {
  assert.equal(
    destinationFromConfirmLink(
      "https://jobamooz.com/auth/callback?next=%2Fspecialists%2Fabc%2Fbook",
      HERE,
    ),
    "/specialists/abc/book",
  );
  // The plain callback, carrying nothing: nowhere in particular.
  assert.equal(destinationFromConfirmLink("https://jobamooz.com/auth/callback", HERE), "");
});

test("a plain path on this site is kept, as before", () => {
  assert.equal(destinationFromConfirmLink("/dashboard/account", HERE), "/dashboard/account");
  assert.equal(destinationFromConfirmLink("https://jobamooz.com/faq?x=1", HERE), "/faq?x=1");
});

test("anywhere else is not a destination", () => {
  assert.equal(destinationFromConfirmLink("https://evil.example/auth/callback?next=%2Fx", HERE), "");
  assert.equal(destinationFromConfirmLink("//evil.example/x", HERE), "");
  assert.equal(destinationFromConfirmLink("https://jobamooz.com.evil.example/", HERE), "");
  assert.equal(destinationFromConfirmLink("not a url", HERE), "");
  assert.equal(destinationFromConfirmLink("", HERE), "");
  assert.equal(destinationFromConfirmLink(null, HERE), "");
});

test("a callback carrying another host inside it is still refused", () => {
  assert.equal(
    destinationFromConfirmLink("https://jobamooz.com/auth/callback?next=%2F%2Fevil.example", HERE),
    "",
  );
  assert.equal(
    destinationFromConfirmLink("https://jobamooz.com/auth/callback?next=https%3A%2F%2Fevil.example", HERE),
    "",
  );
});
