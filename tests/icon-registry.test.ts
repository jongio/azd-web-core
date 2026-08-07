import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const iconSource = readFileSync(
  fileURLToPath(new URL("../src/components/Icon.astro", import.meta.url)),
  "utf8",
);

/**
 * Adding an icon requires three edits in Icon.astro: the lucide import, the
 * IconName union member, and the runtime map entry. Missing the union member
 * makes a valid icon a type error; missing the map entry makes Icon throw at
 * build time. Both failures are easy to miss in review, so assert all three
 * sets are identical.
 */
function parseImportedIdentifiers(): Map<string, string> {
  const identifierByName = new Map<string, string>();
  const pattern = /^import\s+(\w+)\s+from\s+"@lucide\/astro\/icons\/([\w-]+)";$/gm;
  for (const match of iconSource.matchAll(pattern)) {
    identifierByName.set(match[2], match[1]);
  }
  return identifierByName;
}

function parseUnionMembers(): string[] {
  const union = iconSource.split("export type IconName =")[1];
  if (!union) throw new Error("IconName union not found in Icon.astro");
  const body = union.split(";")[0];
  return [...body.matchAll(/\|\s*"([\w-]+)"/g)].map((match) => match[1]);
}

function parseMapEntries(): Map<string, string> {
  const map = iconSource.split("const icons: Record")[1];
  if (!map) throw new Error("icons record not found in Icon.astro");
  const body = map.split("\n};")[0];
  const entries = new Map<string, string>();
  for (const match of body.matchAll(/^\s*"?([\w-]+)"?:\s*(\w+),$/gm)) {
    entries.set(match[1], match[2]);
  }
  return entries;
}

describe("Icon registry", () => {
  const imports = parseImportedIdentifiers();
  const union = parseUnionMembers();
  const map = parseMapEntries();

  it("parses a non-trivial registry", () => {
    expect(imports.size).toBeGreaterThan(50);
  });

  it("has no duplicate union members", () => {
    expect(union).toStrictEqual([...new Set(union)]);
  });

  it("keeps the union sorted so additions land in a predictable place", () => {
    expect(union).toStrictEqual([...union].sort());
  });

  it("exposes exactly the imported icons in the IconName union", () => {
    expect([...union].sort()).toStrictEqual([...imports.keys()].sort());
  });

  it("exposes exactly the imported icons in the runtime map", () => {
    expect([...map.keys()].sort()).toStrictEqual([...imports.keys()].sort());
  });

  it("maps each icon name to the identifier imported for that name", () => {
    for (const [name, identifier] of map) {
      expect(identifier, `icons["${name}"] is wired to the wrong import`).toBe(
        imports.get(name),
      );
    }
  });
});
