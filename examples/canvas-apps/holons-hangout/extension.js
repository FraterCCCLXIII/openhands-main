/* Holons Hangout — the Hangout / Team Chat experience, built on Holons.
 *
 * A Holon is a workspace (left icon rail); its feed, courses and modules are channels; its
 * members are the team; feed posts are threaded messages (comments are the replies).
 *
 * Browser-only, dependency-free ESM. Styles are scoped under `.hh`; text is always set with
 * textContent. The holons-api base URL (and a sign-in token) are kept in this browser's
 * localStorage. With no reachable API it runs in Demo mode on in-memory sample Holons.
 *
 * API endpoints (verified against holons-api config/routes.rb, controllers and jbuilder views):
 *   POST /users/tokens/sign_in   GET /holons[?scope=joined|created]   GET /posts   POST /posts
 *   GET /comments   POST /comments   GET /holon_memberships?holon_id=   GET /up
 * holons-api has no course or module endpoints (the React front end keeps those in Firestore),
 * so a connected Holon shows its feed and team, and courses appear in Demo mode only.
 */

const STORAGE_KEY = "holons-hangout:v1";
const SVG_NS = "http://www.w3.org/2000/svg";

const BLOBS = [
  { id: "violet", fill: "#8B5CF6", path: "M32 6c14 0 24 10 24 24 0 16-11 28-24 28S8 46 8 30C8 16 18 6 32 6Z" },
  { id: "blue", fill: "#2D9CF0", path: "M32 4c9 14 22 22 22 36 0 11-10 20-22 20S10 51 10 40C10 26 23 18 32 4Z" },
  { id: "green", fill: "#2FBF71", path: "M18 18c4-8 12-8 14-2 3-6 12-6 15 2 7 1 12 9 8 17-3 7-10 9-16 8-6 4-14 4-19-2-7-3-9-12-5-18 0-2 1-4 3-5Z" },
  { id: "teal", fill: "#19B5A5", path: "M10 14c0-5 4-8 9-8h14c9 0 15 7 15 16s-6 14-14 14H21c-6 0-11-4-11-10Z" },
  { id: "brown", fill: "#8A5A3C", path: "M32 6c15 0 26 10 26 25S47 58 32 58 6 46 6 31 17 6 32 6Z" },
  { id: "orange", fill: "#F5760A", path: "M32 5c14 0 25 11 25 26 0 14-10 26-25 26S7 45 7 31C7 16 18 5 32 5Z" },
  { id: "red", fill: "#EF4444", path: "M12 22c0-8 6-14 14-14h12c8 0 14 6 14 14v10c0 8-6 14-14 14H26c-8 0-14-6-14-14Z" },
  { id: "pink", fill: "#EC4899", path: "M32 6 58 52H6Z" },
  { id: "indigo", fill: "#5B5BF0", path: "M14 12h36c3 0 6 3 6 6v28c0 3-3 6-6 6H14c-3 0-6-3-6-6V18c0-3 3-6 6-6Z" },
];


// Slightly different outlines for the orb, so a column of them does not look stamped.
const ORB_PATHS = [
  "M32 6C45 5 58 15 58 31C58 47 46 58 31 58C17 58 6 47 6 32C6 17 18 7 32 6Z",
  "M30 5C44 4 59 17 58 33C57 48 44 59 30 58C16 57 5 46 6 31C7 17 17 6 30 5Z",
  "M34 6C47 8 58 19 57 34C56 49 43 58 29 57C15 56 6 44 7 29C8 15 21 4 34 6Z",
];

/** The front-page orb as an avatar: one flat blob that wobbles, with two pill eyes that glance around and blink. */
function orbSvg(blob, index) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", "0 0 64 64");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("data-style", "orb");
  const delay = `${-((index * 7 + 3) % 53) / 10}s`;
  const add = (parent, tag, attrs) => {
    const n = document.createElementNS(SVG_NS, tag);
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, String(v)));
    parent.append(n);
    return n;
  };
  const halo = add(svg, "circle", { cx: 32, cy: 33, r: 31, fill: blob.fill, opacity: 0.16 });
  halo.setAttribute("class", "orb-halo");
  const body = add(svg, "g", { class: "orb-body" });
  body.style.animationDelay = delay;
  add(body, "path", { d: ORB_PATHS[index % ORB_PATHS.length], fill: blob.fill });
  const look = add(body, "g", { class: "orb-look" });
  look.style.animationDelay = delay;
  const blink = add(look, "g", { class: "orb-blink" });
  blink.style.animationDelay = delay;
  [21, 36].forEach((x) => add(blink, "rect", { class: "pill-eye", x, y: 23, width: 7, height: 19, rx: 3.5, fill: "#1a0f33" }));
  return svg;
}

/** The avatar for an agent, tinted per agent: the wisp, a flat blob with two pill eyes. */
export function blobSvg(blobId) {
  const blob = BLOBS.find((b) => b.id === blobId) || BLOBS[0];
  return orbSvg(blob, BLOBS.indexOf(blob));
}

const isObject = (v) => v && typeof v === "object" && !Array.isArray(v);

/** Agents sometimes reply with a JSON envelope like {"message": "...", "summary": "..."}; show the message. */
export function unwrapMessage(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed.startsWith("{") || !trimmed.endsWith("}")) return { body: String(raw || ""), note: "" };
  try {
    const data = JSON.parse(trimmed);
    if (isObject(data) && typeof data.message === "string") {
      const note = typeof data.summary === "string" ? data.summary : "";
      return { body: data.message, note };
    }
  } catch { /* not an envelope */ }
  return { body: String(raw || ""), note: "" };
}

