import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig({
  resolve: {
    alias: [
      // Order matters: longer / more specific prefixes first.
      { find: "@internal/", replacement: r("./src/internal/") },
      { find: "@trampoline", replacement: r("./src/utils/trampoline.ts") },
      { find: "@monoids", replacement: r("./src/utils/monoids.ts") },
    ],
  },
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/fingerTree/**", "src/fingerPriorityQueue/**"],
      exclude: ["**/*.{test,bench}.ts"],
      thresholds: {
        // Per-file gates so neither module can silently regress.
        perFile: true,
        lines: 90,
        branches: 75,
        functions: 85,
        statements: 90,
      },
    },
  },
});
