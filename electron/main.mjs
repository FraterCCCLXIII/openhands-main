/**
 * Electron Main Process — Agent Canvas Desktop
 *
 * Starts the full Agent Canvas stack (agent-server + automation via uvx,
 * static frontend, ingress proxy), then opens a native BrowserWindow once
 * the ingress is ready. Shows a loading screen while backends start.
 *
 * Path layout (electron-builder uses directories.app: 'electron'):
 *
 *   Packaged (macOS example):
 *     Contents/Resources/app/     ← __dirname (main.mjs lives here)
 *       main.mjs
 *       boot-overlay.mjs
 *       scripts/                  ← copied from repo scripts/
 *       config/                   ← copied from repo config/
 *       build/                    ← static frontend
 *     Contents/Resources/bin-<arch>/  ← process.resourcesPath/bin-<arch>
 *       uv  uvx                        ← bundled via extraResources
 *     Contents/Resources/bin/          ← legacy flat dir (single-arch builds)
 *
 *   Bundled runtimes (uv `bin`, Node `node`) prefer the arch-tagged dir
 *   matching process.arch — under a universal binary that's the executing
 *   slice (arm64 on Apple Silicon, x64 on Intel/Rosetta) — and fall back
 *   to the legacy flat dir (see lib/bundled-runtime-dir.mjs).
 *
 *   Dev (npm run desktop  →  electron electron):
 *     electron/main.mjs           ← __dirname = <repo>/electron/
 *     scripts/ config/ build/     ← one level up: <repo>/
 *     system uvx from PATH
 *
 * When packaged, scripts/config/build are siblings of main.mjs so
 * projectRoot === __dirname. In dev they are one level up.
 *
 * The dev command points electron at the electron/ DIRECTORY, not at
 * main.mjs directly. Electron's default_app only reads name/productName/
 * version out of <arg>/package.json, so passing the file makes it look for
 * electron/main.mjs/package.json, miss, and leave app.name at the host
 * bundle's default — "Electron" in the menu bar and userData path.
 */

import {
  app,
  BrowserWindow,
  clipboard,
  dialog,
  ipcMain,
  nativeImage,
  nativeTheme,
  safeStorage,
  shell,
} from "electron";
import { chmodSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawnSync } from "node:child_process";

import { installBootOverlay } from "./boot-overlay.mjs";
import { isExternalBrowsableUrl, isLoopbackAppUrl } from "./lib/window-url-policy.mjs";
import { resolveBundledRuntimeDir } from "./lib/bundled-runtime-dir.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ── Path resolution ───────────────────────────────────────────────────────────
// Packaged (directories.app: 'electron'): scripts/config/build are SIBLINGS of
// main.mjs inside Resources/app/, so projectRoot === __dirname.
// Dev (electron electron): those directories are one level UP in the
// repo root, so projectRoot === join(__dirname, '..').
// Both branches key off __dirname (always <repo>/electron in dev), not
// app.getAppPath(), so the entry-point form doesn't affect them.

const projectRoot = app.isPackaged ? __dirname : join(__dirname, "..");
const buildDir = join(projectRoot, "build");
const scriptsDir = join(projectRoot, "scripts");

// OpenHands raised-hands app icon, used as the BrowserWindow.icon option.
// Windows gets the multi-size icon.ico (16→256, small sizes as classic BMP
// entries — the Windows shell needs those); Linux uses the 1024×1024 PNG
// for its taskbar. On macOS the dock icon comes from the .app bundle's
// icon.icns, so this path is unused there. Both files live next to main.mjs
// in dev and are copied into Resources/app/build-resources/ via the
// `files:` array. Regenerate with `npm run generate-icons`.
const appIconPath = join(
  __dirname,
  "build-resources",
  process.platform === "win32" ? "icon.ico" : "icon.png",
);

// electron-builder's NSIS shortcuts are stamped with AppUserModelId
// ${APP_ID} (WinShell::SetLnkAUMI in installer.nsh). Declare the same id so
// running/pinned taskbar entries group with the shortcut and inherit its
// icon. Must match appId in electron-builder.config.mjs, and must be set
// before any BrowserWindow is created.
if (process.platform === "win32") {
  app.setAppUserModelId("dev.openhands.agent-canvas");
}

