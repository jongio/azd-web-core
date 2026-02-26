/**
 * Tailwind CSS v4 theme preset for "Developer Terminal" design.
 *
 * In Tailwind v4, configuration is primarily CSS-based. This preset
 * exports token values so consuming Astro sites can reference them
 * in their own `@theme` blocks or JS config if needed.
 */

export const colors = {
  background: "var(--color-background)",
  surface: "var(--color-surface)",
  "surface-2": "var(--color-surface-2)",
  primary: "var(--color-primary)",
  accent: "var(--color-accent)",
  success: "var(--color-success)",
  warning: "var(--color-warning)",
  danger: "var(--color-danger)",
  text: "var(--color-text)",
  "text-muted": "var(--color-text-muted)",
  border: "var(--color-border)",
} as const;

export const fontFamily = {
  sans: "var(--font-sans)",
  mono: "var(--font-mono)",
} as const;

export const borderRadius = {
  sm: "var(--radius-sm)",
  md: "var(--radius-md)",
  lg: "var(--radius-lg)",
} as const;

export const spacing = {
  1: "var(--space-1)",
  2: "var(--space-2)",
  3: "var(--space-3)",
  4: "var(--space-4)",
  5: "var(--space-5)",
  6: "var(--space-6)",
  8: "var(--space-8)",
  10: "var(--space-10)",
  12: "var(--space-12)",
  16: "var(--space-16)",
  20: "var(--space-20)",
} as const;

export const boxShadow = {
  card: "var(--shadow-card)",
  hover: "var(--shadow-hover)",
  lg: "var(--shadow-lg)",
} as const;

const preset = {
  colors,
  fontFamily,
  borderRadius,
  spacing,
  boxShadow,
} as const;

export default preset;
