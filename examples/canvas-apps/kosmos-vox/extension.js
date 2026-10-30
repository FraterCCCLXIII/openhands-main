/* Kosmos Vox: voice for your agents. A Modern Telepathy product.
 *
 * A voice workbench for the Kamiji voice stack. Left: which voice engines are installed and running on this machine
 * (with the exact commands to install or start them; nothing is ever installed or started for you). Right: a Kamiji
 * avatar whose mouth follows the speech, the speaking and listening controls, a transcript, and the "talk to the agent"
 * loop (mic, voice-activity detection, speech recognition, an Agent Server conversation, spoken reply).
 * Dependency-free ESM. Styles are scoped under `.kv`; text is set with textContent. Settings live in this browser's
 * localStorage. No audio leaves the machine except to the localhost engines.
 *
 * Kosmos Vox(TM), Kosmos(TM), Kamiji(TM), Kamikin(TM) and Modern Telepathy are marks of Paul Bloch.
 * (c) 2026 Paul Bloch. See NOTICE.md and TRADEMARKS.md. Third-party names (Qwen, Whisper, OpenAI, Kokoro) belong to their owners.
 *
 * Engines are external and local: speech recognition on any OpenAI-compatible /audio/transcriptions server, speech
 * playback on the Kamiji voice server (Kokoro and Qwen3-TTS) with the browser voice as the fallback.
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
  ttsEngine: "auto",
  browserVoice: "",
  speed: 1,
  cute: 0.7,
  qwenMood: "",
  avatar: "creature:cat",
  agentMode: false,
  kamijiDir: "",
  yakopopDir: "~/Documents/github/yakopop",
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

/** The JSON body for the Kamiji voice server's /v1/audio/speech. */
export function buildSpeechBody({ text, voice, lang = "en", speed = 1 } = {}) {
  return { input: text, voice, lang, speed: Number.isFinite(Number(speed)) ? Number(speed) : 1 };
}

/** Ask the Kamiji voice server (Kokoro or Qwen3-TTS) for audio; returns the WAV blob. */
export async function synthesize(text, { url, voice, lang, speed = 1, fetchImpl = fetch, signal } = {}) {
  return (await synthesizeClip(text, { url, voice, lang, speed, fetchImpl, signal })).blob;
}

/** Like `synthesize`, plus the lip-sync headers: `visemes` (Kokoro) and `speech` ([start, end] seconds, Qwen). */
export async function synthesizeClip(text, { url, voice, lang, speed = 1, fetchImpl = fetch, signal } = {}) {
  const res = await fetchImpl(`${String(url).replace(/\/+$/, "")}/v1/audio/speech`, {
    method: "POST", headers: { "content-type": "application/json" }, signal,
    body: JSON.stringify(buildSpeechBody({ text, voice, lang, speed })),
  });
  if (!res.ok) throw new Error(`Voice server answered ${res.status}.`);
  const header = (n) => (typeof res.headers?.get === "function" ? res.headers.get(n) : null);
  return { blob: await res.blob(), visemes: parseVisemes(header("x-visemes")), speech: parseSpeech(header("x-speech")) };
}

export const VISEME_IDS = Object.freeze(["aa", "ee", "ih", "oh", "ou", "fv", "mbp", "sil"]);
/** How open the mouth is for each Kokoro viseme (0..1). */
export const VISEME_OPEN = Object.freeze({ aa: 1, ee: 0.45, ih: 0.4, oh: 0.8, ou: 0.55, fv: 0.2, mbp: 0, sil: 0 });

/** Parses the `x-visemes` header ([[viseme, start, end], ...] in seconds). Returns null when it is missing or unusable. */
export function parseVisemes(header) {
  if (!header) return null;
  let raw;
  try { raw = JSON.parse(header); } catch { return null; }
  if (!Array.isArray(raw)) return null;
  const out = raw
    .filter((r) => Array.isArray(r) && r.length >= 3 && Number.isFinite(Number(r[1])) && Number.isFinite(Number(r[2])) && Number(r[2]) >= Number(r[1]))
    .map((r) => ({ id: VISEME_IDS.includes(r[0]) ? r[0] : "sil", start: Number(r[1]), end: Number(r[2]) }));
  return out.length ? out : null;
}

/** Parses the Qwen `x-speech` header ([start, end] seconds the voice is actually speaking). */
export function parseSpeech(header) {
  if (!header) return null;
  try {
    const r = JSON.parse(header);
    return Array.isArray(r) && r.length >= 2 && Number.isFinite(Number(r[0])) && Number.isFinite(Number(r[1])) ? [Number(r[0]), Number(r[1])] : null;
  } catch { return null; }
}

/** The viseme id playing `t` seconds into the clip. */
export function visemeAt(list, t) {
  if (!list) return "sil";
  for (const v of list) if (t >= v.start && t < v.end) return v.id;
  return "sil";
}

/** Mouth opening (0..1) from the RMS level (0..1) of the audio being played. */
export function mouthFromRms(rms) {
  const n = Number(rms);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, (n - 0.015) * 5));
}

/** The best lip-sync source available right now: server visemes, then word boundaries, then the audio level, then a wiggle. */
export function chooseMouthSource({ speaking = false, hasVisemes = false, sinceBoundaryMs = Infinity, hasRms = false } = {}) {
  if (!speaking) return "idle";
  if (hasVisemes) return "visemes";
  if (sinceBoundaryMs < 350) return "boundary";
  if (hasRms) return "audio";
  return "wiggle";
}

/**
 * The mouth signal: call `start()` when speech begins, `boundary(now)` on word events, `value(now)` every frame.
 * With `reduced` (prefers-reduced-motion) the mouth is only open or closed and changes at most 8 times a second.
 */
export function createMouthDriver({ reduced = false, rand = Math.random } = {}) {
  let speaking = false, visemes = null, t0 = 0, rms = null, lastBoundary = -Infinity;
  let wiggleAt = -Infinity, wiggleVal = 0, shown = 0, shownAt = -Infinity;
  return {
    start({ visemes: v = null, startedAt = 0, rms: r = null } = {}) { speaking = true; visemes = v; t0 = startedAt; rms = r; },
    attachRms(r) { rms = r; },
    boundary(now) { lastBoundary = now; },
    stop() { speaking = false; visemes = null; rms = null; lastBoundary = -Infinity; },
    get speaking() { return speaking; },
    value(now) {
      const source = chooseMouthSource({ speaking, hasVisemes: Boolean(visemes), sinceBoundaryMs: now - lastBoundary, hasRms: typeof rms === "function" });
      let open = 0, viseme = "sil";
      if (source === "visemes") { viseme = visemeAt(visemes, (now - t0) / 1000); open = VISEME_OPEN[viseme] ?? 0; }
      else if (source === "boundary") { open = 0.15 + 0.75 * Math.max(0, 1 - (now - lastBoundary) / 220); viseme = open > 0.6 ? "aa" : "ih"; }
      else if (source === "audio") { open = mouthFromRms(rms()); viseme = open > 0.6 ? "aa" : open > 0.2 ? "ih" : "sil"; }
      else if (source === "wiggle") {
        if (now - wiggleAt >= 110) { wiggleAt = now; wiggleVal = 0.12 + rand() * 0.55; }
        open = wiggleVal; viseme = open > 0.4 ? "aa" : "ih";
      }
      if (reduced) {
        if (now - shownAt >= 125) { const next = open > 0.3 ? 1 : 0; if (next !== shown) { shown = next; shownAt = now; } }
        open = shown;
      }
      return { open, viseme, source };
    },
  };
}

/** The "cute" macro from the Kamiji voice layer: one slider moves pitch and rate together. */
export function cuteMacro(cute) {
  const c = Math.max(0, Math.min(1, Number.isFinite(Number(cute)) ? Number(cute) : 0.7));
  return { pitch: +(1 + 0.5 * c).toFixed(2), rate: +(0.95 + 0.15 * c).toFixed(3) };
}

/** Sets the Qwen mood in a voice id: `qwen:girl-teen@2` + happy => `qwen:girl-teen/happy@2`. Other voices are returned unchanged. */
export function withMood(voice, mood) {
  const m = /^(qwen:[^/@~]+)(?:\/[^@~]*)?(.*)$/.exec(String(voice || ""));
  if (!m) return voice;
  return mood ? `${m[1]}/${mood}${m[2]}` : `${m[1]}${m[2]}`;
}

/** `GET /v1/voices` => a deduplicated list of voice ids (Qwen moods collapse into their base voice). */
export function listVoices(data) {
  const raw = Array.isArray(data?.voices) ? data.voices.filter((v) => typeof v === "string") : [];
  const seen = new Set();
  const out = [];
  for (const v of raw) {
    const id = v.startsWith("qwen:") ? v.replace(/^(qwen:[^/@~]+).*$/, "$1") : v;
    if (!seen.has(id)) { seen.add(id); out.push(id); }
  }
  return out;
}

/** Which speech engine to use: Auto picks the Kamiji voice server when it answers, otherwise the browser voice. */
export function chooseEngine({ pref = "auto", kamijiRunning = false } = {}) {
  if (pref === "browser") return "browser";
  if (pref === "kamiji") return kamijiRunning ? "kamiji" : "browser";
  return kamijiRunning ? "kamiji" : "browser";
}

/** Which way to listen: the Whisper server when it answers, then the browser, then typing. */
export function chooseListener({ sttRunning = false, recognition = false } = {}) {
  if (sttRunning) return "whisper";
  if (recognition) return "browser";
  return "typed";
}

/** Running, installed, missing, or unknown (not checked). Running wins; installed only counts when detection ran. */
export function engineStatus({ running = false, installed } = {}) {
  if (running) return "running";
  if (installed === true) return "installed";
  if (installed === false) return "missing";
  return "unknown";
}

/** Probes an HTTP endpoint with a short timeout. `opaque` uses no-cors, for servers that send no CORS headers (up or down is all we learn). */
export async function probeUrl(url, { fetchImpl = fetch, timeoutMs = 1500, opaque = false } = {}) {
  const ctl = typeof AbortController === "function" ? new AbortController() : null;
  const timer = setTimeout(() => ctl?.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const res = await fetchImpl(url, { signal: ctl?.signal, ...(opaque ? { mode: "no-cors" } : {}) });
    if (!opaque && res && res.ok === false) return { ok: false, ms: Date.now() - t0, data: null };
    let data = null;
    if (!opaque && typeof res?.json === "function") { try { data = await res.json(); } catch { data = null; } }
    return { ok: true, ms: Date.now() - t0, data };
  } catch {
    return { ok: false, ms: Date.now() - t0, data: null };
  } finally {
    clearTimeout(timer);
  }
}

/** "~/x" => `$HOME/x`, quoted for sh. Returns null for anything with characters that could break the quoting. */
export function shellPath(p) {
  const raw = String(p || "").trim().replace(/\/+$/, "");
  if (!raw || /[^\w ./~@+-]/.test(raw)) return null;
  const abs = raw === "~" ? "$HOME" : raw.startsWith("~/") ? `$HOME/${raw.slice(2)}` : raw;
  return `"${abs}"`;
}

