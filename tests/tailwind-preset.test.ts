import { describe, it, expect } from "vitest";
import preset, { colors, fontFamily, borderRadius, spacing, boxShadow } from "../src/tailwind-preset";

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

  it("defines font family tokens", () => {
    expect(fontFamily.sans).toBe("var(--font-sans)");
    expect(fontFamily.mono).toBe("var(--font-mono)");
  });
});
