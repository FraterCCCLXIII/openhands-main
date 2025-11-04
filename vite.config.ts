/// <reference types="vitest" />

import { defineConfig } from 'vite';
import { reactRouter } from '@react-router/dev/vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';
import { configDefaults } from 'vitest/config';

export default defineConfig({
  plugins: [!process.env.VITEST && reactRouter(), tsconfigPaths(), svgr()],
  assetsInclude: '**/*.md',
  ssr: {
    noExternal: ['posthog-js', 'posthog-js/react'],
  },
  server: {
    host: '0.0.0.0',
    port: 12000,
    cors: true,
    allowedHosts: [
      'work-1-jobyjlkutwzfesrq.prod-runtime.all-hands.dev',
      'work-2-jobyjlkutwzfesrq.prod-runtime.all-hands.dev',
      'work-1-szkhgiiemnsxkrfu.prod-runtime.all-hands.dev',
      'work-2-szkhgiiemnsxkrfu.prod-runtime.all-hands.dev',
      'work-1-bzqtzhnhqqmonbry.prod-runtime.all-hands.dev',
      'work-2-bzqtzhnhqqmonbry.prod-runtime.all-hands.dev',
      'work-1-vtalhqzgjwolpxja.prod-runtime.all-hands.dev',
      'work-2-vtalhqzgjwolpxja.prod-runtime.all-hands.dev',
      'work-1-wwbvnpzpoleiwmqz.prod-runtime.all-hands.dev',
      'work-2-wwbvnpzpoleiwmqz.prod-runtime.all-hands.dev',
      'work-1-mdyrwpwijsfliofl.prod-runtime.all-hands.dev',
      'work-2-mdyrwpwijsfliofl.prod-runtime.all-hands.dev',
      'work-1-egmxtsefwqvojzhw.prod-runtime.all-hands.dev',
      'work-2-egmxtsefwqvojzhw.prod-runtime.all-hands.dev',
    ],
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['vitest-setup.ts'],
    exclude: [...configDefaults.exclude, '**/tests'],
  },
});