/** The read-only script that checks what is installed. It prints `key=1`, `key=0` or `key=<path>` lines and never changes anything. */
export function buildDetectScript({ yakopopDir = DEFAULTS.yakopopDir, kamijiDir = "" } = {}) {
  const yk = shellPath(yakopopDir);
  const km = shellPath(kamijiDir);
  const lines = [
    '[ -n "$ZSH_VERSION" ] && setopt nonomatch 2>/dev/null',
    'export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"',
    'f(){ [ -e "$2" ] && echo "$1=1" || echo "$1=0"; }',
    'x(){ [ -x "$2" ] && echo "$1=1" || echo "$1=0"; }',
    'c(){ command -v "$2" >/dev/null 2>&1 && echo "$1=1" || echo "$1=0"; }',
    'HF="$HOME/.cache/huggingface/hub"',
    'x kamiji_venv "$HOME/.kamiji-voice/venv/bin/python"',
    'f kamiji_kokoro_model "$HF/models--speaches-ai--Kokoro-82M-v1.0-ONNX"',
    'f kamiji_qwen_model "$HF/models--mlx-community--Qwen3-TTS-12Hz-1.7B-Base-4bit"',
    'R=0; for p in ' + (km ? `${km}/tools/voice-server/run.sh ` : "") + '"$HOME"/Documents/github/*/tools/voice-server/run.sh "$HOME"/Documents/github/*/*/tools/voice-server/run.sh "$HOME"/Kosmos/*/tools/voice-server/run.sh; do [ -f "$p" ] && { R="$p"; break; }; done; echo "kamiji_run=$R"',
    'x stt_python "$HOME/Kosmos/voice-server/.venv/bin/python"',
    yk ? `f stt_server ${yk}/tools/stt/server.py` : "echo stt_server=0",
    'f stt_model "$HF/models--deepdml--faster-whisper-large-v3-turbo-ct2"',
    "c whisper_cli whisper-cli",
    "c whisper_server whisper-server",
    'f whisper_model "$HOME/.cache/whisper/ggml-base.en.bin"',
    'f arco_bot "$HOME/Kosmos/voice-server/bot.py"',
    "c say say",
    "c espeak_ng espeak-ng",
    "c ffmpeg ffmpeg",
    "c piper piper",
    "echo detect_done=1",
  ];
  return lines.join("\n");
}

/** Turns the detect script's output into `{ key: true | false | "<path>" }`. */
export function parseDetectOutput(text) {
  const out = {};
  for (const line of String(text || "").split(/\r?\n/)) {
    const m = /^([a-z][a-z0-9_]*)=(.*)$/.exec(line.trim());
    if (!m) continue;
    out[m[1]] = m[2] === "1" ? true : m[2] === "0" ? false : m[2];
  }
  return out;
}

/** Runs a shell command through the Agent Server and waits for it to finish. Resolves `{ exitCode, stdout, stderr }`. */
export async function runBash(host, command, { cwd, timeout = 60, pollMs = 600, maxPolls = 40, sleep = (ms) => new Promise((r) => setTimeout(r, ms)) } = {}) {
  if (!host?.agentServer?.request) throw new Error("Detection needs the Agent Server.");
  const started = await host.agentServer.request({ method: "POST", path: "/api/bash/start_bash_command", body: cwd ? { command, cwd, timeout } : { command, timeout } });
  const id = started?.id;
  if (!id) throw new Error("The Agent Server did not return a command id.");
  for (let i = 0; i < maxPolls; i += 1) {
    await sleep(pollMs);
    const page = await host.agentServer.request({ path: `/api/bash/bash_events/search?kind__eq=BashOutput&command_id__eq=${encodeURIComponent(id)}&sort_order=TIMESTAMP&limit=100` });
    const items = (Array.isArray(page?.items) ? page.items : []).filter((e) => e.kind === "BashOutput").sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    const last = items[items.length - 1];
    if (last && last.exit_code !== null && last.exit_code !== undefined) {
      return { exitCode: last.exit_code, stdout: items.map((e) => e.stdout || "").join(""), stderr: items.map((e) => e.stderr || "").join("") };
    }
  }
  throw new Error("The command did not finish in time.");
}

/** The documented commands for each engine. `null` when something needed (a folder) is not known. */
export function engineCommands({ kamijiRun = null, yakopopDir = DEFAULTS.yakopopDir } = {}) {
  const run = kamijiRun ? `"${kamijiRun}"` : null;
  const yk = shellPath(yakopopDir);
  return {
    kamijiStart: run && `${run} start`,
    kamijiStop: run && `${run} stop`,
    kamijiStatus: run && `${run} status`,
    sttStart: yk && `cd ${yk} && nohup "$HOME/Kosmos/voice-server/.venv/bin/python" tools/stt/server.py --port 4640 > "$HOME/.kosmos-vox-stt.log" 2>&1 & echo $! > "$HOME/.kosmos-vox-stt.pid"; echo "started whisper server (pid $(cat "$HOME/.kosmos-vox-stt.pid")), the first request loads the model"`,
    sttStop: '[ -f "$HOME/.kosmos-vox-stt.pid" ] && kill "$(cat "$HOME/.kosmos-vox-stt.pid")" && rm -f "$HOME/.kosmos-vox-stt.pid" && echo stopped || echo "nothing to stop (only a server started from here can be stopped from here)"',
  };
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

/**
 * Drag handles for the outer columns of a page's grid (a left list and/or a right panel).
 *
 * `columns` is a list of `{ el, edge, min, max, initial, label }`: `el` is the column's element,
 * `edge` is "left" for a column on the left side (its handle sits on its right edge) or "right"
 * for one on the right side. The app's CSS must read each width from a variable, for example
 * `grid-template-columns: var(--grip-0, 300px) minmax(0, 1fr) var(--grip-1, 280px)`, where the
 * number is the column's position in the `columns` list. Widths are saved per `storageKey`.
 * Call `refresh()` after the app shows or hides a column; call `dispose()` on unmount.
 */
function gripColumns({ grid, columns, storageKey, centerMin = 320, narrowQuery = "(max-width: 720px)" }) {
  const win = grid.ownerDocument.defaultView || globalThis;
  const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
  const saved = (() => {
    try { return JSON.parse(win.localStorage.getItem(storageKey) || "{}") || {}; } catch { return {}; }
  })();
  const widths = columns.map((c, i) => (Number.isFinite(saved[i]) ? clamp(saved[i], c.min, c.max) : c.initial));
  const handles = [];
  const cleanups = [];

  const narrow = () => Boolean(win.matchMedia && win.matchMedia(narrowQuery).matches);
  const shown = (i) => !narrow() && columns[i].el.isConnected && win.getComputedStyle(columns[i].el).display !== "none";
  const save = () => { try { win.localStorage.setItem(storageKey, JSON.stringify(Object.fromEntries(widths.map((w, i) => [i, w])))); } catch { /* storage unavailable */ } };
  // The widest a column may get while the middle keeps `centerMin` and the other grips keep their widths.
  const limit = (i) => {
    const total = grid.clientWidth;
    if (!total) return columns[i].max;
    const others = widths.reduce((sum, w, j) => (j !== i && shown(j) ? sum + w : sum), 0);
    return clamp(total - others - centerMin, columns[i].min, columns[i].max);
  };

  function apply() {
    columns.forEach((c, i) => {
      if (narrow()) grid.style.removeProperty(`--grip-${i}`);
      else grid.style.setProperty(`--grip-${i}`, `${widths[i]}px`);
      const h = handles[i];
      h.hidden = !shown(i);
      h.setAttribute("aria-valuenow", String(Math.round(widths[i])));
      h.setAttribute("aria-valuemax", String(Math.round(limit(i))));
    });
  }

  function set(i, width, persist = true) {
    widths[i] = clamp(Math.round(width), columns[i].min, limit(i));
    apply();
    if (persist) save();
  }

  columns.forEach((c, i) => {
    const h = grid.ownerDocument.createElement("div");
    h.className = `grip grip-${c.edge}`;
    h.dataset.grip = String(i);
    h.setAttribute("role", "separator");
    h.setAttribute("aria-orientation", "vertical");
    h.setAttribute("aria-label", `Resize ${c.label || "column"}`);
    h.setAttribute("aria-valuemin", String(c.min));
    h.tabIndex = 0;
    h.style[c.edge === "left" ? "left" : "right"] = `var(--grip-${i}, ${c.initial}px)`;
    const dir = c.edge === "left" ? 1 : -1;
    let startX = 0;
    let startW = 0;
    const move = (e) => { set(i, startW + dir * (e.clientX - startX), false); };
    const up = () => {
      grid.classList.remove("gripping");
      h.classList.remove("on");
      grid.ownerDocument.removeEventListener("pointermove", move);
      grid.ownerDocument.removeEventListener("pointerup", up);
      save();
    };
    h.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      startX = e.clientX;
      startW = widths[i];
      grid.classList.add("gripping");
      h.classList.add("on");
      grid.ownerDocument.addEventListener("pointermove", move);
      grid.ownerDocument.addEventListener("pointerup", up);
    });
    h.addEventListener("keydown", (e) => {
      const step = e.shiftKey ? 64 : 16;
      const grow = (e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0) * dir;
      if (grow) set(i, widths[i] + grow * step);
      else if (e.key === "Home") set(i, c.min);
      else if (e.key === "End") set(i, limit(i));
      else return;
      e.preventDefault();
    });
    h.addEventListener("dblclick", () => set(i, c.initial));
    cleanups.push(() => { grid.ownerDocument.removeEventListener("pointermove", move); grid.ownerDocument.removeEventListener("pointerup", up); h.remove(); });
    handles.push(h);
    grid.append(h);
  });

  win.addEventListener("resize", apply);
  cleanups.push(() => win.removeEventListener("resize", apply));
  apply();
  return { refresh: apply, widths: () => [...widths], dispose: () => cleanups.forEach((fn) => fn()) };
}

/** CSS for the handles; add it to the app's stylesheet and make the grid `position: relative`. */
const GRIP_CSS = `
.grip { position: absolute; top: 0; bottom: 0; width: 11px; z-index: 6; cursor: col-resize; touch-action: none; outline: 0; }
.grip-left { transform: translateX(-50%); }
.grip-right { transform: translateX(50%); }
.grip::after { content: ""; position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; margin-left: -1px; border-radius: 2px; background: transparent; transition: background .12s; }
.grip:hover::after, .grip:focus-visible::after, .grip.on::after { background: var(--oh-color-primary, #7c9dff); }
.gripping { user-select: none; cursor: col-resize; }
.gripping * { pointer-events: none; }
.gripping .grip { pointer-events: auto; }
@media (max-width: 720px) { .grip { display: none; } }
`;


const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};
const btn = (label, cls, fn) => { const b = el("button", `btn ${cls || ""}`.trim(), label); b.type = "button"; if (fn) b.addEventListener("click", fn); return b; };
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));

