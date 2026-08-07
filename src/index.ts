/**
 * @jongio/azd-web-core
 *
 * Re-exports for all shared Astro components and CSS asset paths.
 * Components are imported directly from their .astro files by consuming sites.
 *
 * Usage in an Astro site:
 *   import Layout from "@jongio/azd-web-core/components/Layout.astro";
 *   import "@jongio/azd-web-core/base.css";
 */

// CSS asset paths (for documentation / programmatic reference)
export const tokensCSS = "@jongio/azd-web-core/tokens.css";
export const baseCSS = "@jongio/azd-web-core/base.css";

// Component paths (for documentation / programmatic reference)
export const components = {
  Layout: "@jongio/azd-web-core/components/Layout.astro",
  Header: "@jongio/azd-web-core/components/Header.astro",
  Footer: "@jongio/azd-web-core/components/Footer.astro",
  ThemeToggle: "@jongio/azd-web-core/components/ThemeToggle.astro",
  FeatureCard: "@jongio/azd-web-core/components/FeatureCard.astro",
  InstallTabs: "@jongio/azd-web-core/components/InstallTabs.astro",
  StepCard: "@jongio/azd-web-core/components/StepCard.astro",
  CodeBlock: "@jongio/azd-web-core/components/CodeBlock.astro",
  HeroBanner: "@jongio/azd-web-core/components/HeroBanner.astro",
  SuiteNav: "@jongio/azd-web-core/components/SuiteNav.astro",
  Icon: "@jongio/azd-web-core/components/Icon.astro",
} as const;

// Tailwind preset re-export
export { default as tailwindPreset } from "./tailwind-preset.ts";
export * from "./tailwind-preset.ts";

// Utilities
export { initClipboardButtons } from "./utils/clipboard.ts";
export type { ClipboardButtonOptions } from "./utils/clipboard.ts";
// TOGGLE_SELECTOR / MENU_SELECTOR stay module-local. They are internal DOM hooks
// shared with the test suite, not package API. Publishing them would make a
// rename a semver-major break for a capability no consumer uses, and
// initClipboardButtons sets the precedent of not exporting its selectors.
export { initMobileMenu } from "./utils/mobileMenu.ts";
