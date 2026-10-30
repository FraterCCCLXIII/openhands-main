import { describe, expect, it, vi } from "vitest";
import {
  BRAND, activate, askAgent, buildDetectScript, chooseEngine, chooseListener, chooseMouthSource, createMouthDriver, createVad, cuteMacro, engineStatus, mouthFromRms, mount,
  parseDetectOutput, parseVisemes, runBash, splitSentences, synthesize, synthesizeClip, transcribe, withMood,
} from "./extension.js";

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
  it("keeps the white label on the pressed microphone button readable (WCAG AA 4.5:1)", () => {
    const container = document.createElement("div");
    mount(container, host());
    const css = container.querySelector("style").textContent;
    const accent = css.match(/--acc:\s*(#[0-9a-f]{6})/i)[1];
    const label = css.match(/\.mic\[aria-pressed="true"\]\s*\{[^}]*?[;\s]color:\s*(#[0-9a-f]{3,6})/i)[1];
    const lum = (hex) => {
      const h = hex.length === 4 ? hex.replace(/[0-9a-f]/gi, "$&$&").slice(1) : hex.slice(1);
      const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    const [hi, lo] = [lum(accent), lum(label)].sort((a, b) => b - a);
    expect((hi + 0.05) / (lo + 0.05)).toBeGreaterThanOrEqual(4.5);
  });
});

// ---- voice workbench ----
const flush = async () => { for (let i = 0; i < 12; i += 1) await Promise.resolve(); await new Promise((r) => setTimeout(r, 0)); };
const instantSleep = async () => {};

/** A fetch stub for the localhost probes: `up` lists the base URLs that answer. */
function fetchStub(up = {}) {
  return vi.fn(async (url) => {
    const u = String(url);
    if (u.startsWith("http://127.0.0.1:4650/v1/voices") && up.kamiji) return { ok: true, json: async () => ({ voices: ["kokoro:af_heart", "qwen:girl-teen/happy@2", "qwen:girl-teen/sad", "qwen:grandma"] }) };
    if (u.startsWith("http://127.0.0.1:4650") && up.kamiji) return { ok: true, json: async () => ({ status: "ready", library: true }) };
    if (u.startsWith("http://127.0.0.1:4640") && up.stt) return { ok: true, json: async () => ({ status: "ready", model: "large-v3-turbo" }) };
    throw new TypeError("connection refused");
  });
}

/** A host whose Agent Server answers the bash start and poll calls with canned stdout. */
function bashHost(stdout) {
  const request = vi.fn(async ({ path, method }) => {
    if (method === "POST" && path === "/api/bash/start_bash_command") return { id: "cmd-1", kind: "BashCommand" };
    if (path.startsWith("/api/bash/bash_events/search")) return { items: [{ kind: "BashOutput", command_id: "cmd-1", order: 0, exit_code: 0, stdout, stderr: "" }] };
    return { items: [] };
  });
  return { apiVersion: "1", registerPage: vi.fn(), agentServer: { request } };
}

const pillOf = (container, id) => container.querySelector(`[data-engine="${id}"] .pill`)?.textContent;

describe("full height", () => {
  it("fills the page below its top edge and never drops under 480", () => {
    const container = document.createElement("div");
    document.body.append(container);
    window.innerHeight = 900;
    const stop = mount(container, { apiVersion: "1" }, { fetch: fetchStub() });
    const root = container.querySelector(".kv");
    expect(root.style.height).toBe("900px");
    window.innerHeight = 300;
    window.dispatchEvent(new Event("resize"));
    expect(root.style.height).toBe("480px");
    stop();
    container.remove();
  });

  it("keeps the footer inside the scrolling main column so no empty area is left", () => {
    const container = document.createElement("div");
    mount(container, { apiVersion: "1" }, { fetch: fetchStub() });
    const main = container.querySelector(".main");
    expect(main.lastElementChild.tagName).toBe("FOOTER");
    expect(container.querySelector(".kv").textContent).toContain("Nothing is installed or started for you");
  });
});

describe("engines panel", () => {
  it("combines the HTTP probes with the read-only install check into Installed, Running and Missing", async () => {
    const host = bashHost("kamiji_venv=1\nkamiji_kokoro_model=1\nkamiji_qwen_model=1\nkamiji_run=0\nstt_python=1\nstt_server=1\nstt_model=1\nwhisper_cli=1\nwhisper_server=1\nwhisper_model=0\nsay=1\nespeak_ng=0\nffmpeg=1\npiper=0\ndetect_done=1");
    const container = document.createElement("div");
    mount(container, host, { fetch: fetchStub({ kamiji: true }), sleep: instantSleep });
    await flush();
    expect(pillOf(container, "kamiji")).toBe("Running");
    expect(pillOf(container, "stt")).toBe("Installed");
    expect(pillOf(container, "whisper-cpp")).toBe("Missing");
    expect(pillOf(container, "arco")).toBe("Missing");
    expect(pillOf(container, "system")).toBe("Installed");
    expect(pillOf(container, "wake")).toBe("Missing");
    expect(pillOf(container, "clone")).toBe("Missing");
    expect(container.querySelector('[data-engine="kamiji"]').textContent).toContain("3 voices");
    expect(container.querySelector('[data-engine="kamiji"] details pre').textContent).toContain("run.sh start");
  });

  it("asks the Agent Server for the check with one start call and reads the output by command id", async () => {
    const host = bashHost("detect_done=1");
    const out = await runBash(host, "echo hi", { sleep: instantSleep });
    const [start, poll] = host.agentServer.request.mock.calls.map(([a]) => a);
    expect(start).toMatchObject({ method: "POST", path: "/api/bash/start_bash_command", body: { command: "echo hi" } });
    expect(poll.path).toBe("/api/bash/bash_events/search?kind__eq=BashOutput&command_id__eq=cmd-1&sort_order=TIMESTAMP&limit=100");
    expect(out).toMatchObject({ exitCode: 0, stdout: "detect_done=1" });
  });

  it("says detection needs the Agent Server when the host has none, and still probes over HTTP", async () => {
    const container = document.createElement("div");
    const fetch = fetchStub({ kamiji: true });
    mount(container, { apiVersion: "1" }, { fetch, sleep: instantSleep });
    await flush();
    expect(container.textContent).toContain("Detection needs the Agent Server");
    expect(pillOf(container, "kamiji")).toBe("Running");
    expect(pillOf(container, "stt")).toBe("Not checked");
    expect(container.querySelector('[data-action="kamiji:start"]').disabled).toBe(true);
  });

  it("runs the documented start command when Start is pressed, then probes again", async () => {
    const host = bashHost("kamiji_venv=1\nkamiji_kokoro_model=1\nkamiji_run=/opt/kamiji/tools/voice-server/run.sh\ndetect_done=1");
    const container = document.createElement("div");
    const fetch = fetchStub();
    mount(container, host, { fetch, sleep: instantSleep });
    await flush();
    expect(pillOf(container, "kamiji")).toBe("Installed");
    const probesBefore = fetch.mock.calls.length;
    container.querySelector('[data-action="kamiji:start"]').click();
    await flush();
    const posts = host.agentServer.request.mock.calls.map(([a]) => a).filter((a) => a.method === "POST" && a.path === "/api/bash/start_bash_command");
    expect(posts.at(-1).body.command).toBe('"/opt/kamiji/tools/voice-server/run.sh" start');
    expect(fetch.mock.calls.length).toBeGreaterThan(probesBefore);
    expect(container.querySelector(".rail pre").textContent).toContain("run.sh");
  });

  it("builds a detection script that only reads", () => {
    const script = buildDetectScript({ yakopopDir: "~/Documents/github/yakopop" });
    expect(script).not.toMatch(/\b(rm|curl|wget|pip|brew|mv|cp|kill|chmod|sudo|install)\b/);
    expect(script).toContain('"$HOME/Documents/github/yakopop"/tools/stt/server.py');
    expect(buildDetectScript({ yakopopDir: "x; rm -rf /" })).toContain("stt_server=0");
    expect(parseDetectOutput("a=1\nb=0\nkamiji_run=/x/run.sh\nnoise")).toEqual({ a: true, b: false, kamiji_run: "/x/run.sh" });
  });

  it("maps probe and install facts to a status", () => {
    expect(engineStatus({ running: true, installed: false })).toBe("running");
    expect(engineStatus({ installed: true })).toBe("installed");
    expect(engineStatus({ installed: false })).toBe("missing");
    expect(engineStatus({})).toBe("unknown");
  });
});

describe("fallbacks", () => {
  it("states the browser voice and typed input when no engine is running, and still speaks typed text", async () => {
    const container = document.createElement("div");
    mount(container, { apiVersion: "1" }, { fetch: fetchStub(), sleep: instantSleep });
    await flush();
    expect(container.querySelector(".using").textContent).toContain("Using: Browser voice");
    expect(container.querySelector(".using").textContent).toContain("typed input");
    expect(container.querySelector('input[aria-label="Type what you would say"]')).not.toBeNull();
    expect(container.querySelector(".mic").disabled).toBe(true);
    expect(chooseEngine({ pref: "kamiji", kamijiRunning: false })).toBe("browser");
    expect(chooseEngine({ pref: "auto", kamijiRunning: true })).toBe("kamiji");
    expect(chooseListener({ sttRunning: false, recognition: false })).toBe("typed");
    expect(chooseListener({ sttRunning: false, recognition: true })).toBe("browser");
    expect(chooseListener({ sttRunning: true, recognition: true })).toBe("whisper");
  });

  it("switches to the Kamiji voice server and offers Qwen moods only when it answers", async () => {
    const container = document.createElement("div");
    mount(container, { apiVersion: "1" }, { fetch: fetchStub({ kamiji: true, stt: true }), sleep: instantSleep });
    await flush();
    expect(container.querySelector(".using").textContent).toContain("Kamiji voice server");
    expect(container.querySelector(".using").textContent).toContain("Whisper server");
    expect([...container.querySelectorAll(".chip")].map((c) => c.textContent)).toContain("scared");
    expect(withMood("qwen:girl-teen@2", "happy")).toBe("qwen:girl-teen/happy@2");
    expect(withMood("qwen:girl-teen/sad~tone=bright", "")).toBe("qwen:girl-teen~tone=bright");
    expect(withMood("kokoro:af_heart", "happy")).toBe("kokoro:af_heart");
  });
});

describe("lip sync", () => {
  it("parses the x-visemes header and rejects junk", () => {
    expect(parseVisemes('[["aa",0,0.2],["mbp",0.2,0.3],["zz",0.3,0.4]]')).toEqual([{ id: "aa", start: 0, end: 0.2 }, { id: "mbp", start: 0.2, end: 0.3 }, { id: "sil", start: 0.3, end: 0.4 }]);
    expect(parseVisemes("not json")).toBeNull();
    expect(parseVisemes("[]")).toBeNull();
    expect(parseVisemes(null)).toBeNull();
  });

  it("reads the lip-sync headers from the voice server reply", async () => {
    const headers = new Map([["x-visemes", '[["oh",0,0.5]]'], ["x-speech", "[0.1,1.4]"]]);
    const fetchImpl = vi.fn(async () => ({ ok: true, blob: async () => new Blob(["wav"]), headers: { get: (k) => headers.get(k) ?? null } }));
    const clip = await synthesizeClip("Hi.", { url: "http://v", voice: "kokoro:af_heart", lang: "en", speed: 1.2, fetchImpl });
    expect(clip.visemes).toEqual([{ id: "oh", start: 0, end: 0.5 }]);
    expect(clip.speech).toEqual([0.1, 1.4]);
    expect(JSON.parse(fetchImpl.mock.calls[0][1].body)).toMatchObject({ speed: 1.2, lang: "en" });
  });

  it("prefers server visemes, then word boundaries, then the audio level, then a wiggle", () => {
    expect(chooseMouthSource({ speaking: false, hasVisemes: true })).toBe("idle");
    expect(chooseMouthSource({ speaking: true, hasVisemes: true, hasRms: true, sinceBoundaryMs: 10 })).toBe("visemes");
    expect(chooseMouthSource({ speaking: true, sinceBoundaryMs: 100, hasRms: true })).toBe("boundary");
    expect(chooseMouthSource({ speaking: true, sinceBoundaryMs: 2000, hasRms: true })).toBe("audio");
    expect(chooseMouthSource({ speaking: true })).toBe("wiggle");
    const d = createMouthDriver();
    d.start({ visemes: [{ id: "aa", start: 0, end: 1 }], startedAt: 0 });
    expect(d.value(500)).toMatchObject({ source: "visemes", viseme: "aa", open: 1 });
    expect(mouthFromRms(0)).toBe(0);
    expect(mouthFromRms(0.5)).toBe(1);
    expect(mouthFromRms(0.1)).toBeGreaterThan(mouthFromRms(0.05));
    expect(cuteMacro(0.7)).toEqual({ pitch: 1.35, rate: 1.055 });
  });

  it("limits the mouth to open or closed and at most 8 changes a second with reduced motion", () => {
    let n = 0;
    const d = createMouthDriver({ reduced: true, rand: () => (n++ % 2 ? 0.9 : 0) });
    d.start({ startedAt: 0 });
    const seen = [];
    for (let t = 0; t < 1000; t += 10) seen.push(d.value(t).open);
    expect(new Set(seen).size).toBeLessThanOrEqual(2);
    let changes = 0;
    for (let i = 1; i < seen.length; i += 1) if (seen[i] !== seen[i - 1]) changes += 1;
    expect(changes).toBeLessThanOrEqual(8);
  });
});

describe("layout", () => {
  it("remembers the dragged width of the engines column", () => {
    localStorage.removeItem("grip:kosmos-vox");
    const container = document.createElement("div");
    document.body.append(container);
    mount(container, { apiVersion: "1" }, { fetch: fetchStub() });
    const handle = container.querySelector('.grip[data-grip="0"]');
    handle.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    expect(JSON.parse(localStorage.getItem("grip:kosmos-vox"))).toEqual({ 0: 316 });
    container.remove();
  });

  it("gives every solid-background button, chip and pill a readable foreground", () => {
    const container = document.createElement("div");
    mount(container, { apiVersion: "1" }, { fetch: fetchStub() });
    const css = container.querySelector("style").textContent;
    const accent = css.match(/--acc:\s*(#[0-9a-f]{6})/i)[1];
    const lum = (raw) => {
      const hex = raw.length === 4 ? `#${[...raw.slice(1)].map((c) => c + c).join("")}` : raw;
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };
    let checked = 0;
    for (const [, selector, body] of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
      if (!/\.(btn|chip|pill|mic|line)\b/.test(selector)) continue;
      const bg = body.match(/(?:^|[;\s])background:\s*([^;]+);/)?.[1].trim();
      if (!bg || bg === "transparent") continue;
      const fg = body.match(/(?:^|[;\s])color:\s*([^;]+);/)?.[1].trim();
      expect(fg, `${selector.trim()} sets a background but no color`).toBeTruthy();
      const hexBg = bg === "var(--acc)" ? accent : bg;
      if (/^#[0-9a-f]{3,6}$/i.test(hexBg) && /^#[0-9a-f]{3,6}$/i.test(fg)) {
        const [hi, lo] = [lum(hexBg), lum(fg)].sort((a, b) => b - a);
        expect((hi + 0.05) / (lo + 0.05), selector.trim()).toBeGreaterThanOrEqual(4.5);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(6);
  });
});