const CSS = `
.kv { --bg:var(--oh-color-base,#14111f); --fg:var(--oh-foreground,#f4f1ff); --mut:var(--oh-muted,#a39dc2); --card:var(--oh-color-base-secondary,#1d1930); --line:var(--oh-border-subtle,#2d2745); --acc:#7c3aed; --err:var(--oh-color-danger,#f87171);
  font:14px/1.45 system-ui,sans-serif; color:var(--fg); background:var(--bg); height:100%; min-height:480px; overflow:hidden; position:relative; box-sizing:border-box;
  display:grid; grid-template-columns:var(--grip-0,300px) minmax(0,1fr); grid-template-rows:minmax(0,1fr); }
.kv * { box-sizing:border-box; }
.kv [hidden] { display:none !important; }
.kv .rail { min-width:0; min-height:0; overflow:auto; padding:14px 12px; border-right:1px solid var(--line); display:flex; flex-direction:column; gap:8px; background:var(--bg); color:var(--fg); }
.kv .main { min-width:0; min-height:0; overflow:auto; padding:16px 18px 12px; display:flex; flex-direction:column; gap:12px; background:var(--bg); color:var(--fg); }
.kv .main > * { flex:none; }
.kv h1 { font-size:22px; font-weight:400; margin:0; }
.kv h2 { font-size:15px; font-weight:600; margin:0; }
.kv h3 { font-size:11px; font-weight:600; letter-spacing:.06em; text-transform:uppercase; color:var(--mut); margin:8px 0 0; }
.kv .head { display:flex; align-items:center; justify-content:space-between; gap:8px; color:var(--fg); }
.kv .note { color:var(--mut); font-size:12px; margin:0; }
.kv .note.err, .kv .state.err { color:var(--err); }
.kv .state { color:var(--mut); min-height:20px; }
.kv .using { color:var(--fg); font-weight:500; }
.kv .btn { font:inherit; font-size:13px; padding:6px 12px; border-radius:8px; border:1px solid var(--line); background:var(--card); color:var(--fg); cursor:pointer; }
.kv .btn:disabled { opacity:.5; cursor:not-allowed; }
.kv .btn.pri { background:var(--acc); border-color:var(--acc); color:#fff; }
.kv .btn.danger { background:#b91c1c; border-color:#b91c1c; color:#fff; }
.kv .mic { padding:10px 24px; border-radius:999px; font-size:15px; border:0; background:#fff; color:#111; }
.kv .mic[aria-pressed="true"] { background:var(--acc); color:#fff; }
.kv .chip { font:inherit; font-size:12px; padding:4px 10px; border-radius:999px; border:1px solid var(--line); background:var(--card); color:var(--fg); cursor:pointer; }
.kv .chip[aria-pressed="true"] { background:var(--acc); border-color:var(--acc); color:#fff; }
.kv .chips { display:flex; flex-wrap:wrap; gap:6px; }
.kv .pill { display:inline-block; font-size:11px; font-weight:600; padding:2px 8px; border-radius:999px; background:#6b7280; color:#fff; white-space:nowrap; }
.kv .pill.running { background:#15803d; color:#fff; }
.kv .pill.installed { background:#1d4ed8; color:#fff; }
.kv .pill.missing { background:#4b5563; color:#fff; }
.kv .erow { border:1px solid var(--line); border-radius:10px; padding:8px 10px; background:var(--card); color:var(--fg); display:flex; flex-direction:column; gap:4px; }
.kv .erow .top { display:flex; align-items:center; justify-content:space-between; gap:8px; font-weight:600; }
.kv .erow .acts { display:flex; flex-wrap:wrap; gap:6px; margin-top:2px; }
.kv .erow .meta, .kv .erow .desc { font-size:12px; color:var(--mut); margin:0; overflow-wrap:anywhere; }
.kv .ipanel { border:1px solid var(--line); border-radius:8px; padding:8px 10px; background:var(--bg); color:var(--fg); display:flex; flex-direction:column; gap:6px; }
.kv .ipanel ol { margin:0; padding-left:20px; display:flex; flex-direction:column; gap:8px; }
.kv .ipanel li { font-size:12px; color:var(--fg); }
.kv .ipanel .code { display:flex; flex-direction:column; gap:4px; align-items:flex-start; margin-top:4px; }
.kv .ipanel .code pre { align-self:stretch; margin:0; }
.kv .ipanel a { color:var(--fg); text-decoration:underline; overflow-wrap:anywhere; }
.kv .ipanel ul { margin:0; padding-left:18px; font-size:12px; }
.kv .ipanel .btn { font-size:12px; padding:3px 10px; }
.kv .sr { position:absolute; width:1px; height:1px; overflow:hidden; clip:rect(0 0 0 0); white-space:nowrap; }
.kv details { color:var(--mut); }
.kv details summary { cursor:pointer; font-size:12px; }
.kv pre { margin:6px 0 0; padding:8px; border-radius:8px; background:var(--bg); color:var(--fg); border:1px solid var(--line); font:11px/1.4 ui-monospace,Menlo,monospace; white-space:pre-wrap; overflow-wrap:anywhere; max-height:220px; overflow:auto; user-select:text; }
.kv .card { border:1px solid var(--line); border-radius:12px; padding:12px 14px; background:var(--card); color:var(--fg); display:flex; flex-direction:column; gap:8px; }
.kv .stagecard { align-items:center; }
.kv .stage { width:min(260px,60vw); aspect-ratio:1; }
.kv .stage svg, .kv .stage canvas { width:100%; height:100%; display:block; }
.kv .row { display:flex; flex-wrap:wrap; gap:8px 14px; align-items:center; }
.kv label.f { display:grid; gap:2px; font-size:12px; color:var(--mut); min-width:0; }
.kv input, .kv select, .kv textarea { background:var(--bg); color:var(--fg); border:1px solid var(--line); border-radius:8px; padding:6px 8px; font:inherit; min-width:0; }
.kv textarea { width:100%; min-height:56px; resize:vertical; }
.kv input[type=range] { padding:0; }
.kv .meter { height:6px; width:140px; border-radius:3px; background:var(--line); overflow:hidden; }
.kv .meter > i { display:block; height:100%; width:0; background:var(--acc); }
.kv .lines { display:flex; flex-direction:column; gap:6px; max-height:220px; overflow:auto; }
.kv .line { padding:8px 12px; border-radius:12px; background:var(--bg); color:var(--fg); border:1px solid var(--line); white-space:pre-wrap; max-width:90%; }
.kv .line.me { align-self:flex-end; background:var(--acc); border-color:var(--acc); color:#fff; }
.kv .diag { font-size:12px; color:var(--mut); }
.kv footer { margin-top:auto; padding-top:16px; text-align:center; color:var(--mut); font-size:12px; }
.kv footer b { color:var(--fg); font-weight:500; }
.kv .built { color:var(--mut); font-size:12px; text-align:center; margin:0; }
@media (max-width:720px) {
  .kv { display:block; overflow:auto; }
  .kv .rail { border-right:0; border-bottom:1px solid var(--line); overflow:visible; }
  .kv .main { overflow:visible; }
}
@media (prefers-reduced-motion:reduce) { .kv canvas { animation:none; } }
` + GRIP_CSS;

// ---- Avatars: dependency-free 2D drawings with a mouth the driver moves (ideas from the Kamiji and Meet apps) ----

export const PLANS = Object.freeze({
  slime: { label: "Slime", ears: "none", tail: "none", horns: false, body: "#7dd3fc", belly: "#e0f2fe", accent: "#38bdf8" },
  cat: { label: "Cat", ears: "pointy", tail: "long", horns: false, body: "#fbbf24", belly: "#fef3c7", accent: "#f59e0b" },
  fox: { label: "Fox", ears: "pointy", tail: "fluffy", horns: false, body: "#fb923c", belly: "#ffedd5", accent: "#ea580c" },
  bunny: { label: "Bunny", ears: "long", tail: "short", horns: false, body: "#f9a8d4", belly: "#fdf2f8", accent: "#ec4899" },
  bear: { label: "Bear", ears: "round", tail: "short", horns: false, body: "#a8a29e", belly: "#e7e5e4", accent: "#78716c" },
  dragon: { label: "Dragon", ears: "none", tail: "long", horns: true, body: "#86efac", belly: "#dcfce7", accent: "#22c55e" },
});
const EYES = "#1f1235";
const EXPR_FOR_MOOD = { idle: "happy", listening: "surprised", thinking: "sleepy", speaking: "happy" };

function eyeMarkup(cx, eyeY, dx, r, expr) {
  return [-1, 1].map((s) => {
    const x = cx + s * dx;
    if (expr === "sleepy") return `<path d="M${x - r} ${eyeY} Q${x} ${eyeY + r * 0.9} ${x + r} ${eyeY}" fill="none" stroke="${EYES}" stroke-width="4" stroke-linecap="round"/>`;
    if (expr === "happy") return `<path d="M${x - r} ${eyeY + 3} Q${x} ${eyeY - r * 1.3} ${x + r} ${eyeY + 3}" fill="none" stroke="${EYES}" stroke-width="4.5" stroke-linecap="round"/>`;
    const rr = expr === "surprised" ? r * 1.25 : r;
    return `<ellipse cx="${x}" cy="${eyeY}" rx="${rr * 0.82}" ry="${rr * 1.15}" fill="${EYES}"/><circle cx="${x + 2}" cy="${eyeY - rr * 0.4}" r="${Math.max(2, rr * 0.3)}" fill="#fff"/>`;
  }).join("");
}
/** A smile when closed and an ellipse when open; `setMouth` moves them. */
const mouthMarkup = (cx, my) => `<path class="m-closed" d="M${cx - 13} ${my} Q${cx} ${my + 14} ${cx + 13} ${my}" fill="none" stroke="${EYES}" stroke-width="3.5" stroke-linecap="round"/><ellipse class="m-open" cx="${cx}" cy="${my + 6}" rx="9" ry="6" fill="${EYES}" style="display:none"/>`;

