import { defineConfig, globalIgnores } from "eslint/config";
import nextPlugin from "@next/eslint-plugin-next";
import globals from "globals";
import tseslint from "typescript-eslint";

const sourceFiles = ["**/*.{js,mjs,cjs,jsx,ts,tsx,mts,cts}"];

export default defineConfig([
  globalIgnores([
    ".next/**",
    "coverage/**",
    "next-env.d.ts",
    "tsconfig.tsbuildinfo",
  ]),
  ...tseslint.configs.recommended,
  {
    files: sourceFiles,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  {
    files: sourceFiles,
    plugins: {
      "@next/next": nextPlugin,
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
    },
    settings: {
      next: {
        rootDir: ".",
      },
    },
  },
]);
