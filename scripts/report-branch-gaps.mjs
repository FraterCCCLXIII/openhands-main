import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

export const DEFAULT_COVERAGE_SUMMARY_PATH = "coverage/coverage-summary.json";

const AREA_LABELS = {
  frontend: "Frontend total",
  "frontend-app": "Frontend app/",
  "frontend-components": "Frontend src/components/",
  backend: "Backend total",
  "backend-api": "Backend app/api/",
  "backend-lib": "Backend src/lib/",
};

const AREA_ORDER = [
  "frontend",
  "frontend-app",
  "frontend-components",
  "backend",
  "backend-api",
  "backend-lib",
];

function createAreaSummary(name) {
  return {
    name,
    coveredBranches: 0,
    totalBranches: 0,
    uncoveredBranches: 0,
    filesWithUncoveredBranches: 0,
  };
}

function toPosix(filePath) {
  return filePath.split(path.sep).join("/");
}

function getBranchStats(stats) {
  const totalBranches = stats?.branches?.total ?? 0;
  const coveredBranches = stats?.branches?.covered ?? 0;
  const uncoveredBranches = Math.max(totalBranches - coveredBranches, 0);
  const branchPct = totalBranches === 0 ? 100 : Number(((coveredBranches / totalBranches) * 100).toFixed(2));

  return {
    totalBranches,
    coveredBranches,
    uncoveredBranches,
    branchPct,
  };
}

export function normalizeCoveragePath(filePath, rootDir = process.cwd()) {
  return toPosix(path.relative(rootDir, path.resolve(filePath)));
}

export function classifyCoverageArea(relativePath) {
  if (relativePath.startsWith("app/api/")) {
    return "backend-api";
  }

  if (relativePath.startsWith("src/lib/")) {
    return "backend-lib";
  }

  if (relativePath.startsWith("src/components/")) {
    return "frontend-components";
  }

  if (relativePath.startsWith("app/")) {
    return "frontend-app";
  }

  return null;
}

export function isRelevantCoverageFile(relativePath) {
  return (
    classifyCoverageArea(relativePath) !== null &&
    !relativePath.endsWith(".d.ts") &&
    !/\.test\.[cm]?[jt]sx?$/.test(relativePath) &&
    relativePath !== "src/lib/db/pglite-test-utils.ts"
  );
}

export function summarizeBranchCoverage(coverageSummary, rootDir = process.cwd()) {
  const groups = new Map(AREA_ORDER.map((name) => [name, createAreaSummary(name)]));
  const files = [];

  for (const [filePath, stats] of Object.entries(coverageSummary)) {
    if (filePath === "total") {
      continue;
    }

    const relativePath = normalizeCoveragePath(filePath, rootDir);
    if (!isRelevantCoverageFile(relativePath)) {
      continue;
    }

    const area = classifyCoverageArea(relativePath);
    if (!area) {
      continue;
    }

    const branchStats = getBranchStats(stats);
    const parentArea = area.startsWith("frontend") ? "frontend" : "backend";

    files.push({
      area,
      relativePath,
      ...branchStats,
    });

    for (const groupName of [area, parentArea]) {
      const group = groups.get(groupName);
      if (!group) {
        continue;
      }

      group.coveredBranches += branchStats.coveredBranches;
      group.totalBranches += branchStats.totalBranches;
      group.uncoveredBranches += branchStats.uncoveredBranches;
      if (branchStats.uncoveredBranches > 0) {
        group.filesWithUncoveredBranches += 1;
      }
    }
  }

  const groupSummaries = AREA_ORDER.map((name) => {
    const group = groups.get(name) ?? createAreaSummary(name);
    return {
      ...group,
      branchPct:
        group.totalBranches === 0
          ? 100
          : Number(((group.coveredBranches / group.totalBranches) * 100).toFixed(2)),
    };
  });

  const rankedFiles = [...files].sort((left, right) => {
    if (right.uncoveredBranches !== left.uncoveredBranches) {
      return right.uncoveredBranches - left.uncoveredBranches;
    }

    if (left.branchPct !== right.branchPct) {
      return left.branchPct - right.branchPct;
    }

    return left.relativePath.localeCompare(right.relativePath);
  });

  return {
    groups: groupSummaries,
    files: rankedFiles,
  };
}

function formatPercent(value) {
  return `${value.toFixed(2)}%`;
}

function formatCoverageRatio(coveredBranches, totalBranches) {
  return `${coveredBranches}/${totalBranches}`;
}

