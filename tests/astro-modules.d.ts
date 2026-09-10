/**
 * `tsc` has no Astro plugin, so `.astro` imports are opaque to it. Astro's own
 * `astro check` understands them natively, which is why the shipped source
 * needs no equivalent. This declaration exists purely so the test suite can be
 * type-checked via `tsconfig.test.json`.
 *
 * The shape matches what `experimental_AstroContainer.renderToString` accepts.
 *
 * Known limitation: `AstroComponentFactory` is not generic over props, so this
 * wildcard cannot carry per-component prop types, and a wildcard module cannot
 * re-export a named `Props` interface either (TS2614). A test that renders
 * `Header` with a misspelled or missing prop will therefore not fail
 * `pnpm typecheck`. `pnpm check` (astro check) is the authority for prop
 * correctness in `.astro` files; it resolves the real component types and runs
 * both in CI and in the publish `verify` job, so the gap is covered before
 * anything ships. Narrowing this to per-file declarations was considered and
 * rejected: it would mean hand-maintaining a duplicate of every component's
 * prop interface, which drifts silently the moment a component changes.
 */
declare module "*.astro" {
  const Component: import("astro/runtime/server/index.js").AstroComponentFactory;
  export default Component;
}
