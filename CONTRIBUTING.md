# Contributing to azd-web-core

Thank you for your interest in contributing! This library provides shared Astro components, design tokens, and styles for azd extension websites.

## Development Setup

1. Clone this repo alongside the consumer sites:
   ```
   azd-extensions/
   ├── azd-web-core/    ← this repo
   ├── azd-app/
   ├── azd-copilot/
   ├── azd-exec/
   ├── azd-rest/
   └── azd-extensions/
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Start a consumer site's dev server to see changes:
   ```bash
   cd ../azd-app/web && pnpm dev
   ```
   Consumer sites use `pnpm.overrides` to resolve this package from the local filesystem, so edits are reflected after a dev server restart.

## Making Changes

- **Components** live in `src/components/` — all are Astro (`.astro`) files
- **Design tokens** are in `src/tokens.css` — CSS custom properties
- **Base styles** are in `src/base.css` — global resets and utilities
- **Tailwind preset** is in `src/tailwind-preset.ts`

### Guidelines

- Keep components framework-agnostic (Astro + vanilla JS, no client-side frameworks)
- Use `<script is:inline>` for interactive behavior (not bundled Astro scripts) to avoid scoping issues
- Maintain WCAG 2.1 AA accessibility compliance
- Test changes across all 5 consumer sites before submitting a PR

## Publishing

Publishing happens automatically when a version tag is pushed:

```bash
npm version patch   # or minor, major
git push && git push --tags
```

The `Publish Packages` workflow publishes to GitHub Packages, then `Notify Consumer Sites` triggers rebuilds of all consumer sites.

## Code of Conduct

Be respectful. We follow the [Contributor Covenant](https://www.contributor-covenant.org/).
