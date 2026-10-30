/* Kosmos Vox: voice for your agents. A Modern Telepathy product.
 *
 * Capture the mic, detect when you stop talking, transcribe, send the text to an agent conversation,
 * then speak the reply while an orb's mouth follows the audio. Dependency-free ESM. Styles are scoped
 * under `.kv`; text is set with textContent. Settings live in this browser's localStorage.
 *
 * Kosmos Vox(TM), Kosmos(TM), Kamiji(TM), Kamikin(TM) and Modern Telepathy are marks of Paul Bloch.
 * (c) 2026 Paul Bloch. See NOTICE.md and TRADEMARKS.md. Third-party names (Qwen, Whisper, OpenAI) belong to their owners.
 *
 * Services are external and local by default: speech recognition on any OpenAI-compatible
 * /audio/transcriptions server, speech playback on the Kamiji voice server (Qwen3-TTS) with the
 * browser voice as fallback.
 */

export const BRAND = Object.freeze({
  product: "Kosmos Vox",
  tagline: "Voice for your agents",
  owner: "Paul Bloch",
  maker: "Modern Telepathy",
  copyright: "© 2026 Paul Bloch",
  marks: ["Kosmos Vox", "Kosmos", "Kamiji", "Kamikin", "Modern Telepathy"],
});

const STORAGE_KEY = "kosmos-vox:v1";
export const DEFAULTS = Object.freeze({
  sttUrl: "http://127.0.0.1:4640/v1",
  sttModel: "whisper-1",
  ttsUrl: "http://127.0.0.1:4650",
  ttsVoice: "qwen:girl-teen/happy@2",
  lang: "en",
  silenceMs: 900,
  threshold: 0.05,
  conversationId: "",
  speakReplies: true,
});

// ==== ENGINE START (also copied to kamiji/packages/kosmos-vox/engine.js; keep this block free of UI code) ====

/** Energy voice-activity detector: feed it mic levels (0..1) with a clock; it reports when speech starts and ends. */
export function createVad({ threshold = 0.05, silenceMs = 900, minSpeechMs = 250 } = {}) {
  let speaking = false;
  let since = 0;
  let lastLoud = 0;
  return {
    feed(level, now) {
      if (level >= threshold) {
        lastLoud = now;
        if (!speaking) { speaking = true; since = now; return "start"; }
      } else if (speaking && now - lastLoud >= silenceMs) {
        speaking = false;
        return now - since - silenceMs >= minSpeechMs ? "end" : "cancel";
      }
      return null;
    },
    get speaking() { return speaking; },
    reset() { speaking = false; },
  };
}