function renderTextSummary(summary, topFiles) {
  const sections = ["Branch coverage by area"];

  for (const group of summary.groups) {
    sections.push(
      `- ${AREA_LABELS[group.name]}: ${formatPercent(group.branchPct)} (${formatCoverageRatio(
        group.coveredBranches,
        group.totalBranches,
      )}, ${group.uncoveredBranches} uncovered, ${group.filesWithUncoveredBranches} files with gaps)`,
    );
  }

  sections.push("", `Highest-priority uncovered branch files (top ${topFiles})`);

  const rankedFiles = summary.files.filter((file) => file.uncoveredBranches > 0).slice(0, topFiles);
  if (rankedFiles.length === 0) {
    sections.push("- No uncovered branches found in the configured frontend/backend source set.");
    return sections.join("\n");
  }

  rankedFiles.forEach((file, index) => {
    sections.push(
      `${index + 1}. [${AREA_LABELS[file.area]}] ${file.relativePath} — ${file.uncoveredBranches} uncovered branches (${formatPercent(
        file.branchPct,
      )}, ${formatCoverageRatio(file.coveredBranches, file.totalBranches)})`,
    );
  });

  return sections.join("\n");
}

function renderMarkdownSummary(summary, topFiles) {
  const lines = [
    "### Branch coverage by area",
    "",
    "| Area | Branch coverage | Covered / Total | Uncovered | Files with gaps |",
    "| --- | ---: | ---: | ---: | ---: |",
  ];

  for (const group of summary.groups) {
    lines.push(
      `| ${AREA_LABELS[group.name]} | ${formatPercent(group.branchPct)} | ${formatCoverageRatio(
        group.coveredBranches,
        group.totalBranches,
      )} | ${group.uncoveredBranches} | ${group.filesWithUncoveredBranches} |`,
    );
  }

  lines.push("", `### Highest-priority uncovered branch files (top ${topFiles})`, "");

  const rankedFiles = summary.files.filter((file) => file.uncoveredBranches > 0).slice(0, topFiles);
  if (rankedFiles.length === 0) {
    lines.push("No uncovered branches found in the configured frontend/backend source set.");
    return lines.join("\n");
  }

  lines.push(
    "| Area | File | Branch coverage | Uncovered | Covered / Total |",
    "| --- | --- | ---: | ---: | ---: |",
  );

  for (const file of rankedFiles) {
    lines.push(
      `| ${AREA_LABELS[file.area]} | \`${file.relativePath}\` | ${formatPercent(file.branchPct)} | ${file.uncoveredBranches} | ${formatCoverageRatio(
        file.coveredBranches,
        file.totalBranches,
      )} |`,
    );
  }

  return lines.join("\n");
}

export function renderBranchCoverageSummary(summary, options = {}) {
  const { format = "text", topFiles = 10 } = options;

  if (format === "markdown") {
    return renderMarkdownSummary(summary, topFiles);
  }

  return renderTextSummary(summary, topFiles);
}

export function loadCoverageSummary(coverageSummaryPath = DEFAULT_COVERAGE_SUMMARY_PATH) {
  return JSON.parse(fs.readFileSync(coverageSummaryPath, "utf8"));
}

function parseCliArgs(argv) {
  let coverageSummaryPath = DEFAULT_COVERAGE_SUMMARY_PATH;
  let format = "text";
  let topFiles = 10;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--format") {
      format = argv[index + 1] ?? format;
      index += 1;
      continue;
    }

    if (arg.startsWith("--format=")) {
      format = arg.slice("--format=".length) || format;
      continue;
    }

    if (arg === "--top-files") {
      const parsed = Number.parseInt(argv[index + 1] ?? `${topFiles}`, 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        topFiles = parsed;
      }
      index += 1;
      continue;
    }

    if (arg.startsWith("--top-files=")) {
      const parsed = Number.parseInt(arg.slice("--top-files=".length), 10);
      if (Number.isFinite(parsed) && parsed > 0) {
        topFiles = parsed;
      }
      continue;
    }

    if (!arg.startsWith("--")) {
      coverageSummaryPath = arg;
    }
  }

  return { coverageSummaryPath, format, topFiles };
}

function runCli() {
  const { coverageSummaryPath, format, topFiles } = parseCliArgs(process.argv.slice(2));

  if (!fs.existsSync(coverageSummaryPath)) {
    console.error(`Coverage summary not found at ${coverageSummaryPath}. Run \`npm run test:coverage\` first.`);
    process.exitCode = 1;
    return;
  }

  const coverageSummary = loadCoverageSummary(coverageSummaryPath);
  const summary = summarizeBranchCoverage(coverageSummary);
  console.log(renderBranchCoverageSummary(summary, { format, topFiles }));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runCli();
}
