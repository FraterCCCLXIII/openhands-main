// Bundles src/extension.js (+ OrbitDB, libp2p, helia, QR encoder) into ONE self-contained ESM file.
import { build } from "esbuild";
import { writeFileSync, statSync, readFileSync } from "node:fs";

const result = await build({
  entryPoints: ["src/extension.js"],
  outfile: "extension.js",
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  minify: true,
  legalComments: "none",
  splitting: false,
  metafile: true,
  inject: ["src/shim.js"],
  alias: { events: "events", path: "path-browserify", "node:path": "path-browserify" },
  define: { "process.env.NODE_ENV": '"production"', global: "globalThis" },
  banner: { js: "/* Murmur (Canvas Extension). Bundled from src/ with esbuild. Includes OrbitDB (MIT, (c) Protocol Labs / Haja Networks) via FraterCCCLXIII/holons-p2p, libp2p, helia, qrcode-generator (MIT); see NOTICE.md. */" },
  logLevel: "warning",
});
writeFileSync("build-meta.json", JSON.stringify(result.metafile, null, 1));
const out = readFileSync("extension.js", "utf8");
const externals = Object.values(result.metafile.outputs).flatMap((o) => o.imports).filter((i) => i.external || i.kind !== "dynamic-import");
console.log(`extension.js ${(statSync("extension.js").size / 1e6).toFixed(2)} MB; remaining import records: ${externals.length}`);
console.log("bare/static import statements in output:", (out.match(/^\s*import[\s{*"']/gm) || []).length);