const SAFE_URL = /^(https?:\/\/|mailto:)/i;
const INLINE = /(`[^`\n]+`)|(\*\*[^*\n]+\*\*|__[^_\n]+__)|(~~[^~\n]+~~)|(\[[^\]\n]+\]\([^)\s]+\))|(\bhttps?:\/\/[^\s<>)]+[^\s<>).,;:!?])|(\*[^*\s][^*\n]*\*|_[^_\s][^_\n]*_)/g;

/** Appends inline markdown (code, bold, italic, strike, links) to a parent, as text nodes and elements. */
export function renderInline(parent, source) {
  let last = 0;
  const textOf = (t) => document.createTextNode(t);
  for (const m of source.matchAll(INLINE)) {
    if (m.index > last) parent.append(textOf(source.slice(last, m.index)));
    const [whole] = m;
    if (m[1]) { const c = document.createElement("code"); c.textContent = whole.slice(1, -1); parent.append(c); }
    else if (m[2]) { const b = document.createElement("strong"); renderInline(b, whole.slice(2, -2)); parent.append(b); }
    else if (m[3]) { const d = document.createElement("del"); renderInline(d, whole.slice(2, -2)); parent.append(d); }
    else if (m[4]) {
      const [, label, url] = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(whole);
      if (SAFE_URL.test(url)) { const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; renderInline(a, label); parent.append(a); }
      else parent.append(textOf(label));
    } else if (m[5]) { const a = document.createElement("a"); a.href = whole; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = whole; parent.append(a); }
    else { const i = document.createElement("em"); renderInline(i, whole.slice(1, -1)); parent.append(i); }
    last = m.index + whole.length;
  }
  if (last < source.length) parent.append(textOf(source.slice(last)));
}

const FENCE_OPEN = /^\s*```\s*([\w+#.-]*)\s*$/;
const BULLET = /^(\s*)([-*+]|\d+[.)])\s+(.*)$/;

function codeBlock(lang, lines) {
  const wrap = document.createElement("div");
  wrap.className = "mdcode";
  const bar = document.createElement("div");
  bar.className = "mdcodebar";
  const label = document.createElement("span");
  label.textContent = lang || "text";
  const copy = document.createElement("button");
  copy.type = "button";
  copy.textContent = "Copy";
  copy.addEventListener("click", () => {
    navigator.clipboard?.writeText(lines.join("\n")).then(() => { copy.textContent = "Copied"; setTimeout(() => { copy.textContent = "Copy"; }, 1200); }).catch(() => {});
  });
  bar.append(label, copy);
  const pre = document.createElement("pre");
  const code = document.createElement("code");
  code.textContent = lines.join("\n");
  pre.append(code);
  wrap.append(bar, pre);
  return wrap;
}

function listBlock(items) {
  // items: [{ indent, ordered, text }]; nested by indentation.
  const root = document.createElement(items[0].ordered ? "ol" : "ul");
  const stack = [{ indent: items[0].indent, list: root }];
  items.forEach((it) => {
    while (stack.length > 1 && it.indent < stack.at(-1).indent) stack.pop();
    let top = stack.at(-1);
    if (it.indent > top.indent) {
      const parentLi = top.list.lastElementChild;
      const sub = document.createElement(it.ordered ? "ol" : "ul");
      (parentLi || top.list).append(sub);
      top = { indent: it.indent, list: sub };
      stack.push(top);
    }
    const li = document.createElement("li");
    const task = /^\[([ xX])\]\s+(.*)$/.exec(it.text);
    if (task) {
      li.className = "mdtask";
      const box = document.createElement("input");
      box.type = "checkbox";
      box.disabled = true;
      box.checked = task[1].toLowerCase() === "x";
      li.append(box, document.createTextNode(" "));
      renderInline(li, task[2]);
    } else renderInline(li, it.text);
    top.list.append(li);
  });
  return root;
}

function tableBlock(rows) {
  const split = (line) => line.replace(/^\s*\|/, "").replace(/\|\s*$/, "").split("|").map((c) => c.trim());
  const table = document.createElement("table");
  const head = document.createElement("thead");
  const hr = document.createElement("tr");
  split(rows[0]).forEach((c) => { const th = document.createElement("th"); renderInline(th, c); hr.append(th); });
  head.append(hr);
  const body = document.createElement("tbody");
  rows.slice(2).forEach((line) => {
    const tr = document.createElement("tr");
    split(line).forEach((c) => { const td = document.createElement("td"); renderInline(td, c); tr.append(td); });
    body.append(tr);
  });
  table.append(head, body);
  const wrap = document.createElement("div");
  wrap.className = "mdtable";
  wrap.append(table);
  return wrap;
}

/** Renders markdown into a container element. Tolerates half-finished text, so it is safe to call as a reply streams in. */
export function renderMarkdown(source) {
  const root = document.createElement("div");
  root.className = "md";
  const { body, note } = unwrapMessage(source);
  const lines = body.replace(/\r\n?/g, "\n").split("\n");
  let i = 0;
  let para = [];
  const flush = () => {
    if (!para.length) return;
    const p = document.createElement("p");
    para.forEach((line, n) => { if (n) p.append(document.createElement("br")); renderInline(p, line); });
    root.append(p);
    para = [];
  };
  while (i < lines.length) {
    const line = lines[i];
    const open = FENCE_OPEN.exec(line);
    if (open) {
      flush();
      const code = [];
      i += 1;
      while (i < lines.length && !/^\s*```\s*$/.test(lines[i])) { code.push(lines[i]); i += 1; }
      i += 1; // closing fence, or the end of a reply that is still streaming
      root.append(codeBlock(open[1], code));
      continue;
    }
    if (!line.trim()) { flush(); i += 1; continue; }
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      const h = document.createElement(`h${Math.min(heading[1].length + 2, 6)}`);
      renderInline(h, heading[2]);
      root.append(h);
      i += 1;
      continue;
    }
    if (/^\s*([-*_])(\s*\1){2,}\s*$/.test(line)) { flush(); root.append(document.createElement("hr")); i += 1; continue; }
    if (/^\s*>/.test(line)) {
      flush();
      const quote = [];
      while (i < lines.length && /^\s*>/.test(lines[i])) { quote.push(lines[i].replace(/^\s*>\s?/, "")); i += 1; }
      const bq = document.createElement("blockquote");
      quote.forEach((q, n) => { if (n) bq.append(document.createElement("br")); renderInline(bq, q); });
      root.append(bq);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/.test(lines[i + 1])) {
      flush();
      const rows = [];
      while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i]); i += 1; }
      root.append(tableBlock(rows));
      continue;
    }
    if (BULLET.test(line)) {
      flush();
      const items = [];
      while (i < lines.length && (BULLET.test(lines[i]) || (/^\s{2,}\S/.test(lines[i]) && items.length))) {
        const b = BULLET.exec(lines[i]);
        if (b) items.push({ indent: b[1].length, ordered: /\d/.test(b[2]), text: b[3] });
        else items.at(-1).text += ` ${lines[i].trim()}`;
        i += 1;
      }
      root.append(listBlock(items));
      continue;
    }
    para.push(line);
    i += 1;
  }
  flush();
  if (note) { const n = document.createElement("p"); n.className = "mdnote"; n.textContent = note; root.append(n); }
  return root;
}

/** A one-line plain version of a message, for the list preview. */
export function plainText(source) {
  const { body } = unwrapMessage(source);
  return body
    .replace(/```[\s\S]*?(```|$)/g, " ")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s{0,3}#{1,6}\s+/gm, "")
    .replace(/(\*\*|__|~~)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^\s*([-*+]|\d+[.)])\s+(\[[ xX]\]\s+)?/gm, "")
    .replace(/\s+/g, " ")
    .trim();
}



// ─── holons-api client ────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(message, status = 0) { super(message); this.name = "ApiError"; this.status = status; }
}

export const normalizeBase = (url) => String(url || "").trim().replace(/\/+$/, "");

/** A small client for holons-api. `fetchFn` is injectable for tests. Rails answers JSON; errors are { error } or field errors. */
export function createClient({ baseUrl, token = "", fetchFn = (...a) => globalThis.fetch(...a) } = {}) {
  const base = normalizeBase(baseUrl);
  async function request(method, path, body, { auth = true } = {}) {
    if (!base) throw new ApiError("No API address set.");
    const headers = { Accept: "application/json" };
    if (body !== undefined) headers["Content-Type"] = "application/json";
    if (auth && token) headers.Authorization = `Bearer ${token}`;
    let res;
    try {
      res = await fetchFn(`${base}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    } catch {
      throw new ApiError(`Could not reach ${base}. Is holons-api running, and does it allow this origin (CORS)?`);
    }
    let data = null;
    try { data = res.status === 204 ? null : await res.json(); } catch { /* empty or non-JSON body */ }
    if (!res.ok) {
      const detail = data && (data.error || data.errors || (typeof data === "object" ? Object.entries(data).map(([k, v]) => `${k} ${[].concat(v).join(", ")}`).join("; ") : ""));
      const msg = res.status === 401 ? "Not signed in, or the token expired." : `holons-api answered ${res.status}${detail ? `: ${typeof detail === "string" ? detail : JSON.stringify(detail)}` : ""}`;
      throw new ApiError(msg, res.status);
    }
    return data;
  }
  return {
    mode: "live",
    base,
    health: () => request("GET", "/up", undefined, { auth: false }).then(() => true),
    /** devise-api sign in; the JSON answer carries `token`. */
    async signIn(email, password) {
      const data = await request("POST", "/users/tokens/sign_in", { email, password }, { auth: false });
      if (!data || !data.token) throw new ApiError("Signed in, but the server returned no token.");
      return data.token;
    },
    listHolons: (scope) => request("GET", `/holons${scope ? `?scope=${encodeURIComponent(scope)}` : ""}`),
    // Rails exposes every post / comment; the holon or post filter happens here (no server-side filter exists).
    listPosts: async (holonId) => (await request("GET", "/posts")).filter((p) => p.holon_id === holonId),
    createPost: (post) => request("POST", "/posts", { post }),
    listComments: async (postId) => (await request("GET", "/comments")).filter((c) => c.post_id === postId),
    createComment: (comment) => request("POST", "/comments", { comment }),
    listMemberships: (holonId) => request("GET", `/holon_memberships?holon_id=${encodeURIComponent(holonId)}`),
    listCourses: async () => [],
    listModules: async () => [],
    coursesSupported: false,
  };
}

// ─── Demo mode: in-memory sample Holons that answer like the client ──────────

const ago = (min) => new Date(Date.now() - min * 60000).toISOString();

export function createDemo() {
  const users = [
    { id: 1, name: "Ada Lovelace", role: "moderator" }, { id: 2, name: "Grace Hopper", role: "moderator" },
    { id: 3, name: "Alan Turing", role: "member" }, { id: 4, name: "Katherine Johnson", role: "member" },
    { id: 5, name: "Linus Torvalds", role: "member" }, { id: 6, name: "You", role: "member" },
  ];
  const holons = [
    { id: 1, name: "Open Source Academy", description: "Learn to contribute to open source.", created_at: ago(9000), updated_at: ago(60) },
    { id: 2, name: "Garden Circle", description: "Permaculture, seeds and soil, together.", created_at: ago(7000), updated_at: ago(300) },
    { id: 3, name: "Night Owls Chess", description: "Weekly puzzles and game reviews.", created_at: ago(5000), updated_at: ago(1500) },
  ];
  const memberships = [
    ...[1, 2, 3, 4, 6].map((m, i) => ({ id: i + 1, holon_id: 1, member_id: m })),
    ...[2, 4, 5, 6].map((m, i) => ({ id: i + 10, holon_id: 2, member_id: m })),
    ...[3, 5, 6].map((m, i) => ({ id: i + 20, holon_id: 3, member_id: m })),
  ];
  const posts = [
    { id: 1, holon_id: 1, author_id: 1, title: "Welcome to Open Source Academy", content: "Say hi and tell us what you want to **ship** this term.\n\n- Pick a project\n- Read `CONTRIBUTING.md`\n- Open a first PR", created_at: ago(900), updated_at: ago(900) },
    { id: 2, holon_id: 1, author_id: 2, title: "Office hours moved", content: "Thursday at 17:00 UTC. Notes land in [the wiki](https://example.com/wiki).", created_at: ago(240), updated_at: ago(240) },
    { id: 3, holon_id: 2, author_id: 4, title: "Seed swap Saturday", content: "Bring **tomatoes**, basil, anything heirloom.", created_at: ago(700), updated_at: ago(700) },
    { id: 4, holon_id: 3, author_id: 3, title: "Puzzle of the week", content: "White to move and mate in three:\n\n```\n8/8/8/3k4/8/3K4/3Q4/8 w - - 0 1\n```", created_at: ago(1600), updated_at: ago(1600) },
  ];
  const comments = [
    { id: 1, post_id: 1, author_id: 3, content: "Hi! I want to fix a docs bug first.", created_at: ago(800), updated_at: ago(800) },
    { id: 2, post_id: 1, author_id: 1, content: "Great pick. Start with the *good first issue* label.", created_at: ago(780), updated_at: ago(780) },
  ];
  const courses = [
    { id: 1, holon_id: 1, instructor_id: 1, name: "Git and Pull Requests", description: "From `git init` to a merged PR." },
    { id: 2, holon_id: 1, instructor_id: 2, name: "Reading Large Codebases", description: "Navigate unfamiliar code with confidence." },
    { id: 3, holon_id: 2, instructor_id: 4, name: "Soil Science 101", description: "What lives under your feet." },
  ];
  const modules = [
    { id: 1, course_id: 1, name: "Branching", body: "## Branching\n\nA branch is a movable pointer to a commit.\n\n```bash\ngit switch -c my-fix\n```" },
    { id: 2, course_id: 1, name: "Opening a PR", body: "## Opening a PR\n\n1. Push your branch\n2. Describe the **why**\n3. Request review" },
    { id: 3, course_id: 2, name: "Start from the tests", body: "Tests show intent. Read them first." },
    { id: 4, course_id: 3, name: "Compost", body: "## Compost\n\nGreens and browns, about 1:3." },
  ];
  let next = { post: 100, comment: 100 };
  return {
    mode: "demo",
    base: "",
    coursesSupported: true,
    users,
    listHolons: async () => holons.slice(),
    listPosts: async (holonId) => posts.filter((p) => p.holon_id === holonId),
    createPost: async (post) => {
      if (!post.content || !post.title) throw new ApiError("Title and content can't be blank.", 422);
      const row = { id: next.post++, author_id: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...post };
      posts.push(row);
      return row;
    },
    listComments: async (postId) => comments.filter((c) => c.post_id === postId),
    createComment: async (comment) => {
      if (!comment.content) throw new ApiError("Content can't be blank.", 422);
      const row = { id: next.comment++, author_id: 6, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...comment };
      comments.push(row);
      return row;
    },
    listMemberships: async (holonId) => memberships.filter((m) => m.holon_id === holonId).map((m) => ({ ...m, role: users.find((u) => u.id === m.member_id)?.role })),
    listCourses: async (holonId) => courses.filter((c) => c.holon_id === holonId),
    listModules: async (courseId) => modules.filter((m) => m.course_id === courseId),
  };
}

/** Picks the live client when the API answers and the token is accepted, else Demo. Returns { backend, notice }. */
export async function chooseBackend({ baseUrl, token, fetchFn }) {
  const base = normalizeBase(baseUrl);
  if (!base) return { backend: createDemo(), notice: "" };
  if (!token) return { backend: createDemo(), notice: "Sign in to connect to holons-api. Showing the demo." };
  const client = createClient({ baseUrl: base, token, fetchFn });
  try {
    await client.listHolons();
    return { backend: client, notice: "" };
  } catch (e) {
    return { backend: createDemo(), notice: `${e.message} Showing the demo.` };
  }
}

// ─── Mapping Holons onto chat ────────────────────────────────────────────────

export const orbFor = (id) => BLOBS[Math.abs(Number(id) || 0) % BLOBS.length].id;
export const initialsOf = (name) => String(name || "?").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join("");

export function shortTime(iso, now = new Date()) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

/** The API needs a title on every post; a chat message has none, so the first line becomes it. */
export function titleFrom(text) {
  const first = String(text).trim().split("\n")[0].replace(/^#+\s*/, "");
  return first.length > 60 ? `${first.slice(0, 57)}...` : first;
}

/** Loads everything a Holon shows: team, courses with modules, and the feed with comments. */
export async function loadHolon(backend, holon) {
  const [memberships, courses, posts] = await Promise.all([backend.listMemberships(holon.id), backend.listCourses(holon.id), backend.listPosts(holon.id)]);
  const nameOf = (id) => (backend.users && backend.users.find((u) => u.id === id)?.name) || `Member #${id}`;
  const members = memberships.map((m) => ({ id: m.member_id, name: nameOf(m.member_id), role: m.role || "member" }));
  const withModules = await Promise.all(courses.map(async (c) => ({ ...c, modules: await backend.listModules(c.id) })));
  const feed = await Promise.all(posts.map(async (p) => ({
    ...p,
    authorName: p.author_id ? nameOf(p.author_id) : "Member",
    comments: (await backend.listComments(p.id)).map((c) => ({ ...c, authorName: nameOf(c.author_id) })),
  })));
  feed.sort((a, b) => String(a.created_at).localeCompare(String(b.created_at)));
  return { members, courses: withModules, feed, nameOf };
}

// ─── UI ──────────────────────────────────────────────────────────────────────

function el(tag, cls, content) {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (content !== undefined) node.textContent = content;
  return node;
}

const avatar = (id, small) => { const w = el("span", `avatar${small ? " sm" : ""}`); w.append(blobSvg(orbFor(id))); return w; };

function poweredBy(cls = "") {
  const d = el("div", `powered${cls ? ` ${cls}` : ""}`);
  const hand = el("span", "poweredmark");
  hand.append(blobSvg("violet"));
  d.append(el("span", "", "Powered by"), hand, el("b", "", "Kamiji"), el("span", "", "and"), el("b", "kosmos", "Kosmos"));
  return d;
}

const CSS = `
.hh { --hh-bg: var(--oh-color-base, #171717); --hh-panel: var(--oh-color-base-secondary, #212121); --hh-raised: var(--oh-surface-raised, #2a2a2a);
  --hh-text: var(--oh-foreground, #eee); --hh-contrast: var(--oh-contrast, #fff); --hh-muted: var(--oh-muted, #9a9a9a);
  --hh-border: var(--oh-border-subtle, #3a3a3a); --hh-primary: var(--oh-color-primary, #fff); --hh-on-primary: var(--oh-accent-foreground, #111);
  --hh-success: var(--oh-success, #34d399); --hh-warn: #f2b51d;
  box-sizing: border-box; position: sticky; top: 0; color: var(--hh-text); background: var(--hh-bg); font: 14px/1.45 system-ui, sans-serif;
  height: 100dvh; max-height: 100dvh; min-height: 480px; overflow: hidden; }
.hh *, .hh *::before, .hh *::after { box-sizing: border-box; }
.hh button, .hh input, .hh textarea { font: inherit; color: inherit; }
.hh .shell { display: grid; grid-template-columns: 56px 300px minmax(0, 1fr) 280px; height: 100%; min-height: 0; }
.hh .rail { display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 10px 0; border-right: 1px solid var(--hh-border); overflow-y: auto; scrollbar-width: none; }
.hh .rbtn { position: relative; width: 40px; height: 40px; border: 0; border-radius: 12px; background: transparent; color: var(--hh-muted); display: grid; place-items: center; cursor: pointer; padding: 0; }
.hh .rbtn .avatar { width: 30px; height: 30px; }
.hh .rbtn:hover { background: var(--hh-panel); color: var(--hh-contrast); }
.hh .rbtn[aria-pressed="true"] { background: var(--hh-raised); color: var(--hh-contrast); }
.hh .rbtn[aria-pressed="true"]::before { content: ""; position: absolute; left: -8px; top: 10px; bottom: 10px; width: 3px; border-radius: 3px; background: var(--hh-primary); }
.hh .rspacer { flex: 1; }
.hh .rsep { width: 24px; height: 1px; background: var(--hh-border); margin: 6px 0; }
.hh .list { display: flex; flex-direction: column; min-height: 0; border-right: 1px solid var(--hh-border); background: var(--hh-bg); }
.hh .lhead { padding: 14px 16px 8px; }
.hh .lhead h2 { margin: 0; font-size: 16px; font-weight: 650; color: var(--hh-contrast); }
.hh .lhead p { margin: 2px 0 0; color: var(--hh-muted); font-size: 12px; }
.hh .rows { flex: 1; overflow-y: auto; padding: 4px 8px; min-height: 0; }
.hh .lsect { margin: 12px 8px 4px; font-size: 11px; letter-spacing: .06em; text-transform: uppercase; color: var(--hh-muted); }
.hh .row { display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 10px; border: 0; border-radius: 10px; background: transparent; text-align: left; cursor: pointer; }
.hh .row:hover { background: var(--hh-panel); }
.hh .row[aria-current="true"] { background: var(--hh-raised); color: var(--hh-contrast); }
.hh .row .glyph { width: 18px; text-align: center; color: var(--hh-muted); flex: none; }
.hh .row .rt { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hh .row.sub { padding-left: 32px; font-size: 13px; color: var(--hh-muted); }
.hh .row .count { font-size: 11px; color: var(--hh-muted); }
.hh .powered { display: flex; align-items: center; gap: 6px; color: var(--hh-muted); font-size: 12px; }
.hh .powered b { color: var(--hh-text); font-weight: 600; }
.hh .lpowered { flex: none; justify-content: center; padding: 8px 10px; border-top: 1px solid var(--hh-border); }
.hh .poweredmark { width: 18px; height: 18px; display: inline-block; }
.hh .poweredmark svg { width: 100%; height: 100%; }
.hh .kosmos { letter-spacing: .06em; }
.hh .main { display: flex; flex-direction: column; min-width: 0; min-height: 0; }
.hh .mhead { display: flex; align-items: center; gap: 10px; padding: 12px 18px; border-bottom: 1px solid var(--hh-border); }
.hh .mhead h3 { margin: 0; font-size: 15px; color: var(--hh-contrast); flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.hh .status { display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--hh-border); background: transparent; font-size: 12px; cursor: pointer; }
.hh .status i { width: 8px; height: 8px; border-radius: 50%; background: var(--hh-warn); }
.hh .status[data-mode="live"] i { background: var(--hh-success); }
.hh .banner { margin: 10px 18px 0; padding: 8px 12px; border-radius: 10px; border: 1px solid var(--hh-border); background: var(--hh-panel); font-size: 13px; }
.hh .banner.error { border-color: #ef4444; }
.hh .thread { flex: 1; overflow-y: auto; padding: 14px 18px; display: grid; align-content: start; gap: 16px; min-height: 0; }
.hh .msg { display: grid; grid-template-columns: 40px minmax(0, 1fr); gap: 10px; }
.hh .avatar { flex: none; width: 40px; height: 40px; }
.hh .avatar svg { width: 100%; height: 100%; display: block; }
.hh .avatar.sm { width: 28px; height: 28px; }
.hh .mmeta { display: flex; gap: 8px; align-items: baseline; }
.hh .mname { font-weight: 650; color: var(--hh-contrast); }
.hh .mtime { color: var(--hh-muted); font-size: 12px; }
.hh .mtitle { font-weight: 650; color: var(--hh-contrast); margin: 2px 0; }
.hh .replies { margin-top: 8px; display: grid; gap: 10px; border-left: 2px solid var(--hh-border); padding-left: 12px; }
.hh .reply { display: grid; grid-template-columns: 28px minmax(0, 1fr); gap: 8px; }
.hh .linkbtn { border: 0; background: transparent; color: var(--hh-muted); cursor: pointer; padding: 2px 0; font-size: 12px; }
.hh .linkbtn:hover { color: var(--hh-contrast); }
.hh .rform { display: flex; gap: 6px; margin-top: 6px; }
.hh .empty { color: var(--hh-muted); text-align: center; padding: 40px 10px; }
.hh .composer { display: flex; gap: 8px; padding: 12px 18px; border-top: 1px solid var(--hh-border); align-items: flex-end; }
.hh .composer textarea, .hh .rform input, .hh .setform input { flex: 1; min-width: 0; resize: none; background: var(--hh-panel); border: 1px solid var(--hh-border); border-radius: 12px; padding: 9px 12px; }
.hh .composer textarea { min-height: 40px; max-height: 140px; }
.hh .send, .hh .primary { border: 0; border-radius: 10px; background: var(--hh-contrast); color: var(--hh-bg); padding: 8px 16px; font-weight: 600; cursor: pointer; }
.hh .send:disabled { opacity: .4; cursor: default; }
.hh .ghost { border: 1px solid var(--hh-border); border-radius: 10px; background: transparent; padding: 8px 14px; cursor: pointer; }
.hh .note { padding: 12px 18px; border-top: 1px solid var(--hh-border); color: var(--hh-muted); font-size: 12.5px; }
.hh .team { border-left: 1px solid var(--hh-border); padding: 14px; overflow-y: auto; }
.hh .team h4 { margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--hh-muted); }
.hh .member { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
.hh .member small { color: var(--hh-muted); display: block; }
.hh .welcome { flex: 1; position: relative; display: grid; place-items: center; align-content: center; text-align: center; gap: 12px; padding: 24px; background: radial-gradient(circle at 50% 35%, color-mix(in srgb, #8B5CF6 28%, var(--hh-bg)), var(--hh-bg) 70%); overflow: auto; }
.hh .welcome h1 { margin: 0; font-size: 28px; font-weight: 500; color: #fff; }
.hh .welcome p { margin: 0; color: rgba(255,255,255,.7); max-width: 420px; }
.hh .wbig { width: 110px; height: 110px; }
.hh .wbig svg { width: 100%; height: 100%; }
.hh .wpowered { position: absolute; left: 0; right: 0; bottom: 16px; justify-content: center; color: rgba(255,255,255,.62); }
.hh .wpowered b { color: #fff; }
.hh .setform { display: grid; gap: 8px; padding: 14px 18px; border-bottom: 1px solid var(--hh-border); background: var(--hh-panel); }
.hh .setform label { display: grid; gap: 3px; font-size: 12px; color: var(--hh-muted); }
.hh .setform .btns { display: flex; gap: 8px; }
.hh .orb-body { transform-box: view-box; transform-origin: 32px 34px; animation: hhOrb 5s ease-in-out infinite alternate; }
.hh .orb-look { animation: hhLook 8s ease-in-out infinite; }
.hh .orb-blink { transform-box: view-box; transform-origin: 32px 33px; animation: hhBlink 6s infinite; }
@keyframes hhOrb { 0% { transform: scale(1, 1) rotate(0deg); } 100% { transform: scale(1.05, .95) rotate(-3deg); } }
@keyframes hhLook { 0%, 38% { transform: translateX(0); } 46%, 66% { transform: translateX(3px); } 76%, 92% { transform: translateX(-3px); } 100% { transform: translateX(0); } }
@keyframes hhBlink { 0%, 91%, 100% { transform: scaleY(1); } 94% { transform: scaleY(.1); } }
@media (prefers-reduced-motion: reduce) { .hh .orb-body, .hh .orb-look, .hh .orb-blink { animation: none; } }
.hh .md { display: grid; gap: 8px; min-width: 0; line-height: 1.5; }
.hh .md p, .hh .md ul, .hh .md ol, .hh .md blockquote, .hh .md h3, .hh .md h4, .hh .md h5, .hh .md h6, .hh .md hr { margin: 0; }
.hh .md h3, .hh .md h4, .hh .md h5, .hh .md h6 { font-weight: 650; color: var(--hh-contrast); }
.hh .md strong { font-weight: 650; color: var(--hh-contrast); }
.hh .md a { color: #7c9dff; text-decoration: underline; text-underline-offset: 2px; }
.hh .md ul, .hh .md ol { padding-left: 22px; display: grid; gap: 3px; }
.hh .md blockquote { border-left: 3px solid var(--hh-border); padding: 2px 0 2px 12px; color: var(--hh-muted); }
.hh .md hr { border: 0; border-top: 1px solid var(--hh-border); }
.hh .md code { font: 12.5px ui-monospace, SF Mono, Menlo, monospace; background: rgba(255,255,255,.08); border-radius: 5px; padding: 1px 5px; overflow-wrap: anywhere; }
.hh .md .mdcode { border: 1px solid var(--hh-border); border-radius: 10px; overflow: hidden; background: #0e0e10; }
.hh .md .mdcodebar { display: flex; justify-content: space-between; padding: 4px 10px; font-size: 11px; color: var(--hh-muted); border-bottom: 1px solid var(--hh-border); }
.hh .md .mdcodebar button { border: 0; background: transparent; color: var(--hh-muted); cursor: pointer; font-size: 11px; }
.hh .md pre { margin: 0; padding: 10px 12px; overflow-x: auto; font: 12.5px/1.55 ui-monospace, SF Mono, Menlo, monospace; }
.hh .md pre code { background: none; padding: 0; }
.hh .md .mdtable { overflow-x: auto; border: 1px solid var(--hh-border); border-radius: 10px; }
.hh .md table { border-collapse: collapse; width: 100%; font-size: 13px; }
.hh .md th, .hh .md td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--hh-border); }
.hh .md .mdnote { font-size: 12px; color: var(--hh-muted); }
@media (max-width: 900px) { .hh .shell { grid-template-columns: 56px 220px minmax(0, 1fr); } .hh .team { display: none; } }
`;

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("Holons Hangout requires Canvas host API 1.");
  return host.registerPage("holons-hangout", ({ container }) => mount(container));
}

function readSaved() {
  try { return { baseUrl: "", token: "", email: "", ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; } catch { return { baseUrl: "", token: "", email: "" }; }
}
function writeSaved(saved) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }

function mount(container) {
  const root = el("div", "hh");
  container.append(el("style", "", CSS), root);
  let disposed = false;
  const saved = readSaved();
  const state = { backend: null, notice: "", error: "", holons: [], holonId: null, channel: "welcome", data: null, loading: true, settings: false, openReplies: new Set(), refocus: false };

  const holon = () => state.holons.find((h) => h.id === state.holonId);
  const safe = (fn) => async (...a) => { try { state.error = ""; await fn(...a); } catch (e) { state.error = e.message || String(e); } if (!disposed) render(); };

  async function connect(creds) {
    state.loading = true; render();
    const { backend, notice } = await chooseBackend({ baseUrl: creds.baseUrl, token: creds.token });
    if (disposed) return;
    state.backend = backend; state.notice = notice; state.error = "";
    try { state.holons = await backend.listHolons(); } catch (e) { state.holons = []; state.error = e.message; }
    state.holonId = null; state.channel = "welcome"; state.data = null; state.loading = false;
    render();
  }

  const openHolon = safe(async (id) => {
    state.holonId = id; state.channel = "feed"; state.data = null; render();
    state.data = await loadHolon(state.backend, holon());
  });

  const refresh = async () => { state.data = await loadHolon(state.backend, holon()); };

  const post = safe(async (text) => {
    await state.backend.createPost({ holon_id: state.holonId, title: titleFrom(text), content: text });
    await refresh();
    state.refocus = true;
  });
  const reply = safe(async (postId, text) => {
    await state.backend.createComment({ post_id: postId, content: text });
    state.openReplies.add(postId);
    await refresh();
  });
  const signIn = safe(async (baseUrl, email, password) => {
    const base = normalizeBase(baseUrl);
    const token = await createClient({ baseUrl: base }).signIn(email, password);
    saved.baseUrl = base; saved.token = token; saved.email = email; writeSaved(saved);
    state.settings = false;
    await connect(saved);
  });

  // — pieces —
  function railView() {
    const rail = el("nav", "rail");
    rail.setAttribute("aria-label", "Holons");
    const home = el("button", "rbtn");
    home.type = "button"; home.title = "Home"; home.setAttribute("aria-label", "Home");
    home.setAttribute("aria-pressed", String(state.channel === "welcome"));
    home.append(avatar(0, false));
    home.addEventListener("click", () => { state.holonId = null; state.channel = "welcome"; render(); });
    rail.append(home, el("div", "rsep"));
    state.holons.forEach((h) => {
      const b = el("button", "rbtn");
      b.type = "button"; b.title = h.name; b.setAttribute("aria-label", h.name); b.dataset.holon = String(h.id);
      b.setAttribute("aria-pressed", String(h.id === state.holonId));
      b.append(avatar(h.id + 1, false));
      b.addEventListener("click", () => openHolon(h.id));
      rail.append(b);
    });
    return rail;
  }

  function listView() {
    const col = el("aside", "list");
    const head = el("div", "lhead");
    const h = holon();
    head.append(el("h2", "", h ? h.name : "Holons"), el("p", "", h ? h.description || "" : "Communities you belong to"));
    const rows = el("div", "rows");
    const row = (glyph, label, key, cls = "", count) => {
      const b = el("button", `row ${cls}`.trim());
      b.type = "button"; b.dataset.channel = key;
      if (state.channel === key) b.setAttribute("aria-current", "true");
      b.append(el("span", "glyph", glyph), el("span", "rt", label));
      if (count !== undefined) b.append(el("span", "count", String(count)));
      b.addEventListener("click", () => { state.channel = key; render(); });
      return b;
    };
    if (!h) {
      state.holons.forEach((x) => {
        const b = el("button", "row");
        b.type = "button"; b.dataset.holon = String(x.id);
        b.append(avatar(x.id + 1, true), el("span", "rt", x.name));
        b.addEventListener("click", () => openHolon(x.id));
        rows.append(b);
      });
      if (!state.holons.length && !state.loading) rows.append(el("div", "empty", "No Holons yet."));
    } else {
      rows.append(el("div", "lsect", "Channels"), row("#", "feed", "feed", "", state.data ? state.data.feed.length : undefined));
      rows.append(el("div", "lsect", "Courses"));
      if (state.data) {
        if (!state.backend.coursesSupported) rows.append(el("div", "empty", "holons-api exposes no courses yet."));
        else if (!state.data.courses.length) rows.append(el("div", "empty", "No courses yet."));
        state.data.courses.forEach((c) => {
          rows.append(row("▸", c.name, `course:${c.id}`));
          c.modules.forEach((m) => rows.append(row("•", m.name, `module:${m.id}`, "sub")));
        });
      }
    }
    col.append(head, rows, poweredBy("lpowered"));
    return col;
  }

  function messageView(name, authorId, time, bodyNode, small) {
    const m = el("div", small ? "reply" : "msg");
    m.append(avatar(authorId, small));
    const body = el("div", "mbody");
    const meta = el("div", "mmeta");
    meta.append(el("span", "mname", name), el("span", "mtime", time));
    body.append(meta, bodyNode);
    m.append(body);
    return m;
  }

  function feedView(thread) {
    if (!state.data.feed.length) thread.append(el("div", "empty", "No posts yet. Start the conversation."));
    state.data.feed.forEach((p) => {
      const body = el("div");
      body.append(el("div", "mtitle", p.title || ""), renderMarkdown(p.content || ""));
      const msg = messageView(p.authorName, p.author_id, shortTime(p.created_at), body);
      msg.dataset.post = String(p.id);
      const open = state.openReplies.has(p.id);
      const toggle = el("button", "linkbtn", `${open ? "Hide" : "Show"} replies (${p.comments.length})`);
      toggle.type = "button";
      toggle.addEventListener("click", () => { if (open) state.openReplies.delete(p.id); else state.openReplies.add(p.id); render(); });
      body.append(toggle);
      if (open) {
        const replies = el("div", "replies");
        p.comments.forEach((c) => replies.append(messageView(c.authorName, c.author_id, shortTime(c.created_at), renderMarkdown(c.content || ""), true)));
        const form = el("form", "rform");
        const input = el("input"); input.placeholder = "Reply..."; input.setAttribute("aria-label", "Reply");
        const go = el("button", "ghost", "Reply"); go.type = "submit";
        form.append(input, go);
        form.addEventListener("submit", (e) => { e.preventDefault(); const t = input.value.trim(); if (t) reply(p.id, t); });
        replies.append(form);
        body.append(replies);
      }
      thread.append(msg);
    });
  }

  function mainView() {
    const main = el("main", "main");
    const head = el("div", "mhead");
    const h = holon();
    const course = state.data && state.channel.startsWith("course:") ? state.data.courses.find((c) => `course:${c.id}` === state.channel) : null;
    const mod = state.data && state.channel.startsWith("module:") ? state.data.courses.flatMap((c) => c.modules.map((m) => ({ ...m, course: c }))).find((m) => `module:${m.id}` === state.channel) : null;
    const title = state.channel === "welcome" || !h ? "Welcome" : course ? course.name : mod ? `${mod.course.name} / ${mod.name}` : `${h.name} / feed`;
    head.append(el("h3", "", title));
    const status = el("button", "status");
    status.type = "button"; status.dataset.mode = state.backend ? state.backend.mode : "demo";
    status.title = "Connection settings";
    status.append(el("i"), el("span", "", state.loading ? "Connecting..." : state.backend && state.backend.mode === "live" ? "Connected" : "Demo"));
    status.addEventListener("click", () => { state.settings = !state.settings; render(); });
    head.append(status);
    main.append(head);
    if (state.settings) main.append(settingsView());
    if (state.notice) main.append(el("div", "banner", state.notice));
    if (state.error) { const b = el("div", "banner error", state.error); b.setAttribute("role", "alert"); main.append(b); }

    if (state.channel === "welcome" || !h) {
      const w = el("div", "welcome");
      const big = el("span", "wbig"); big.append(blobSvg("violet"));
      const live = state.backend && state.backend.mode === "live";
      w.append(big, el("h1", "", "Holons Hangout"),
        el("p", "", live ? `Connected to ${state.backend.base}. Pick a Holon on the left.` : "Chat with your Holons: feeds, courses and the people in them. You are in Demo mode with sample Holons."),
        poweredBy("wpowered"));
      main.append(w);
      return main;
    }
    const thread = el("div", "thread");
    if (!state.data) thread.append(el("div", "empty", "Loading..."));
    else if (state.channel === "feed") feedView(thread);
    else if (course) {
      thread.append(messageView("Course", course.instructor_id || course.id, "", renderMarkdown(`**${course.name}**\n\n${course.description || ""}`)));
      course.modules.forEach((m) => thread.append(messageView(m.name, m.id, "", renderMarkdown(m.body || m.description || ""))));
    } else if (mod) thread.append(messageView(mod.name, mod.id, "", renderMarkdown(mod.body || "")));
    else thread.append(el("div", "empty", "Nothing here."));
    main.append(thread);

    if (state.channel === "feed" && state.data) {
      const form = el("form", "composer");
      const ta = el("textarea"); ta.placeholder = `Post to ${h.name}`; ta.rows = 1; ta.setAttribute("aria-label", "Message");
      const send = el("button", "send", "Send"); send.type = "submit";
      form.append(ta, send);
      ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); } });
      form.addEventListener("submit", (e) => { e.preventDefault(); const t = ta.value.trim(); if (t) post(t); });
      main.append(form);
    } else main.append(el("div", "note", "Courses and modules are read-only here."));
    return main;
  }

  function settingsView() {
    const form = el("form", "setform");
    const field = (label, type, value, name) => {
      const l = el("label", "", label);
      const i = el("input"); i.type = type; i.value = value; i.name = name; i.autocomplete = type === "password" ? "current-password" : "off";
      l.append(i);
      return [l, i];
    };
    const [l1, base] = field("holons-api base URL", "url", saved.baseUrl, "base");
    base.placeholder = "http://localhost:3000";
    const [l2, email] = field("Email", "email", saved.email, "email");
    const [l3, pass] = field("Password", "password", "", "password");
    const btns = el("div", "btns");
    const go = el("button", "primary", "Connect"); go.type = "submit";
    const demo = el("button", "ghost", "Use demo"); demo.type = "button";
    btns.append(go, demo);
    form.append(l1, l2, l3, btns, el("small", "", "The URL and token stay in this browser. The password is sent once and not stored."));
    form.addEventListener("submit", (e) => { e.preventDefault(); signIn(base.value, email.value.trim(), pass.value); });
    demo.addEventListener("click", () => { saved.baseUrl = ""; saved.token = ""; writeSaved(saved); state.settings = false; connect(saved); });
    return form;
  }

  function teamView() {
    const col = el("aside", "team");
    col.append(el("h4", "", `Team${state.data ? ` (${state.data.members.length})` : ""}`));
    if (state.data) state.data.members.forEach((m) => {
      const r = el("div", "member");
      const who = el("div");
      who.append(el("span", "", m.name), el("small", "", m.role));
      r.append(avatar(m.id, true), who);
      col.append(r);
    });
    else col.append(el("div", "empty", holon() ? "Loading..." : "Pick a Holon."));
    return col;
  }

  function render() {
    if (disposed) return;
    const shell = el("div", "shell");
    shell.append(railView(), listView(), mainView(), teamView());
    root.replaceChildren(shell);
    const ta = root.querySelector(".composer textarea");
    if (ta && state.refocus) { ta.focus(); state.refocus = false; }
  }

  render();
  connect(saved);
  return () => { disposed = true; root.remove(); };
}
