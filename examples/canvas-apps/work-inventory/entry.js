// Canvas App entry for the Work Inventory page. `build.mjs` prepends
// inventory-db.js and replaces the two placeholders below, producing the
// self-contained `dist/extension.js` that the Agent Server serves.
/* global createInventoryDb */

const PAGE_HTML = __PAGE_HTML__;
const CONFIG = __CONFIG__;

// Runs first inside the page: it takes the `window.claude` shim from the
// iframe element. Same handoff as the Kosmos Roadmap app.
const PAGE_PRELUDE =
  "<script>window.claude = window.frameElement && window.frameElement.inventoryClaude;</script>" +
  "<style>[hidden]{display:none!important}</style>";

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

export function activate(host) {
  return host.registerPage(CONFIG.pageId, ({ container }) => {
    const store = createInventoryDb(agentServerStorage(host, CONFIG.dataDir), {
      pollMs: CONFIG.pollMs,
      missingSnapshotMessage: `no snapshot in ${CONFIG.dataDir}. Run examples/canvas-apps/work-inventory/sync.mjs.`,
    });
    const frame = document.createElement("iframe");
    frame.title = CONFIG.title;
    frame.style.cssText = "display:block;width:100%;height:100%;min-height:480px;border:0;";
    frame.inventoryClaude = {
      use: async (name) => (name === "db" ? store.db : null),
    };
    frame.srcdoc = `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">${PAGE_PRELUDE}${PAGE_HTML}`;
    frame.dataset.workInventory = "";
    container.style.height = "100%";
    container.append(frame);
    // Fill the visible page below wherever the host put us (hosts may not give a definite height).
    const fit = () => {
      const top = Math.max(0, frame.getBoundingClientRect().top);
      frame.style.height = `${Math.max(480, (window.innerHeight || 800) - top)}px`;
    };
    const onResize = () => fit();
    window.addEventListener("resize", onResize);
    const ro = typeof window.ResizeObserver === "function" && container.parentElement ? new window.ResizeObserver(onResize) : null;
    ro?.observe(container.parentElement || container);
    fit();
    return () => {
      window.removeEventListener("resize", onResize);
      ro?.disconnect();
      store.dispose();
      frame.remove();
      if (!container.querySelector("iframe[data-work-inventory]")) {
        container.style.removeProperty("height");
      }
    };
  });
}
