import { test } from "node:test";
import assert from "node:assert/strict";
import { keepTheForm } from "@/lib/keep-the-form";

type State = { error?: string; success?: boolean } | undefined;
const fd = new FormData();

test("a request that dies becomes an error line, not a crash", async () => {
  const action = async (): Promise<State> => {
    throw new Error("fetch failed");
  };
  const guarded = keepTheForm(action, "ذخیره نشد");
  assert.deepEqual(await guarded(undefined, fd), { error: "ذخیره نشد" });
});

test("a normal answer passes through untouched", async () => {
  const action = async (): Promise<State> => ({ success: true });
  const guarded = keepTheForm(action, "ذخیره نشد");
  assert.deepEqual(await guarded(undefined, fd), { success: true });
});

test("Next's own redirect signal keeps flying", async () => {
  // This is how redirect() travels: a thrown error carrying a digest.
  const signal = Object.assign(new Error("NEXT_REDIRECT"), {
    digest: "NEXT_REDIRECT;push;/dashboard;307;",
  });
  const action = async (): Promise<State> => {
    throw signal;
  };
  const guarded = keepTheForm(action, "ذخیره نشد");
  await assert.rejects(guarded(undefined, fd), (e) => e === signal);
});
