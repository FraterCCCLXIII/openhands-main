/// <reference types="vite-plugin-svgr/client" />
/// <reference types="vitest" />

import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";

export default defineConfig({
  plugins: [
    // https://remix.run/docs/en/main/guides/vite#plugin-usage-with-other-vite-based-tools-eg-vitest-storybook
    !process.env.VITEST && remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
    svgr(),
  ],
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest-setup.ts"],
  },
});
