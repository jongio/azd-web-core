# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-02-26

### ⚠ BREAKING CHANGES

- Complete rewrite from React/monorepo to Astro component library
- Removed `azd-web-core-react`, `azd-web-core-tailwind`, and `azd-web-core-tokens` sub-packages
- Now a single flat package exporting Astro components directly

### Added

- **Astro 5 components**: Layout, Header, Footer, HeroBanner, FeatureCard, InstallTabs, CodeBlock, ThemeToggle, SuiteNav, StepCard
- **Design tokens**: CSS custom properties for colors, spacing, and typography (`tokens.css`)
- **Base styles**: Global resets, focus states, reduced-motion support (`base.css`)
- **Tailwind v4 preset**: Shared configuration for consistent styling (`tailwind-preset.ts`)
- **Dark-first design**: "Developer Terminal" aesthetic with dark mode as default
- **Accessibility**: WCAG 2.1 AA compliant — keyboard navigation, ARIA landmarks, skip links, 44px touch targets, contrast ratios
- **Theme toggle**: JavaScript-based with `is:inline` script for flash-free SSR support
- **CI/CD integration**: Published to GitHub Packages, cross-repo dispatch for automated consumer site rebuilds

### Removed

- React component library (`azd-web-core-react`)
- Tailwind v3 preset package (`azd-web-core-tailwind`)
- Design token generator package (`azd-web-core-tokens`)
- Test app and visual regression tests
- Monorepo workspace configuration

## [1.0.0] - 2025-01-01

Initial release with React components and Tailwind v3 preset (deprecated).