// ── Bundled uv ────────────────────────────────────────────────────────────────

/**
 * Inject the bundled uv binary into PATH so that uvx calls inside
 * dev-with-automation.mjs resolve to our bundled binary.
 * No-op in dev mode (falls back to system uv).
 */
function injectBundledUv() {
  if (!app.isPackaged) return;

  const isWin = process.platform === "win32";
  const uvName = isWin ? "uv.exe" : "uv";
  const uvxName = isWin ? "uvx.exe" : "uvx";
  const binDir = resolveBundledRuntimeDir(process.resourcesPath, "bin");
  if (!binDir) {
    console.warn(
      "[desktop] Bundled uv not found — looked in",
      join(process.resourcesPath, `bin-${process.arch}`),
      "and",
      join(process.resourcesPath, "bin"),
    );
    return;
  }
  const uvPath = join(binDir, uvName);

  // We only probe for `uv` here — `uv` and `uvx` ship together in the
  // bundle (`download-uv.mjs` writes both), so if `uv` is present we
  // assume `uvx` is too. `uvxAvailable()` is called separately by
  // start-up code to confirm the resolved binary actually runs.
  if (!existsSync(uvPath)) {
    console.warn("[desktop] Bundled uv not found at", uvPath);
    return;
  }

  // electron-builder copies files without preserving the +x bit on Unix.
  if (!isWin) {
    try {
      chmodSync(uvPath, 0o755);
      const uvxPath = join(binDir, uvxName);
      if (existsSync(uvxPath)) chmodSync(uvxPath, 0o755);
    } catch {}
  }

  const sep = isWin ? ";" : ":";
  process.env.PATH = `${binDir}${sep}${process.env.PATH ?? ""}`;
  console.log("[desktop] Injected bundled uv from", binDir);
}

/**
 * Verify uvx is reachable (either bundled or system).
 * Returns true/false — callers show a dialog on false.
 */
function uvxAvailable() {
  const cmd = process.platform === "win32" ? "uvx.exe" : "uvx";
  const r = spawnSync(cmd, ["--version"], { stdio: "pipe" });
  return r.status === 0;
}

/**
 * Inject the bundled Node.js distribution into PATH so subsequent spawns
 * can find `node`, `npm`, and `npx`.
 *
 * When the app runs as a packaged .app on macOS, the system PATH is minimal
 * (/usr/bin:/bin only) — Homebrew, nvm, asdf etc. installs of Node are
 * invisible. Two breakages flow from that:
 *
 *   1. The dev-with-automation.mjs stack spawns `node scripts/ingress.mjs`
 *      and `node scripts/static-server.mjs`; if `node` is not found those
 *      processes fail silently and port 8000 never responds.
 *   2. Most stdio MCP marketplace entries (Slack, GitHub, Figma, etc.)
 *      use `command: "npx"`. When the agent-server tries to spawn one the
 *      missing `npx` makes the spawn fail with ENOENT; the SDK reports it
 *      as an `error_kind: "connection"` MCP test failure, surfaced in the
 *      install modal as "Could not reach the server".
 *
 * We tried bridging via Electron-as-Node (ELECTRON_RUN_AS_NODE=1) wrappers
 * first. That fixed the ENOENT but introduced a new failure: stdio MCP
 * servers spawned through the wrapper exited with "McpError: Connection
 * closed" before the JSON-RPC handshake completed. Electron-as-Node is
 * fine for our networking helper scripts but its stdin/stdout semantics
 * differ enough from a vanilla `node` binary that stdio JSON-RPC servers
 * are not reliable under it. The robust fix is to ship a real Node.js
 * runtime as an extraResource (see scripts/download-node.mjs and the
 * `resources/node/` entry in electron-builder.config.mjs) and just put
 * its bin dir on PATH.
 *
 * No-op in dev mode (`npm run desktop`): the user's terminal PATH already
 * has Node tooling and `app.isPackaged` is false. If the bundled dir is
 * somehow missing (e.g. the download step was skipped during packaging),
 * we log a loud warning and leave PATH untouched so the failure mode is
 * obvious in the console rather than confusing downstream.
 */
