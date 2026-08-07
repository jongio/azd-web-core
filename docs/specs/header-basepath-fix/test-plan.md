# Test Plan: Fix Header base-path and mobile menu binding defects

## Status: COVERED

## Strategy

The existing suite (`src/components/accessibility.test.ts`) asserts on **source text**. That
style cannot detect this bug class: the "#27 - Mobile menu focus trap" case passes today by
finding the string `e.key === "Tab"` in a handler that can never bind. Three stronger layers
replace that reliance:

1. **Rendered-output tests** — render `Header.astro` through `experimental_AstroContainer`
   and assert on the HTML the component actually emits with real props. This proves template
   behavior rather than template text.
2. **Contract tests** — extract every `data-*` selector queried by Header's scripts and every
   `data-*` attribute emitted by Header/MobileMenu markup, then assert the first set is a
   subset of the second. Catches the whole selector-mismatch class, not this one instance.
   Must fail against the code as it stands today.
3. **Behavioral tests** — the mobile menu wiring moves out of the inline `<script>` into
   `src/utils/mobileMenu.ts` (following the precedent set by `src/utils/clipboard.ts` in
   `a7f9fb4`) so Escape, focus trap, and rebinding can be driven directly under jsdom.

### Base-path verification technique

`import.meta.env.BASE_URL` is supplied by Vite and defaults to `/`, which is
indistinguishable from the bug under a default config. Setting a non-root `base` in
`vitest.config.ts` does **not** work: Astro's own Vite plugin resolves `BASE_URL` at
transform time and overrides both a Vite-level `base` and a `define` entry. The working
technique is `vi.stubEnv("BASE_URL", "/azd-rest/")` before rendering, paired with
`vi.unstubAllEnvs()` in `afterEach`. Verified: the rendered logo href becomes the stubbed
value, so a regression to a literal `href="/"` fails T1.

### Fallback

Not needed. `experimental_AstroContainer` renders these components successfully once
`vitest.config.ts` uses `getViteConfig` from `astro/config` (required to supply the Astro
plugin so `.astro` files can be imported). Rendering emits a harmless
`[WARN] Missing pages directory: src/pages`.

## Planned Tests

| ID | AC | Description | Type | Status | Location |
|----|----|-------------|------|--------|----------|
| T1 | AC1 | Rendered home link equals the configured non-root base URL | render | automated | `src/components/Header.test.ts` |
| T2 | AC1 | Rendered home link is still correct on a root deployment | render | automated | `src/components/Header.test.ts` |
| T3 | AC2 | Rendered Header emits no `<img>` element | render | automated | `src/components/Header.test.ts` |
| T4 | AC2 | Rendered Header contains no `azure-icon` reference | render | automated | `src/components/Header.test.ts` |
| T5 | AC2 | Rendered Header logo is an inline `<svg>` marked `aria-hidden` | render | automated | `src/components/Header.test.ts` |
| T6 | AC3 | Every `data-*` selector queried in Header scripts exists in emitted markup | contract | automated | `src/components/Header.test.ts` |
| T7 | AC7 | Header declares exactly one script block wiring the mobile menu | contract | automated | `src/components/Header.test.ts` |
| T8 | AC4 | Escape closes an open mobile menu | behavior | automated | `src/utils/mobileMenu.test.ts` |
| T9 | AC4 | Escape restores focus to the toggle button | behavior | automated | `src/utils/mobileMenu.test.ts` |
| T10 | AC4 | Escape is a no-op when the menu is already closed | edge | automated | `src/utils/mobileMenu.test.ts` |
| T11 | AC5 | Tab from the last focusable element wraps to the first | behavior | automated | `src/utils/mobileMenu.test.ts` |
| T12 | AC5 | Shift+Tab from the first focusable element wraps to the last | behavior | automated | `src/utils/mobileMenu.test.ts` |
| T13 | AC5 | Focus trap is inactive while the menu is closed | edge | automated | `src/utils/mobileMenu.test.ts` |
| T14 | AC5 | Focus trap tolerates a menu containing no focusable children | edge | automated | `src/utils/mobileMenu.test.ts` |
| T15 | AC6 | Re-initialising aborts prior listeners, leaving no duplicate handlers | behavior | automated | `src/utils/mobileMenu.test.ts` |
| T16 | AC6 | Initialisation is a no-op when toggle or menu is absent | error path | automated | `src/utils/mobileMenu.test.ts` |
| T17 | AC3 | Toggle click flips `aria-expanded` and the `hidden`/`flex` classes | behavior | automated | `src/utils/mobileMenu.test.ts` |
| T18 | AC8 | `MobileMenu.astro` defines a `.mobile-link:hover` rule | source | automated | `src/components/Header.test.ts` |
| T19 | AC9 | `notify-consumers.yml` matrix lists no archived repository | config | automated | `tests/notify-consumers.test.ts` |
| T20 | AC9 | `notify-consumers.yml` matrix covers exactly the four active consumers | config | automated | `tests/notify-consumers.test.ts` |
| T21 | AC6 | Header re-initialises on `astro:page-load`, aborting the prior controller | contract | automated | `src/components/Header.test.ts` |
| T22 | AC7 | Every `package.json` export target exists on disk | contract | automated | `tests/package-exports.test.ts` |
| T23 | AC7 | Every `package.json` export target sits inside a published directory | contract | automated | `tests/package-exports.test.ts` |

