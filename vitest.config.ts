import { getViteConfig } from "astro/config";

/**
 * `getViteConfig` supplies the Astro plugin so `.astro` components can be imported
 * and rendered through `experimental_AstroContainer` inside tests.
 *
 * `import.meta.env.BASE_URL` is `/` here, which is indistinguishable from a
 * hardcoded root path. Tests that care about base-path correctness stub it with
 * `vi.stubEnv("BASE_URL", ...)` rather than relying on config.
 */
export default getViteConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts", "tests/**/*.test.ts"],
    // Randomise order so a test that leaks a listener or mutates shared state
    // fails here instead of passing by declaration-order luck. The seed is
    // pinned because `pnpm test` gates publishing: a fresh seed per run would
    // turn an order-dependent failure into an irreproducible release blocker
    // that goes green on retry, which teaches everyone to ignore it. Bump this
    // constant deliberately to explore a different ordering.
    sequence: { shuffle: { tests: true }, seed: 20260727 },
    coverage: {
      provider: "v8",
      include: ["src/utils/**/*.ts"],
      exclude: ["**/*.test.ts"],
    },
  },
});