/** The creature as an SVG string (300x300) with a mouth group. Pure, so it is testable. */
export function creatureMarkup(plan, expr = "happy") {
  const p = PLANS[plan] || PLANS.slime;
  const cx = 150, cy = 176, rx = 76, ry = 68, topY = cy - ry, eyeY = cy - ry * 0.18;
  const acc = `fill="${p.accent}"`;
  const parts = [];
  if (p.tail === "fluffy") parts.push(`<ellipse ${acc} cx="${cx + rx * 0.85 + 30}" cy="${cy + ry * 0.55 - 26}" rx="22" ry="40" transform="rotate(28 ${cx + rx * 0.85 + 30} ${cy + ry * 0.55 - 26})"/>`);
  else if (p.tail === "long") parts.push(`<path d="M${cx + rx * 0.85 - 6} ${cy + ry * 0.55} Q${cx + rx * 0.85 + 60} ${cy + ry * 0.55 + 6} ${cx + rx * 0.85 + 52} ${cy + ry * 0.55 - 54}" fill="none" stroke="${p.accent}" stroke-width="13" stroke-linecap="round"/>`);
  else if (p.tail === "short") parts.push(`<circle ${acc} cx="${cx + rx * 0.85 + 8}" cy="${cy + ry * 0.55 - 4}" r="13"/>`);
  [-1, 1].forEach((sd) => {
    const x = cx + sd * rx * 0.62;
    if (p.ears === "round") parts.push(`<circle ${acc} cx="${x}" cy="${topY + 8}" r="${rx * 0.26}"/>`);
    if (p.ears === "pointy") parts.push(`<path ${acc} d="M${x - sd * 26} ${topY + 22} L${x + sd * 4} ${topY - 38} L${x + sd * 30} ${topY + 18} Z"/>`);
    if (p.ears === "long") parts.push(`<ellipse ${acc} cx="${x}" cy="${topY - 34}" rx="${rx * 0.17}" ry="${rx * 0.62}" transform="rotate(${sd * 8} ${x} ${topY})"/>`);
    if (p.horns) { const hx = cx + sd * rx * 0.36; parts.push(`<path d="M${hx - 9} ${topY + 12} L${hx + sd * 3} ${topY - 26} L${hx + 11} ${topY + 12} Z" fill="#f5f0e6"/>`); }
  });
  parts.push(`<ellipse ${acc} cx="${cx - rx * 0.4}" cy="${cy + ry - 2}" rx="${rx * 0.22}" ry="9"/><ellipse ${acc} cx="${cx + rx * 0.4}" cy="${cy + ry - 2}" rx="${rx * 0.22}" ry="9"/>`);
  parts.push(`<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${p.body}"/><ellipse cx="${cx}" cy="${cy + ry * 0.38}" rx="${rx * 0.58}" ry="${ry * 0.5}" fill="${p.belly}" opacity="0.9"/>`);
  parts.push(eyeMarkup(cx, eyeY, 27, 9, expr), mouthMarkup(cx, eyeY + 24));
  parts.push(`<ellipse cx="${cx - 39}" cy="${eyeY + 17}" rx="9" ry="5.5" ${acc} opacity="0.35"/><ellipse cx="${cx + 39}" cy="${eyeY + 17}" rx="9" ry="5.5" ${acc} opacity="0.35"/>`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" role="img" aria-label="${p.label} Kamiji">${parts.join("")}</svg>`;
}

/** A simple hand with a face on the palm; the mouth has closed, open, "O" and smile states, like the Kamiji hand. */
export function handMarkup(expr = "happy") {
  const skin = "#fcd9b6", edge = "#e8b98a";
  const fingers = [[84, 40, -10], [118, 22, -3], [152, 22, 3], [186, 40, 10]].map(([x, y, r]) => `<rect x="${x - 15}" y="${y}" width="30" height="96" rx="15" fill="${skin}" stroke="${edge}" stroke-width="2" transform="rotate(${r} ${x} ${y + 90})"/>`).join("");
  const thumb = `<rect x="30" y="130" width="30" height="86" rx="15" fill="${skin}" stroke="${edge}" stroke-width="2" transform="rotate(-48 45 200)"/>`;
  const palm = `<rect x="64" y="100" width="172" height="170" rx="62" fill="${skin}" stroke="${edge}" stroke-width="2"/>`;
  const face = `${eyeMarkup(150, 168, 30, 9, expr)}${mouthMarkup(150, 200)}<ellipse cx="108" cy="190" rx="10" ry="6" fill="#f472b6" opacity="0.35"/><ellipse cx="192" cy="190" rx="10" ry="6" fill="#f472b6" opacity="0.35"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" role="img" aria-label="Kamiji hand">${thumb}${fingers}${palm}${face}</svg>`;
}

/** Moves the `.m-closed` / `.m-open` pair of an avatar SVG. */
function applyMouth(svg, open, viseme) {
  const closed = svg.querySelector(".m-closed");
  const o = svg.querySelector(".m-open");
  if (!closed || !o) return;
  if (open < 0.08) { closed.style.display = ""; o.style.display = "none"; return; }
  const round = viseme === "oh" || viseme === "ou";
  const wide = viseme === "ee" || viseme === "ih";
  closed.style.display = "none";
  o.style.display = "";
  o.setAttribute("rx", String(round ? 5 + open * 4 : wide ? 10 + open * 8 : 8 + open * 7));
  o.setAttribute("ry", String(2 + open * (round ? 12 : 14)));
}

/** The Flux blob (as in the Meet app) with a mouth that follows the signal. */
function fluxAvatar() {
  const canvas = document.createElement("canvas");
  canvas.width = 240; canvas.height = 240;
  canvas.setAttribute("role", "img"); canvas.setAttribute("aria-label", "A Flux Kamiji");
  const ctx = canvas.getContext ? canvas.getContext("2d") : null;
  const st = { open: 0, viseme: "sil", raf: 0, alive: true };
  const still = typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const W = 240;
  const draw = (ms) => {
    if (!st.alive || !ctx) return;
    const t = ms / 1000;
    ctx.clearRect(0, 0, W, W);
    const R = 76 + Math.sin(t * 1.4) * 3 + st.open * 6;
    const hue = 250 + Math.sin(t * 0.5) * 70;
    const g = ctx.createRadialGradient(W / 2 - 24, W / 2 - 30, 10, W / 2, W / 2, R + 30);
    g.addColorStop(0, `hsl(${hue + 80} 90% 68%)`); g.addColorStop(0.55, `hsl(${hue} 85% 60%)`); g.addColorStop(1, `hsl(${hue - 60} 80% 52%)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i <= 72; i += 1) {
      const a = (i / 72) * Math.PI * 2;
      const r = R + Math.sin(a * 3 + t * 1.7) * 5 + Math.sin(a * 5 - t * 1.2) * 3;
      const x = W / 2 + Math.cos(a) * r, y = W / 2 + Math.sin(a) * r;
      if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y);
    }
    ctx.fill();
    const blink = Math.sin(t * 0.8) > 0.985 ? 0.12 : 1;
    ctx.fillStyle = EYES;
    [-24, 24].forEach((dx) => { ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(W / 2 + dx - 8, W / 2 - 40, 16, 40 * blink, 8); else ctx.rect(W / 2 + dx - 8, W / 2 - 40, 16, 40 * blink); ctx.fill(); });
    ctx.beginPath();
    ctx.ellipse(W / 2, W / 2 + 28, 12 + st.open * 8, 3 + st.open * 15, 0, 0, Math.PI * 2);
    ctx.fill();
    if (!still || st.open > 0) st.raf = requestAnimationFrame(draw);
  };
  if (typeof requestAnimationFrame === "function") st.raf = requestAnimationFrame(draw);
  return {
    node: canvas,
    setMouth(open, viseme) { st.open = open; st.viseme = viseme; if (still && typeof requestAnimationFrame === "function") { cancelAnimationFrame(st.raf); st.raf = requestAnimationFrame(draw); } },
    setMood() {},
    dispose() { st.alive = false; cancelAnimationFrame?.(st.raf); },
  };
}

/** `kind` is "creature:<plan>", "hand" or "flux". */
export function createAvatar(kind) {
  if (kind === "flux") return fluxAvatar();
  const holder = el("div");
  holder.style.cssText = "width:100%;height:100%";
  let expr = "happy", last = { open: 0, viseme: "sil" };
  const markup = () => (kind === "hand" ? handMarkup(expr) : creatureMarkup(String(kind).split(":")[1], expr));
  const paint = () => { holder.innerHTML = markup(); const svg = holder.querySelector("svg"); if (svg) applyMouth(svg, last.open, last.viseme); };
  paint();
  return {
    node: holder,
    setMouth(open, viseme) {
      const q = Math.round(open * 20) / 20;
      if (q === last.open && viseme === last.viseme) return;
      last = { open: q, viseme };
      const svg = holder.querySelector("svg");
      if (svg) applyMouth(svg, q, viseme);
    },
    setMood(mood) { const next = EXPR_FOR_MOOD[mood] || "happy"; if (next !== expr) { expr = next; paint(); } },
    dispose() { holder.replaceChildren(); },
  };
}

export const AVATAR_CHOICES = Object.freeze([...Object.entries(PLANS).map(([id, p]) => [`creature:${id}`, p.label]), ["flux", "Flux"], ["hand", "Hand"]]);

export const SAMPLES = Object.freeze({
  en: ["Hello! I am your Kamiji. Shall we play?", "The quick brown fox jumps over the lazy dog.", "Oh no, I think I heard something in the dark."],
  ja: ["こんにちは！いっしょにあそぼう！", "今日はいい天気ですね。", "えっ、ほんとう？うれしい！"],
});
export const MOODS = Object.freeze(["happy", "sad", "scared", "angry"]);

const STATUS_TEXT = { running: "Running", installed: "Installed", missing: "Missing", unknown: "Not checked" };

const HELP = {
  kamiji: [
    "# once (needs uv and ffmpeg; Apple silicon for Qwen)",
    "uv venv -p 3.12 ~/.kamiji-voice/venv",
    'uv pip install -p ~/.kamiji-voice/venv/bin/python mlx-audio==0.5.8 pyworld "setuptools<81" numpy kokoro-onnx==0.5.0 onnxruntime onnx huggingface_hub',
    "uv pip install -p ~/.kamiji-voice/venv/bin/python --no-deps misaki==0.9.4 pyopenjtalk==0.4.1 fugashi==1.5.2 jaconv==0.5.0 addict==2.4.0 mojimoji==0.0.13",
    "brew install ffmpeg",
    "# run (from the Kamiji repo)",
    "tools/voice-server/run.sh start     # also: stop, status",
  ].join("\n"),
  stt: [
    "# faster-whisper in the venv used by yakopop's stt server",
    "~/Kosmos/voice-server/.venv/bin/pip install faster-whisper huggingface_hub",
    "# run (from the yakopop repo)",
    "~/Kosmos/voice-server/.venv/bin/python tools/stt/server.py --port 4640",
  ].join("\n"),
  whisperCpp: [
    "brew install whisper-cpp",
    "mkdir -p ~/.cache/whisper && curl -L -o ~/.cache/whisper/ggml-base.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin",
    "whisper-server --port 8080     # serves /inference, not the OpenAI route",
  ].join("\n"),
  arco: ["cd ~/Kosmos/voice-server", "python3 -m venv .venv && .venv/bin/pip install -r requirements.txt", ".venv/bin/python bot.py --host localhost --port 4630"].join("\n"),
};

const LINKS = {
  kamijiDocs: ["Kamiji voice server README (kamiji repo, tools/voice-server/README.md)", "https://github.com/FraterCCCLXIII/kamiji/blob/HEAD/tools/voice-server/README.md"],
  kamijiRepo: ["Kamiji repository", "https://github.com/FraterCCCLXIII/kamiji"],
  qwenModel: ["Qwen3-TTS model on Hugging Face (mlx-community/Qwen3-TTS-12Hz-1.7B-Base-4bit)", "https://huggingface.co/mlx-community/Qwen3-TTS-12Hz-1.7B-Base-4bit"],
  kokoroModel: ["Kokoro ONNX model on Hugging Face (speaches-ai/Kokoro-82M-v1.0-ONNX)", "https://huggingface.co/speaches-ai/Kokoro-82M-v1.0-ONNX"],
  yakopopRepo: ["yakopop repository (tools/stt/server.py)", "https://github.com/Modern-Telepathy/yakopop"],
  whisperModel: ["Whisper model on Hugging Face (deepdml/faster-whisper-large-v3-turbo-ct2)", "https://huggingface.co/deepdml/faster-whisper-large-v3-turbo-ct2"],
  kosmosRepo: ["Kosmos repository (voice-server/README.md)", "https://github.com/Kosmos-computer/Kosmos"],
  whisperCpp: ["whisper.cpp project", "https://github.com/ggml-org/whisper.cpp"],
  whisperCppModels: ["whisper.cpp ggml models on Hugging Face", "https://huggingface.co/ggerganov/whisper.cpp"],
};

/** Install helpers for engines that are not installed. Only text that already exists in this app, the Kamiji, yakopop and Kosmos READMEs or the git remotes. Shown, never run. */
const INSTALL = {
  kamiji: {
    prereq: "macOS on Apple silicon (the Qwen3-TTS voices use MLX), uv, Homebrew. Model sizes from the Kamiji verification notes: Qwen3-TTS about 1.65 GB, Kokoro about 337 MB, downloaded from Hugging Face on first use (public, no login). Qwen peaks near 15 GB of memory while generating.",
    steps: [
      ["Create the Python 3.12 environment the server runs from.", ["uv venv -p 3.12 ~/.kamiji-voice/venv"]],
      ["Install the voice packages into it.", [
        'uv pip install -p ~/.kamiji-voice/venv/bin/python mlx-audio==0.5.8 pyworld "setuptools<81" numpy kokoro-onnx==0.5.0 onnxruntime onnx huggingface_hub',
        "uv pip install -p ~/.kamiji-voice/venv/bin/python --no-deps misaki==0.9.4 pyopenjtalk==0.4.1 fugashi==1.5.2 jaconv==0.5.0 addict==2.4.0 mojimoji==0.0.13"]],
      ["Install ffmpeg.", ["brew install ffmpeg"]],
      ["Start the server from the Kamiji repo (or use the Start button above once the Kamiji folder is set in Settings).", ["tools/voice-server/run.sh start     # also: stop, status"]],
    ],
    links: [LINKS.kamijiDocs, LINKS.kamijiRepo, LINKS.kokoroModel, LINKS.qwenModel],
  },
  stt: {
    prereq: "Python 3.11+ and the Kosmos voice-server venv at ~/Kosmos/voice-server/.venv (step 1), plus the yakopop repo (folder set under Settings). The server loads its model from the Hugging Face cache only and never downloads it, so deepdml/faster-whisper-large-v3-turbo-ct2 must already be cached; no download command for it is documented in these repos.",
    steps: [
      ["Create the venv if you do not have it (from the Kosmos repo, voice-server/README.md).", ["cd ~/Kosmos/voice-server", "python3 -m venv .venv"]],
      ["Install faster-whisper into it.", ["~/Kosmos/voice-server/.venv/bin/pip install faster-whisper huggingface_hub"]],
      ["Start the server from the yakopop repo (or use Start above).", ["~/Kosmos/voice-server/.venv/bin/python tools/stt/server.py --port 4640"]],
    ],
    links: [LINKS.yakopopRepo, LINKS.kosmosRepo, LINKS.whisperModel],
  },
  "whisper-cpp": {
    prereq: "Homebrew. The base.en model file is downloaded by the second command from Hugging Face (size not recorded in these repos). This page does not use whisper.cpp yet (detected only).",
    steps: [
      ["Install whisper.cpp.", ["brew install whisper-cpp"]],
      ["Download the base.en model.", ["mkdir -p ~/.cache/whisper && curl -L -o ~/.cache/whisper/ggml-base.en.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin"]],
      ["Optional: run the server (serves /inference, not the OpenAI route).", ["whisper-server --port 8080"]],
    ],
    links: [LINKS.whisperCpp, LINKS.whisperCppModels],
  },
  arco: {
    prereq: "Python 3.11+ and the Kosmos repo checked out at ~/Kosmos (voice-server/ folder). The first run downloads about 1 to 2 GB of models (Whisper, Kokoro, Silero, Smart Turn v3) into ~/.cache, per its README.",
    steps: [
      ["Create the venv and install the requirements.", ["cd ~/Kosmos/voice-server", "python3 -m venv .venv", ".venv/bin/pip install -r requirements.txt"]],
      ["Run it.", [".venv/bin/python bot.py --host localhost --port 4630"]],
    ],
    links: [LINKS.kosmosRepo],
  },
  system: {
    prereq: "Only ffmpeg has an install command in these repos. say ships with macOS. No verified route for espeak-ng is recorded here.",
    steps: [["Install ffmpeg.", ["brew install ffmpeg"]]],
    links: [],
  },
  "browser-tts": { note: "Built into the browser, so there is nothing to install here. This browser exposes no speechSynthesis; try another browser or the Kamiji voice server.", steps: [], links: [] },
  "browser-stt": { note: "Built into the browser, so there is nothing to install here. This browser exposes no SpeechRecognition; use the Whisper server or typed input.", steps: [], links: [] },
  piper: { note: "No install route is recorded in these repos, and this page does not wire Piper. The Arco README only says Piper needs its own server.", steps: [], links: [LINKS.kosmosRepo] },
};

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("Kosmos Vox requires Canvas host API 1.");
  return host.registerPage("kosmos-vox", ({ container }) => mount(container, host));
}

function mount(container, host, deps = {}) {
  const win = container.ownerDocument?.defaultView || globalThis;
  const doFetch = deps.fetch || ((...a) => globalThis.fetch(...a));
  const sleep = deps.sleep || ((ms) => new Promise((r) => setTimeout(r, ms)));
  const now = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
  const reduced = () => { try { return Boolean(win.matchMedia?.("(prefers-reduced-motion: reduce)").matches); } catch { return false; } };

  const root = el("div", "kv");
  container.append(el("style", "", CSS), root);
  let disposed = false;
  const saved = (() => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; } catch { return { ...DEFAULTS }; } })();
  const s = {
    ...saved, listening: false, status: "Press Talk, or type below.", error: false, lines: [], conversations: [],
    probes: { kamiji: { ok: false }, stt: { ok: false }, arco: { ok: false } },
    detect: null, detectState: "idle", detectNote: "", voices: [], log: "", busy: "", mood: "idle", notice: "",
    diag: { stt: null, agent: null, tts: null, mouth: "idle" },
  };
  const persist = () => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...DEFAULTS, ...Object.fromEntries(Object.keys(DEFAULTS).map((k) => [k, s[k]])) })); } catch { /* no storage */ } };

  /** Fill the visible page below wherever the host put us (hosts may not give a definite height). */
  function fit() {
    const top = Math.max(0, root.getBoundingClientRect().top);
    root.style.height = `${Math.max(480, (win.innerHeight || 800) - top)}px`;
  }

  // ---- derived facts ----
  const synth = () => globalThis.speechSynthesis;
  const SR = () => globalThis.SpeechRecognition || globalThis.webkitSpeechRecognition;
  const browserVoices = () => { try { return synth()?.getVoices?.() || []; } catch { return []; } };
  const kamijiUp = () => Boolean(s.probes.kamiji.ok);
  const qwenUp = () => kamijiUp() && Boolean(s.probes.kamiji.data?.library);
  const engine = () => chooseEngine({ pref: s.ttsEngine, kamijiRunning: kamijiUp() });
  const listener = () => chooseListener({ sttRunning: Boolean(s.probes.stt.ok), recognition: Boolean(SR()) });
  const sttBase = () => String(s.sttUrl).replace(/\/+$/, "").replace(/\/v1$/, "");
  const flag = (k) => (s.detect ? s.detect[k] : undefined);
  const all = (...keys) => (s.detect ? keys.every((k) => s.detect[k] === true) : undefined);
  const kamijiRunPath = () => {
    const found = s.detect?.kamiji_run;
    if (typeof found === "string" && /^[\w ./@+-]+$/.test(found)) return found;
    const q = shellPath(s.kamijiDir);
    return q ? `${q.slice(1, -1)}/tools/voice-server/run.sh` : null;
  };
  const commands = () => engineCommands({ kamijiRun: kamijiRunPath(), yakopopDir: s.yakopopDir });

  // ---- skeleton ----
  const rail = el("aside", "rail");
  rail.setAttribute("aria-label", "Voice engines");
  const main = el("main", "main");
  root.append(rail, main);

  // Engines panel
  const eHead = el("div", "head");
  eHead.append(el("h2", "", "Engines"));
  const refreshBtn = btn("Refresh", "", () => refreshAll());
  eHead.append(refreshBtn);
  const eNote = el("p", "note", "Nothing is installed or started for you. Start and Stop run only the commands shown, when you press them.");
  const eDetect = el("p", "note");
  const eRows = el("div");
  eRows.style.cssText = "display:flex;flex-direction:column;gap:8px";
  const logBox = el("details");
  logBox.append(el("summary", "", "Command log"));
  const logPre = el("pre", "", "Nothing has been run yet.");
  logBox.append(logPre);
  rail.append(eHead, eNote, eDetect, eRows, logBox);

  // Main: header, stage
  const mHead = el("div");
  const title = el("h1", "", BRAND.product.replace(/^Kosmos/, "Kosmos™"));
  const using = el("div", "using");
  const state = el("div", "state", s.status);
  state.setAttribute("aria-live", "polite");
  mHead.append(title, using, state);

  const stageCard = el("section", "card stagecard");
  stageCard.setAttribute("aria-label", "Avatar");
  const avatarChips = el("div", "chips");
  const stage = el("div", "stage");
  stageCard.append(avatarChips, stage);

  // Speak
  const speakCard = el("section", "card");
  speakCard.append(el("h2", "", "Speak"));
  const selField = (label, options, key, onChange) => {
    const l = el("label", "f", label);
    const sel = el("select");
    options.forEach(([v, t]) => sel.append(new Option(t, v)));
    sel.value = String(s[key]);
    sel.addEventListener("change", () => { s[key] = sel.value; persist(); onChange?.(); });
    l.append(sel);
    return { l, sel };
  };
  const engF = selField("Speech engine", [["auto", "Auto (best running)"], ["kamiji", "Kamiji voice server"], ["browser", "Browser voice"]], "ttsEngine", () => renderControls());
  const langF = selField("Language", [["en", "English"], ["ja", "日本語"]], "lang", () => { renderSamples(); renderControls(); });
  const voiceF = selField("Voice", [[s.ttsVoice, s.ttsVoice]], "ttsVoice", () => { s.ttsVoice = withMood(s.ttsVoice, s.qwenMood || ""); persist(); renderControls(); });
  const bVoiceF = selField("Browser voice", [["", "System default"]], "browserVoice");
  const range = (label, key, min, max, step) => {
    const l = el("label", "f", label);
    const i = el("input"); i.type = "range"; i.min = min; i.max = max; i.step = step; i.value = String(s[key]);
    const out = el("span", "", String(s[key]));
    i.addEventListener("input", () => { s[key] = Number(i.value); out.textContent = i.value; persist(); });
    l.append(i, out);
    return l;
  };
  const speedF = range("Speed", "speed", 0.6, 1.5, 0.05);
  const cuteF = range("Cute (browser voice pitch and rate)", "cute", 0, 1, 0.05);
  const moodChips = el("div", "chips");
  const moodWrap = el("div");
  moodWrap.append(el("span", "note", "Mood (Qwen voices)"), moodChips);
  const row1 = el("div", "row"); row1.append(engF.l, langF.l, voiceF.l, bVoiceF.l);
  const row2 = el("div", "row"); row2.append(speedF, cuteF);
  const sampleChips = el("div", "chips");
  const sayText = el("textarea");
  sayText.setAttribute("aria-label", "Text to say");
  sayText.value = SAMPLES[s.lang]?.[0] || SAMPLES.en[0];
  const sayBtn = btn("Say it", "pri", () => speak(sayText.value));
  const stopBtn = btn("Stop", "", () => stopSpeaking());
  const row3 = el("div", "row"); row3.append(sayBtn, stopBtn);
  speakCard.append(row1, row2, moodWrap, sampleChips, sayText, row3);

  // Listen
  const listenCard = el("section", "card");
  listenCard.append(el("h2", "", "Listen"));
  const listenInfo = el("p", "note");
  const mic = btn("Talk", "mic", () => (s.listening ? stopListening() : startListening()));
  mic.setAttribute("aria-pressed", "false");
  const meter = el("div", "meter"); const meterFill = el("i"); meter.append(meterFill);
  const interim = el("span", "note");
  const micRow = el("div", "row"); micRow.append(mic, meter, interim);
  const typedForm = el("form", "row");
  const typed = el("input"); typed.type = "text"; typed.placeholder = "Type what you would say"; typed.setAttribute("aria-label", "Type what you would say"); typed.style.flex = "1 1 200px";
  const typedSend = btn("Send", "", null); typedSend.type = "submit";
  typedForm.append(typed, typedSend);
  const agentBox = el("input"); agentBox.type = "checkbox"; agentBox.checked = s.agentMode;
  agentBox.addEventListener("change", () => { s.agentMode = agentBox.checked; persist(); renderControls(); });
  const agentLabel = el("label", "row"); agentLabel.append(agentBox, document.createTextNode("Talk to the agent (send what I say to a conversation and speak the reply)"));
  const convoSelect = el("select");
  convoSelect.setAttribute("aria-label", "Agent conversation");
  convoSelect.addEventListener("change", () => { s.conversationId = convoSelect.value; persist(); });
  const speakBox = el("input"); speakBox.type = "checkbox"; speakBox.checked = s.speakReplies;
  speakBox.addEventListener("change", () => { s.speakReplies = speakBox.checked; persist(); });
  const speakLabel = el("label", "row"); speakLabel.append(speakBox, document.createTextNode("Speak replies"));
  const agentRow = el("div", "row"); agentRow.append(convoSelect, speakLabel);
  listenCard.append(listenInfo, micRow, typedForm, agentLabel, agentRow);

  // Transcript, diagnostics, settings, footer
  const talkCard = el("section", "card");
  talkCard.append(el("h2", "", "Transcript"));
  const lines = el("div", "lines");
  lines.setAttribute("aria-live", "polite");
  talkCard.append(lines);
  const diag = el("div", "diag");
  diag.setAttribute("aria-label", "Diagnostics");

  const details = el("details");
  details.append(el("summary", "", "Settings"));
  const field = (label, key, type = "text") => {
    const l = el("label", "f", label);
    const i = el("input");
    i.type = type; i.value = String(s[key]);
    i.addEventListener("change", () => { s[key] = type === "number" ? Number(i.value) : i.value.trim(); persist(); if (key === "kamijiDir" || key === "yakopopDir") renderEngines(); if (key === "ttsUrl" || key === "sttUrl") refreshProbes(); });
    l.append(i);
    return l;
  };
  const setRow = el("div", "row");
  setRow.append(field("Recognition URL", "sttUrl"), field("Recognition model", "sttModel"), field("Voice server URL", "ttsUrl"), field("Kamiji folder (for Start)", "kamijiDir"), field("yakopop folder (for Start)", "yakopopDir"), field("Silence (ms)", "silenceMs", "number"), field("Mic threshold", "threshold", "number"));
  details.append(setRow);

  const built = el("p", "built", "Built with the Kamiji voice server (Kokoro and Qwen3-TTS), Whisper, and the Web Speech API.");
  const foot = el("footer");
  const line1 = el("div");
  line1.append(el("b", "", `${BRAND.product}™`), ` · a ${BRAND.maker} product`);
  foot.append(line1, el("div", "", `${BRAND.copyright}. Kosmos™, Kamiji™ and Kamikin™ are trademarks of ${BRAND.owner}. Third-party names belong to their owners.`));

  main.append(mHead, stageCard, speakCard, listenCard, talkCard, diag, details, built, foot);

  const grip = gripColumns({ grid: root, storageKey: "grip:kosmos-vox", columns: [{ el: rail, edge: "left", min: 240, max: 460, initial: 300, label: "engines column" }] });

  const fit0 = () => { if (!disposed) fit(); };
  win.addEventListener("resize", fit0);
  const ro = typeof win.ResizeObserver === "function" && container.parentElement ? new win.ResizeObserver(fit0) : null;
  ro?.observe(container.parentElement || container);
  fit();
  win.requestAnimationFrame?.(fit0);

  // ---- avatar + mouth driver ----
  const driver = createMouthDriver({ reduced: reduced() });
  let avatar = null;
  const mountAvatar = () => {
    avatar?.dispose();
    avatar = createAvatar(s.avatar);
    avatar.setMood(s.mood);
    stage.replaceChildren(avatar.node);
    avatarChips.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.kind === s.avatar)));
  };
  AVATAR_CHOICES.forEach(([kind, label]) => {
    const b = el("button", "chip", label); b.type = "button"; b.dataset.kind = kind; b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => { s.avatar = kind; persist(); mountAvatar(); });
    avatarChips.append(b);
  });
  mountAvatar();
  let raf = 0;
  const frame = () => {
    if (disposed) return;
    const m = driver.value(now());
    avatar.setMouth(m.open, m.viseme);
    if (m.source !== "idle" && m.source !== s.diag.mouth) { s.diag.mouth = m.source; renderDiag(); }
    raf = requestAnimationFrame(frame);
  };
  if (typeof requestAnimationFrame === "function") raf = requestAnimationFrame(frame);

  // ---- status helpers ----
  const setMood = (mood) => { s.mood = mood; avatar?.setMood(mood); };
  const setStatus = (text, error = false, mood) => {
    s.status = text; s.error = error;
    state.textContent = text;
    state.className = `state${error ? " err" : ""}`;
    if (mood) setMood(mood);
  };
  const addLine = (who, text) => { const l = el("div", `line ${who}`, text); lines.append(l); l.scrollIntoView?.({ block: "nearest" }); };
  const fmtMs = (v) => (v == null ? "-" : v >= 1000 ? `${(v / 1000).toFixed(1)} s` : `${Math.round(v)} ms`);
  function renderDiag() {
    diag.textContent = `Speech to text: ${fmtMs(s.diag.stt)} · Agent: ${fmtMs(s.diag.agent)} · Text to speech: ${fmtMs(s.diag.tts)} · Mouth follows: ${s.diag.mouth}`;
  }
  const appendLog = (text) => { s.log += `${text}\n`; logPre.textContent = s.log; logPre.scrollTop = logPre.scrollHeight; };

  // ---- Engines panel ----
  const openHelp = new Set();
  const openInstall = new Set();
  function rows() {
    const voiceCount = browserVoices().length;
    const defVoice = browserVoices().find((v) => v.default)?.name;
    const kp = s.probes.kamiji;
    const kMeta = [];
    if (kp.ok) { kMeta.push(`Kokoro ready · Qwen ${kp.data?.library ? "ready" : "not answering"}`); if (s.voices.length) kMeta.push(`${s.voices.length} voices`); }
    if (s.detect) kMeta.push(`Qwen3-TTS model ${s.detect.kamiji_qwen_model ? "cached" : "not cached"}`);
    const sp = s.probes.stt;
    const sys = ["say", "espeak_ng", "ffmpeg"].map((k) => `${k.replace("_", "-")}: ${s.detect ? (s.detect[k] ? "yes" : "no") : "?"}`);
    const cmd = commands();
    const wcpp = all("whisper_cli", "whisper_server", "whisper_model");
    const missingW = s.detect ? ["whisper_cli", "whisper_server", "whisper_model"].filter((k) => !s.detect[k]).map((k) => k.replace("_", "-")) : [];
    return [
      { group: "Speech output" },
      { id: "browser-tts", name: "Browser voice", desc: "The speech engine built into this browser. Always the fallback.", status: synth() ? "installed" : "missing", meta: synth() ? [`${voiceCount} voices`, defVoice ? `default: ${defVoice}` : "default: system"] : ["speechSynthesis is not available here"] },
      { id: "kamiji", name: "Kamiji voice server", desc: "Kokoro 82M voices, and Qwen3-TTS 1.7B designed voices with moods (Apple silicon).", port: ":4650 voices + :4653 Qwen", status: engineStatus({ running: kp.ok, installed: all("kamiji_venv", "kamiji_kokoro_model") }), meta: kMeta, help: HELP.kamiji,
        actions: [["Start", "kamijiStart", "pri"], ["Stop", "kamijiStop", ""], ["Status", "kamijiStatus", ""]], needs: cmd.kamijiStart ? "" : "Set the Kamiji folder under Settings to enable Start." },
      { group: "Listening" },
      { id: "browser-stt", name: "Browser listening", desc: "Speech recognition built into the browser. The desktop app often lacks it, and some browsers send the audio to their vendor's service.", status: SR() ? "installed" : "missing", meta: [SR() ? "SpeechRecognition available" : "SpeechRecognition not available here"] },
      { id: "stt", name: "Whisper server", desc: "faster-whisper large-v3-turbo with an OpenAI-shaped /v1/audio/transcriptions route (yakopop).", port: ":4640", status: engineStatus({ running: sp.ok, installed: all("stt_python", "stt_server") }), meta: sp.ok && sp.data?.model ? [`model: ${sp.data.model}`] : s.detect ? [`model ${s.detect.stt_model ? "cached" : "not cached"}`] : [], help: HELP.stt,
        actions: [["Start", "sttStart", "pri"], ["Stop", "sttStop", ""]], needs: cmd.sttStart ? "" : "The yakopop folder in Settings is not usable." },
      { id: "whisper-cpp", name: "whisper.cpp", desc: "Detected, not wired: whisper-server answers /inference on :8080, not the OpenAI route this page speaks.", port: ":8080", status: engineStatus({ installed: wcpp }), meta: s.detect ? [wcpp ? "whisper-cli, whisper-server and the base.en model found" : `missing: ${missingW.join(", ")}`] : [], help: HELP.whisperCpp },
      { group: "Other" },
      { id: "arco", name: "Arco (Pipecat)", desc: "Optional full-duplex voice pipeline with its own turn-taking. Informational: not used by this page.", port: ":4630", status: engineStatus({ running: s.probes.arco.ok, installed: all("arco_bot", "stt_python") }), meta: [], help: HELP.arco },
      { id: "system", name: "System tools", desc: "Command-line helpers on this machine (informational).", status: s.detect ? (["say", "espeak_ng", "ffmpeg"].some((k) => s.detect[k]) ? "installed" : "missing") : "unknown", meta: [sys.join(" · ")] },
      { group: "Not available" },
      { id: "wake", name: "Wake word", desc: "Not built. No wake-word code exists yet.", status: "missing", meta: [] },
      { id: "piper", name: "Piper", desc: s.detect?.piper ? "Found on the path, but not wired into this page." : "Not installed on this machine and not wired.", status: s.detect?.piper ? "installed" : "missing", meta: [] },
      { id: "clone", name: "Voice cloning from a sample", desc: "Not built. The voice server has no clone-from-upload endpoint.", status: "missing", meta: [] },
    ];
  }

  /** Copies text to the clipboard; falls back to a hidden textarea and execCommand. Resolves true when it worked. */
  async function copyText(text) {
    try { if (navigator.clipboard?.writeText) { await navigator.clipboard.writeText(text); return true; } } catch { /* fall through to the old way */ }
    try {
      const t = document.createElement("textarea");
      t.value = text; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;left:-9999px;top:0";
      document.body.append(t); t.select();
      const ok = document.execCommand?.("copy") === true;
      t.remove();
      return ok;
    } catch { return false; }
  }

  /** A prominent Install button that only reveals instructions. Nothing here runs a command. */
  function installHelper(id, name, inst) {
    const wrap = el("div");
    wrap.dataset.install = id;
    const panel = el("div", "ipanel");
    panel.id = `kv-install-${id}`;
    panel.hidden = !openInstall.has(id);
    const toggle = btn(`Install ${name}`, "pri", () => {
      const open = panel.hidden;
      panel.hidden = !open;
      toggle.setAttribute("aria-expanded", String(open));
      if (open) openInstall.add(id); else openInstall.delete(id);
    });
    toggle.dataset.action = `${id}:install`;
    toggle.setAttribute("aria-expanded", String(!panel.hidden));
    toggle.setAttribute("aria-controls", panel.id);
    toggle.title = "Shows the steps and commands. Nothing is run.";
    const live = el("span", "sr");
    live.setAttribute("role", "status"); live.setAttribute("aria-live", "polite");
    if (inst.prereq) panel.append(el("p", "note", `Before you start: ${inst.prereq}`));
    if (inst.note) panel.append(el("p", "note", inst.note));
    if (inst.steps.length) {
      const ol = el("ol");
      inst.steps.forEach(([text, cmds]) => {
        const li = el("li", "", text);
        cmds.forEach((cmd) => {
          const code = el("div", "code");
          const pre = el("pre", "", cmd);
          const copy = btn("Copy", "", async () => {
            const ok = await copyText(cmd);
            copy.textContent = ok ? "Copied" : "Copy failed";
            live.textContent = ok ? "Copied to clipboard" : "Copy failed. Select the command and copy it by hand.";
            setTimeout(() => { copy.textContent = "Copy"; }, 2000);
          });
          copy.setAttribute("aria-label", `Copy command: ${cmd.slice(0, 80)}`);
          code.append(pre, copy);
          li.append(code);
        });
        ol.append(li);
      });
      panel.append(ol, el("p", "note", "After running the commands, press Refresh."));
    }
    if (inst.links.length) {
      const ul = el("ul");
      inst.links.forEach(([label, url]) => {
        const a = el("a", "", label); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer";
        const li = el("li"); li.append(a); ul.append(li);
      });
      panel.append(el("p", "note", "Official sources"), ul);
    }
    panel.append(live);
    wrap.append(toggle, panel);
    return wrap;
  }

  function renderEngines() {
    eRows.replaceChildren();
    eDetect.textContent = s.detectState === "unavailable" ? "Detection needs the Agent Server. Running engines are still found over HTTP."
      : s.detectState === "running" ? "Checking what is installed…"
      : s.detectState === "failed" ? `Install check failed: ${s.detectNote}`
      : s.detectState === "done" ? "Install status read from this machine (read-only check)." : "";
    eDetect.className = `note${s.detectState === "failed" ? " err" : ""}`;
    for (const r of rows()) {
      if (r.group) { eRows.append(el("h3", "", r.group)); continue; }
      const row = el("div", "erow");
      row.dataset.engine = r.id;
      const top = el("div", "top");
      top.append(el("span", "", r.name + (r.port ? ` · ${r.port}` : "")), el("span", `pill ${r.status}`, STATUS_TEXT[r.status]));
      row.append(top, el("p", "desc", r.desc));
      if (r.meta?.length) row.append(el("p", "meta", r.meta.join(" · ")));
      if (r.actions) {
        const acts = el("div", "acts");
        r.actions.forEach(([label, key, cls]) => {
          const b = btn(label, cls, () => runEngineCommand(r.id, label, commands()[key]));
          b.dataset.action = `${r.id}:${label.toLowerCase()}`;
          const cmd = commands()[key];
          b.disabled = !cmd || !host.agentServer?.request || Boolean(s.busy);
          b.title = !host.agentServer?.request ? "Needs the Agent Server to run this for you" : !cmd ? r.needs : `Runs: ${cmd.slice(0, 160)}`;
          acts.append(b);
        });
        row.append(acts);
        if (r.needs) row.append(el("p", "meta", r.needs));
      }
      const inst = INSTALL[r.id];
      const needsInstall = Boolean(inst) && (r.status === "missing" || r.status === "unknown");
      if (needsInstall) row.append(installHelper(r.id, r.name, inst));
      if (r.help && !needsInstall) {
        const d = el("details");
        d.open = openHelp.has(r.id);
        d.addEventListener("toggle", () => { if (d.open) openHelp.add(r.id); else openHelp.delete(r.id); });
        d.append(el("summary", "", "Install"), el("pre", "", r.help));
        row.append(d);
      }
      eRows.append(row);
    }
  }

  function renderSamples() {
    sampleChips.replaceChildren();
    (SAMPLES[s.lang] || SAMPLES.en).forEach((t) => {
      const c = el("button", "chip", t.length > 28 ? `${t.slice(0, 26)}…` : t); c.type = "button"; c.title = t;
      c.addEventListener("click", () => { sayText.value = t; speak(t); });
      sampleChips.append(c);
    });
  }

  function renderControls() {
    const eng = engine();
    const wantKamiji = s.ttsEngine === "kamiji" && !kamijiUp();
    using.textContent = `Using: ${eng === "kamiji" ? `Kamiji voice server (${String(s.ttsVoice).startsWith("qwen:") && qwenUp() ? "Qwen3-TTS" : "Kokoro"})` : "Browser voice"} · ${{ whisper: "Listening: Whisper server", browser: "Listening: Browser listening", typed: "Listening: typed input" }[listener()]}`;
    s.notice = wantKamiji ? "The Kamiji voice server is not running, so the Browser voice is used. Start it in Engines." : "";
    // voices
    const ids = s.voices.length ? s.voices : [s.ttsVoice];
    voiceF.sel.replaceChildren(...ids.map((v) => new Option(v, v)));
    if (!ids.includes(s.ttsVoice)) voiceF.sel.append(new Option(s.ttsVoice, s.ttsVoice));
    voiceF.sel.value = s.ttsVoice;
    voiceF.l.hidden = eng !== "kamiji";
    const want = s.lang === "ja" ? "ja" : "en";
    const bv = browserVoices().filter((v) => String(v.lang || "").toLowerCase().startsWith(want));
    bVoiceF.sel.replaceChildren(new Option("System default", ""), ...bv.map((v) => new Option(v.name, v.name)));
    bVoiceF.sel.value = bv.some((v) => v.name === s.browserVoice) ? s.browserVoice : "";
    bVoiceF.l.hidden = eng !== "browser";
    cuteF.hidden = eng !== "browser";
    // moods only for Qwen
    const showMood = eng === "kamiji" && qwenUp() && String(s.ttsVoice).startsWith("qwen:");
    moodWrap.hidden = !showMood;
    moodChips.replaceChildren();
    ["", ...MOODS].forEach((m) => {
      const c = el("button", "chip", m || "neutral"); c.type = "button"; c.setAttribute("aria-pressed", String((s.qwenMood || "") === m));
      c.addEventListener("click", () => { s.qwenMood = m; s.ttsVoice = withMood(s.ttsVoice, m); persist(); renderControls(); });
      moodChips.append(c);
    });
    // listening
    const l = listener();
    listenInfo.textContent = l === "whisper" ? `Listening goes to the Whisper server on :4640 (local). It stops when you pause.`
      : l === "browser" ? "The Whisper server is not running, so Talk uses the browser's own speech recognition. Some browsers send that audio to their vendor's service. Start the Whisper server in Engines to keep it on this machine."
      : "No listening engine is running and this browser has no speech recognition, so type what you would say. Start the Whisper server in Engines to talk.";
    mic.disabled = l === "typed" && !s.listening;
    mic.title = mic.disabled ? "No listening engine is available" : "";
    convoSelect.hidden = !s.agentMode; speakLabel.hidden = !s.agentMode;
    agentRow.hidden = !s.agentMode;
    notice.textContent = s.notice;
    notice.hidden = !s.notice;
  }
  const notice = el("p", "note");
  mHead.append(notice);

  const fillConversations = () => {
    convoSelect.replaceChildren(new Option("Choose a conversation…", ""));
    s.conversations.forEach((c) => convoSelect.append(new Option(c.title || `Conversation ${String(c.id).slice(0, 6)}`, c.id)));
    convoSelect.value = s.conversationId;
  };

  // ---- probing and detection ----
  async function refreshProbes() {
    if (disposed) return;
    const [k, t, a] = await Promise.all([
      probeUrl(`${String(s.ttsUrl).replace(/\/+$/, "")}/`, { fetchImpl: doFetch }),
      probeUrl(`${sttBase()}/`, { fetchImpl: doFetch }),
      probeUrl("http://127.0.0.1:4630/status", { fetchImpl: doFetch, opaque: true }),
    ]);
    if (disposed) return;
    s.probes = { kamiji: k, stt: t, arco: a };
    if (k.ok) {
      try {
        const res = await doFetch(`${String(s.ttsUrl).replace(/\/+$/, "")}/v1/voices`);
        if (res.ok) s.voices = listVoices(await res.json());
      } catch { /* the list stays as it was */ }
    } else s.voices = [];
    if (disposed) return;
    renderEngines();
    renderControls();
  }

  async function refreshDetect() {
    if (disposed) return;
    if (!host.agentServer?.request) { s.detectState = "unavailable"; renderEngines(); return; }
    s.detectState = "running"; renderEngines();
    try {
      const out = await runBash(host, buildDetectScript({ yakopopDir: s.yakopopDir, kamijiDir: s.kamijiDir }), { sleep });
      if (disposed) return;
      s.detect = parseDetectOutput(out.stdout);
      s.detectState = "done";
    } catch (e) {
      s.detectState = "failed"; s.detectNote = e instanceof Error ? e.message : String(e);
    }
    if (disposed) return;
    renderEngines();
    renderControls();
  }

  async function refreshAll() { await Promise.all([refreshProbes(), refreshDetect()]); }

  async function runEngineCommand(id, label, command) {
    if (!command || s.busy) return;
    s.busy = id; renderEngines();
    appendLog(`$ ${command}`);
    try {
      const out = await runBash(host, command, { sleep });
      appendLog(`${(out.stdout + out.stderr).trim() || "(no output)"}\n[exit ${out.exitCode}]`);
      if (out.exitCode !== 0) appendLog(`${label} did not succeed. Run it yourself in a terminal if this keeps happening.`);
    } catch (e) {
      appendLog(`Could not run it from here (${e instanceof Error ? e.message : e}). Run it yourself: ${command}`);
    }
    s.busy = "";
    const tries = label === "Start" ? 6 : 1;
    for (let i = 0; i < tries && !disposed; i += 1) {
      await sleep(label === "Start" ? 1500 : 800);
      await refreshProbes();
      const up = id === "kamiji" ? s.probes.kamiji.ok : id === "stt" ? s.probes.stt.ok : false;
      if (label === "Start" && up) break;
    }
    if (!disposed) { logBox.open = true; renderEngines(); }
  }

  // ---- speaking ----
  let audioCtx = null, speakToken = 0, player = null, cancelBrowser = null;
  const getCtx = () => { audioCtx ||= new (globalThis.AudioContext || globalThis.webkitAudioContext)(); return audioCtx; };

  function stopSpeaking() {
    speakToken += 1;
    try { player?.stop(); } catch { /* already stopped */ }
    player = null;
    try { synth()?.cancel(); } catch { /* none */ }
    cancelBrowser?.();
    driver.stop();
    if (!s.listening) setMood("idle");
  }

  async function playClip(clip, token) {
    const ctx = getCtx();
    const buf = await ctx.decodeAudioData(await clip.blob.arrayBuffer());
    if (token !== speakToken) return;
    const src = ctx.createBufferSource();
    const an = ctx.createAnalyser();
    an.fftSize = 512;
    src.buffer = buf;
    src.connect(an); an.connect(ctx.destination);
    const data = new Uint8Array(an.fftSize);
    const t0 = now();
    const level = () => {
      const t = (now() - t0) / 1000;
      if (clip.speech && (t < clip.speech[0] || t > clip.speech[1])) return 0;
      an.getByteTimeDomainData(data);
      let sum = 0; for (const v of data) sum += ((v - 128) / 128) ** 2;
      return Math.sqrt(sum / data.length);
    };
    driver.start({ visemes: clip.visemes, startedAt: t0, rms: level });
    player = src;
    await new Promise((resolve) => { src.onended = resolve; src.start(); });
    driver.stop();
  }

  function speakBrowser(text, token) {
    return new Promise((resolve) => {
      const ss = synth();
      if (!ss || typeof SpeechSynthesisUtterance === "undefined") { appendLog("No browser voice is available; showing the text only."); resolve(); return; }
      const { pitch, rate } = cuteMacro(s.cute);
      const clauses = text.split(/(?<=[,、，;；])\s*/).filter(Boolean);
      const voice = browserVoices().find((v) => v.name === s.browserVoice);
      let i = 0;
      const done = () => { cancelBrowser = null; driver.stop(); resolve(); };
      cancelBrowser = () => { i = clauses.length; done(); };
      const next = () => {
        if (token !== speakToken || i >= clauses.length) { done(); return; }
        const u = new SpeechSynthesisUtterance(clauses[i]);
        i += 1;
        u.lang = s.lang === "ja" ? "ja-JP" : "en-US";
        if (voice) u.voice = voice;
        u.pitch = clamp(pitch * (1 + (Math.random() - 0.5) * 0.2), 0, 2);
        u.rate = clamp(rate * s.speed, 0.5, 2);
        u.onstart = () => { if (!driver.speaking) driver.start({ startedAt: now() }); };
        u.onboundary = () => driver.boundary(now());
        u.onend = () => setTimeout(next, 90);
        u.onerror = () => { done(); };
        ss.speak(u);
      };
      driver.start({ startedAt: now() });
      next();
    });
  }

  async function speak(text) {
    const sentences = splitSentences(text);
    if (!sentences.length) return;
    stopSpeaking();
    const token = speakToken;
    setStatus("Speaking…", false, "speaking");
    let eng = engine();
    for (const sentence of sentences) {
      if (disposed || token !== speakToken) return;
      if (eng === "kamiji") {
        try {
          const t0 = now();
          const clip = await (deps.synthesizeClip || synthesizeClip)(sentence, { url: s.ttsUrl, voice: s.ttsVoice, lang: s.lang, speed: s.speed, fetchImpl: doFetch });
          if (s.diag.tts == null || sentence === sentences[0]) { s.diag.tts = now() - t0; renderDiag(); }
          if (token !== speakToken) return;
          await playClip(clip, token);
          continue;
        } catch (e) {
          eng = "browser";
          s.notice = `The Kamiji voice server failed (${e instanceof Error ? e.message : e}). Using the Browser voice.`;
          notice.textContent = s.notice; notice.hidden = false;
          appendLog(s.notice);
        }
      }
      await speakBrowser(sentence, token);
    }
    if (!disposed && token === speakToken) { driver.stop(); setStatus(listener() === "typed" ? "Type below, or press Say it." : "Press Talk, or type below.", false, "idle"); }
  }

  // ---- listening and the agent loop ----
  async function handleHeard(text, sttMs) {
    const clean = String(text || "").trim();
    if (!clean) { setStatus("I did not catch that. Try again.", false, "idle"); return; }
    addLine("me", clean);
    if (sttMs != null) { s.diag.stt = sttMs; renderDiag(); }
    try {
      if (s.agentMode) {
        if (!host.agentServer?.request) { setStatus("Talking to the agent needs the Agent Server.", true, "idle"); return; }
        if (!s.conversationId) { setStatus("Pick a conversation to get a reply.", true, "idle"); return; }
        setStatus("Thinking…", false, "thinking");
        const t0 = now();
        const reply = await (deps.askAgent || askAgent)(host, s.conversationId, clean);
        s.diag.agent = now() - t0; renderDiag();
        addLine("agent", reply);
        if (s.speakReplies) await speak(reply); else setStatus("Press Talk, or type below.", false, "idle");
      } else {
        await speak(clean);
      }
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Something went wrong.", true, "idle");
    }
  }

  typedForm.addEventListener("submit", (e) => { e.preventDefault(); const t = typed.value; typed.value = ""; handleHeard(t, null); });

  let stream = null, recorder = null, chunks = [], micRaf = 0, vad = null, rec = null;
  let stopListening = () => {};

  async function startListening() {
    if (s.listening) return;
    stopSpeaking();
    const mode = listener();
    if (mode === "typed") return;
    if (mode === "browser") { startBrowserListening(); return; }
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
    } catch (e) {
      const denied = e && (e.name === "NotAllowedError" || e.name === "SecurityError");
      setStatus(denied ? "The microphone is blocked. Allow it for this page; the Canvas frame may not permit it. You can still type." : "No microphone could be opened. You can still type.", true, "idle");
      return;
    }
    const ctx = getCtx();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    source.connect(analyser);
    chunks = [];
    recorder = new MediaRecorder(stream);
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data); };
    let send = false;
    let endedAt = 0;
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      if (send && chunks.length) transcribeAndHandle(new Blob(chunks, { type: recorder.mimeType || "audio/webm" }), endedAt);
      else setStatus("Press Talk, or type below.", false, "idle");
    };
    recorder.start();
    vad = createVad({ threshold: s.threshold, silenceMs: s.silenceMs });
    s.listening = true;
    mic.setAttribute("aria-pressed", "true"); mic.textContent = "Stop";
    setStatus("Listening…", false, "listening");
    const data = new Uint8Array(analyser.fftSize);
    const finish = (doSend) => {
      cancelAnimationFrame(micRaf);
      s.listening = false; send = doSend; endedAt = now();
      meterFill.style.width = "0";
      mic.setAttribute("aria-pressed", "false"); mic.textContent = "Talk";
      if (recorder.state !== "inactive") recorder.stop();
    };
    stopListening = () => finish(false);
    const tick = () => {
      analyser.getByteTimeDomainData(data);
      let sum = 0; for (const v of data) sum += ((v - 128) / 128) ** 2;
      const level = Math.sqrt(sum / data.length);
      meterFill.style.width = `${Math.round(clamp(level * 4, 0, 1) * 100)}%`;
      const ev = vad.feed(level, now());
      if (ev === "end") { finish(true); return; }
      if (ev === "cancel") chunks = [];
      micRaf = requestAnimationFrame(tick);
    };
    micRaf = requestAnimationFrame(tick);
  }

  async function transcribeAndHandle(blob, endedAt) {
    try {
      setStatus("Transcribing…", false, "thinking");
      const text = await (deps.transcribe || transcribe)(blob, { url: s.sttUrl, model: s.sttModel, lang: s.lang, fetchImpl: doFetch });
      await handleHeard(text, now() - endedAt);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Something went wrong.", true, "idle");
    }
  }

  function startBrowserListening() {
    const Ctor = SR();
    rec = new Ctor();
    rec.lang = s.lang === "ja" ? "ja-JP" : "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    let finalText = "";
    rec.onresult = (e) => {
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i += 1) {
        const r = e.results[i];
        if (r.isFinal) finalText += r[0].transcript; else interimText += r[0].transcript;
      }
      interim.textContent = interimText;
    };
    rec.onerror = (e) => { setStatus(`Browser listening stopped (${e.error || "error"}). You can still type.`, true, "idle"); };
    rec.onend = () => {
      s.listening = false; interim.textContent = "";
      mic.setAttribute("aria-pressed", "false"); mic.textContent = "Talk";
      if (finalText.trim()) handleHeard(finalText, null); else if (!s.error) setStatus("I did not catch that. Try again.", false, "idle");
    };
    stopListening = () => { try { rec.stop(); } catch { /* not started */ } };
    s.listening = true;
    mic.setAttribute("aria-pressed", "true"); mic.textContent = "Stop";
    setStatus("Listening (browser)…", false, "listening");
    try { rec.start(); } catch (e) { setStatus("Browser listening could not start. You can still type.", true, "idle"); s.listening = false; mic.setAttribute("aria-pressed", "false"); mic.textContent = "Talk"; }
  }

  // ---- go ----
  renderSamples();
  renderDiag();
  renderEngines();
  renderControls();
  fillConversations();
  host.agentServer?.request({ path: "/api/conversations/search?limit=40" }).then((page) => {
    if (disposed) return;
    s.conversations = Array.isArray(page?.items) ? page.items : [];
    fillConversations();
  }).catch(() => { /* Agent Server not reachable: replies stay off until it is */ });

  const visible = () => !win.document.hidden;
  refreshProbes();
  if (visible()) refreshDetect(); else if (!host.agentServer) { s.detectState = "unavailable"; renderEngines(); }
  const timer = setInterval(() => { if (visible()) refreshProbes(); }, 10000);
  const onVis = () => { if (visible()) { refreshProbes(); if (s.detectState === "idle") refreshDetect(); } };
  win.document.addEventListener("visibilitychange", onVis);
  const onVoices = () => { renderControls(); renderEngines(); };
  try { synth()?.addEventListener?.("voiceschanged", onVoices); } catch { /* none */ }

  return () => {
    disposed = true;
    clearInterval(timer);
    cancelAnimationFrame(raf); cancelAnimationFrame(micRaf);
    win.removeEventListener("resize", fit0);
    win.document.removeEventListener("visibilitychange", onVis);
    try { synth()?.removeEventListener?.("voiceschanged", onVoices); } catch { /* none */ }
    ro?.disconnect();
    grip.dispose();
    stopSpeaking();
    try { rec?.abort?.(); } catch { /* none */ }
    avatar?.dispose();
    stream?.getTracks().forEach((t) => t.stop());
    root.remove();
  };
}

export { mount };
