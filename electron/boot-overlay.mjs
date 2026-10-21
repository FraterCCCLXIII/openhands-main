/**
 * Startup overlay drawn on top of the main app window while the local stack
 * boots (see main.mjs::renderBootOverlay). It replaces the old standalone
 * splash window, so the app shell is the backdrop instead of a second window.
 *
 * main.mjs runs `installBootOverlay` in the page with executeJavaScript, which
 * serializes the function source. It must stay self-contained: it cannot close
 * over anything in this module. The first call defines `window.__ohBoot`;
 * later calls reattach the overlay and replay the state. Log lines are
 * untrusted process output, so they only ever go in through textContent.
 *
 * Colors follow the app's secondary button (border-border, bg-base-secondary,
 * surface-raised on hover) and the cool-grey tokens in src/index.css.
 */
export function installBootOverlay(initial) {
  if (window.__ohBoot) {
    window.__ohBoot.restore(initial);
    return;
  }

  const MAX_LINES = 2000;
  const CSS = `
    #oh-boot-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
      background: rgba(16, 16, 16, 0.66);
      -webkit-backdrop-filter: blur(6px);
      backdrop-filter: blur(6px);
      -webkit-app-region: no-drag;
      transition: opacity 200ms ease;
      font-family: -apple-system, "SF Pro", BlinkMacSystemFont, "Segoe UI", "Roboto",
        "Helvetica Neue", sans-serif;
      color: #ececec;
      -webkit-font-smoothing: antialiased;
      user-select: none;
    }
    #oh-boot-overlay.leaving { opacity: 0; pointer-events: none; }
    #oh-boot-overlay * { box-sizing: border-box; }

    #oh-boot-overlay .oh-boot-card {
      width: 460px;
      max-width: 100%;
      max-height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 28px 24px 20px;
      overflow: hidden;
      border: 1px solid #404040;
      border-radius: 16px;
      background: #202020;
      box-shadow: 0 24px 60px rgba(0, 0, 0, 0.5);
    }
    #oh-boot-overlay .oh-boot-logo {
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
      border-radius: 16px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.06);
      -webkit-user-drag: none;
    }
    #oh-boot-overlay h1 {
      margin: 0 0 6px;
      font-size: 20px;
      font-weight: 600;
      letter-spacing: -0.3px;
    }
    #oh-boot-overlay .oh-boot-tagline {
      margin: 0 0 24px;
      font-size: 13px;
      color: #979797;
    }
    #oh-boot-overlay .oh-boot-spinner {
      width: 24px;
      height: 24px;
      margin-bottom: 12px;
      color: #fff;
      animation: oh-boot-spin 1s linear infinite;
    }
    @keyframes oh-boot-spin { to { transform: rotate(360deg); } }
    #oh-boot-overlay .oh-boot-status {
      max-width: 100%;
      margin: 0;
      font-size: 12px;
      letter-spacing: 0.3px;
      color: #979797;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #oh-boot-overlay .oh-boot-hint {
      margin: 12px 0 0;
      font-size: 11px;
      line-height: 1.5;
      color: #737373;
      text-align: center;
    }
    #oh-boot-overlay .oh-boot-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
    }
    #oh-boot-overlay .oh-boot-btn {
      height: 36px;
      padding: 0 16px;
      font: inherit;
      font-size: 13px;
      color: #fff;
      background: #202020;
      border: 1px solid #404040;
      border-radius: 8px;
      cursor: pointer;
      transition: background-color 75ms ease, border-color 75ms ease;
    }
    #oh-boot-overlay .oh-boot-btn:hover {
      background: #282828;
    }
    #oh-boot-overlay .oh-boot-btn:focus-visible {
      outline: 2px solid #979797;
      outline-offset: 2px;
    }
    #oh-boot-overlay .oh-boot-quit { display: none; }

    #oh-boot-overlay .oh-boot-console {
      display: none;
      flex-direction: column;
      width: 100%;
      min-height: 0;
      height: 240px;
      margin-top: 16px;
      border: 1px solid #404040;
      border-radius: 12px;
      background: #101010;
      overflow: hidden;
      user-select: text;
    }
    #oh-boot-overlay.expanded .oh-boot-console { display: flex; }
    #oh-boot-overlay .oh-boot-console-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 4px 6px 4px 12px;
      border-bottom: 1px solid #404040;
      font-size: 11px;
      color: #979797;
    }
    #oh-boot-overlay .oh-boot-log {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      padding: 8px 12px;
      font-family: source-code-pro, Menlo, Monaco, Consolas, "Courier New", monospace;
      font-size: 10.5px;
      line-height: 1.55;
      color: #979797;
      white-space: pre-wrap;
      overflow-wrap: anywhere;
      cursor: text;
    }
    #oh-boot-overlay .oh-boot-log:empty::before {
      content: "Waiting for output…";
      color: #737373;
    }
    #oh-boot-overlay .oh-boot-name { color: #737373; }
    #oh-boot-overlay .oh-boot-line-error { color: #e76a5e; }

    #oh-boot-overlay.failed .oh-boot-spinner,
    #oh-boot-overlay.failed .oh-boot-hint { display: none; }
    #oh-boot-overlay.failed .oh-boot-status {
      color: #e76a5e;
      white-space: normal;
      line-height: 1.45;
    }
    #oh-boot-overlay.failed .oh-boot-quit { display: inline-block; }
  `;

  let root = null;
  let logEl = null;
  let statusEl = null;
  let toggleBtn = null;
  let logPinned = true;
  let state = { status: "", fatal: null, expanded: false };

  function appendRows(batch) {
    if (!root || !batch || !batch.length) return;
    const frag = document.createDocumentFragment();
    for (const entry of batch) {
      const row = document.createElement("div");
      row.className = entry.level === "error" ? "oh-boot-line-error" : "";
      const name = document.createElement("span");
      name.className = "oh-boot-name";
      name.textContent = "[" + entry.name + "]";
      row.appendChild(name);
      row.appendChild(document.createTextNode(" " + entry.line));
      frag.appendChild(row);
    }
    logEl.appendChild(frag);
    while (logEl.childElementCount > MAX_LINES) {
      logEl.removeChild(logEl.firstElementChild);
    }
    if (logPinned) logEl.scrollTop = logEl.scrollHeight;
  }

  function render() {
    if (!root) return;
    root.classList.toggle("failed", Boolean(state.fatal));
    root.classList.toggle("expanded", state.expanded || Boolean(state.fatal));
    statusEl.textContent = state.fatal ?? (state.status || "Starting services…");
    toggleBtn.textContent = state.expanded ? "Hide details" : "Show details";
  }

  function build(icon) {
    if (!document.getElementById("oh-boot-overlay-style")) {
      const style = document.createElement("style");
      style.id = "oh-boot-overlay-style";
      style.textContent = CSS;
      document.head.appendChild(style);
    }
    root = document.createElement("div");
    root.id = "oh-boot-overlay";
    root.innerHTML = `
      <div class="oh-boot-card" role="dialog" aria-modal="true" aria-label="Starting OpenHands Agent Canvas">
        <img class="oh-boot-logo" src="${icon}" alt="" draggable="false" />
        <h1>OpenHands Agent Canvas</h1>
        <p class="oh-boot-tagline">AI coding agent interface</p>
        <svg class="oh-boot-spinner" viewBox="0 0 66 66" fill="none" aria-hidden="true">
          <path d="M63 33C63 16.4315 49.5685 3 33 3C16.4315 3 3 16.4315 3 33C3 49.5685 16.4315 63 33 63"
            stroke="currentColor" stroke-width="6" stroke-linecap="round" />
        </svg>
        <p class="oh-boot-status" role="status"></p>
        <p class="oh-boot-hint">
          First launch downloads Python + the OpenHands agent server.<br />
          This can take a few minutes on a fresh machine.
        </p>
        <div class="oh-boot-actions">
          <button type="button" class="oh-boot-btn" data-action="toggle">Show details</button>
          <button type="button" class="oh-boot-btn oh-boot-quit" data-action="quit">Quit</button>
        </div>
        <div class="oh-boot-console" aria-label="Startup log">
          <div class="oh-boot-console-head">
            <span>Startup log</span>
            <button type="button" class="oh-boot-btn" data-action="copy" style="height:26px;padding:0 10px;font-size:11px">Copy</button>
          </div>
          <div class="oh-boot-log"></div>
        </div>
      </div>`;
    document.body.appendChild(root);

    statusEl = root.querySelector(".oh-boot-status");
    toggleBtn = root.querySelector('[data-action="toggle"]');
    logEl = root.querySelector(".oh-boot-log");
    const copyBtn = root.querySelector('[data-action="copy"]');
    const quitBtn = root.querySelector('[data-action="quit"]');

    logEl.addEventListener("scroll", () => {
      logPinned = logEl.scrollTop + logEl.clientHeight >= logEl.scrollHeight - 8;
    });
    toggleBtn.addEventListener("click", () => {
      state.expanded = !state.expanded;
      render();
      if (state.expanded && logPinned) logEl.scrollTop = logEl.scrollHeight;
    });
    copyBtn.addEventListener("click", () => {
      const bridge = window.desktopBoot;
      if (!bridge) return;
      bridge.copyLogs().then(() => {
        copyBtn.textContent = "Copied";
        setTimeout(() => {
          copyBtn.textContent = "Copy";
        }, 1200);
      });
    });
    quitBtn.addEventListener("click", () => {
      if (window.desktopBoot) window.desktopBoot.quit();
    });
  }

  window.__ohBoot = {
    append(batch) {
      appendRows(batch);
    },
    setStatus(text) {
      state.status = text;
      if (root && !state.fatal) statusEl.textContent = text || "Starting services…";
    },
    restore(next) {
      state = {
        status: next.status || "",
        fatal: next.fatal || null,
        expanded: Boolean(next.expanded),
      };
      if (!root) build(next.icon);
      logEl.replaceChildren();
      appendRows(next.log || []);
      render();
    },
    dismiss() {
      if (!root) return;
      const leaving = root;
      root = null;
      leaving.classList.add("leaving");
      setTimeout(() => leaving.remove(), 220);
    },
  };
  window.__ohBoot.restore(initial);
}
