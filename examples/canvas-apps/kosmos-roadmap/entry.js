// Canvas App entry for the Kosmos Roadmap page. `build.mjs` prepends
// roadmap-db.js and replaces the two placeholders below, producing the
// self-contained `dist/extension.js` that the Agent Server serves.
/* global createRoadmapDb */

const PAGE_HTML = __PAGE_HTML__;
const CONFIG = __CONFIG__;

// Runs first inside the page: it takes the `window.claude` shim from the
// iframe element. The `[hidden]` rule comes from the claude.ai page skeleton;
// without it the page's own `display` rules show its closed drawer and
// popover. The Ask Claude drawer stays hidden until it is wired to OpenHands'
// own LLM routing.
const PAGE_PRELUDE =
  "<script>window.claude = window.frameElement && window.frameElement.kosmosClaude;</script>" +
  "<style>[hidden]{display:none!important}#ask-btn{display:none!important}</style>";

function agentServerStorage(host, dataDir) {
  const filePath = (file) => encodeURIComponent(`${dataDir}/${file}`);
  return {
    async read(file) {
      let body;
      try {
        body = await host.agentServer.request({
          path: `/api/file/download?path=${filePath(file)}`,
        });
      } catch (error) {
        if (error && error.status === 404) return null;
        throw error;
      }
      if (typeof body === "string") return body;
      if (body instanceof Blob) return body.text();
      if (body instanceof ArrayBuffer) return new TextDecoder().decode(body);
      return JSON.stringify(body);
    },
    async write(file, text) {
      // FormData is built in this realm so the host's HTTP client sends it as
      // multipart rather than JSON.
      const form = new FormData();
      form.append("file", new Blob([text], { type: "application/json" }), file);
      await host.agentServer.request({
        method: "POST",
        path: `/api/file/upload?path=${filePath(file)}`,
        body: form,
      });
    },
  };
}

function claudeShim(db) {
  const user = { id: async () => "openhands", can: () => true };
  return {
    use: async (name) => {
      if (name === "db") return db;
      if (name === "user") return user;
      return null;
    },
  };
}

export function activate(host) {
  return host.registerPage(CONFIG.pageId, ({ container }) => {
    const store = createRoadmapDb(agentServerStorage(host, CONFIG.dataDir), {
      pollMs: CONFIG.pollMs,
      missingSnapshotMessage: `no snapshot in ${CONFIG.dataDir}. Run examples/canvas-apps/kosmos-roadmap/sync.mjs.`,
    });
    const frame = document.createElement("iframe");
    frame.title = CONFIG.title;
    frame.style.cssText = "display:block;width:100%;height:100%;border:0;";
    // srcdoc keeps the page's global styles and ids out of Canvas while
    // letting it share Canvas' origin, which the frameElement handoff needs.
    frame.kosmosClaude = claudeShim(store.db);
    // The page is an artifact body without a document skeleton; claude.ai
    // adds one, so this does too.
    frame.srcdoc = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${PAGE_PRELUDE}${PAGE_HTML}`;

    frame.dataset.kosmosRoadmap = "";
    container.style.height = "100%";
    container.append(frame);
    return () => {
      store.dispose();
      frame.remove();
      // Canvas can dispose an earlier mount after a later one has started in
      // the same container; leave the height to the frame that remains.
      if (!container.querySelector("iframe[data-kosmos-roadmap]")) {
        container.style.removeProperty("height");
      }
    };
  });
}
