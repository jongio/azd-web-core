import { describe, it, expect, vi, afterEach } from "vitest";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { JSDOM } from "jsdom";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Header from "./Header.astro";

const dir = dirname(fileURLToPath(import.meta.url));
const read = (name: string): string => readFileSync(resolve(dir, name), "utf-8");

const props = {
  extensionName: "azd rest",
  navLinks: [{ label: "Docs", href: "/docs" }],
  githubUrl: "https://github.com/jongio/azd-rest",
  hubUrl: "https://jongio.github.io/azd-extensions/",
};

async function renderHeader(baseUrl: string): Promise<string> {
  vi.stubEnv("BASE_URL", baseUrl);
  const container = await AstroContainer.create();
  return container.renderToString(Header, { props });
}

/** Extracts the href of the logo anchor from rendered Header markup. */
function logoHref(html: string): string | undefined {
  return html.match(/<a href="([^"]*)" class="flex items-center gap-\[var\(--space-2\)\]/)?.[1];
}

/** Removes comments so prose mentioning a selector cannot be mistaken for a query. */
function stripComments(src: string): string {
  // Strips block and line comments so prose that merely mentions a selector
  // cannot satisfy the contract check. The `[^:]` guard keeps `https://` intact.
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

/** Returns every quoted or templated string literal in a source file. */
function stringLiterals(src: string): string {
  return (
    stripComments(src).match(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g) ?? []
  ).join("\n");
}

/** Strips script and style blocks, leaving only rendered template markup. */
function templateOf(src: string): string {
  return src
    .replace(/<script[\s\S]*?<\/script>/g, "")
    .replace(/<style[\s\S]*?<\/style>/g, "");
}

/** Returns the concatenated contents of every script block in a component. */
function scriptsOf(src: string): string {
  return (src.match(/<script[\s\S]*?<\/script>/g) ?? []).join("\n");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Header mobile menu wiring", () => {
  it("T48: aria-controls points at an element that actually exists", async () => {
    const html = await renderHeader("/azd-rest/");
    const doc = new JSDOM(`<!doctype html><body>${html}</body>`).window.document;

    const toggle = doc.querySelector("[data-mobile-toggle]");
    expect(toggle).not.toBeNull();

    const id = toggle!.getAttribute("aria-controls");
    expect(id).toBeTruthy();

    const target = doc.getElementById(id!);
    expect(target).not.toBeNull();
    expect(target!.hasAttribute("data-mobile-menu")).toBe(true);
  });

  it("T49: the menu id is namespaced so it cannot collide in a consumer site", async () => {
    // This component ships into sites that own their own markup. azd-app
    // already declares an unprefixed id="mobile-menu", and a duplicate id makes
    // aria-controls resolve by document order instead of by intent.
    const html = await renderHeader("/azd-rest/");
    const doc = new JSDOM(`<!doctype html><body>${html}</body>`).window.document;

    const id = doc.querySelector("[data-mobile-menu]")!.getAttribute("id");
    expect(id).toBe("azd-core-mobile-menu");
  });
});

describe("Header base path (D1)", () => {
  it("T1: logo href resolves to the configured base path", async () => {
    const html = await renderHeader("/azd-rest/");
    expect(logoHref(html)).toBe("/azd-rest/");
  });

  it("T2: logo href is still correct on a root deployment", async () => {
    const html = await renderHeader("/");
    expect(logoHref(html)).toBe("/");
  });
});

describe("Header logo asset (D2)", () => {
  it("T3: renders no img element", async () => {
    const html = await renderHeader("/azd-rest/");
    expect(html).not.toMatch(/<img\b/);
  });

  it("T4: makes no reference to azure-icon", async () => {
    const html = await renderHeader("/azd-rest/");
    expect(html).not.toContain("azure-icon");
  });

  it("T5: renders the logo as an inline decorative svg", async () => {
    const html = await renderHeader("/azd-rest/");
    const logo = html.match(/<a href="[^"]*" class="flex items-center gap-\[var\(--space-2\)\][\s\S]*?<\/a>/)?.[0];
    expect(logo).toBeDefined();
    expect(logo).toMatch(/<svg\b/);
    expect(logo).toMatch(/aria-hidden="true"/);
  });
});

describe("Header script/markup selector contract (D3)", () => {
  const header = read("Header.astro");
  const mobileMenu = read("MobileMenu.astro");
  const menuUtil = read("../utils/mobileMenu.ts");

  it("T6: every data attribute selector queried has a matching attribute in markup", () => {
    const queried = new Set(
      [
        ...`${stringLiterals(scriptsOf(header))}\n${stringLiterals(menuUtil)}`.matchAll(
          /\[data-[a-z0-9-]+\]/g,
        ),
      ].map((m) => m[0]),
    );
    const emitted = new Set(
      [...`${templateOf(header)}\n${templateOf(mobileMenu)}`.matchAll(/\bdata-[a-z0-9-]+/g)].map(
        (m) => `[${m[0]}]`,
      ),
    );

    expect(queried.size).toBeGreaterThan(0);
    const orphans = [...queried].filter((selector) => !emitted.has(selector));
    expect(orphans).toEqual([]);
  });

  it("T7: declares exactly one script block", () => {
    expect(scriptsOf(header).match(/<script\b/g) ?? []).toHaveLength(1);
  });

  it("T21: re-initialises on astro:page-load, aborting the previous controller", () => {
    const script = scriptsOf(header);
    expect(script).toContain('document.addEventListener("astro:page-load", setup)');
    // Without the abort, a View Transition navigation stacks a second set of
    // listeners and every click toggles the menu twice.
    expect(script).toMatch(/function setup\(\)\s*\{\s*controller\?\.abort\(\);/);
  });
});

describe("MobileMenu affordances (D4)", () => {
  it("T18: mobile links expose a hover state", () => {
    expect(read("MobileMenu.astro")).toMatch(/\.mobile-link:hover\s*\{/);
  });
});
