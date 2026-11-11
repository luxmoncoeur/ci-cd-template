import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts"],
      // `json-summary` writes coverage/coverage-summary.json, which the reusable CI workflow
      // turns into a table in the job summary. `text` prints the same numbers in the log.
      reporter: ["text", "json-summary"],
      thresholds: { lines: 90, functions: 90, branches: 90, statements: 90 },
    },
  },
});
