import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import preset, { colors, fontFamily, fontSize, borderRadius, spacing, boxShadow } from "../src/tailwind-preset";

const tokensCss = readFileSync(fileURLToPath(new URL("../src/tokens.css", import.meta.url)), "utf8");

describe("tailwind-preset", () => {
  it("exports a valid preset object with all token groups", () => {
    expect(preset).toBeDefined();
    expect(preset.colors).toBe(colors);
    expect(preset.fontFamily).toBe(fontFamily);
    expect(preset.borderRadius).toBe(borderRadius);
    expect(preset.spacing).toBe(spacing);
    expect(preset.boxShadow).toBe(boxShadow);
  });

  it("defines expected color tokens referencing CSS custom properties", () => {
    expect(colors.background).toBe("var(--color-background)");
    expect(colors.primary).toBe("var(--color-primary)");
    expect(colors.text).toBe("var(--color-text)");
  });

  it("defines font family tokens under the azd namespace", () => {
    expect(fontFamily.sans).toBe("var(--azd-font-sans)");
    expect(fontFamily.mono).toBe("var(--azd-font-mono)");
  });

  it("exposes a font size for every step of the type scale", () => {
    for (const step of ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"] as const) {
      expect(fontSize[step]).toBe(`var(--azd-text-${step})`);
    }
  });
});

describe("tokens.css / Tailwind namespace isolation", () => {
  /**
   * Tailwind v4 generates its `text-*`, `font-*` and spacing utilities from
   * these exact variable names. Defining them here silently rewrites every
   * Tailwind utility on every consuming site, and leaves Tailwind's derived
   * `--text-N--line-height` values mismatched against the new sizes.
   */
  const RESERVED = ["--text-", "--font-sans", "--font-mono", "--font-weight-", "--spacing:"];

  it.each(RESERVED)("does not define the Tailwind-reserved token %s", (reserved) => {
    const declaration = new RegExp(`^\\s*${reserved.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[\\w-]*\\s*:`, "m");
    expect(tokensCss).not.toMatch(declaration);
  });

  it("pairs every type scale step with a line height", () => {
    const sizes = [...tokensCss.matchAll(/--azd-text-([\w]+)\s*:/g)].map((m) => m[1]);
    const leadings = [...tokensCss.matchAll(/--azd-leading-([\w]+)\s*:/g)].map((m) => m[1]);
    expect(sizes.length).toBeGreaterThan(0);
    expect([...sizes].sort()).toEqual([...leadings].sort());
  });

  it("keeps the type scale monotonically increasing", () => {
    const order = ["xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl"];
    const rem = order.map((step) => {
      const m = tokensCss.match(new RegExp(`--azd-text-${step}\\s*:\\s*([\\d.]+)rem`));
      expect(m, `--azd-text-${step} missing or not in rem`).not.toBeNull();
      return Number(m![1]);
    });
    for (let i = 1; i < rem.length; i++) {
      expect(rem[i], `${order[i]} must exceed ${order[i - 1]}`).toBeGreaterThan(rem[i - 1]);
    }
  });
});