| T24 | AC6 | The focus trap stays inactive when the menu is open but `display: none` | behavioral | automated | `src/utils/mobileMenu.test.ts` |
| T25 | AC6 | The key handler yields to a widget that already called `preventDefault` | behavioral | automated | `src/utils/mobileMenu.test.ts` |
| T26 | AC7 | Test files are excluded from the published artifact | contract | automated | `tests/package-exports.test.ts` |
| T27 | AC8 | The dispatch payload is built with `toJSON`, not string splicing | contract | automated | `tests/notify-consumers.test.ts` |
| T28 | AC8 | Dispatch only fires for pushed version tags | contract | automated | `tests/notify-consumers.test.ts` |
| T29 | AC4 | Menu closes when a menu link is activated | behavioral | automated | `src/utils/mobileMenu.test.ts` |
| T30 | AC4 | Menu closes on a click outside the menu and toggle | behavioral | automated | `src/utils/mobileMenu.test.ts` |
| T31 | AC4 | Menu stays open on a non-link click inside it | edge | automated | `src/utils/mobileMenu.test.ts` |
| T32 | AC6 | Menu closes when the viewport crosses the `md` breakpoint | behavioral | automated | `src/utils/mobileMenu.test.ts` |
| T33 | AC6 | A resize below the breakpoint leaves an open menu alone | edge | automated | `src/utils/mobileMenu.test.ts` |
| T34 | AC6 | A resize with the menu closed does not steal focus | edge | automated | `src/utils/mobileMenu.test.ts` |
| T35 | AC3 | Keys other than Tab and Escape pass through untouched | edge | automated | `src/utils/mobileMenu.test.ts` |
| T36 | AC3 | Tab from mid-ring is left to the browser | edge | automated | `src/utils/mobileMenu.test.ts` |
| T37 | AC5 | Publish workflow grants no elevated permission at workflow level | contract | automated | `tests/publish-workflow.test.ts` |
| T38 | AC5 | `packages`/`id-token` write is confined to the publish job | contract | automated | `tests/publish-workflow.test.ts` |
| T39 | AC5 | No build/test/check tooling runs in the privileged job | contract | automated | `tests/publish-workflow.test.ts` |
| T40 | AC5 | Privileged job installs with `--ignore-scripts` | contract | automated | `tests/publish-workflow.test.ts` |
| T41 | AC5 | Publishing is gated behind the `verify` job | contract | automated | `tests/publish-workflow.test.ts` |
| T42 | AC5 | No checkout leaves a credential on disk | contract | automated | `tests/publish-workflow.test.ts` |
| T43 | AC5 | The supply-chain cooldown is actually enforced | contract | automated | `tests/publish-workflow.test.ts` |