/** Splits a reply into sentences so speech can start before the whole reply is synthesised. */
export function splitSentences(text) {
  const clean = String(text || "").replace(/```[\s\S]*?```/g, " code omitted. ").replace(/[`*_#>]+/g, "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  return clean.match(/[^.!?。！？]+[.!?。！？]*/g).map((s) => s.trim()).filter(Boolean);
}

/** Text of an Agent Server message event. */
export function messageText(event) {
  if (!event || event.kind !== "MessageEvent") return "";
  const parts = event.llm_message?.content;
  return Array.isArray(parts) ? parts.map((p) => (p && p.type === "text" ? p.text : "")).join("").trim() : "";
}

/** POST the recording to an OpenAI-compatible transcription endpoint. */
export async function transcribe(blob, { url, model, lang, apiKey, fetchImpl = fetch } = {}) {
  const form = new FormData();
  form.append("file", blob, `speech.${blob.type?.includes("mp4") ? "m4a" : "webm"}`);
  form.append("model", model || "whisper-1");
  if (lang) form.append("language", lang);
  const res = await fetchImpl(`${String(url).replace(/\/+$/, "")}/audio/transcriptions`, { method: "POST", body: form, headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : undefined });
  if (!res.ok) throw new Error(`Speech recognition failed (${res.status}).`);
  const data = await res.json();
  return String(data.text || "").trim();
}

/** Ask the Kamiji voice server (Qwen3-TTS) for audio; returns the WAV blob. */
export async function synthesize(text, { url, voice, lang, fetchImpl = fetch, signal } = {}) {
  const res = await fetchImpl(`${String(url).replace(/\/+$/, "")}/v1/audio/speech`, {
    method: "POST", headers: { "content-type": "application/json" }, signal,
    body: JSON.stringify({ input: text, voice, lang, speed: 1 }),
  });
  if (!res.ok) throw new Error(`Voice server answered ${res.status}.`);
  return res.blob();
}

/** Sends a user message to a conversation and waits for the agent's next message. */
export async function askAgent(host, conversationId, text, { timeoutMs = 120000, pollMs = 1500, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  const base = `/api/conversations/${conversationId}/events`;
  const before = await host.agentServer.request({ path: `${base}/search?limit=1&sort_order=TIMESTAMP_DESC` }).catch(() => null);
  const seen = before?.items?.[0]?.id ?? null;
  await host.agentServer.request({ path: base, method: "POST", body: { role: "user", content: [{ type: "text", text }], run: true } });
  const start = Date.now();
  let lastText = "";
  let stableSince = 0;
  while (Date.now() - start < timeoutMs) {
    await sleep(pollMs);
    const res = await host.agentServer.request({ path: `${base}/search?limit=20&sort_order=TIMESTAMP_DESC` });
    const items = Array.isArray(res?.items) ? res.items : [];
    const fresh = [];
    for (const e of items) { if (e.id === seen) break; fresh.push(e); }
    const reply = fresh.find((e) => e.source !== "user" && messageText(e));
    if (reply) {
      const t = messageText(reply);
      if (t === lastText) { if (Date.now() - stableSince >= pollMs) return t; } else { lastText = t; stableSince = Date.now(); }
    }
  }
  if (lastText) return lastText;
  throw new Error("The agent did not answer in time.");
}

// ==== ENGINE END ====

const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

const CSS = `
.kv { --bg:#14111f; --fg:#f4f1ff; --mut:#9b94b8; --card:#1d1930; --line:#2d2745; --acc:#8b5cf6; font:14px/1.45 system-ui,sans-serif; color:var(--fg); background:var(--bg); min-height:100%; display:flex; flex-direction:column; align-items:center; padding:24px 16px 16px; box-sizing:border-box; }
.kv * { box-sizing:border-box; }
.kv .stage { width:min(320px,70vw); aspect-ratio:1; margin-top:8px; }
.kv canvas { width:100%; height:100%; display:block; }
.kv h1 { font-size:22px; font-weight:400; margin:8px 0 2px; }
.kv .state { color:var(--mut); min-height:20px; }
.kv .state.err { color:#f87171; }
.kv .mic { margin:14px 0 8px; padding:12px 28px; border-radius:999px; border:0; background:#fff; color:#111; font:inherit; font-size:15px; cursor:pointer; }
.kv .mic[aria-pressed="true"] { background:var(--acc); color:#fff; }
.kv .lines { width:min(640px,100%); margin-top:8px; display:flex; flex-direction:column; gap:8px; }
.kv .line { padding:10px 14px; border-radius:14px; background:var(--card); white-space:pre-wrap; }
.kv .line.me { align-self:flex-end; background:var(--acc); }
.kv details { width:min(640px,100%); margin-top:14px; color:var(--mut); }
.kv label { display:grid; grid-template-columns:140px 1fr; gap:8px; align-items:center; margin:6px 0; }
.kv input, .kv select { background:var(--card); color:var(--fg); border:1px solid var(--line); border-radius:8px; padding:6px 8px; font:inherit; min-width:0; }
.kv footer { margin-top:auto; padding-top:24px; text-align:center; color:var(--mut); font-size:12px; max-width:640px; }
.kv footer b { color:var(--fg); font-weight:500; }
@media (prefers-reduced-motion:reduce) { .kv canvas { animation:none; } }
`;

/** The orb: a wobbling blob with pill eyes and a mouth whose opening follows the audio level. */
function createOrb(canvas) {
  const ctx = canvas.getContext?.("2d");
  const o = { level: 0, mood: "idle", t: 0, raf: 0 };
  const W = (canvas.width = 320);
  canvas.height = 320;
  const draw = (ts) => {
    if (!ctx) return;
    o.t = ts / 1000;
    const calm = o.mood === "idle" ? 0.4 : 1;
    const r = 112 + o.level * 14;
    ctx.clearRect(0, 0, W, W);
    ctx.fillStyle = o.mood === "listening" ? "#a78bfa" : o.mood === "thinking" ? "#6366f1" : "#8b5cf6";
    ctx.beginPath();
    for (let i = 0; i <= 64; i += 1) {
      const a = (i / 64) * Math.PI * 2;
      const rr = r + Math.sin(a * 3 + o.t * 1.6) * 4 * calm + Math.sin(a * 5 - o.t * 1.1) * 3 * calm;
      const x = W / 2 + Math.cos(a) * rr;
      const y = W / 2 + 6 + Math.sin(a) * rr;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.fill();
    const blink = Math.sin(o.t * 0.9) > 0.985 ? 0.15 : 1;
    ctx.fillStyle = "#1a0f33";
    [-30, 30].forEach((dx) => { ctx.beginPath(); ctx.roundRect?.(W / 2 + dx - 8, W / 2 - 34, 16, 46 * blink, 8); ctx.fill(); });
    const open = Math.min(1, o.level * 2.2);
    ctx.beginPath();
    ctx.ellipse(W / 2, W / 2 + 54, 18 + open * 8, 3 + open * 16, 0, 0, Math.PI * 2);
    ctx.fill();
    o.raf = requestAnimationFrame(draw);
  };
  o.raf = typeof requestAnimationFrame === "function" ? requestAnimationFrame(draw) : 0;
  o.stop = () => cancelAnimationFrame?.(o.raf);
  return o;
}

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("Kosmos Vox requires Canvas host API 1.");
  return host.registerPage("kosmos-vox", ({ container }) => mount(container, host));
}

function mount(container, host, deps = {}) {
  const root = el("div", "kv");
  container.append(el("style", "", CSS), root);
  let disposed = false;
  const saved = (() => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; } catch { return { ...DEFAULTS }; } })();
  const s = { ...saved, listening: false, status: "Tap the microphone and talk.", error: false, lines: [], conversations: [] };
  const persist = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULTS, ...Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, s[k]])) })); } catch { /* no storage */ } };

  const stage = el("div", "stage");
  const canvas = el("canvas");
  stage.append(canvas);
  const orb = createOrb(canvas);
  const title = el("h1", "", BRAND.product);
  const state = el("div", "state", s.status);
  const mic = el("button", "mic", "Start talking");
  mic.type = "button";
  mic.setAttribute("aria-pressed", "false");
  const lines = el("div", "lines");
  lines.setAttribute("aria-live", "polite");

  const setStatus = (text, error = false, mood) => {
    s.status = text; s.error = error;
    state.textContent = text;
    state.className = `state${error ? " err" : ""}`;
    if (mood) orb.mood = mood;
  };
  const addLine = (who, text) => { const l = el("div", `line ${who}`, text); lines.append(l); l.scrollIntoView?.({ block: "nearest" }); };

  let stream = null, audioCtx = null, analyser = null, recorder = null, chunks = [], raf = 0, vad = null, player = null;

  async function speak(text) {
    const sentences = splitSentences(text);
    if (!sentences.length) return;
    setStatus("Speaking…", false, "speaking");
    for (const sentence of sentences) {
      if (disposed) return;
      try {
        const blob = await (deps.synthesize || synthesize)(sentence, { url: s.ttsUrl, voice: s.ttsVoice, lang: s.lang });
        await playBlob(blob);
      } catch {
        await speakSystem(sentence);
      }
    }
  }

  async function playBlob(blob) {
    audioCtx ||= new AudioContext();
    const buf = await audioCtx.decodeAudioData(await blob.arrayBuffer());
    const src = audioCtx.createBufferSource();
    const an = audioCtx.createAnalyser();
    an.fftSize = 512;
    src.buffer = buf;
    src.connect(an); an.connect(audioCtx.destination);
    const data = new Uint8Array(an.fftSize);
    let live = true;
    const tick = () => { if (!live) return; an.getByteTimeDomainData(data); let sum = 0; for (const v of data) sum += ((v - 128) / 128) ** 2; orb.level = Math.sqrt(sum / data.length) * 2.2; requestAnimationFrame(tick); };
    tick();
    player = src;
    await new Promise((resolve) => { src.onended = resolve; src.start(); });
    live = false; orb.level = 0; player = null;
  }

  function speakSystem(text) {
    return new Promise((resolve) => {
      const synth = globalThis.speechSynthesis;
      if (!synth) { resolve(); return; }
      const u = new SpeechSynthesisUtterance(text);
      u.lang = s.lang;
      const wiggle = setInterval(() => { orb.level = 0.15 + Math.random() * 0.25; }, 90);
      const done = () => { clearInterval(wiggle); orb.level = 0; resolve(); };
      u.onend = done; u.onerror = done;
      synth.speak(u);
    });
  }

  function stopSpeaking() { try { player?.stop(); } catch { /* already stopped */ } globalThis.speechSynthesis?.cancel(); orb.level = 0; }

  async function handleUtterance(blob) {
    try {
      setStatus("Transcribing…", false, "thinking");
      const text = await (deps.transcribe || transcribe)(blob, { url: s.sttUrl, model: s.sttModel, lang: s.lang });
      if (!text) { setStatus("I did not catch that. Try again.", false, "idle"); return; }
      addLine("me", text);
      if (!s.conversationId) { setStatus("Pick a conversation under Settings to get a reply.", true, "idle"); return; }
      setStatus("Thinking…", false, "thinking");
      const reply = await (deps.askAgent || askAgent)(host, s.conversationId, text);
      addLine("agent", reply);
      if (s.speakReplies) await speak(reply);
      setStatus("Tap the microphone and talk.", false, "idle");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Something went wrong.", true, "idle");
    }
  }

  async function startListening() {
    if (s.listening) return;
    stopSpeaking();
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
    } catch {
      setStatus("The microphone is blocked. Allow it for this page, or the Canvas frame may not permit it.", true, "idle");
      return;
    }
    audioCtx ||= new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    chunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    let send = false;
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (send && chunks.length) handleUtterance(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }));
      else setStatus("Tap the microphone and talk.", false, "idle");
    };
    recorder.start();
    vad = createVad({ threshold: s.threshold, silenceMs: s.silenceMs });
    s.listening = true;
    mic.setAttribute("aria-pressed", "true");
    mic.textContent = "Stop";
    setStatus("Listening…", false, "listening");
    const data = new Uint8Array(analyser.fftSize);
    const finish = (doSend) => {
      cancelAnimationFrame(raf);
      s.listening = false; send = doSend; orb.level = 0;
      mic.setAttribute("aria-pressed", "false"); mic.textContent = "Start talking";
      if (recorder.state !== "inactive") recorder.stop();
    };
    stopListening = () => finish(false);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0; for (const v of data) sum += ((v - 128) / 128) ** 2;
      const level = Math.sqrt(sum / data.length);
      orb.level = level * 1.6;
      const ev = vad.feed(level, performance.now());
      if (ev === "end") { finish(true); return; }
      if (ev === "cancel") { chunks = []; }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
  }
  let stopListening = () => {};

  mic.addEventListener("click", () => (s.listening ? stopListening() : startListening()));

  // Settings
  const details = el("details");
  details.append(el("summary", "", "Settings"));
  const field = (label, key, type = "text") => {
    const l = el("label", "", label);
    const i = el("input");
    i.type = type; i.value = String(s[key]);
    i.addEventListener("change", () => { s[key] = type === "number" ? Number(i.value) : i.value.trim(); persist(); });
    l.append(i);
    return l;
  };
  const convoSelect = el("select");
  const fillConversations = () => {
    convoSelect.replaceChildren(new Option("Choose a conversation…", ""));
    s.conversations.forEach((c) => convoSelect.append(new Option(c.title || `Conversation ${String(c.id).slice(0, 6)}`, c.id)));
    convoSelect.value = s.conversationId;
  };
  convoSelect.addEventListener("change", () => { s.conversationId = convoSelect.value; persist(); });
  const convoLabel = el("label", "", "Agent conversation");
  convoLabel.append(convoSelect);
  const speakLabel = el("label", "", "Speak replies");
  const speakBox = el("input"); speakBox.type = "checkbox"; speakBox.checked = s.speakReplies;
  speakBox.addEventListener("change", () => { s.speakReplies = speakBox.checked; persist(); });
  speakLabel.append(speakBox);
  details.append(convoLabel, field("Recognition URL", "sttUrl"), field("Recognition model", "sttModel"), field("Voice server URL", "ttsUrl"), field("Voice", "ttsVoice"), field("Language", "lang"), field("Silence (ms)", "silenceMs", "number"), field("Mic threshold", "threshold", "number"), speakLabel);

  const foot = el("footer");
  const line1 = el("div");
  const b1 = el("b", "", `${BRAND.product}™`);
  line1.append(b1, ` · a ${BRAND.maker} product`);
  const line2 = el("div", "", `${BRAND.copyright}. Kosmos™, Kamiji™ and Kamikin™ are trademarks of ${BRAND.owner}. Third-party names belong to their owners.`);
  foot.append(line1, line2);

  root.append(stage, title, state, mic, lines, details, foot);
  fillConversations();
  host.agentServer?.request({ path: "/api/conversations/search?limit=40" }).then((page) => {
    if (disposed) return;
    s.conversations = Array.isArray(page?.items) ? page.items : [];
    fillConversations();
  }).catch(() => { /* Agent Server not reachable: replies stay off until it is */ });

  return () => { disposed = true; cancelAnimationFrame(raf); orb.stop(); stopSpeaking(); stream?.getTracks().forEach((t) => t.stop()); root.remove(); };
}

export { mount };
