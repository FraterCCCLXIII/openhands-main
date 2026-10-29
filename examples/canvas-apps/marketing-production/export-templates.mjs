// Writes the agent campaign templates in extension.js to templates/ as .md and .json files.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { TEMPLATES } from "./extension.js";

const out = join(dirname(fileURLToPath(import.meta.url)), "templates");
mkdirSync(out, { recursive: true });
for (const t of TEMPLATES) {
  writeFileSync(join(out, `${t.id}.md`), t.md);
  writeFileSync(join(out, `${t.id}.json`), `${JSON.stringify(t.json, null, 2)}\n`);
}
console.log(`Wrote ${TEMPLATES.length * 2} files to ${out}`);
