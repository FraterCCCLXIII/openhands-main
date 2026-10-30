import { describe, expect, it, vi } from "vitest";
import { BRAND, activate, askAgent, createVad, mount, splitSentences, synthesize, transcribe } from "./extension.js";

describe("voice activity detector", () => {
  it("starts on loud input and ends after the silence window", () => {
    const vad = createVad({ threshold: 0.05, silenceMs: 500, minSpeechMs: 200 });
    expect(vad.feed(0.01, 0)).toBeNull();
    expect(vad.feed(0.2, 100)).toBe("start");
    expect(vad.feed(0.2, 900)).toBeNull();
    expect(vad.feed(0.01, 1200)).toBeNull();
    expect(vad.feed(0.01, 1400)).toBe("end");
  });

  it("cancels a blip shorter than the minimum speech", () => {
    const vad = createVad({ silenceMs: 300, minSpeechMs: 400 });
    vad.feed(0.3, 0);
    expect(vad.feed(0, 400)).toBe("cancel");
  });
});

describe("splitSentences", () => {
  it("splits sentences and drops markdown and code", () => {
    expect(splitSentences("Done! **Bold** text. ```x=1``` Next?")).toEqual(["Done!", "Bold text.", "code omitted.", "Next?"]);
    expect(splitSentences("")).toEqual([]);
  });
});

describe("speech services", () => {
  it("posts a transcription and returns the text", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, json: async () => ({ text: " hello there " }) }));
    const text = await transcribe(new Blob(["x"], { type: "audio/webm" }), { url: "http://s/v1/", model: "m", lang: "en", fetchImpl });
    expect(text).toBe("hello there");
    expect(fetchImpl.mock.calls[0][0]).toBe("http://s/v1/audio/transcriptions");
  });

  it("reports a failed transcription", async () => {
    const fetchImpl = async () => ({ ok: false, status: 500 });
    await expect(transcribe(new Blob(["x"]), { url: "u", fetchImpl })).rejects.toThrow("500");
  });

  it("asks the voice server for speech with the chosen voice", async () => {
    const fetchImpl = vi.fn(async () => ({ ok: true, blob: async () => new Blob(["wav"]) }));
    await synthesize("Hi.", { url: "http://v:4650/", voice: "qwen:girl-teen/happy@2", lang: "en", fetchImpl });
    expect(fetchImpl.mock.calls[0][0]).toBe("http://v:4650/v1/audio/speech");
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toMatchObject({ input: "Hi.", voice: "qwen:girl-teen/happy@2" });
  });
});

describe("askAgent", () => {
  it("sends the message and returns the next agent message once it is stable", async () => {
    const events = [{ id: "old", source: "agent", kind: "MessageEvent", llm_message: { content: [{ type: "text", text: "old" }] } }];
    const request = vi.fn(async ({ path, method }) => {
      if (method === "POST") { events.unshift({ id: "new", source: "agent", kind: "MessageEvent", llm_message: { content: [{ type: "text", text: "Sure thing." }] } }); return {}; }
      return { items: [...events] };
    });
    const reply = await askAgent({ agentServer: { request } }, "c1", "hello", { pollMs: 0, sleep: async () => {} });
    expect(reply).toBe("Sure thing.");
    const post = request.mock.calls.find(([a]) => a.method === "POST")[0];
    expect(post.path).toBe("/api/conversations/c1/events");
    expect(post.body).toMatchObject({ role: "user", run: true });
  });
});

describe("page", () => {
  const host = (items = []) => ({ apiVersion: "1", registerPage: vi.fn((id, fn) => ({ id, fn })), agentServer: { request: vi.fn(async () => ({ items })) } });

  it("registers the Vox page and requires host API 1", () => {
    const h = host();
    activate(h);
    expect(h.registerPage).toHaveBeenCalledWith("kosmos-vox", expect.any(Function));
    expect(() => activate({ apiVersion: "2" })).toThrow();
  });

  it("shows the brand, the trademark line and the conversations to pick", async () => {
    const container = document.createElement("div");
    mount(container, host([{ id: "abc123", title: "Plan the launch" }]));
    await Promise.resolve(); await Promise.resolve();
    expect(container.textContent).toContain(`${BRAND.product}™`);
    expect(container.textContent).toContain("Kamiji™");
    expect(container.textContent).toContain("Paul Bloch");
    expect([...container.querySelectorAll("option")].map((o) => o.textContent)).toContain("Plan the launch");
  });
});
