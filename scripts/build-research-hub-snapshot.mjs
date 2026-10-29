#!/usr/bin/env node
// Builds the research-hub Canvas Extension bundle from scraped sources.
//   node scripts/build-research-hub-snapshot.mjs <findingsDir> <indexResultsRepoDir>
// <findingsDir>: one JSON per article ({slug,url,title,date,category,summary,findings,tags})
// <indexResultsRepoDir>: a checkout of github.com/OpenHands/openhands-index-results
// Writes src/fixtures/canvas-extensions/research-hub/extension.js (template + inlined data).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const [findingsDir, indexDir] = process.argv.slice(2);
if (!findingsDir || !indexDir) {
  console.error("usage: build-research-hub-snapshot.mjs <findingsDir> <indexResultsRepoDir>");
  process.exit(1);
}

const extDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/fixtures/canvas-extensions/research-hub",
);

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

const articles = fs
  .readdirSync(findingsDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => readJson(path.join(findingsDir, f)))
  .sort((a, b) => (b.date || "").localeCompare(a.date || ""));

// Index results: results/<model>/{metadata,scores}.json plus alternative agents
// at alternative_agents/<agent>/<model>/.
function loadEntries(root, kind) {
  const base = path.join(indexDir, root);
  if (!fs.existsSync(base)) return [];
  const out = [];
  const visit = (dir, agent) => {
    const meta = path.join(dir, "metadata.json");
    const scores = path.join(dir, "scores.json");
    if (fs.existsSync(meta) && fs.existsSync(scores)) {
      const m = readJson(meta);
      out.push({
        kind,
        agent: agent ?? m.agent_name ?? "OpenHands",
        agent_version: m.agent_version ?? null,
        model: m.model ?? path.basename(dir),
        openness: m.openness ?? null,
        country: m.country ?? null,
        release_date: m.release_date ?? null,
        parameter_count_b: m.parameter_count_b ?? null,
        active_parameter_count_b: m.active_parameter_count_b ?? null,
        input_price: m.input_price ?? null,
        output_price: m.output_price ?? null,
        scores: readJson(scores).map((s) => ({
          benchmark: s.benchmark,
          score: s.score,
          metric: s.metric ?? null,
          cost_per_instance: s.cost_per_instance ?? null,
          average_runtime: s.average_runtime ?? null,
        })),
      });
      return;
    }
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (e.isDirectory() && e.name !== "instance_results") {
        visit(path.join(dir, e.name), agent ?? (root === "alternative_agents" ? e.name : null));
      }
    }
  };
  visit(base, null);
  return out;
}

const entries = [...loadEntries("results", "model"), ...loadEntries("alternative_agents", "agent")];
const benchmarks = [...new Set(entries.flatMap((e) => e.scores.map((s) => s.benchmark)))].sort();

const data = {
  generated_at: new Date().toISOString(),
  sources: {
    articles: "https://openhands.dev/blog",
    index: "https://index.openhands.dev/home",
    index_results: "https://github.com/OpenHands/openhands-index-results",
  },
  articles,
  index: { benchmarks, entries },
};

const template = fs.readFileSync(path.join(extDir, "extension.template.js"), "utf8");
fs.writeFileSync(
  path.join(extDir, "extension.js"),
  template.replace("/*__DATA__*/null", JSON.stringify(data)),
);
console.log(
  `wrote extension.js: ${articles.length} articles, ${articles.reduce((n, a) => n + a.findings.length, 0)} findings, ${entries.length} index entries`,
);