function injectBundledNode() {
  if (!app.isPackaged) return;

  const isWin = process.platform === "win32";
  const nodeRoot = resolveBundledRuntimeDir(process.resourcesPath, "node");
  if (!nodeRoot) {
    console.warn(
      "[desktop] Bundled Node.js not found — looked in " +
        `${join(process.resourcesPath, `node-${process.arch}`)} and ` +
        `${join(process.resourcesPath, "node")} — backend scripts and stdio ` +
        "MCP servers will fail. Run `npm run download-node` and rebuild.",
    );
    return;
  }
  // POSIX Node distributions put binaries in bin/; Windows zips put node.exe
  // and the npm.cmd / npx.cmd wrappers at the distribution root.
  const binDir = isWin ? nodeRoot : join(nodeRoot, "bin");
  const nodeExe = isWin ? join(nodeRoot, "node.exe") : join(binDir, "node");

  if (!existsSync(nodeExe)) {
    console.warn(
      `[desktop] Bundled Node.js not found at ${nodeExe} — backend ` +
        "scripts and stdio MCP servers will fail. Run `npm run download-node` " +
        "and rebuild.",
    );
    return;
  }

  // node.exe alone is not enough. npm / npx are wrapper scripts that exec
  // npm's JS entry points out of the distribution's own node_modules, and
  // that directory is the one piece electron-builder drops on Windows (see
  // restoreBundledNodeNpm in electron-builder.config.mjs). Since we PREPEND
  // this dir to PATH, a half-copied bundle doesn't just fail to help — it
  // shadows the user's working npm with shims that die on MODULE_NOT_FOUND.
  // Warn loudly, but still inject: `node` itself works and the backend
  // launcher scripts need it.
  const npmCli = isWin
    ? join(nodeRoot, "node_modules", "npm", "bin", "npm-cli.js")
    : join(nodeRoot, "lib", "node_modules", "npm", "bin", "npm-cli.js");
  if (!existsSync(npmCli)) {
    console.warn(
      `[desktop] Bundled npm is incomplete — ${npmCli} is missing. ` +
        "`npx`-launched subprocesses (stdio MCP servers, ACP servers) will " +
        "fail with MODULE_NOT_FOUND, and this bundle shadows any npm already " +
        "on PATH. Rebuild with `npm run download-node`.",
    );
  }

  // electron-builder doesn't always preserve the +x bit on POSIX. node, npm,
  // and npx need to be executable for shell PATH lookup to consider them.
  if (!isWin) {
    const required = ["node", "npm", "npx"];
    for (const name of required) {
      const p = join(binDir, name);
      try {
        if (existsSync(p)) chmodSync(p, 0o755);
      } catch {
        // best-effort: a stale read-only mount or test fixture is fine to skip
      }
    }
  }

  const sep = isWin ? ";" : ":";
  process.env.PATH = `${binDir}${sep}${process.env.PATH ?? ""}`;
  console.log("[desktop] Injected bundled Node from", binDir);
}

// ── Readiness polling ─────────────────────────────────────────────────────────

/**
 * Wait until `url` responds at all (status < 500). Used to confirm the
 * ingress proxy is bound — not a guarantee that the agent-server behind it
 * is ready. Use {@link waitForAgentServer} for that.
 */
async function waitForUrl(url, timeoutMs = 120_000, intervalMs = 600) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      if (res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(
    `Timed out waiting for ${url} to become ready (${timeoutMs / 1000}s).`,
  );
}

/**
 * Wait until `url` returns HTTP 200 — meaning the agent-server itself is
 * serving requests, not just that the ingress proxy is up.
 *
 * On first launch, `uvx` has to download a Python toolchain and install
 * `openhands-agent-server` and its workspace deps from PyPI, which can
 * easily take a few minutes on a slow network. We poll the route end-to-end
 * (through ingress on port 8000, so a missing or restarted ingress is also
 * caught) instead of just probing the static-server fallback that
 * `waitForUrl` would accept.
 */
