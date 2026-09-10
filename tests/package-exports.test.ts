import { describe, it, expect } from "vitest";
import { existsSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import pkg from "../package.json" with { type: "json" };

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/**
 * Subpath exports are only exercised when a consumer installs the package, so a
 * typo here ships broken and is invisible to every check that runs in this repo.
 */
describe("package exports map", () => {
  const entries = Object.entries(pkg.exports as Record<string, string>);

  /**
   * Wildcard targets like `./src/components/*` resolve per-import, so the check
   * is that the directory they expand within exists and holds something.
   */
  function targetExists(target: string): boolean {
    const path = resolve(root, target.replace(/\*.*$/, ""));
    if (!existsSync(path)) return false;
    return target.includes("*") ? readdirSync(path).length > 0 : true;
  }

  it("T22: every export target exists on disk", () => {
    const missing = entries.filter(([, target]) => !targetExists(target));
    expect(missing).toEqual([]);
  });

  it("T23: every export target is inside a published directory", () => {
    const published = (pkg.files as string[]).filter((entry) => !entry.startsWith("!"));
    const escaping = entries.filter(
      ([, target]) => !published.some((dir) => target.replace(/^\.\//, "").startsWith(dir)),
    );
    expect(escaping).toEqual([]);
  });

  it("T26: test files are excluded from the published artifact", () => {
    // `files: ["src"]` would otherwise ship every co-located *.test.ts, which
    // statically imports vitest and astro/container. Those are devDependencies
    // and are absent from a consumer's tree.
    expect(pkg.files as string[]).toContain("!src/**/*.test.ts");
  });
});