T21 through T23 were added during Phase 3 reconciliation to close gaps the original
20-test plan missed. T24 through T28 were added after the security audit; each one guards
a specific finding. See the Functionality Inventory below.

**T24 is the most important test in this plan.** Extracting the menu wiring made the focus
trap bind for the first time, which *activated* a latent keyboard trap: both the toggle and
the menu carry `md:hidden`, so widening the viewport past the breakpoint hides them via
`display` while the open class remains. Without the visibility check, every `Tab` on the page
would be redirected into an invisible element. The fix is only observable through behavior,
so a source-level assertion could not have caught it.

**Deviation from plan**: T2 was planned as a source assertion that no literal `href="/"`
appears. It is implemented instead as a rendered root-deployment control (base `/` still
produces a working link). The rendered form is stronger: it constrains behavior at both base
configurations rather than banning a string. T1 already fails on a hardcoded literal, so the
banned-string assertion added nothing.

## Regression guard requirement

T6 and T7 MUST be verified to **fail against the pre-fix source**. A contract test that
passes on broken code provides no guard.

### Evidence

Pre-fix source restored via
`git stash push -- src/components/Header.astro src/components/MobileMenu.astro .github/workflows/notify-consumers.yml`,
then `npx vitest run --reporter=verbose`:

```
× tests/notify-consumers.test.ts  > T19: dispatches to no archived repository
× tests/notify-consumers.test.ts  > T20: covers exactly the active consumer sites
× src/components/Header.test.ts   > T1: logo href resolves to the configured base path
✓ src/components/Header.test.ts   > T2: logo href is still correct on a root deployment
× src/components/Header.test.ts   > T3: renders no img element
× src/components/Header.test.ts   > T4: makes no reference to azure-icon
× src/components/Header.test.ts   > T5: renders the logo as an inline decorative svg
× src/components/Header.test.ts   > T6: every data attribute selector queried has a matching attribute in markup
× src/components/Header.test.ts   > T7: declares exactly one script block
× src/components/Header.test.ts   > T18: mobile links expose a hover state
```

9 tests fail pre-fix, covering all five defects: D1 (T1), D2 (T3, T4, T5), D3 (T6, T7),
D4 (T18), D5 (T19, T20). T6 and T7 both fail as required.

T2 passing pre-fix is correct: it is the root-deployment control, which the old hardcoded
`href="/"` satisfied by coincidence. T8 through T17 also pass pre-fix because they exercise
`src/utils/mobileMenu.ts`, a new file the stash did not remove. They are new-behavior tests
for logic that had no reachable equivalent before, not regression guards. The guard for that
defect is T6, which proves the old handler could never bind.

Restored with `git stash pop`; full suite green at 36 passed / 0 failed.

## Functionality Inventory

Every unit of functionality introduced by `git diff main...HEAD`, mapped to a covering test.

### `src/utils/mobileMenu.ts` (new)

| Unit | Covering test | Status |
|------|---------------|--------|
| `TOGGLE_SELECTOR` value matches emitted markup | T6 | covered |
| `MENU_SELECTOR` value matches emitted markup | T6 | covered |
| `FOCUSABLE_SELECTOR` selects menu links | T11, T12 | covered |
| `isOpen()` reads the `hidden` class | T13, T17 | covered |
| `setOpen()` writes `hidden`/`flex`/`aria-expanded` | T8, T17 | covered |
| `setOpen()` focuses into the ring on open | T44 | covered |
| `setOpen()` restores focus to toggle when closing from inside | T45, T46 | covered |
| `setOpen()` leaves focus alone when it was already outside | T47 | covered |
| `focusRing()` places the toggle first | T12 | covered |
| `focusRing()` returns menu descendants in order | T11 | covered |
| `initMobileMenu()` guard: toggle or menu absent | T16 | covered |
| `initMobileMenu()` click listener | T17 | covered |
| keydown early return while menu is closed | T10, T13 | covered |
| keydown Escape branch: close | T8 | covered |
| keydown Escape branch: restore focus | T9 | covered |
| keydown non-Tab early return | T10 | covered |
| keydown empty focus ring guard | T14 | covered |
| keydown Tab forward wrap | T11 | covered |
| keydown Shift+Tab backward wrap | T12 | covered |
| returned `AbortController` tears down listeners | T15 | covered |

