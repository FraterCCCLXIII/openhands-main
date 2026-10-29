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
// own LLM routing. The page fills the frame, so the document's default 8px
// body margin goes too.
const PAGE_PRELUDE =
  "<script>window.claude = window.frameElement && window.frameElement.kosmosClaude;</script>" +
  "<style>html,body{margin:0}[hidden]{display:none!important}#ask-btn{display:none!important}</style>";

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

// Starts the agent a composer route names: a new conversation on the local
// Agent Server with the route's brief as its first message. It runs only when
// the person presses Start on a route; Canvas asks no consent of its own.
function dispatcher(host) {
  let profiles = null;
  async function list() {
    if (!profiles) {
      const [agents, llms] = await Promise.all([
        host.agentServer.request({ path: "/api/agent-profiles" }).catch(() => null),
        host.agentServer.request({ path: "/api/profiles" }).catch(() => null),
      ]);
      profiles = {
        agents: agents?.profiles ?? [],
        activeAgent: agents?.active_agent_profile_id ?? null,
        llms: llms?.profiles ?? [],
        activeLlm: llms?.active_profile ?? null,
      };
    }
    return profiles;
  }
  return {
    profiles: list,
    // model is the route's family (haiku, sonnet, opus, fable). An LLM
    // profile whose name or model contains it becomes this conversation's
    // LLM; otherwise the agent profile's own LLM (or its Model Router) runs.
    async start({ message, model, card, role }) {
      const p = await list();
      const agent =
        p.agents.find((a) => a.id && a.id === p.activeAgent) ??
        p.agents.find((a) => a.name === "default") ??
        p.agents[0];
      if (!agent) throw new Error("This Agent Server has no agent profile.");
      const llm = model
        ? p.llms.find((l) => `${l.name} ${l.model ?? ""}`.toLowerCase().includes(model.toLowerCase()))
        : null;
      const body = {
        agent_profile_id: agent.id ?? agent.name,
        initial_message: { role: "user", content: [{ type: "text", text: message }] },
        tags: { source: "kosmos-roadmap", kosmos_card: card ?? "", kosmos_role: role ?? "" },
      };
      if (llm) body.agent_launch_additions = { llm_profile_ref: llm.name };
      const info = await host.agentServer.request({ method: "POST", path: "/api/conversations", body });
      const id = info?.id ?? info?.conversation_id ?? null;
      if (id) host.navigate(`/conversations/${id}`);
      return { id, agent: agent.name, llm: llm?.name ?? null };
    },
  };
}

function claudeShim(db, host) {
  const user = { id: async () => "openhands", can: () => true };
  const dispatch = dispatcher(host);
  return {
    use: async (name) => {
      if (name === "db") return db;
      if (name === "user") return user;
      if (name === "dispatch") return dispatch;
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
    frame.kosmosClaude = claudeShim(store.db, host);
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