async function waitForAgentServer(
  url = "http://localhost:8000/server_info",
  timeoutMs = 10 * 60_000,
  intervalMs = 1_000,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(2000) });
      // Only 200 is success here. 502 from ingress means the upstream agent
      // server isn't bound yet; 401 means auth is required and the bundled
      // key didn't reach us — we still treat that as "the agent server is
      // up", because the proxy got a real HTTP response from it.
      if (res.status === 200 || res.status === 401) return;
    } catch {
      // Transient network / DNS / timeout — keep polling until the deadline.
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  throw new Error(
    `Agent server at ${url} never came up (${Math.round(timeoutMs / 1000)}s). ` +
      "Check the terminal log for errors from uvx / the agent-server process.",
  );
}

// ── Windows ───────────────────────────────────────────────────────────────────

let mainWin = null;
/** MARS session bridge (port-forward tunnels, MARSOHS-1429) — created in app.whenReady(). */
let marsTunnelBridge = null;

const APP_URL = "http://localhost:8000";
// Blank page the window shows until the ingress is up; the startup overlay is
// drawn on top of it, then on top of the app once the app page loads.
const BOOT_SHELL_URL = `data:text/html;charset=utf-8,${encodeURIComponent(
  '<!doctype html><meta charset="utf-8"><body style="margin:0;background:#0b0e14"></body>',
)}`;

