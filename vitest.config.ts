import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "app/**/*.test.ts",
      "app/**/*.test.tsx",
    ],
    coverage: {
      provider: "v8",
      reportOnFailure: true,
      reportsDirectory: "./coverage",
      reporter: ["text-summary", "json-summary", "json", "lcov", "html"],
      include: [
        "app/**/*.{ts,tsx}",
        "src/components/**/*.{ts,tsx}",
        "src/lib/**/*.{ts,tsx}",
      ],
      exclude: [
        "**/*.d.ts",
        "**/*.test.{ts,tsx}",
      ],
    },
  },
});
