import { test } from "node:test";
import assert from "node:assert/strict";
import { fetchWithTimeout } from "@/lib/supabase/fetch";

// A fetch that only ever ends when it is aborted: the shape of a stall. Like
// the real fetch, it also refuses straight away when handed a signal that is
// already aborted — a listener added after the fact would never fire.
const stalled: typeof fetch = (_input, init) =>
  new Promise((_, reject) => {
    const signal = init?.signal;
    if (signal?.aborted) return reject(signal.reason);
    signal?.addEventListener("abort", () => reject(signal.reason));
  });

async function withFetch<T>(fake: typeof fetch, run: () => Promise<T>): Promise<T> {
  const real = globalThis.fetch;
  globalThis.fetch = fake;
  try {
    return await run();
  } finally {
    globalThis.fetch = real;
  }
}

test("a reply that never comes is given up on, quickly", () =>
  withFetch(stalled, async () => {
    const started = Date.now();
    await assert.rejects(
      fetchWithTimeout(60)("https://db.example.invalid/rest/v1/profiles?apikey=secret"),
      (e: unknown) =>
        (e as DOMException).name === "TimeoutError" &&
        !String((e as DOMException).message).includes("secret"),
    );
    assert.ok(Date.now() - started < 1000, "did not wait around");
  }));

test("a prompt reply passes through untouched", () =>
  withFetch(async () => new Response("fine", { status: 200 }), async () => {
    const res = await fetchWithTimeout(60)("https://db.example.invalid/");
    assert.equal(await res.text(), "fine");
  }));

test("the caller's own abort still wins", () =>
  withFetch(stalled, async () => {
    const theirs = new AbortController();
    theirs.abort(new Error("caller gave up"));
    await assert.rejects(
      fetchWithTimeout(5000)("https://db.example.invalid/", { signal: theirs.signal }),
      /caller gave up/,
    );
  }));
