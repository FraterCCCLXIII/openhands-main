import { describe, expect, it, vi } from "vitest";
import { activate, liveAgent, messageText, shortTime } from "./extension.js";

function mountWith(request) {
  let mountFn;
  const host = { apiVersion: "1", navigate: vi.fn(), agentServer: { request }, registerPage: (_id, fn) => { mountFn = fn; return () => {}; } };
  activate(host);
  const container = document.createElement("div");
  document.body.append(container);
  const dispose = mountFn({ container });
  return { container, dispose };
}

describe("message helpers", () => {
  it("reads only text from a MessageEvent", () => {
    expect(messageText({ kind: "MessageEvent", llm_message: { content: [{ type: "text", text: "hi " }, { type: "image" }] } })).toBe("hi");
    expect(messageText({ kind: "ActionEvent" })).toBe("");
  });

  it("builds a live agent row from a conversation and its events", () => {
    const events = [
      { kind: "MessageEvent", source: "user", llm_message: { content: [{ type: "text", text: "run tests" }] } },
      { kind: "ActionEvent", source: "agent" },
      { kind: "MessageEvent", source: "agent", llm_message: { content: [{ type: "text", text: "All green" }] } },
    ];
    const agent = liveAgent({ id: "abc123", title: "CI fixer", updated_at: "2026-01-01T10:00:00Z" }, events);
    expect(agent).toMatchObject({ live: true, name: "CI fixer", conversationId: "abc123", preview: "All green" });
    expect(agent.thread).toEqual([["me", "run tests"], ["agent", "All green"]]);
  });

  it("labels today by time and yesterday by name", () => {
    const now = new Date(2026, 9, 29, 15, 0);
    expect(shortTime(new Date(2026, 9, 28, 9, 0).toISOString(), now)).toBe("Yesterday");
    expect(shortTime("not a date", now)).toBe("");
  });
});

describe("Hangout page", () => {
  it("lists the sample agents, opens one, and appends a sent message locally", async () => {
    const { container, dispose } = mountWith(vi.fn().mockRejectedValue(new Error("offline")));
    await new Promise((r) => setTimeout(r, 0));
    const rows = container.querySelectorAll(".row");
    expect(rows.length).toBe(9);
    rows[2].click();
    expect(container.querySelector(".chathead").textContent).toContain("Inbox Manager");
    const input = container.querySelector(".composer input");
    input.value = "status?";
    input.dispatchEvent(new Event("input"));
    container.querySelector(".composer").dispatchEvent(new Event("submit", { cancelable: true }));
    await new Promise((r) => setTimeout(r, 0));
    expect([...container.querySelectorAll(".bubble.me")].map((n) => n.textContent)).toContain("status?");
    expect(container.textContent).toContain("not reachable");
    dispose();
  });

  it("shows real conversations first and posts a message to the one picked", async () => {
    const request = vi.fn(async ({ path }) => {
      if (path.startsWith("/api/conversations/search")) return { items: [{ id: "c1", title: "Docs agent", updated_at: "2026-01-01T00:00:00Z" }] };
      if (path.includes("/events/search")) return { items: [{ kind: "MessageEvent", source: "agent", llm_message: { content: [{ type: "text", text: "Docs updated" }] } }] };
      return {};
    });
    const { container, dispose } = mountWith(request);
    await new Promise((r) => setTimeout(r, 10));
    const first = container.querySelector(".row");
    expect(first.textContent).toContain("Docs agent");
    first.click();
    const input = container.querySelector(".composer input");
    input.value = "ship it";
    input.dispatchEvent(new Event("input"));
    container.querySelector(".composer").dispatchEvent(new Event("submit", { cancelable: true }));
    await new Promise((r) => setTimeout(r, 10));
    const post = request.mock.calls.find(([arg]) => arg.method === "POST");
    expect(post[0].path).toBe("/api/conversations/c1/events");
    expect(post[0].body).toMatchObject({ role: "user", run: true });
    dispose();
  });
});
