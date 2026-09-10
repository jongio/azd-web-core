---
title: Fix Header base-path and mobile menu binding defects
status: draft
category: bugfix
created: 2026-08-04
updated: 2026-08-04
---

# Fix Header base-path and mobile menu binding defects

## Problem

`@jongio/azd-web-core` is consumed by four active extension sites, every one of which
deploys to GitHub Pages under a distinct base path (`/azd-app/`, `/azd-copilot/`,
`/azd-extensions/`, `/azd-rest/`). `Header.astro` was written as though it were running
at a domain root. Three separate defects follow from that assumption, plus one release
automation defect that targets a repository that no longer accepts writes.

### D1. Logo link leaves the site (live in production today)

`Header.astro` renders `<a href="/">` around the site logo and name. On a base-path
deployment that resolves to `https://jongio.github.io/`, which is the GitHub Pages
account root, not the site. Verified against live production HTML on both
`jongio.github.io/azd-rest/` and `jongio.github.io/azd-copilot/`: both serve
`<a href="/" class="flex items-center gap-[var(--space-2)] ...">`.

This is not latent. Every visitor who clicks the logo on any of the four sites today is
navigated off that site.

### D2. Logo image references an asset that does not exist (latent)

PR #94 (`6e56b61`, "decompose Header, extract config, async fonts, fix README prop")
replaced the working inline terminal-glyph `<svg>` with:

```html
<img src="/azure-icon.svg" alt="" class="h-5 w-5" aria-hidden="true" />
```

`azure-icon.svg` is present in **no** consumer's `public/` directory and **nowhere in
azd-web-core itself**. The package references an asset it neither ships nor documents as
a consumer obligation. Confirmed 404 at both `jongio.github.io/azure-icon.svg` and
`jongio.github.io/azd-rest/azure-icon.svg`.

This has not surfaced yet only because the deployed sites are still running a much older
core (see "Why this went unnoticed"). It breaks on every site the moment any of them
actually upgrades.

### D3. Mobile menu Escape handling and focus trap never bind

`Header.astro` carries two `<script>` blocks that both try to wire the mobile menu.

The first queries `document.querySelector("[data-menu-toggle]")`. The markup emits
`data-mobile-toggle`. The selector never matches, so `toggle` is null, so the entire
guarded block never runs. That block is the only place Escape-to-close and the Tab focus
trap are implemented.

The second block queries `[data-mobile-toggle]` correctly and wires the click toggle, but
implements neither Escape nor the focus trap, registers no `astro:page-load` listener, and
uses no `AbortController`.

Net effect: the menu opens and closes on click, and nothing else works. Keyboard users
cannot dismiss the menu, and focus escapes the open overlay. WCAG 2.1.2 (No Keyboard Trap)
and 2.4.3 (Focus Order) are both implicated.

### D4. Mobile nav links have no hover affordance

`MobileMenu.astro` defines `.mobile-link` with a color but no `:hover` rule, so mobile nav
links are the only interactive text in the header that gives no pointer feedback.

### D5. Release automation dispatches to an archived repository

`notify-consumers.yml` fans out `repository_dispatch` to five repos, one of which is
`jongio/azd-exec`. That repository was archived on 2026-06-25 and is read-only; the
dispatch will return 403. The last successful run of this workflow was 2026-03-03, which
predates the archive, so the failure is latent and will appear on the next `v*` publish.

## Why this went unnoticed

Two independent reasons, both worth recording because they shape the fix.

**The test suite asserts text presence, not behavior.** `accessibility.test.ts` contains a
case named "#27 - Mobile menu focus trap" which asserts that `Header.astro` *contains the
string* `e.key === "Tab"`. That assertion passes even though the handler containing it can
never bind. A test that reads the source as text cannot detect that a selector does not
match the markup it queries.

**Consumers never receive new versions.** All four consumer workflows install with
`pnpm install --frozen-lockfile`, which reinstalls the version already pinned in
`pnpm-lock.yaml`. The `repository_dispatch` rebuild therefore rebuilds against the *old*
core and succeeds, so the pipeline looks healthy while delivering nothing. Direct evidence:
live headers still render the pre-#94 inline `<svg>`, `backdrop-blur`, and
`max-w-[1280px]`, while local v2.4.1 has `<img>`, no backdrop blur, and `max-w-6xl`.