function createMainWindow() {
  mainWin = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    show: false,
    // App-shell background (--oh-background in src/index.css) — avoids white
    // flashes during the show → maximize repaint after the splash closes.
    backgroundColor: "#0b0e14",
    // hiddenInset hides the native title bar but keeps the traffic lights
    // floating over the app shell; the renderer reserves a drag band for them.
    titleBarStyle: process.platform === "darwin" ? "hiddenInset" : "default",
    icon: appIconPath,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Desktop-shell state and the MARS tunnel bridge (see preload-main.cjs).
      preload: join(__dirname, "preload-main.cjs"),
    },
  });

  // The renderer drops its reserved traffic-light band in fullscreen, where
  // macOS hides the buttons. Only transitions are pushed; the preload reads the
  // current state over "window:full-screen:get" on every page load.
  const sendFullScreenState = () => {
    if (!mainWin || mainWin.isDestroyed()) return;
    mainWin.webContents.send("window:full-screen", mainWin.isFullScreen());
  };
  mainWin.on("enter-full-screen", sendFullScreenState);
  mainWin.on("leave-full-screen", sendFullScreenState);

  // Reattach the startup overlay after every page load (the app page replaces
  // the shell page, and a dismissed overlay is only drawn again on failure).
  mainWin.webContents.on("did-finish-load", () => {
    if (!bootUi.dismissed) renderBootOverlay();
  });

  mainWin.once("ready-to-show", () => {
    mainWin?.show();
    mainWin?.maximize();
  });

  mainWin.loadURL(bootUi.backendReady ? APP_URL : BOOT_SHELL_URL);

  // Route window.open() calls appropriately.
  mainWin.webContents.setWindowOpenHandler(({ url }) => {
    // The "Login with OpenHands Cloud" device-flow opens about:blank immediately
    // on the user's click (to beat popup blockers), then navigates the popup to
    // the OAuth verification URL once it has one.  We must allow about:blank
    // through so window.open() returns a non-null WindowProxy; the did-create-window
    // handler below redirects the popup to the system browser when it navigates.
    if (url === "about:blank") {
      return {
        action: "allow",
        overrideBrowserWindowOptions: { width: 800, height: 700 },
      };
    }
    // All other URLs open directly in the system browser. The loopback test
    // goes through URL parsing: prefix matching would also accept
    // attacker-controlled hosts like http://localhost.evil.com (or
    // http://localhost@evil.com) and render them in a chromeless native
    // window. Schemes outside the openExternal allowlist are denied
    // outright — shell.openExternal would forward them to OS protocol
    // handlers.
    if (isLoopbackAppUrl(url)) {
      return { action: "allow" };
    }
    if (isExternalBrowsableUrl(url)) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  // When the renderer opens a popup (the about:blank above), watch for its
  // first navigation away from about:blank.  That navigation will be to the
  // OAuth verification URL — open it in the system browser and close the
  // now-unneeded Electron popup.
  mainWin.webContents.on("did-create-window", (popupWin) => {
    popupWin.webContents.on("will-navigate", (_event, url) => {
      if (url !== "about:blank" && !isLoopbackAppUrl(url)) {
        _event.preventDefault();
        if (isExternalBrowsableUrl(url)) {
          shell.openExternal(url);
        }
        popupWin.close();
      }
    });
  });

  mainWin.on("closed", () => {
    mainWin = null;
  });
}

// ── Startup log buffer ────────────────────────────────────────────────────────
//
// Every service log line (all services, all levels, sanitized) is kept in a
// bounded buffer and streamed to the startup overlay's console in batches (see
// boot-overlay.mjs). The buffer is the single source of truth: the overlay
// replays it whenever it is drawn (lines emitted earlier would otherwise be
// lost) and it backs the "Copy logs" action. In a packaged app this console is
// the only log surface — stdout/stderr go to /dev/null when launched from
// Finder, and the winston file logger is a no-op there (see
// `.agents/skills/desktop-electron/references/guide.md` on dependency stripping).

const BOOT_LOG_MAX_LINES = 2000;
const BOOT_LOG_FLUSH_MS = 200;

const bootLog = []; // {name, line, level}[] — level: stdout|stderr|info|warn|error
let bootLogPending = [];
let bootLogFlushTimer = null;
// What the startup overlay shows. `fatal` is the failure summary, `dismissed`
// means the stack is up and the overlay has been removed.
const bootUi = {
  status: "",
  fatal: null,
  dismissed: false,
  backendReady: false,
};
let bootIcon = null;

/** Run `script` in the main window's page, if it is still alive. Best-effort. */
function runInBootPage(script) {
  if (!mainWin || mainWin.isDestroyed()) return;
  mainWin.webContents.executeJavaScript(script, true).catch(() => {});
}

/**
 * Draw or update the startup overlay on the main window. The page-side install
 * is idempotent (see boot-overlay.mjs), so this also reattaches an overlay
 * that was dismissed earlier.
 */
function renderBootOverlay() {
  bootIcon ??= nativeImage
    .createFromPath(appIconPath)
    .resize({ width: 128 })
    .toDataURL();
  const state = {
    status: bootUi.status,
    fatal: bootUi.fatal,
    icon: bootIcon,
    log: bootLog,
  };
  runInBootPage(
    `(${installBootOverlay.toString()})(${JSON.stringify(state)});`,
  );
}

function dismissBootOverlay() {
  bootUi.dismissed = true;
  runInBootPage("window.__ohBoot && window.__ohBoot.dismiss();");
}

// SGR color codes AND cursor-control CSI sequences (uv/uvicorn can emit
// either when they mis-detect a TTY).
const ANSI_CSI_RE = /\x1b\[[0-9;?]*[ -/]*[@-~]/g;

/**
 * Strip ANSI escapes and reduce carriage-return progress redraws (e.g. uv
 * download bars arrive as one chunk of "\r"-separated frames) to the final
 * frame — what a real terminal would have settled on.
 */
function sanitizeLogLine(line) {
  const frames = String(line ?? "")
    .replace(ANSI_CSI_RE, "")
    .split("\r")
    .map((s) => s.trim())
    .filter(Boolean);
  return frames.length ? frames[frames.length - 1] : "";
}

function appendBootLog(name, line, level) {
  const entry = { name, line, level };
  bootLog.push(entry);
  if (bootLog.length > BOOT_LOG_MAX_LINES) {
    bootLog.splice(0, bootLog.length - BOOT_LOG_MAX_LINES);
  }
  bootLogPending.push(entry);
  if (!bootLogFlushTimer) {
    bootLogFlushTimer = setTimeout(flushBootLog, BOOT_LOG_FLUSH_MS);
  }
}

function flushBootLog() {
  clearTimeout(bootLogFlushTimer);
  bootLogFlushTimer = null;
  if (!bootLogPending.length) return;
  const batch = bootLogPending;
  bootLogPending = [];
  // Entries stay in bootLog; a page that loads later replays it in full.
  if (!bootUi.dismissed) {
    runInBootPage(
      `window.__ohBoot && window.__ohBoot.append(${JSON.stringify(batch)});`,
    );
  }
}

/**
 * Switch the overlay into its failure state: the error summary with Copy logs
 * and Quit actions, with the console expanded so the log can be read. Reopens
 * the overlay if it was already dismissed (the automation backend can fail
 * after the app is up).
 */
function showBootFailure(summary) {
  bootUi.fatal = summary;
  bootUi.dismissed = false;
  renderBootOverlay();
}

// IPC surface for the startup overlay (see preload-main.cjs). The overlay runs
// in the app page, so only the main window's webContents may reach these.
function isMainWinEvent(event) {
  return (
    mainWin !== null &&
    !mainWin.isDestroyed() &&
    event.sender === mainWin.webContents
  );
}

ipcMain.handle("boot-overlay:copy", (event) => {
  if (!isMainWinEvent(event)) return 0;
  clipboard.writeText(bootLog.map((e) => `[${e.name}] ${e.line}`).join("\n"));
  return bootLog.length;
});

// The overlay has no window chrome to close the app with; the failure state
// shows a Quit button instead.
ipcMain.handle("boot-overlay:quit", (event) => {
  if (!isMainWinEvent(event)) return;
  app.quit();
});

// Synchronous so the preload has the state before the first render; a
// renderer that starts with "not fullscreen" paints the band and then drops it.
ipcMain.on("window:full-screen:get", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  event.returnValue = win !== null && !win.isDestroyed() && win.isFullScreen();
});

// ── Backend stack ─────────────────────────────────────────────────────────────

/**
 * Update the status line of the startup overlay. The status is kept in
 * bootUi, so a page that loads later shows the current line.
 *
 * Best-effort: any failure (window destroyed, page not ready, etc.) is
 * swallowed — this is purely a UX nicety and must never crash the launcher.
 */
function setLoadingStatus(line) {
  // Limit to a single line, max ~120 chars, to keep the overlay readable.
  const oneLine = String(line ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
  if (!oneLine) return;
  bootUi.status = oneLine;
  runInBootPage(
    `window.__ohBoot && window.__ohBoot.setStatus(${JSON.stringify(oneLine)});`,
  );
}

/**
 * Phase marker: headline + a line in the startup-log console, so the log
 * records which stage a failed boot died in.
 */
function setBootPhase(message) {
  appendBootLog("desktop", message, "info");
  setLoadingStatus(message);
}

/**
 * Last few `level: "error"` service log lines (spawn failures, non-zero
 * exits). Appended to the startup-failure dialog: a packaged app launched
 * from Finder has stdout/stderr wired to /dev/null, so without this a
 * crashed ingress/static-server surfaces only as an opaque "timed out
 * waiting for http://localhost:8000" message.
 */
const recentServiceErrors = [];

/**
 * Forward dev-stack service log lines to (a) the loading screen and (b) the
 * terminal log. The terminal already receives them via `logService`; we add
 * a tee here so the user can see what's happening on first launch when uvx
 * is downloading Python + agent-server.
 */
function handleServiceLog(name, line, level) {
  if (!line) return;
  const clean = sanitizeLogLine(line);
  if (!clean) return;
  // Full-fidelity stream: every service and level goes to the console buffer.
  // The one-line headline below stays filtered to the interesting services.
  appendBootLog(name, clean, level);
  if (name === "agent-server" || name === "automation") {
    setLoadingStatus(`${name}: ${clean}`);
  }
  // Mirror errors to a `[desktop]` terminal line so dev runs stay grep-friendly.
  if (level === "error") {
    console.error(`[desktop] [${name}] ${clean}`);
    // Errors from ANY service (including ingress/static, which the headline
    // filter above skips) are worth showing — a dead ingress is exactly the
    // case where the user would otherwise stare at a silent 120 s timeout.
    setLoadingStatus(`${name}: ${clean}`);
    recentServiceErrors.push(`${name}: ${clean}`);
    if (recentServiceErrors.length > 5) recentServiceErrors.shift();
  }
}

async function startStack() {
  const entryUrl = pathToFileURL(
    join(scriptsDir, "dev-with-automation.mjs"),
  ).href;
  const { main } = await import(entryUrl);

  // main() starts agent-server + automation backend + static server + ingress.
  //   skipNpmCheck: npm is not needed at runtime in static mode.
  //   agentServerReadyTimeoutMs: dev defaults to 60 s (warm uvx cache); a
  //     packaged binary on a fresh machine can spend several minutes inside
  //     uvx the first time, downloading Python + installing openhands-
  //     agent-server from PyPI. 10 minutes is generous but bounded.
  //   onServiceLog: stream uvx/agent-server output to the loading window so
  //     the user sees progress instead of an indefinite spinner.
  const result = await main({
    bannerTitle: "OpenHands Agent Canvas",
    staticMode: true,
    staticDir: buildDir,
    mode: "agent-canvas",
    isPublic: false,
    // The preload provides window.marsBridge; the stack's ingress must not
    // host a second, separate one.
    marsWebBridge: false,
    skipNpmCheck: true,
    agentServerReadyTimeoutMs: 10 * 60_000,
    onServiceLog: handleServiceLog,
    // main() announces the stack without waiting for the automation backend;
    // if it then exits during startup, the services are already stopped.
    onAutomationStartupFailure: failStartup,
  });

  // main() returns { config, agentServerReady } — treat a timeout as a fatal
  // startup error so the splash shows a clear dialog instead of dropping the
  // user into a half-booted UI that will only emit "Request timeout" popups.
  if (result?.agentServerReady === false) {
    throw new Error(
      "The agent server did not finish starting in time. " +
        "On first launch this can take several minutes while uvx downloads " +
        "Python and the OpenHands agent-server from PyPI. " +
        "Check your internet connection and try again.",
    );
  }
}

let startupFailed = false;

/**
 * Show why startup failed in the startup overlay, keeping the full startup log
 * readable and copyable. Falls back to a native dialog when the window is gone.
 */
function failStartup(err) {
  if (startupFailed) return;
  startupFailed = true;
  const summary =
    err.message +
    " Ensure ports 8000, 18000, and 18001 are free, then try again.";
  // Record the failure in the terminal and the startup-log buffer so it
  // shows (and copies) as the final console line.
  console.error("[desktop] Startup failed:", err);
  appendBootLog("desktop", summary, "error");
  if (mainWin && !mainWin.isDestroyed()) {
    // The overlay stays up in its failure state; the app quits via its Quit
    // button (or Cmd+Q / closing the window).
    showBootFailure(summary);
    return;
  }
  const errorTail = recentServiceErrors.length
    ? `\n\nRecent service errors:\n${recentServiceErrors.join("\n")}`
    : "";
  dialog.showErrorBox(
    "OpenHands Agent Canvas failed to start",
    summary + errorTail,
  );
  app.quit();
}

// ── App lifecycle ─────────────────────────────────────────────────────────────

app.whenReady().then(async () => {
  nativeTheme.themeSource = "dark";

  // Set the dock icon explicitly on macOS so `npm run desktop` shows the
  // OpenHands logo instead of the default Electron logo. In a packaged
  // build the .app bundle's icon.icns already provides this, but
  // app.dock.setIcon() is a cheap idempotent override that also fixes
  // the dev workflow.
  if (process.platform === "darwin" && app.dock && existsSync(appIconPath)) {
    app.dock.setIcon(nativeImage.createFromPath(appIconPath));
  }

  injectBundledUv();
  injectBundledNode();

  // Registered before the window loads so the renderer's first paint can
  // already reach the bridge (MARSOHS-1429). Independent of the agent-server
  // stack below — MARS sessions don't need the bundled backend to be up.
  const { createMarsTunnelBridge } = await import(
    pathToFileURL(join(scriptsDir, "mars-tunnel-bridge.mjs")).href
  );
  marsTunnelBridge = createMarsTunnelBridge({
    userDataPath: app.getPath("userData"),
    safeStorage,
    openExternal: (url) => shell.openExternal(url),
  });
  marsTunnelBridge.registerIpc(ipcMain);

  if (!uvxAvailable()) {
    dialog.showErrorBox(
      "Missing prerequisite: uv",
      app.isPackaged
        ? "The bundled uv binary could not be found. Please reinstall OpenHands Agent Canvas."
        : "uv (uvx) is not installed.\n\nInstall it from https://docs.astral.sh/uv/ then restart.",
    );
    app.quit();
    return;
  }

  createMainWindow();

  try {
    setBootPhase("Starting backend services…");
    await startStack();

    // Stage 1: ingress proxy is bound (anything < 500 on /). The app page
    // loads now, with the startup overlay drawn on top of it.
    setBootPhase("Waiting for proxy…");
    await waitForUrl(APP_URL);
    bootUi.backendReady = true;
    mainWin?.loadURL(APP_URL);

    // Stage 2: the agent-server behind the proxy is actually serving
    // requests. `startStack()` already waited for this internally, but we
    // re-probe end-to-end here so that if the user closes the splash race
    // window between processes binding, we still open the main window with
    // a live backend. Cheap (a single 200 response) when everything is up.
    setBootPhase("Connecting to agent server…");
    await waitForAgentServer("http://localhost:8000/server_info", 60_000);

    if (startupFailed) return;
    setBootPhase("Ready.");
    dismissBootOverlay();
  } catch (err) {
    failStartup(err);
  }
});

// ── Graceful shutdown ─────────────────────────────────────────────────────────
//
// dev-with-automation.mjs spawns the backend processes with detached:true so
// they form their own OS process groups and survive the parent's death by
// default. We must explicitly kill them when the app quits.
//
// createShutdownHookRegistry (dev-process-utils.mjs) already registered a
// SIGTERM handler that iterates every tracked process, calls signalProcessTree
// on its group, waits for exit, then calls process.exit(0). We just need to
// fire that handler before Electron lets the process die.
//
// Flow:
//   user closes window / Cmd+Q
//     → window-all-closed → app.quit()
//     → before-quit fires (first time)  → we preventDefault + send SIGTERM
//     → SIGTERM handler kills all children, calls process.exit(0)
//     → before-quit fires again (cleanupStarted=true) → we return, Electron exits
//
// Windows has no real POSIX signals: process.kill(pid, "SIGTERM") would
// terminate this process WITHOUT running the "SIGTERM" listener, skipping
// cleanup and orphaning the children on ports 8000/18000/18001 (the next
// launch then fails at startup). process.emit("SIGTERM") runs the same
// registered handler in-process instead.

let cleanupStarted = false;

app.on("before-quit", (event) => {
  if (cleanupStarted) return; // SIGTERM cleanup already running — allow exit

  cleanupStarted = true;
  event.preventDefault();

  // MARS connections are in-process state (tunnel listeners to close; no OS
  // subprocess to signal and wait on), so this
  // doesn't need the SIGTERM-based cleanup path below — just tear them down
  // directly. Best-effort: quitting must not hang on it.
  void marsTunnelBridge?.dispose().catch((err) => {
    console.warn("[desktop] Failed to close MARS connections:", err);
  });

  console.log("[desktop] Stopping backend services…");
  if (process.platform === "win32") {
    // Run the cleanup handler in-process (see header note). emit() returns
    // false when no listener is registered — the stack never started, so
    // there is nothing to clean up and we can exit immediately.
    if (!process.emit("SIGTERM")) app.exit(0);
  } else {
    process.kill(process.pid, "SIGTERM");
  }

  // Safety net: if the SIGTERM handler doesn't finish within 6 s, force-quit.
  const t = setTimeout(() => {
    console.warn("[desktop] Cleanup timed out — forcing exit");
    app.exit(0);
  }, 6000);
  if (t.unref) t.unref();
});

app.on("window-all-closed", () => {
  app.quit();
});

// macOS: clicking the dock icon when no window is open re-launches the app.
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    // The backend is already running — just open a new renderer window.
    if (mainWin === null) createMainWindow();
  }
});
