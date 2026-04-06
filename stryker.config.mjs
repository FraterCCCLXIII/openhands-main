/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
const config = {
  testRunner: "vitest",
  checkers: ["typescript"],
  reporters: ["clear-text", "html"],
  coverageAnalysis: "perTest",
  cleanTempDir: "always",
  tempDirName: ".stryker-tmp/mutation",
  vitest: {
    configFile: "vitest.config.ts",
    related: true,
  },
};

export default config;