### `src/components/Header.astro`

| Unit | Covering test | Status |
|------|---------------|--------|
| Logo href honours a non-root base path | T1 | covered |
| Logo href still correct at root base | T2 | covered |
| Logo renders as inline `<svg>`, not `<img>` | T3, T5 | covered |
| No `azure-icon` asset reference remains | T4 | covered |
| Script selectors all exist in markup | T6 | covered |
| Exactly one script block | T7 | covered |
| `setup()` aborts before re-init on `astro:page-load` | T21 | covered |

### `src/components/MobileMenu.astro`

| Unit | Covering test | Status |
|------|---------------|--------|
| `.mobile-link:hover` rule exists | T18 | covered |
| Menu id is namespaced against consumer collisions | T49 | covered |
| `aria-controls` resolves to the real menu element | T48 | covered |

### `.github/workflows/notify-consumers.yml`

| Unit | Covering test | Status |
|------|---------------|--------|
| No archived repo in the dispatch matrix | T19 | covered |
| Matrix equals the four active consumers | T20 | covered |
| Payload is JSON-encoded, not spliced | T27 | covered |
| Dispatch is limited to pushed version tags | T28 | covered |

### `package.json` / `src/index.ts`

| Unit | Covering test | Status |
|------|---------------|--------|
| Export target ships inside `files` | T23 | covered |
| Test files excluded from the tarball | T26 | covered |
| `initMobileMenu` re-exported from the barrel | T22 (indirect) | covered |

**Gaps: 0.**

### Gaps found and closed during reconciliation

1. **`astro:page-load` re-initialisation was untested.** T7 proved only that a single
   script block existed. Nothing asserted the script actually re-runs on View Transition
   navigation, nor that it aborts the previous controller first. That omission left the
   exact duplicate-listener regression the refactor was meant to prevent unguarded.
   Closed by T21.
2. **The `exports` map was untested.** A subpath export is only exercised when a consumer
   installs the package, so a bad target ships broken and no check in this repo notices.
   Closed by T22 and T23, which validate the whole map. A `./utils/mobileMenu` subpath was
   briefly added and then removed: no consumer wires the menu itself, and removing an export
   later is a breaking change while adding one is not.
3. **The focus trap could strand keyboard users at desktop width.** Found by the security
   audit, not by the plan. The trap only became reachable because of this change, so the
   plan treated it as pre-existing behavior and never questioned its open/closed test.
   Closed by T24.
4. **The keydown handler acted on events it did not own**, and the dispatch payload
   interpolated a git ref straight into JSON. Closed by T25 and T27.
5. **Adding co-located tests under `src/` silently expanded the published tarball.**
   `files: ["src"]` ships everything, so the two new test files would have reached
   consumers with static `vitest` imports they cannot resolve. Closed by T26.
6. **The menu had no dismissal path other than the toggle.** These are documentation
   sites whose nav links are frequently in-page anchors, which navigate without a page
   load, so the overlay would sit on top of the section the user jumped to with focus
   still trapped. Closed by T29 through T31.
7. **Menu state survived the `md` breakpoint**, leaving `aria-expanded="true"` on an
   invisible button and re-revealing an open menu on the way back down. Closed by T32
   and T33.
8. **`accessibility.test.ts` asserted strings, not structure.** Its `#26` case checked
   that `role="tabpanel"` and `tabindex="0"` both appeared somewhere in the file, never
   that they were on the same element. That is the identical failure mode as `#27`, still
   live. Both `#25` and `#26` are now render tests that bind attributes to the elements
   carrying the role. Verified by mutation: moving `tabindex="0"` off the tabpanel onto an
   unrelated `<span>` leaves the old assertion green and fails the new one.
