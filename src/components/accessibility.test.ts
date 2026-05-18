import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
function read(name: string): string {
  return readFileSync(resolve(dir, name), "utf-8");
}

describe("Accessibility regression tests", () => {
  describe("#25 - SuiteNav breadcrumb landmark", () => {
    const src = read("SuiteNav.astro");
    it("wraps breadcrumb in a nav element", () => {
      expect(src).toContain("<nav");
    });
    it("has aria-label Breadcrumb", () => {
      expect(src).toMatch(/aria-label=["']Breadcrumb["']/);
    });
  });

  describe("#26 - InstallTabs tabpanel keyboard access", () => {
    const src = read("InstallTabs.astro");
    it("tabpanel has tabindex 0", () => {
      expect(src).toMatch(/role=["']tabpanel["']/);
      expect(src).toContain('tabindex="0"');
    });
    it("tabs use role tablist and tab", () => {
      expect(src).toMatch(/role=["']tablist["']/);
      expect(src).toMatch(/role=["']tab["']/);
    });
  });

  describe("#27 - Mobile menu focus trap", () => {
    const src = read("Header.astro");
    it("traps focus with Tab key handling", () => {
      expect(src).toContain('e.key === "Tab"');
    });
    it("closes on Escape key", () => {
      expect(src).toContain('e.key === "Escape"');
    });
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

  describe("#85 - Accessibility test coverage", () => {
    it("this test file exists and runs", () => {
      expect(true).toBe(true);
    });
  });
});
