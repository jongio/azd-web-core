# @jongio/azd-web-core

Shared Astro components, design tokens, and Tailwind v4 preset for **azd extension** websites. Implements the "Developer Terminal" design language—dark-first, monospace accents, sky-blue/violet palette.

## Install

```bash
# .npmrc — point @jongio scope at GitHub Packages
echo "@jongio:registry=https://npm.pkg.github.com" >> .npmrc

# add the package
pnpm add @jongio/azd-web-core
```

> **Peer dependencies:** `astro >=5.0.0` and `tailwindcss >=4.0.0`

## Quick Start

### 1. Import CSS

In your global stylesheet (e.g. `src/styles/global.css`):

```css
@import "@jongio/azd-web-core/base.css";
```

`base.css` already imports `tokens.css` and Tailwind, so one import is all you need.

### 2. Use Components

```astro
---
import Layout from "@jongio/azd-web-core/components/Layout.astro";
import Header from "@jongio/azd-web-core/components/Header.astro";
import Footer from "@jongio/azd-web-core/components/Footer.astro";
import HeroBanner from "@jongio/azd-web-core/components/HeroBanner.astro";
import FeatureCard from "@jongio/azd-web-core/components/FeatureCard.astro";
---

<Layout title="My Extension" extensionName="my-ext">
  <Header extensionName="my-ext" githubUrl="https://github.com/org/repo" />
  <HeroBanner
    title='Build with <span class="gradient-text">azd</span>'
    subtitle="A developer extension for the Azure Developer CLI."
    primaryCta={{ label: "Get Started", href: "#install" }}
  />
  <section class="mx-auto grid max-w-5xl gap-6 p-6 md:grid-cols-3">
    <FeatureCard title="Fast" description="Optimised for speed." icon="⚡" />
    <FeatureCard title="Typed" description="Full TypeScript support." icon="🔒" />
    <FeatureCard title="Themed" description="Dark & light out of the box." icon="🎨" />
  </section>
  <Footer extensionName="my-ext" githubUrl="https://github.com/org/repo" />
</Layout>
```

### 3. Tailwind Preset (optional)

If you want the token values available as Tailwind utilities in JS config:

```ts
import preset from "@jongio/azd-web-core/tailwind-preset";
// preset.colors, preset.fontFamily, etc.
```

## Components

| Component | Description |
|-----------|-------------|
| `Layout.astro` | Full HTML shell with fonts, meta tags, theme init |
| `Header.astro` | Sticky header with logo, nav, theme toggle, GitHub link |
| `Footer.astro` | 3-column footer with resources, community, copyright |
| `ThemeToggle.astro` | Dark/light toggle with localStorage persistence |
| `FeatureCard.astro` | Hoverable card with icon, title, description, glow |
| `InstallTabs.astro` | Tabbed install instructions with copy buttons |
| `StepCard.astro` | Numbered step with monospace number |
| `CodeBlock.astro` | Terminal-styled code display with copy button |
| `HeroBanner.astro` | Hero section with gradient accent and CTAs |
| `SuiteNav.astro` | "azd extensions → azd [name]" breadcrumb |

## Theme System

Dark is the default. The `Layout` component initialises the theme from `localStorage` (key: `azd-theme`), falling back to the OS preference, then to dark. Toggle with the `ThemeToggle` component or manually:

```js
document.documentElement.setAttribute("data-theme", "light"); // or "dark"
```

## Design Tokens

All colours, typography, spacing, radius, and shadows are CSS custom properties defined in `tokens.css`. Components reference them via `var(--color-*)`, `var(--font-*)`, etc. See the file for the full list.

## CI/CD Integration

`@jongio/azd-web-core` is published to [GitHub Packages](https://npm.pkg.github.com) on every version tag (`v*`).

### How It Works

Consumer sites declare the dependency as a versioned package:

```json
"@jongio/azd-web-core": "^2.0.0"
```

But for **local development**, each site uses a `pnpm.overrides` block in `package.json` to redirect to the local clone:

```json
"pnpm": {
  "overrides": {
    "@jongio/azd-web-core": "file:../../azd-web-core"
  }
}
```

This gives you:
- **Local dev**: Instant refresh — edits to azd-web-core components are picked up immediately (after dev server restart)
- **CI builds**: Pulls the published package from GitHub Packages — no need to clone azd-web-core alongside each site

### Automated Site Rebuilds

When a new version of azd-web-core is published:
1. `publish.yml` publishes to GitHub Packages
2. `notify-consumers.yml` sends a `repository_dispatch` event to all consumer repos
3. Each site's `website.yml` triggers, installs the new version, builds, and deploys to GitHub Pages

### Prerequisites

- Each consumer site needs `.npmrc` with `@jongio:registry=https://npm.pkg.github.com`
- CI workflows use `NODE_AUTH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` for GitHub Packages auth
- The `CONSUMER_DISPATCH_PAT` secret on this repo needs a PAT with `repo` scope for cross-repo dispatch

### Publishing a New Version

```bash
# Bump version
npm version patch  # or minor, major

# Push with tag
git push && git push --tags
```

The publish workflow runs automatically on `v*` tags.

## License

MIT