That second point is tracked separately (it requires coordinated consumer-side changes) but
it is the reason D2 is latent rather than live, and the reason this fix must not be assumed
to reach users just because it is published.

## Goals

- Header renders correctly under any Astro `base`, including the domain root.
- Mobile menu is fully operable by keyboard.
- Release automation performs no writes against archived repositories.
- The test suite can detect a selector/markup contract break, not merely the presence of
  a string.

## Non-goals

- Redesigning the release fan-out to actually deliver versions. That requires changes in
  four other repositories and is tracked as separate work.
- Consumer-side defects (`azd-app` duplicate mobile menu and missing `hubUrl`,
  `azd-copilot` and `azd-rest` missing `id="main-content"`). Separate repos, separate PRs.
- Any component consolidation or design-language work. This change is defect repair only
  and is intended to ship as a backward-compatible patch.

## Decisions

### Restore the inline SVG rather than ship an icon asset

Shipping `azure-icon.svg` inside the package would require every consumer to add a copy
step into `public/`, because Astro does not serve assets out of `node_modules` at a stable
public URL. Rewriting the `src` to `${import.meta.env.BASE_URL}azure-icon.svg` would still
404, since the file exists in no consumer.

Restoring the inline `<svg>` removes the network request entirely, is base-path immune by
construction, and returns the component to the design that is currently live. D2 is treated
as a straight regression revert.

### Use `import.meta.env.BASE_URL` for the home link

`Layout.astro` already establishes this pattern for the favicon. Astro substitutes the
consuming project's base at build time, and it is `/` when no base is configured, so the
single expression is correct for both base-path and root deployments.

### Keep the duplicated `.nav-link` rule

`.nav-link` is declared in both `Header.astro` and `NavLinks.astro`. This looks like
copy-paste debt but is required: Astro scopes `<style>` to the elements in that component's
own template, so `NavLinks` cannot inherit a rule declared in `Header`.

The alternative, promoting `.nav-link` to `base.css`, would publish a generic class name
into the global namespace of every consuming site. For a two-declaration rule that is not a
trade worth making. The duplication is accepted by design and now documented as such.

`.mobile-link` is a genuine defect (missing hover) and is fixed.

### Test the contract, not the string

The root cause of D3 is a mismatch between a selector in a script and an attribute in
markup. The regression guard is therefore a structural invariant test: extract every
`data-*` attribute selector queried by `Header.astro`'s scripts, extract every `data-*`
attribute actually emitted by `Header.astro` and `MobileMenu.astro`, and assert the first
set is a subset of the second.

This catches the entire bug class rather than this one instance, and it would have failed
on the code as it stands today.

## Acceptance criteria

| # | Criterion |
|---|---|
| AC1 | Header home link resolves to the consuming site's base path, not the domain root |
| AC2 | Header logo renders with no external asset reference and no possible 404 |
| AC3 | Every `data-*` selector queried in Header scripts exists in the emitted markup |
| AC4 | Escape closes the open mobile menu and returns focus to the toggle |
| AC5 | Tab and Shift+Tab cycle within the open mobile menu |
| AC6 | Handlers rebind on `astro:page-load` without accumulating duplicate listeners |
| AC7 | Exactly one script block wires the mobile menu |
| AC8 | Mobile nav links expose a hover state |
| AC9 | Release automation dispatches to no archived repository |

## Out of scope, tracked elsewhere

- Consumer `--frozen-lockfile` version-uptake failure (4 repos)
- `azd-extensions/website.yml` missing `repository_dispatch` trigger
- `azd-app` duplicate `data-mobile-menu` and unreachable local `MobileMenu.astro`
- `azd-app` missing required `hubUrl` prop in `Layout.astro` and `tour/TourLayout.astro`
- `azd-copilot` and `azd-rest` missing `id="main-content"` skip-link target

<!-- Pipeline tracking (auto-managed, not part of product spec) -->
## Pipeline Status
Phase: VERIFYING
