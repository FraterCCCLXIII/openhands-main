/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  mutate: [
    "src/lib/core/access-policy.ts",
    "src/lib/core/scoped-api-keys.ts",
  ],
  testFiles: [
    "src/lib/core/access-policy.test.ts",
    "src/lib/core/scoped-api-keys.test.ts",
  ],
  testRunner: "vitest",
  checkers: ["typescript"],
  reporters: ["clear-text", "html"],
  coverageAnalysis: "perTest",
  thresholds: {
    high: 100,
    low: 100,
    break: 100,
  },
  cleanTempDir: "always",
  tempDirName: ".stryker-tmp/mutation-pilot",
  vitest: {
    configFile: "vitest.config.ts",
    related: true,
  },
};

export default config;
