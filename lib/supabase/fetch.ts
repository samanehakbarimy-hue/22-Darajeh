/**
 * A fetch that gives up.
 *
 * Every call the server makes to Supabase — auth, a query, a storage upload —
 * goes through fetch with no time limit, so a reply that never comes is
 * waited for until the platform kills the function: five minutes, then a 504,
 * then the "our fault" page with everything the person typed gone. Found the
 * hard way on 2026-09-29 by the first outsider to fill in a profile.
 *
 * Twenty-five seconds is longer than any healthy call here takes, including
 * pushing a 3MB photo into storage from a server in the same region. Past it,
 * the call fails like any other error and the form gets to say so.
 *
 * The caller's own signal still counts: whichever of the two aborts first
 * wins, and the timer is cleared as soon as headers arrive.
 */
export function fetchWithTimeout(ms: number): typeof fetch {
  return async (input, init) => {
    const controller = new AbortController();
    const timer = setTimeout(
      () =>
        controller.abort(
          new DOMException(
            `No answer from ${describe(input)} in ${ms}ms`,
            "TimeoutError",
          ),
        ),
      ms,
    );
    const theirs = init?.signal;
    if (theirs?.aborted) {
      clearTimeout(timer);
      throw theirs.reason ?? new DOMException("Aborted", "AbortError");
    }
    const onTheirAbort = () => controller.abort(theirs?.reason);
    theirs?.addEventListener("abort", onTheirAbort, { once: true });

    try {
      return await globalThis.fetch(input, {
        ...init,
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
      theirs?.removeEventListener("abort", onTheirAbort);
    }
  };
}

/** Host and path only — never the query string, which can carry a token. */
function describe(input: RequestInfo | URL): string {
  try {
    const url = new URL(
      typeof input === "string" ? input : input instanceof URL ? input : input.url,
    );
    return url.host + url.pathname;
  } catch {
    return "upstream";
  }
}
