import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { experimental_AstroContainer as AstroContainer } from "astro/container";
import { JSDOM } from "jsdom";
import InstallTabs from "./InstallTabs.astro";
import SuiteNav from "./SuiteNav.astro";

const dir = dirname(fileURLToPath(import.meta.url));
function read(name: string): string {
  return readFileSync(resolve(dir, name), "utf-8");
}

/**
 * Renders a component and returns a queryable document.
 *
 * These assertions must bind an attribute to the *element that carries the
 * role*, not merely prove both strings occur in the file. Issue #27 shipped for
 * months behind exactly that weaker form.
 */
async function render(
  Component: Parameters<AstroContainer["renderToString"]>[0],
  props: Record<string, unknown>,
): Promise<Document> {
  const container = await AstroContainer.create();
  const html = await container.renderToString(Component, { props });
  return new JSDOM(`<!doctype html><body>${html}</body>`).window.document;
}

describe("Accessibility regression tests", () => {
  describe("#25 - SuiteNav breadcrumb landmark", () => {
    it("renders the breadcrumb inside a labelled nav landmark", async () => {
      const doc = await render(SuiteNav, { currentExtension: "azd rest", hubUrl: "/hub" });

      const nav = doc.querySelector('nav[aria-label="Breadcrumb"]');
      expect(nav).not.toBeNull();
      expect(nav!.textContent).toContain("azd rest");
    });
  });

  describe("#26 - InstallTabs tabpanel keyboard access", () => {
    const props = {
      tabs: [
        { label: "macOS", commands: ["brew install azd"] },
        { label: "Windows", commands: ["winget install azd"] },
      ],
    };

    it("gives the tabpanel itself a tabindex of 0", async () => {
      const doc = await render(InstallTabs, props);

      const panels = [...doc.querySelectorAll('[role="tabpanel"]')];
      expect(panels.length).toBeGreaterThan(0);
      for (const panel of panels) {
        expect(panel.getAttribute("tabindex")).toBe("0");
      }
    });

    it("points every tab at a panel that exists", async () => {
      const doc = await render(InstallTabs, props);

      const tablist = doc.querySelector('[role="tablist"]');
      expect(tablist).not.toBeNull();

      const tabs = [...doc.querySelectorAll('[role="tab"]')];
      expect(tabs).toHaveLength(props.tabs.length);
      for (const tab of tabs) {
        const controls = tab.getAttribute("aria-controls");
        expect(controls).toBeTruthy();
        expect(doc.getElementById(controls!)?.getAttribute("role")).toBe("tabpanel");
      }
    });
  });

  describe("#27 - Mobile menu focus trap", () => {
    const src = read("Header.astro");
    it("delegates menu wiring to the shared utility", () => {
      expect(src).toMatch(/import\s*\{\s*initMobileMenu\s*\}/);
      expect(src).toContain("initMobileMenu(document)");
    });
    // The Escape and Tab behavior itself is proven in src/utils/mobileMenu.test.ts
    // (T8-T14, T24, T25). Asserting on the util's source text here would restate
    // the original #27 mistake: it passes whenever a string is present, whether
    // or not the handler ever binds.
  });

  describe("#28 - HeroBanner CTA contrast", () => {
    const tokens = read("../tokens.css");
    it("CTA start color meets 4.5:1 on white", () => {
      expect(tokens).toMatch(/--color-cta-start:\s*#0369a1/);
    });
    it("CTA end color meets 4.5:1 on white", () => {
      expect(tokens).toMatch(/--color-cta-end:\s*#6d28d9/);
    });
  });

  describe("#29 - Footer navigation landmarks", () => {
    const src = read("Footer.astro");
    it("has labeled nav for Resources", () => {
      expect(src).toMatch(/aria-label=["']Resources["']/);
    });
    it("has labeled nav for Community", () => {
      expect(src).toMatch(/aria-label=["']Community["']/);
    });
  });

  describe("#38 - FeatureCard focus-visible", () => {
    const src = read("FeatureCard.astro");
    it("has :focus-visible style rule", () => {
      expect(src).toContain(":focus-visible");
    });
    it("sets visible outline on focus", () => {
      expect(src).toMatch(/outline:\s*2px solid/);
    });
  });
});
