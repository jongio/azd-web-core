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
} as const;

// Tailwind preset re-export
export { default as tailwindPreset } from "./tailwind-preset.ts";
export * from "./tailwind-preset.ts";
