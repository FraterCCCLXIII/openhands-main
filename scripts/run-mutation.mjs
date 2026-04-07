import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, extname, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const HELP_TEXT = `Usage:
  npm run test:mutation -- <source-file> [more-source-files...]
  npm run test:mutation -- --mutate <glob-or-file> [--testFile <test-file>]
  npm run test:mutation -- --all [--soft-fail]
  npm run test:mutation:dry -- <source-file>

Examples:
  npm run test:mutation -- src/lib/core/service.ts
  npm run test:mutation -- src/lib/core/service.ts src/lib/api.ts
  npm run test:mutation -- --mutate src/lib/core/service.ts --testFile src/lib/core/service.test.ts
  npm run test:mutation -- --all --soft-fail
`;

const baseConfigPath = resolve('stryker.config.mjs');
const allMutationPatterns = [
  'src/**/*.ts',
  'src/**/*.tsx',
  'app/**/*.ts',
  'app/**/*.tsx',
  '!src/**/*.test.ts',
  '!src/**/*.test.tsx',
  '!app/**/*.test.ts',
  '!app/**/*.test.tsx',
  '!src/**/*.d.ts',
  '!app/**/*.d.ts',
  '!next-env.d.ts',
];

const args = process.argv.slice(2);
const positionalSources = [];
const explicitMutate = [];
const explicitTestFiles = [];
let runAll = false;
let dryRun = false;
let softFail = false;
let showHelp = false;

for (let index = 0; index < args.length; index += 1) {
  const arg = args[index];
  switch (arg) {
    case '--all':
      runAll = true;
      break;
    case '--dry-run':
    case '--dryRunOnly':
      dryRun = true;
      break;
    case '--soft-fail':
      softFail = true;
      break;
    case '--mutate':
      if (!args[index + 1]) {
        throw new Error('--mutate requires a value');
      }
      explicitMutate.push(args[index + 1]);
      index += 1;
      break;
    case '--testFile':
    case '--testFiles':
      if (!args[index + 1]) {
        throw new Error(`${arg} requires a value`);
      }
      explicitTestFiles.push(args[index + 1]);
      index += 1;
      break;
    case '--help':
    case '-h':
      showHelp = true;
      break;
    default:
      if (arg.startsWith('--')) {
        throw new Error(`Unknown argument: ${arg}`);
      }
      positionalSources.push(arg);
      break;
  }
}

if (showHelp) {
  console.log(HELP_TEXT);
  process.exit(0);
}

if (runAll && (explicitMutate.length > 0 || positionalSources.length > 0 || explicitTestFiles.length > 0)) {
  throw new Error('--all cannot be combined with file-specific arguments');
}

const inferTestFile = (sourceFile) => {
  const absoluteSource = resolve(sourceFile);
  const extension = extname(absoluteSource);
  const stem = absoluteSource.slice(0, -extension.length);
  const candidates = extension === '.tsx'
    ? [`${stem}.test.tsx`, `${stem}.test.ts`]
    : [`${stem}.test.ts`, `${stem}.test.tsx`];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    `Could not infer a Vitest file for ${sourceFile}. Looked for ${candidates
      .map((candidate) => `${dirname(candidate)}/${basename(candidate)}`)
      .join(' and ')}. Pass --testFile explicitly if the tests live elsewhere.`,
  );
};

const mutate = runAll
  ? allMutationPatterns
  : [...new Set([...explicitMutate, ...positionalSources])];

if (!runAll && mutate.length === 0) {
  throw new Error('Provide at least one source file/glob to mutate, or pass --all.');
}

const testFiles = runAll
  ? undefined
  : [...new Set(explicitTestFiles.length > 0 ? explicitTestFiles : mutate.map((sourceFile) => inferTestFile(sourceFile)))];

const configOverrides = {
  mutate,
  ...(testFiles ? { testFiles } : {}),
  thresholds: softFail
    ? {
        high: 100,
        low: 100,
        break: null,
      }
    : {
        high: 100,
        low: 100,
        break: 100,
      },
};

const tempDir = mkdtempSync(resolve(tmpdir(), 'context-layer-stryker-'));
const tempConfigPath = resolve(tempDir, 'stryker.generated.mjs');
writeFileSync(
  tempConfigPath,
  `import baseConfig from ${JSON.stringify(baseConfigPath)};\nexport default { ...baseConfig, ...${JSON.stringify(configOverrides, null, 2)} };\n`,
  'utf8',
);

const commandArgs = ['stryker', 'run', tempConfigPath];
if (dryRun) {
  commandArgs.push('--dryRunOnly');
}

const result = spawnSync('npx', commandArgs, { stdio: 'inherit' });
rmSync(tempDir, { recursive: true, force: true });

if (typeof result.status === 'number') {
  process.exit(result.status);
}

if (result.error) {
  throw result.error;
}

process.exit(1);
