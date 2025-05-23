/// <reference types="vitest" />

import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [!process.env.VITEST && reactRouter(), tsconfigPaths(), svgr()],
  assetsInclude: '**/*.md',
  server: {
    host: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['vitest-setup.ts'],
    exclude: [...configDefaults.exclude, '**/tests'],
  },
});
