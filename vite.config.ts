/// <reference types="vitest" />

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { configDefaults } from "vitest/config";

export default defineConfig({
  plugins: [react(), tsconfigPaths(), svgr(), nodePolyfills()],
  assetsInclude: "**/*.md",
  test: {
    environment: "jsdom",
    setupFiles: ["vitest-setup.ts"],
    exclude: [
      ...configDefaults.exclude,
      "**/tests",
    ],
  },
});
