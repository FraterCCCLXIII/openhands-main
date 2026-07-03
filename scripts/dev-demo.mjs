#!/usr/bin/env node
/**
 * Start the full Integrations Hub demo stack for local styling and QA:
 * - FastAPI backend on DEMO_API_PORT (default 3001)
 * - Next.js frontend on PORT (default 3000) with API rewrites to the backend
 *
 * Requires POSTGRES_URL in .env.local and `npm run db:migrate` beforehand.
 */
import { readFileSync, existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envLocalPath = path.join(root, ".env.local");

const loadEnvLocal = () => {
  if (!existsSync(envLocalPath)) {
    return;
  }

  const content = readFileSync(envLocalPath, "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    let value = trimmed.slice(separatorIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
};

loadEnvLocal();

const apiPort = process.env.DEMO_API_PORT ?? "3001";
const uiPort = process.env.PORT ?? "3000";
const apiOrigin = `http://127.0.0.1:${apiPort}`;

process.env.DISABLE_AUTH = process.env.DISABLE_AUTH ?? "true";
process.env.INTHUB_DISABLE_AUTH = process.env.INTHUB_DISABLE_AUTH ?? process.env.DISABLE_AUTH;
process.env.APP_ADMIN_EMAILS = process.env.APP_ADMIN_EMAILS ?? "dev@localhost";
process.env.INTEGRATIONS_HUB_API_ORIGIN = apiOrigin;
process.env.PORT = uiPort;

const children = [];

const shutdown = (signal) => {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
};

process.on("SIGINT", () => {
  shutdown("SIGINT");
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown("SIGTERM");
  process.exit(0);
});

const spawnLogged = (label, command, args, options = {}) => {
  const child = spawn(command, args, {
    cwd: root,
    env: { ...process.env, ...options.env },
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      console.error(`[${label}] exited due to signal ${signal}`);
    } else if (code && code !== 0) {
      console.error(`[${label}] exited with code ${code}`);
    }

    shutdown("SIGTERM");
    process.exit(code ?? 1);
  });

  children.push(child);
  return child;
};

console.log("");
console.log("Integrations Hub demo stack");
console.log(`  UI:      http://localhost:${uiPort}`);
console.log(`  API:     ${apiOrigin} (proxied via Next.js /api/* rewrites)`);
console.log(`  Owner:   dev@localhost (DISABLE_AUTH)`);
console.log("");
console.log("Seed demo data in another terminal:");
console.log("  npm run demo:seed");
console.log("");

spawnLogged(
  "api",
  "uv",
  [
    "run",
    "--directory",
    "backend",
    "uvicorn",
    "backend.app.main:app",
    "--reload",
    "--host",
    "127.0.0.1",
    "--port",
    apiPort,
    "--app-dir",
    root,
  ],
  {
    env: {
      INTHUB_DISABLE_AUTH: process.env.INTHUB_DISABLE_AUTH,
      APP_ADMIN_EMAILS: process.env.APP_ADMIN_EMAILS,
    },
  },
);

setTimeout(() => {
  spawnLogged(
    "ui",
    "npm",
    ["run", "dev", "--", "--port", uiPort],
    {
      env: {
        INTEGRATIONS_HUB_API_ORIGIN: apiOrigin,
        PORT: uiPort,
      },
    },
  );
}, 1500);
