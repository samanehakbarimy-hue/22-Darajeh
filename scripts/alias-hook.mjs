import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";

/**
 * Teaches Node the "@/" alias that Next.js and tsconfig already understand.
 *
 * Without this the tests cannot import anything real: lib/seniority.ts imports
 * "@/lib/rates", which resolves fine under Next and is meaningless to Node. A
 * dozen lines here beats either a test runner dependency or rewriting every
 * import in the app to suit the tests.
 */
const ROOT = pathToFileURL(`${process.cwd()}/`).href;

export function resolve(specifier, context, next) {
  if (!specifier.startsWith("@/")) return next(specifier, context);

  const base = new URL(specifier.slice(2), ROOT).href;
  // Source files are imported without an extension; Node insists on one.
  for (const candidate of [base, `${base}.ts`, `${base}.tsx`, `${base}/index.ts`]) {
    if (existsSync(new URL(candidate))) return next(candidate, context);
  }
  return next(base, context);
}
