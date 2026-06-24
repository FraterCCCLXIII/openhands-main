#!/usr/bin/env node
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const SOURCE_ROOTS = ["app", "src"];
const SOURCE_EXTENSIONS = [".ts", ".tsx"];
const RESOLUTION_SUFFIXES = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

const SERVER_ONLY_PREFIXES = [
  "src/lib/auth.ts",
  "src/lib/security-headers.ts",
];

const normalize = (value) => value.split(path.sep).join("/");

const collectSourceFiles = (directory, files = []) => {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === ".next") {
      continue;
    }

    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectSourceFiles(fullPath, files);
      continue;
    }

    if (SOURCE_EXTENSIONS.includes(path.extname(entry.name))) {
      files.push(normalize(fullPath));
    }
  }

  return files;
};

const stripLeadingComments = (source) =>
  source
    .replace(/^\uFEFF/, "")
    .replace(/^(?:\s|\/\/[^\n]*\n|\/\*[\s\S]*?\*\/)*?/, "");

const isClientEntry = (source) => {
  const trimmed = stripLeadingComments(source);
  return trimmed.startsWith('"use client"') || trimmed.startsWith("'use client'");
};

const isServerOnly = (filePath) =>
  SERVER_ONLY_PREFIXES.some((prefix) => filePath === prefix || filePath.startsWith(prefix));

const files = SOURCE_ROOTS.flatMap((root) => collectSourceFiles(root));
const sourceFileSet = new Set(files);

const resolveLocalImport = (fromFile, specifier) => {
  let candidate;
  if (specifier.startsWith("@/")) {
    candidate = specifier.slice(2);
  } else if (specifier.startsWith(".")) {
    candidate = normalize(path.join(path.dirname(fromFile), specifier));
  } else {
    return null;
  }

  for (const suffix of RESOLUTION_SUFFIXES) {
    const resolved = normalize(candidate + suffix);
    if (sourceFileSet.has(resolved)) {
      return resolved;
    }
  }

  return null;
};

const importPattern = /(?:^|\n)\s*(?:import\s+(type\s+)?(?:[\s\S]*?\s+from\s+)?|export\s+(type\s+)?[\s\S]*?\s+from\s+)["']([^"']+)["']/g;
const graph = new Map();
const sourceByFile = new Map();

for (const file of files) {
  const source = readFileSync(file, "utf8");
  sourceByFile.set(file, source);
  const imports = [];
  let match;

  while ((match = importPattern.exec(source))) {
    const isTypeOnly = Boolean(match[1] || match[2]);
    if (isTypeOnly) {
      continue;
    }

    const resolved = resolveLocalImport(file, match[3]);
    if (resolved) {
      imports.push(resolved);
    }
  }

  graph.set(file, imports);
}

const clientEntries = files.filter((file) => isClientEntry(sourceByFile.get(file) ?? ""));
const violations = [];

for (const entry of clientEntries) {
  const queue = [{ file: entry, chain: [entry] }];
  const seen = new Set();

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || seen.has(current.file)) {
      continue;
    }
    seen.add(current.file);

    if (current.file !== entry && isServerOnly(current.file)) {
      violations.push(current.chain);
      continue;
    }

    for (const next of graph.get(current.file) ?? []) {
      queue.push({ file: next, chain: [...current.chain, next] });
    }
  }
}

if (violations.length > 0) {
  console.error("Client components must not import server-only modules, even transitively.");
  console.error("");
  for (const chain of violations) {
    console.error(`- ${chain.join(" -> ")}`);
  }
  process.exit(1);
}

console.log(`Client boundary check passed for ${clientEntries.length} client entrypoints.`);