9. **The test files were never type-checked.** The root `tsconfig.json` excludes
   `src/**/*.test.ts` and omits `tests/` entirely, so type errors in the suite were
   invisible. Closed by `tsconfig.test.json`, wired into `pnpm typecheck` so CI enforces
   it. `tsc` has no Astro plugin, so `tests/astro-modules.d.ts` declares `*.astro`.
10. **Coverage was unmeasurable** (`@vitest/coverage-v8` was not installed), which hid
    three untested branches in the new keydown and resize handlers: a resize while
    closed, a non-Tab key, and a Tab from the middle of the focus ring. Closed by T34
    through T36. `mobileMenu.ts` is now at 100% statements, lines, and functions, and
    97% branches.

### Coverage

Scoped to `src/utils` because that is where this change put its logic; the `.astro`
components are covered by render tests instead.

| File | Stmts | Branch | Funcs | Lines |
|---|---|---|---|---|
| `mobileMenu.ts` | 100% | 97.36% | 100% | 100% |
| `clipboard.ts` | 0% | 0% | 0% | 0% |

`clipboard.ts` is pre-existing and untouched by this branch. Its gap is real but
uncoupled, so it stays out of this changeset rather than widening the scope.

The one uncovered `mobileMenu.ts` branch is the `view ? ... : true` fallback for a
detached node with no `defaultView`, which is unreachable in jsdom and in a browser.

A second uncovered branch is the `active !== toggle` half of the open-focus guard,
which only differs when the toggle already holds focus, where the call is a no-op.

11. **The release job executed third-party code while holding the publish credential.**
    Adding `pnpm test` to `publish.yml` (itself a fix, since the release path never ran
    tests) put the Vite/Astro plugin chain and the new jsdom tree inside the one job
    holding `packages: write` and `id-token: write`. A single compromised dependency
    could have published a provenance-signed `@jongio/azd-web-core` into all four
    consumer sites. Split into a read-only `verify` job and a minimal `publish` job that
    installs with `--ignore-scripts` and runs no tooling; `persist-credentials: false`
    added to every checkout. Closed by T37 through T42, mutation-verified by
    reintroducing `pnpm test` into the privileged job and confirming T39 and T40 fail.
12. **The supply-chain cooldown was inert.** `pnpm-workspace.yaml` carried a 34-entry
    `minimumReleaseAgeExclude` list but no `minimumReleaseAge` key, so the cooldown those
    exclusions modulate was never enforced and an install would accept a package
    published seconds earlier. Set to 7 days. Enabling it immediately rejected five
    entries, which is the control working. Closed by T43.
13. **Dismissal stranded keyboard focus inside the hidden menu.** Two of the dismissal
    paths this branch introduced (activating a menu link, clicking outside) closed the
    menu without moving focus out of it. The browser resolves focus on a `display: none`
    element by dropping it to `<body>`, so the user's next Tab restarts at the top of the
    page (WCAG 2.4.3). Escape was unaffected because it restored focus at its own call
    site, which is precisely how the other two paths were missed. Focus handling moved
    into `setOpen` so every present and future dismissal path inherits it. Opening now
    also pulls focus into the ring, because Safari does not focus a `<button>` on click
    and the Tab trap only engages from the ends of the ring. Closed by T44 through T47,
    mutation-verified by reverting each half of `setOpen` independently.
14. **The shared menu id could collide inside a consumer site.** `MobileMenu.astro`
    declared an unprefixed `id="mobile-menu"`, and `azd-app/web/src/components/MobileMenu.astro:56`
    already declares the same id on its own dialog. Two elements sharing an id makes the
    header's `aria-controls` resolve by document order rather than by intent. Namespaced
    to `azd-core-mobile-menu`, setting the convention for ids in this package since none
    existed. Closed by T48 and T49.
15. **A release-gating suite ran in a different order every time.** `sequence.shuffle`
    was enabled without a seed. Shuffling is what caught the leaked listener in RF-001,
    so it stays, but with `pnpm test` now gating publication an unseeded shuffle turns an
    order-dependent failure into an irreproducible release blocker that goes green on
    retry. Seed pinned so a failure reproduces on demand.
