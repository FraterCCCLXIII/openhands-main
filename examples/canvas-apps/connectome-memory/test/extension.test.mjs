/**
 * Host-API double for the Connectome memory page.
 *
 * Node has no DOM here, so the double implements the element methods the
 * page actually calls. The assertions are about registration, the first
 * paint, Agent Server paths, disposal, and a bad host version.
 */

import assert from "node:assert/strict";
import test from "node:test";

import { activate, readConversations, readModel, routeScreen } from "../extension.js";

class El {
  constructor(tag) {
    this.tagName = String(tag).toUpperCase();
    this.childNodes = [];
    this.parentNode = null;
    this.dataset = {};
    this.listeners = {};
    this.className = "";
    this.name = "";
    this.type = "";
    this.value = "";
    this.checked = false;
    this.min = "";
    this.style = {};
    this._text = "";
  }

  getBoundingClientRect() {
    return { top: 0 };
  }

  set textContent(value) {
    this._text = value == null ? "" : String(value);
    this.childNodes = [];
  }

  get textContent() {
    if (this.childNodes.length === 0) return this._text;
    return this.childNodes.map((child) => child.textContent || "").join("");
  }

  setAttribute(name, value) {
    if (name.startsWith("data-")) this.dataset[name.slice(5)] = String(value);
  }

  append(...nodes) {
    for (const node of nodes) {
      if (node == null) continue;
      node.parentNode = this;
      this.childNodes.push(node);
    }
  }

  addEventListener(type, fn) {
    this.listeners[type] = this.listeners[type] || [];
    this.listeners[type].push(fn);
  }

  remove() {
    if (!this.parentNode) return;
    this.parentNode.childNodes = this.parentNode.childNodes.filter((child) => child !== this);
    this.parentNode = null;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const found = [];
    const visit = (node) => {
      if (matches(node, selector)) found.push(node);
      for (const child of node.childNodes || []) visit(child);
    };
    for (const child of this.childNodes) visit(child);
    return found;
  }
}

function matches(node, selector) {
  if (selector === "input") return node.tagName === "INPUT";
  const region = selector.match(/^\[data-region="([^"]+)"\]$/);
  if (region) return node.dataset.region === region[1];
  return false;
}

function installDocument() {
  const head = new El("head");
  globalThis.document = {
    head,
    visibilityState: "visible",
    createElement: (tag) => new El(tag),
    createTextNode: (text) => {
      const node = new El("#text");
      node.textContent = text;
      return node;
    },
  };
}

function hostDouble(request) {
  const pages = new Map();
  return {
    apiVersion: "1",
    extension: { name: "connectome-memory", version: "0.1.0", resolvedRef: null },
    backend: { id: "local", kind: "local", orgId: null },
    navigate() {},
    registerPage(id, mount) {
      assert.equal(pages.has(id), false);
      pages.set(id, mount);
      return () => pages.delete(id);
    },
    agentServer: { request },
    pages,
  };
}

test("route remainders select the dashboard, options, tests, and one index", () => {
  assert.deepEqual(routeScreen(""), { name: "dashboard" });
  assert.deepEqual(routeScreen("options"), { name: "options" });
  assert.deepEqual(routeScreen("tests"), { name: "tests" });
  assert.deepEqual(routeScreen("conversations/conv-a"), { name: "conversation", id: "conv-a" });
  assert.equal(routeScreen("nope").name, "unknown");
});

test("settings and conversation payloads keep the model and the token counts", () => {
  assert.deepEqual(
    readModel({
      agent_settings: {
        llm: { model: "openhands/claude-opus-4-5-20251101", api_key: "hidden" },
        condenser: { condenser_kind: "llm_summarizing", enabled: true },
      },
    }),
    { model: "openhands/claude-opus-4-5-20251101", condenser: "llm_summarizing", condenserEnabled: true },
  );
  assert.equal(readModel({}).model, "unavailable");
  const rows = readConversations({
    items: [
      {
        id: "abc",
        title: "Webhook",
        execution_status: "running",
        stats: {
          usage_to_metrics: {
            default: {
              model_name: "opus",
              accumulated_cost: 1.25,
              accumulated_token_usage: { prompt_tokens: 100, completion_tokens: 20 },
            },
          },
        },
      },
    ],
  });
  assert.equal(rows[0].promptTokens, 100);
  assert.equal(rows[0].cost, 1.25);
  assert.equal(rows[0].title, "Webhook");
});

test("activate registers the memory page and a bad host version fails", () => {
  installDocument();
  const host = hostDouble(async () => ({}));
  const unregister = activate(host);
  assert.equal(host.pages.size, 1);
  unregister();
  assert.equal(host.pages.size, 0);
  assert.throws(() => activate({ apiVersion: "2" }), /host API 1/);
});

test("the first paint asks the Agent Server for settings and conversations", async () => {
  installDocument();
  const paths = [];
  const host = hostDouble(async ({ path }) => {
    paths.push(path);
    if (path === "/api/settings") {
      return {
        agent_settings: {
          llm: { model: "openhands/claude-opus-4-5-20251101" },
          condenser: { condenser_kind: "llm_summarizing", enabled: true },
        },
      };
    }
    return { items: [] };
  });
  const fetches = [];
  globalThis.fetch = async (url) => {
    fetches.push(String(url));
    return { ok: false, json: async () => ({ error: "down" }) };
  };
  activate(host);
  const container = new El("div");
  const stop = host.pages.get("memory")({ container, path: "", navigate() {} });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.ok(container.textContent.includes("Connectome memory"));
  assert.ok(paths.includes("/api/settings"));
  assert.ok(paths.includes("/api/conversations/search?limit=20"));
  assert.ok(fetches.some((url) => url.endsWith("/health")));
  assert.ok(container.textContent.includes("local memory service is not running"));
  stop();
  assert.equal(container.childNodes.length, 0);
});

test("a malformed Agent Server body does not throw and renders a fallback", async () => {
  installDocument();
  const host = hostDouble(async () => {
    throw new Error("nope");
  });
  globalThis.fetch = async () => ({ ok: false, json: async () => ({}) });
  activate(host);
  const container = new El("div");
  const stop = host.pages.get("memory")({ container, path: "options", navigate() {} });
  await new Promise((resolve) => setTimeout(resolve, 20));
  assert.ok(container.textContent.includes("did not return settings"));
  assert.ok(container.textContent.includes("Memory options"));
  stop();
});

test("the root fills the visible height on mount and again after a window resize", async () => {
  installDocument();
  const listeners = new Map();
  globalThis.addEventListener = (type, fn) => listeners.set(type, fn);
  globalThis.removeEventListener = () => listeners.delete("resize");
  globalThis.innerHeight = 900;
  globalThis.fetch = async () => ({ ok: false, json: async () => ({ error: "down" }) });
  try {
    const host = hostDouble(async () => ({}));
    activate(host);
    const container = new El("div");
    const stop = host.pages.get("memory")({ container, path: "", navigate() {} });
    const root = container.childNodes.find((node) => node.className === "connectome-memory");
    assert.equal(root.style.height, "900px");
    globalThis.innerHeight = 1200;
    listeners.get("resize")();
    assert.equal(root.style.height, "1200px");
    stop();
  } finally {
    delete globalThis.addEventListener;
    delete globalThis.removeEventListener;
    delete globalThis.innerHeight;
  }
});
