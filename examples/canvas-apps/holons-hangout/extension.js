/* Holons — the Hangout / Team Chat experience, built on Holons.
 *
 * A Holon is a workspace (left icon rail); its feed, courses and modules are channels; its
 * members are the team; feed posts are threaded messages (comments are the replies).
 *
 * Browser-only, dependency-free ESM. Styles are scoped under `.hh`; text is always set with
 * textContent. The holons-api base URL (and a sign-in token) are kept in this browser's
 * localStorage. With no reachable API it runs in Demo mode on in-memory sample Holons.
 *
 * API endpoints VERIFIED against holons-api config/routes.rb (resources + devise_for :users), the
 * controllers' permitted params, the Pundit policies and test/test_helper.rb:
 *   POST /users/tokens/sign_in {email,password}        GET /up
 *   GET|POST /holons {holon:{name,description}}         GET /holons?scope=created|joined
 *   PATCH|DELETE /holons/:id (creator or admin only)
 *   GET|POST /posts {post:{holon_id,title,content}}     PATCH|DELETE /posts/:id
 *   GET|POST /comments {comment:{post_id,content}}      PATCH|DELETE /comments/:id
 *   GET|POST /holon_memberships {holon_membership:{holon_id,member_id}}   DELETE /holon_memberships/:id
 * UNVERIFIED (the devise-api gem source is not installed here; config/initializers/devise.rb enables
 * sign_up with extra_fields name, nickname): POST /users/tokens/sign_up, POST /users/tokens/revoke,
 * GET /users/tokens/info and the `resource_owner` object in the token answer.
 * holons-api has no course or module endpoints (the React front end keeps those in Firestore), so
 * courses are Demo-only, or "Local only" in this browser when connected. It has no invite endpoint.
 * Its jbuilder views omit post title and author ids, so ownership comes from scope=created, from
 * what this browser created, and the server's own 403 is the final word.
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
const HTTP_URL = /^https?:\/\//i;
let urlPolicy = SAFE_URL; // set per renderMarkdown call; the docs reader allows http(s) only
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
      if (urlPolicy.test(url)) { const a = document.createElement("a"); a.href = url; a.target = "_blank"; a.rel = "noopener noreferrer"; renderInline(a, label); parent.append(a); }
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

/** Renders markdown into a container element. Tolerates half-finished text, so it is safe to call as a reply streams in.
 *  `httpOnly` limits links to http(s) (the docs reader); the default also allows mailto:. */
export function renderMarkdown(source, { httpOnly = false } = {}) {
  const previous = urlPolicy;
  urlPolicy = httpOnly ? HTTP_URL : SAFE_URL;
  try { return buildMarkdown(source); } finally { urlPolicy = previous; }
}

function buildMarkdown(source) {
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
    /** devise-api token call; the JSON answer carries `token` and (unverified) `resource_owner`. */
    async authenticate(path, body) {
      const data = await request("POST", path, body, { auth: false });
      const token = data && (typeof data.token === "string" ? data.token : data.token && data.token.access_token);
      if (!token) return { token: "", owner: null, data };
      const o = data.resource_owner;
      return { token, owner: o && o.id !== undefined ? { id: o.id, email: o.email || body.email, name: o.name || o.nickname || "" } : null, data };
    },
    async signIn(email, password) {
      const { token } = await this.authenticate("/users/tokens/sign_in", { email, password });
      if (!token) throw new ApiError("Signed in, but the server returned no token.");
      return token;
    },
    /** UNVERIFIED route: devise-api sign_up (enabled in holons-api's devise.rb). Top-level params, like sign_in. */
    signUp(fields) { return this.authenticate("/users/tokens/sign_up", fields); },
    /** UNVERIFIED route: revokes the current token. */
    signOut: () => request("POST", "/users/tokens/revoke"),
    /** UNVERIFIED route: the signed-in user, used only when the token answer has no resource_owner. */
    async whoami() {
      const d = await request("GET", "/users/tokens/info");
      const o = d && (d.resource_owner || d.user);
      return o && o.id !== undefined ? { id: o.id, email: o.email || "", name: o.name || o.nickname || "" } : null;
    },
    listHolons: (scope) => request("GET", `/holons${scope ? `?scope=${encodeURIComponent(scope)}` : ""}`),
    createHolon: (holon) => request("POST", "/holons", { holon }),
    updateHolon: (id, holon) => request("PATCH", `/holons/${encodeURIComponent(id)}`, { holon }),
    deleteHolon: (id) => request("DELETE", `/holons/${encodeURIComponent(id)}`),
    // Rails exposes every post / comment; the holon or post filter happens here (no server-side filter exists).
    listPosts: async (holonId) => (await request("GET", "/posts")).filter((p) => p.holon_id === holonId),
    createPost: (post) => request("POST", "/posts", { post }),
    updatePost: (id, post) => request("PATCH", `/posts/${encodeURIComponent(id)}`, { post }),
    deletePost: (id) => request("DELETE", `/posts/${encodeURIComponent(id)}`),
    listComments: async (postId) => (await request("GET", "/comments")).filter((c) => c.post_id === postId),
    createComment: (comment) => request("POST", "/comments", { comment }),
    updateComment: (id, comment) => request("PATCH", `/comments/${encodeURIComponent(id)}`, { comment }),
    deleteComment: (id) => request("DELETE", `/comments/${encodeURIComponent(id)}`),
    listMemberships: (holonId) => request("GET", `/holon_memberships?holon_id=${encodeURIComponent(holonId)}`),
    createMembership: (holon_membership) => request("POST", "/holon_memberships", { holon_membership }),
    deleteMembership: (id) => request("DELETE", `/holon_memberships/${encodeURIComponent(id)}`),
    inviteSupported: false,
    listCourses: async () => [],
    listModules: async () => [],
    coursesSupported: false,
  };
}

// ─── Courses and modules: no holons-api routes, so an in-memory (Demo) or browser-local store ─────

const COURSES_KEY = "holons-hangout:local-courses:v1";
const blank = (v) => !String(v || "").trim();

/** Courses and modules with create, reorder and complete. `save` (optional) persists the whole state. */
export function createCourseStore(seed, { save, idPrefix = "" } = {}) {
  const st = { courses: (seed.courses || []).map((c) => ({ ...c })), modules: (seed.modules || []).map((m) => ({ ...m })), next: seed.next || 100 };
  const persist = () => { if (save) save(st); };
  const newId = () => (idPrefix ? `${idPrefix}${st.next++}` : st.next++);
  const find = (id) => st.modules.findIndex((m) => String(m.id) === String(id));
  return {
    state: st,
    listCourses: async (holonId) => st.courses.filter((c) => c.holon_id === holonId),
    listModules: async (courseId) => st.modules.filter((m) => String(m.course_id) === String(courseId)),
    createCourse: async ({ holon_id, name, description = "" }) => {
      if (blank(name)) throw new ApiError("Course name can't be blank.", 422);
      const row = { id: newId(), holon_id, name: name.trim(), description: description.trim(), local: Boolean(idPrefix) };
      st.courses.push(row); persist();
      return { ...row };
    },
    createModule: async ({ course_id, name, body = "" }) => {
      if (blank(name)) throw new ApiError("Module name can't be blank.", 422);
      if (!st.courses.some((c) => String(c.id) === String(course_id))) throw new ApiError("Pick a course first.", 422);
      const row = { id: newId(), course_id, name: name.trim(), body, completed: false };
      st.modules.push(row); persist();
      return { ...row };
    },
    /** Moves a module one step earlier (-1) or later (+1) within its course. */
    moveModule: async (id, dir) => {
      const i = find(id);
      if (i < 0) throw new ApiError("That module no longer exists.", 404);
      const sibs = st.modules.map((m, n) => ({ m, n })).filter((x) => String(x.m.course_id) === String(st.modules[i].course_id));
      const at = sibs.findIndex((x) => x.n === i);
      const other = sibs[at + dir];
      if (!other) return false;
      [st.modules[i], st.modules[other.n]] = [st.modules[other.n], st.modules[i]];
      persist();
      return true;
    },
    setComplete: async (id, completed) => {
      const i = find(id);
      if (i < 0) throw new ApiError("That module no longer exists.", 404);
      st.modules[i] = { ...st.modules[i], completed: Boolean(completed) };
      persist();
    },
  };
}

/** Wraps a live client with browser-local courses for one base URL. Nothing here is sent to the server. */
export function withLocalCourses(client, storage = globalThis.localStorage) {
  let all = {};
  try { all = JSON.parse(storage.getItem(COURSES_KEY) || "{}"); } catch { all = {}; }
  const mine = all[client.base] || {};
  const store = createCourseStore({ ...mine, next: mine.next || 1 }, {
    idPrefix: "L",
    save: (st) => { all[client.base] = { courses: st.courses, modules: st.modules, next: st.next }; try { storage.setItem(COURSES_KEY, JSON.stringify(all)); } catch { /* storage blocked */ } },
  });
  return Object.assign(client, { localCourses: true, ...Object.fromEntries(["listCourses", "listModules", "createCourse", "createModule", "moveModule", "setComplete"].map((k) => [k, store[k]])) });
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
    { id: 1, creator_id: 1, name: "Open Source Academy", description: "Learn to contribute to open source.", created_at: ago(9000), updated_at: ago(60) },
    { id: 2, creator_id: 4, name: "Garden Circle", description: "Permaculture, seeds and soil, together.", created_at: ago(7000), updated_at: ago(300) },
    { id: 3, creator_id: 3, name: "Night Owls Chess", description: "Weekly puzzles and game reviews.", created_at: ago(5000), updated_at: ago(1500) },
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
  const courseStore = createCourseStore({
    courses: [
      { id: 1, holon_id: 1, instructor_id: 1, name: "Git and Pull Requests", description: "From `git init` to a merged PR." },
      { id: 2, holon_id: 1, instructor_id: 2, name: "Reading Large Codebases", description: "Navigate unfamiliar code with confidence." },
      { id: 3, holon_id: 2, instructor_id: 4, name: "Soil Science 101", description: "What lives under your feet." },
    ],
    modules: [
      { id: 1, course_id: 1, name: "Branching", body: "## Branching\n\nA branch is a movable pointer to a commit.\n\n```bash\ngit switch -c my-fix\n```" },
      { id: 2, course_id: 1, name: "Opening a PR", body: "## Opening a PR\n\n1. Push your branch\n2. Describe the **why**\n3. Request review" },
      { id: 3, course_id: 2, name: "Start from the tests", body: "Tests show intent. Read them first." },
      { id: 4, course_id: 3, name: "Compost", body: "## Compost\n\nGreens and browns, about 1:3." },
    ],
    next: 100,
  });
  const ME = 6;
  let next = { post: 100, comment: 100, holon: 100, membership: 100 };
  const now = () => new Date().toISOString();
  const need = (v, what) => { if (blank(v)) throw new ApiError(`${what} can't be blank.`, 422); };
  const find = (list, id, what) => { const row = list.find((x) => x.id === id); if (!row) throw new ApiError(`${what} not found.`, 404); return row; };
  const ownerOnly = (row, what) => { if (row.author_id !== ME) throw new ApiError(`holons-api answered 403: you can only change your own ${what}.`, 403); };
  return {
    mode: "demo",
    base: "",
    coursesSupported: true,
    users,
    me: { id: ME, name: "You", email: "you@demo.local" },
    ...courseStore,
    listHolons: async (scope) => holons.filter((h) => (scope === "created" ? h.creator_id === ME : scope === "joined" ? memberships.some((m) => m.holon_id === h.id && m.member_id === ME) : true)),
    createHolon: async (h) => {
      need(h.name, "Name");
      if (holons.some((x) => x.name.toLowerCase() === h.name.trim().toLowerCase())) throw new ApiError("holons-api answered 422: name has already been taken", 422);
      const row = { id: next.holon++, creator_id: ME, name: h.name.trim(), description: (h.description || "").trim(), created_at: now(), updated_at: now() };
      holons.push(row);
      return { ...row };
    },
    updateHolon: async (id, h) => {
      const row = find(holons, id, "Holon");
      if (row.creator_id !== ME) throw new ApiError("holons-api answered 403: only the creator can change a Holon.", 403);
      need(h.name, "Name");
      Object.assign(row, { name: h.name.trim(), description: (h.description || "").trim(), updated_at: now() });
      return { ...row };
    },
    deleteHolon: async (id) => {
      const row = find(holons, id, "Holon");
      if (row.creator_id !== ME) throw new ApiError("holons-api answered 403: only the creator can delete a Holon.", 403);
      holons.splice(holons.indexOf(row), 1);
      [posts, memberships].forEach((l) => { for (let i = l.length - 1; i >= 0; i--) if (l[i].holon_id === id) l.splice(i, 1); });
    },
    listPosts: async (holonId) => posts.filter((p) => p.holon_id === holonId),
    createPost: async (post) => {
      if (!post.content || !post.title) throw new ApiError("Title and content can't be blank.", 422);
      const row = { id: next.post++, author_id: ME, created_at: now(), updated_at: now(), ...post };
      posts.push(row);
      return row;
    },
    updatePost: async (id, patch) => {
      const row = find(posts, id, "Post");
      ownerOnly(row, "posts");
      if (blank(patch.title) || blank(patch.content)) throw new ApiError("Title and content can't be blank.", 422);
      Object.assign(row, { title: patch.title, content: patch.content, updated_at: now() });
      return { ...row };
    },
    deletePost: async (id) => {
      const row = find(posts, id, "Post");
      ownerOnly(row, "posts");
      posts.splice(posts.indexOf(row), 1);
      for (let i = comments.length - 1; i >= 0; i--) if (comments[i].post_id === id) comments.splice(i, 1);
    },
    listComments: async (postId) => comments.filter((c) => c.post_id === postId),
    createComment: async (comment) => {
      if (!comment.content) throw new ApiError("Content can't be blank.", 422);
      const row = { id: next.comment++, author_id: ME, created_at: now(), updated_at: now(), ...comment };
      comments.push(row);
      return row;
    },
    updateComment: async (id, patch) => {
      const row = find(comments, id, "Comment");
      ownerOnly(row, "comments");
      need(patch.content, "Content");
      Object.assign(row, { content: patch.content, updated_at: now() });
      return { ...row };
    },
    deleteComment: async (id) => {
      const row = find(comments, id, "Comment");
      ownerOnly(row, "comments");
      comments.splice(comments.indexOf(row), 1);
    },
    listMemberships: async (holonId) => memberships.filter((m) => m.holon_id === holonId).map((m) => ({ ...m, role: users.find((u) => u.id === m.member_id)?.role })),
    createMembership: async ({ holon_id, member_id }) => {
      find(holons, holon_id, "Holon");
      if (memberships.some((m) => m.holon_id === holon_id && m.member_id === member_id)) throw new ApiError("holons-api answered 422: holon has already been taken", 422);
      const row = { id: next.membership++, holon_id, member_id };
      memberships.push(row);
      return { ...row };
    },
    deleteMembership: async (id) => {
      const row = find(memberships, id, "Membership");
      memberships.splice(memberships.indexOf(row), 1);
    },
    inviteSupported: false,
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
    return { backend: withLocalCourses(client), notice: "" };
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
  const members = memberships.map((m) => ({ id: m.member_id, membershipId: m.id, name: nameOf(m.member_id), role: m.role || "member" }));
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

const KAMIJI_STROKES = ["M18 24V82M46 24L20 54M28 50L48 82", "M96 48V82", "M120 48V82M120 60Q120 48 134 48Q148 48 148 62V82M148 62Q148 48 162 48Q176 48 176 62V82", "M198 48V82M198 26V26", "M224 48V86Q224 98 210 98M224 26V26", "M250 48V82M250 26V26"];
const KOSMOS_PATHS = [
  "M79.81,54.47c-2.27-3.14-3.59-7.14-3.59-11.73,0-11.39,8.05-19.17,18.75-19.17,5.44,0,10.18,2.02,13.54,5.49,2.77-3.32,28.03-25.97,31.05-29.06-24.12,19.01-35.79,11.75-44.59,11.75-18.92,0-32.79,13.18-32.79,30.99,0,8.04,2.84,15.14,7.69,20.51",
  "M111.85,33.96c1.19,2.57,1.86,5.52,1.86,8.77,0,11.38-8.05,19.17-18.75,19.17-4.03,0-7.67-1.1-10.66-3.09-3.54,2.54-21.13,20.86-24.29,23.89,18.2-10.53,26.87-8.99,34.95-8.99,18.83,0,32.79-13.1,32.79-30.99,0-6.58-2.16-12.99-5.7-18.17l-10.2,9.4Z",
  "M137.56,66.79l4.71-10.44c5.05,3.68,12.58,6.25,19.77,6.25,8.22,0,11.56-2.74,11.56-6.42,0-11.21-34.84-3.51-34.84-25.77,0-10.19,8.22-18.66,25.25-18.66,7.53,0,15.24,1.8,20.8,5.31l-4.28,10.53c-5.56-3.17-11.3-4.71-16.61-4.71-8.22,0-11.39,3.08-11.39,6.85,0,11.04,34.84,3.42,34.84,25.42,0,10.02-8.3,18.58-25.42,18.58-9.5,0-19.09-2.83-24.4-6.93Z",
  "M254.75,72.7l-.09-35.95-17.63,29.62h-6.25l-17.55-28.85v35.18h-13.01V12.78h11.47l22.43,37.24,22.09-37.24h11.39l.17,59.92h-13.01Z",
  "M280.39,42.78c0-17.81,13.87-30.99,32.79-30.99s32.79,13.1,32.79,30.99-13.95,30.99-32.79,30.99-32.79-13.18-32.79-30.99ZM331.93,42.78c0-11.39-8.05-19.17-18.75-19.17s-18.75,7.79-18.75,19.17,8.05,19.17,18.75,19.17,18.75-7.79,18.75-19.17Z",
  "M355.48,66.84l4.71-10.44c5.05,3.68,12.58,6.25,19.77,6.25,8.22,0,11.56-2.74,11.56-6.42,0-11.21-34.84-3.51-34.84-25.77,0-10.19,8.22-18.66,25.25-18.66,7.53,0,15.24,1.8,20.8,5.31l-4.28,10.53c-5.56-3.17-11.3-4.71-16.61-4.71-8.22,0-11.39,3.08-11.39,6.85,0,11.04,34.84,3.42,34.84,25.42,0,10.02-8.3,18.58-25.42,18.58-9.5,0-19.09-2.83-24.4-6.93Z",
  "M13.78,39.15V12.78H0v59.92h13.78v-15.15l.03-.03M28.22,42.74 56.22,72.7H38.43L19.09,52.01 13.81,46.36 10.43,42.74 13.78,39.15 38.43,12.78H56.22L31.06,39.7Z",
];

function logoSvg(viewBox, label, paths, stroke) {
  const svg = document.createElementNS(SVG_NS, "svg");
  svg.setAttribute("viewBox", viewBox);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", label);
  const title = document.createElementNS(SVG_NS, "title");
  title.textContent = label;
  svg.append(title);
  paths.forEach((d) => {
    const path = document.createElementNS(SVG_NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("aria-hidden", "true");
    if (stroke) Object.entries({ fill: "none", stroke: "currentColor", "stroke-width": stroke, "stroke-linecap": "round", "stroke-linejoin": "round" }).forEach(([k, v]) => path.setAttribute(k, v));
    else path.setAttribute("fill", "currentColor");
    svg.append(path);
  });
  return svg;
}

function poweredBy(cls = "") {
  const d = el("div", `powered${cls ? ` ${cls}` : ""}`);
  const logo = (href, svg) => {
    const a = el("a", "plogo");
    a.href = href;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.setAttribute("aria-label", svg.getAttribute("aria-label"));
    a.append(svg);
    return a;
  };
  d.append(
    el("span", "", "Built with"),
    logo("https://github.com/FraterCCCLXIII/kamiji", logoSvg("0 0 276 118", "Kamiji", KAMIJI_STROKES, 16)),
    logo("https://kosmos.computer", logoSvg("0 0 405.3 82.71", "Kosmos", KOSMOS_PATHS)),
  );
  return d;
}

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



// <docs:generated>
// Generated by scripts/embed-docs.mjs from docs/*.md. Do not edit by hand; run `npm run embed-docs`.
export const DOCS = [
  { id: "index", title: "Holons documentation", markdown: "# Holons documentation\n\n> Authored for this app (not imported). It lists the pages and says where they come from.\n\nThis reader has the pages below. All of them were written for this client, from reading its code and README.\n\n| Page | Kind | What it covers |\n|---|---|---|\n| About this implementation | Authored here | What this app is, what works, Demo versus connected, what is real, storage, security |\n| How it works | Authored here | Architecture, modes, the holons-api calls, how Holons map onto chat |\n| Getting started with others | Authored here | Reaching a holons-api server, signing in, sharing a Holon with other people |\n\n## Imported documentation\n\nNone. No protocol or product documentation for Holons was found to import. What exists was checked when these pages were written:\n\n| Repository | What it contains | Licence found | Used here |\n|---|---|---|---|\n| `https://github.com/openartist/holons` (local clone `holons`) | A React front end; its README is the two words \"Holons LMS\" | None stated in the README; no LICENSE file in the clone | No, nothing to import |\n| `https://github.com/matrix9180/holons-api` (local clone `holons-api`) | The Rails API this app talks to; its README is the unedited Rails template | No LICENSE file in the clone, none stated | No, nothing to import. The code itself was read to write these pages |\n| `https://github.com/FraterCCCLXIII/holons-p2p` | A fork of OrbitDB with peer-to-peer chat examples; its docs describe OrbitDB | MIT (Protocol Labs and Haja Networks) | No. It is a different codebase, not the API this app uses, so its pages would not describe this app |\n| `https://github.com/FraterCCCLXIII/test-holons` | Empty repository | none | No |\n\nThe MESH protocol documentation in the sibling MESH app (`mesh-protocol`) is about a different system and is not part of Holons.\n\n## Reading order\n\n1. About this implementation\n2. How it works\n3. Getting started with others\n\nStatements marked **unverified** were not confirmed by running anything. The README of this app says the same about the sign-up, sign-out and \"who am I\" routes.\n" },
  { id: "about", title: "About this implementation", markdown: "# About this implementation\n\n> Authored for this app, from reading `extension.js` and `README.md` in the `holons-hangout` folder. Not imported from another repository.\n\n## What it is\n\nHolons is a Canvas app: one browser-only JavaScript file (`extension.js`, no dependencies) that shows a Holons community as a team chat. It is a client for a server called `holons-api`. It is not a server and stores no community data of its own.\n\nHow Holons are shown as chat:\n\n| In Holons | In this app |\n|---|---|\n| A Holon (community) | A workspace: one round button in the left icon rail |\n| Its feed | The channel named `feed` |\n| Its courses and their modules | Channels listed under \"Courses\" in the second column |\n| Its members | The team panel on the right |\n| A post (title and Markdown text) | A message |\n| A comment on a post | A reply under that message |\n\n## Two modes\n\n| | Demo | Connected |\n|---|---|---|\n| Data | Sample Holons built in memory when the app opens | Whatever your `holons-api` server returns |\n| Who you are | A made-up user called \"You\" | The account you signed in with |\n| Saved after reload | No | Yes, on the server (courses excepted, see below) |\n| Header chip | \"Demo\" | \"Connected\" |\n\nDemo has three sample Holons (Open Source Academy, Garden Circle, Night Owls Chess), sample people, posts, replies, and a course with modules. All of that is invented sample data. Everything you do in Demo works the same way as when connected, but disappears when you reload.\n\n## What works\n\n- Browse Holons, the feed, courses, modules and team members.\n- Create, edit and delete a Holon (only its creator, or an admin, can on the server).\n- Join and leave a Holon.\n- Write, edit and delete posts, and reply, edit and delete replies. Messages are shown as Markdown.\n- Create courses and modules, reorder modules and mark them complete.\n- Sign in, sign up and sign out against a server.\n- Read these docs, and drag the column edges to resize the Holons list and the team panel.\n\n## What is real and what is not\n\n- **Courses and modules are never saved on the server.** `holons-api` has no course or module routes. When connected, the app keeps them in this browser only and labels them \"Local only, not saved to the server\". Nobody else sees them.\n- **Inviting people is not available.** The server has no invite route, and a membership needs a numeric user id with no way to look a person up. The team panel says so.\n- **Post titles and author ids are missing from the server's answers.** The app remembers the titles it wrote in this session, treats a Holon as yours when the server lists it under your created Holons, and treats a post or reply as yours when this browser created it. The server's refusal (HTTP 403) is always the final word.\n- **Sign up, sign out and learning your own user id use routes that were not verified.** See the README of this app.\n\n## What is stored in your browser\n\n| Key (localStorage) | Contents |\n|---|---|\n| `holons-hangout:v1` | Server address, sign-in token, email, your user id (when known), and the ids of posts and replies this browser created |\n| `holons-hangout:local-courses:v1` | Courses and modules you made while connected, per server address |\n| `grip:holons-hangout` | The widths you dragged the Holons list and team panel to |\n\nThe password is sent once to the server and never stored.\n\n## Security notes\n\n- Text is put on the page as text. Markdown from posts and from these docs is built as page elements, never as HTML, so a post cannot inject script. Links in posts may be `http`, `https` or `mailto`; links in these docs may only be `http` or `https`. Links open in a new tab with `noopener noreferrer`.\n- The sign-in token is kept in `localStorage`, which any script on the same page origin can read. Use a server you trust.\n- The app talks to whatever address you type. The `holons-api` clone this was written against allows requests from any origin (CORS `*`, marked FIXME in its source), which is what lets a browser page call it; that is a server setting, not something this app controls.\n- Connecting over plain `http://` sends your password and token unencrypted. Use `https://` anywhere beyond your own machine.\n\n## Limits\n\n- Everything is fetched in full: the app asks for all posts and all comments and filters them by Holon in the browser, because the server has no filter. Large communities will be slow.\n- There is no live update. You see new content after an action or a reload.\n- Not run against a real server by the author of these pages; see the README's list of verified and unverified routes.\n" },
  { id: "how-it-works", title: "How it works", markdown: "# How it works\n\n> Authored for this app, from reading `extension.js`. Not imported from another repository.\n\n## Overview\n\n```\n browser (this app)                              holons-api (Ruby on Rails)\n┌───────────────────────────┐   HTTP + JSON      ┌───────────────────────────┐\n│ UI (DOM) + state          │ ─────────────────▶ │ /holons  /posts           │\n│ createClient (HTTP)       │ ◀───────────────── │ /comments                 │\n│ localStorage: token,      │   Bearer token     │ /holon_memberships        │\n│   local courses, widths   │                    │ /users/tokens/sign_in     │\n└───────────────────────────┘                    └───────────────────────────┘\n        │  no server address, no token, or server unreachable\n        ▼\n in-memory Demo backend (same methods, sample data)\n```\n\nThe UI talks to a backend object. There are two with the same methods: the live client for `holons-api`, and the Demo backend. That is why every flow works in both modes.\n\n## Choosing the mode\n\nOn open (and after sign-in or sign-out) the app picks a backend:\n\n1. No server address saved: Demo.\n2. An address but no token: Demo, with the notice \"Sign in to connect to holons-api. Showing the demo.\"\n3. Both: the app lists Holons from the server. If that works it is **Connected**; if it fails (server down, token rejected) it falls back to Demo and shows the error in a notice.\n\nThe \"Connected\" or \"Demo\" chip in the header, and the Sign in / Sign up buttons, open the account dialog. \"Use demo\" in that dialog forgets the saved address and token.\n\n## Calls to the server\n\nAll requests are JSON with `Authorization: Bearer <token>` once you have one.\n\n| Action | Request |\n|---|---|\n| Sign in | `POST /users/tokens/sign_in` with `{email, password}` |\n| Health | `GET /up` |\n| List Holons | `GET /holons`, or `?scope=created` or `?scope=joined` |\n| Create, edit, delete a Holon | `POST /holons`, `PATCH /holons/:id`, `DELETE /holons/:id` |\n| Posts | `GET /posts`, `POST /posts`, `PATCH` and `DELETE /posts/:id` |\n| Replies | `GET /comments`, `POST /comments`, `PATCH` and `DELETE /comments/:id` |\n| Team | `GET /holon_memberships?holon_id=`, `POST /holon_memberships`, `DELETE /holon_memberships/:id` |\n\nCreate and update bodies are wrapped the way Rails expects, for example `{\"post\": {\"holon_id\": 1, \"title\": \"...\", \"content\": \"...\"}}`.\n\nRoutes the README marks **unverified**: `POST /users/tokens/sign_up`, `POST /users/tokens/revoke` (sign out), and `GET /users/tokens/info` (to learn your user id when the sign-in answer does not carry it).\n\n## Opening a Holon\n\nWhen you open a Holon the app loads, at the same time, its memberships, its courses, and the posts, then the replies of each post. Posts are shown oldest first. The server returns every post and reply, so the app keeps only those for the Holon you opened.\n\n## Ownership and permissions\n\nThe server decides who may do what. The app only decides which buttons to show:\n\n- **Owner**: the Holon appears in your `?scope=created` list. You see Edit and Delete.\n- **Member**: it appears in your `?scope=joined` list. You see Leave.\n- **Neither**: you see Join (disabled with an explanation if the app does not know your user id).\n- Edit and Delete on a post or reply appear when this browser created it (or the server names you as author), and on every post if you own the Holon.\n\nIf you try something the server refuses, the error text from the server is shown in a red banner.\n\n## Writing\n\nCreating a post, editing, deleting and replying are applied to the screen at once and then confirmed with the server; if the server refuses, the change is rolled back and the error is shown. A message waiting for the server is marked \"Sending...\". A post written in the composer gets the first line of its text as its title (the server requires one).\n\n## Courses\n\n```\nDemo:       courses + modules  ──▶  in memory (lost on reload)\nConnected:  courses + modules  ──▶  localStorage, per server address, never sent\n```\n\nA course store handles create, reorder (Move up, Move down) and \"Mark complete\". The same code serves both modes; only where it keeps the data differs.\n\n## The columns\n\n```\n┌────┬──────────────┬──────────────────────────────┬──────────────┐\n│rail│ list         │ main                         │ team         │\n│    │ channels,    │ header, thread or welcome,   │ members and  │\n│    │ courses,     │ composer                     │ roles        │\n│    │ Docs link    │ (or the documentation reader)│              │\n└────┴──────────────┴──────────────────────────────┴──────────────┘\n```\n\nThe edges of the list and the team panel can be dragged (or focused and moved with the arrow keys); the widths are remembered. Below 900 pixels wide the team panel is hidden.\n\n## The docs reader\n\nThe pages you are reading are Markdown files in the `docs/` folder, embedded into `extension.js` by `scripts/embed-docs.mjs` so the extension stays one file. A test checks that the embedded copy matches the files. Back returns to where you were; Copy Markdown and Download .md act on the page being shown.\n" },
  { id: "getting-started", title: "Getting started with others", markdown: "# Getting started with others\n\n> Authored for this app, from `README.md` and `extension.js`, and from reading the `holons-api` source on this machine. Steps marked **unverified** were not run by the author.\n\n## What you need\n\nA running `holons-api` server that you and the other people can reach over HTTP(S), an account on it, and a browser. This app is only a client, so \"working with others\" means everyone signs in to the same server. Without a reachable server the app is a one-person demo.\n\n## 1. Run or find a server\n\n`holons-api` is a separate project (a Ruby on Rails app, `https://github.com/matrix9180/holons-api`). This app does not start it. From its source:\n\n- It listens on port 3000 by default (`PORT` in `config/puma.rb`, `EXPOSE 3000` in its Dockerfile).\n- It uses PostgreSQL (`config/database.yml`).\n- Its CORS settings allow any origin, which lets this page call it from another address.\n\nHow to install, migrate and start it is not documented in that repository (its README is the unedited Rails template), and was not run by the author (**unverified**). If someone else runs a server, ask them for its address and an account.\n\nTo let other people in, the server must be reachable from their machines. Prefer an `https://` address; the app sends your password and token to whatever address you give it.\n\n## 2. Connect\n\n1. Open **Holons** from the Canvas navigation. You start in Demo.\n2. Press **Sign in** in the header (or the Demo chip).\n3. Enter the **holons-api base URL** (for example `http://localhost:3000`), your email and password, and submit.\n4. The chip changes to **Connected** and your Holons load. A notice appears instead if the server cannot be reached or rejects the token.\n\nTo create an account instead, choose \"New here? Sign up\". Sign-up and sign-out use routes the README marks **unverified**.\n\n## 3. Check the connection\n\n| Chip | Meaning |\n|---|---|\n| Connecting... | Waiting for the server |\n| Connected | The server answered and accepted your token |\n| Demo | Sample data; a notice says why, for example \"Showing the demo\" |\n\n## 4. Work with others\n\n1. Press **+** in the rail to create a Holon (name and optional description). You become its owner.\n2. Other people who have accounts on the same server see it in their rail and press **Join**. Joining needs your user id; if the server did not give it, Join is disabled and says so.\n3. Everyone posts in the `feed` channel and replies under posts. You see other people's posts after you open the Holon again or act in it.\n4. The team panel lists members by name where known (otherwise \"Member #id\") and their role.\n\nWhat you cannot do from here:\n\n- **Invite by email or handle.** The server has no invite route. Memberships are made by each person pressing Join.\n- **Share courses.** Courses and modules you create while connected stay in your browser.\n- **Moderate beyond what the server allows.** Editing or deleting someone else's post only works if the server says you may (you own the Holon, or you are an admin).\n\n## Troubleshooting\n\n| You see | Likely cause |\n|---|---|\n| \"Could not reach ... Is holons-api running, and does it allow this origin (CORS)?\" | Wrong address or port, server not running, or a block from the browser (for example an `https` page calling an `http` server) |\n| \"Not signed in, or the token expired.\" | Sign in again |\n| \"holons-api answered 403\" | The server refuses that action for your account |\n| Join is disabled | The server did not tell the app your user id (that route is **unverified**) |\n| Courses missing for a teammate | Courses are local to each browser by design |\n\n## Your data\n\nYour server address, token and email stay in this browser (see \"About this implementation\"). Signing out clears the token and the ids of posts this browser created; local courses stay.\n" },
];
// </docs:generated>

const CSS = `
.hh { --hh-bg: var(--oh-color-base, #171717); --hh-panel: var(--oh-color-base-secondary, #212121); --hh-raised: var(--oh-surface-raised, #2a2a2a);
  --hh-text: var(--oh-foreground, #eee); --hh-contrast: var(--oh-contrast, #fff); --hh-muted: var(--oh-muted, #9a9a9a);
  --hh-border: var(--oh-border-subtle, #3a3a3a); --hh-primary: var(--oh-accent, var(--oh-color-primary, #fff)); --hh-on-primary: var(--oh-accent-foreground, #111);
  --hh-on-contrast: var(--oh-contrast-foreground, #111);
  --hh-success: var(--oh-success, #34d399); --hh-warn: #f2b51d; --hh-link: var(--oh-info-soft-foreground, #7c9dff);
  box-sizing: border-box; position: sticky; top: 0; color: var(--hh-text); background: var(--hh-bg); font: 14px/1.45 system-ui, sans-serif;
  height: 100%; min-height: 480px; overflow: hidden; }
.hh *, .hh *::before, .hh *::after { box-sizing: border-box; }
.hh [hidden] { display: none !important; }
.hh button, .hh input, .hh textarea { font: inherit; color: inherit; }
.hh .shell { position: relative; display: grid; grid-template-columns: 56px var(--grip-0, 300px) minmax(0, 1fr) var(--grip-1, 280px); height: 100%; min-height: 0; }
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
.hh .plogo { display: inline-flex; color: inherit; opacity: .7; }
.hh .plogo:hover { opacity: 1; }
.hh .plogo svg { height: 16px; width: auto; }
.hh .lpowered { flex: none; justify-content: center; padding: 8px 10px; border-top: 1px solid var(--hh-border); }
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
.hh .send, .hh .primary { border: 0; border-radius: 10px; background: var(--hh-contrast); color: var(--hh-on-contrast); padding: 8px 16px; font-weight: 600; cursor: pointer; }
.hh .send:disabled { opacity: .4; cursor: default; }
.hh .ghost { border: 1px solid var(--hh-border); border-radius: 10px; background: transparent; padding: 8px 14px; cursor: pointer; }
.hh .note { padding: 12px 18px; border-top: 1px solid var(--hh-border); color: var(--hh-muted); font-size: 12.5px; }
.hh .team { border-left: 1px solid var(--hh-border); padding: 14px; overflow-y: auto; }
.hh .team h4 { margin: 0 0 10px; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: var(--hh-muted); }
.hh .member { display: flex; align-items: center; gap: 10px; padding: 6px 0; }
.hh .member small { color: var(--hh-muted); display: block; }
.hh .welcome { flex: 1; position: relative; display: grid; place-items: center; align-content: center; text-align: center; gap: 12px; padding: 24px; background: radial-gradient(circle at 50% 35%, color-mix(in srgb, #8B5CF6 28%, var(--hh-bg)), var(--hh-bg) 70%); overflow: auto; }
.hh .welcome h1 { margin: 0; font-size: 28px; font-weight: 500; color: var(--hh-contrast); }
.hh .welcome p { margin: 0; color: color-mix(in srgb, var(--hh-contrast) 78%, transparent); max-width: 420px; }
.hh .wbig { width: 110px; height: 110px; }
.hh .wbig svg { width: 100%; height: 100%; }
.hh .wpowered { position: absolute; left: 0; right: 0; bottom: 16px; justify-content: center; color: color-mix(in srgb, var(--hh-contrast) 75%, transparent); }
.hh .wactions { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }
.hh .welcome .wdocs { border: 1px solid color-mix(in srgb, var(--hh-contrast) 35%, transparent); border-radius: 999px; background: transparent; color: var(--hh-contrast); padding: 10px 18px; cursor: pointer; }
.hh .welcome .wdocs:hover { background: color-mix(in srgb, var(--hh-contrast) 12%, transparent); }
.hh .docslink { flex: none; align-self: flex-start; margin: 0 12px 4px; border: 0; background: transparent; color: var(--hh-muted); font-size: 12px; padding: 2px 6px; border-radius: 6px; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; }
.hh .docslink:hover { background: var(--hh-panel); color: var(--hh-contrast); }
.hh .shell.docsopen { grid-template-columns: 56px var(--grip-0, 300px) minmax(0, 1fr); }
.hh .docs { flex: 1; min-height: 0; display: flex; flex-direction: column; }
.hh .docs .headbtn { border: 1px solid var(--hh-border); background: var(--hh-raised); border-radius: 8px; padding: 4px 12px; cursor: pointer; }
.hh .docs .dbody { flex: 1; min-height: 0; display: grid; grid-template-columns: 240px minmax(0, 1fr); }
.hh .docs .dnav { overflow-y: auto; padding: 8px; display: grid; align-content: start; gap: 2px; }
.hh .docs .dlink[aria-current="page"] { background: var(--hh-raised); color: var(--hh-contrast); }
.hh .docs .dlink { white-space: normal; font-size: 13px; line-height: 18px; }
.hh .docs .dpage { overflow-y: auto; padding: 12px 24px 32px; min-width: 0; }
.hh .docs .dpage > h2 { margin: 12px 0; font-size: 20px; line-height: 28px; color: var(--hh-contrast); outline: none; }
.hh .docs .dpage > h2:focus-visible { outline: 2px solid #7c9dff; outline-offset: 4px; border-radius: 4px; }
.hh .docs .dtools { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; }
.hh .docs .dpage .md { max-width: 820px; }
@media (max-width: 700px) { .hh .docs .dbody { grid-template-columns: minmax(0, 1fr); grid-template-rows: auto minmax(0, 1fr); } .hh .docs .dnav { max-height: 30vh; border-bottom: 1px solid var(--hh-border); } .hh .docs .dpage { padding: 12px 16px 24px; } }
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
.hh .banner.ok { border-color: var(--hh-success); }
.hh .rbtn.add { border: 1px dashed var(--hh-border); font-size: 20px; line-height: 1; }
.hh .who { color: var(--hh-muted); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 220px; }
.hh .sm { padding: 4px 10px; font-size: 12px; }
.hh .hactions { display: flex; flex-wrap: wrap; gap: 6px; align-items: center; margin-top: 8px; }
.hh .badge { font-size: 11px; padding: 2px 8px; border-radius: 999px; border: 1px solid var(--hh-border); color: var(--hh-muted); }
.hh .localtag { font-size: 12px; color: var(--hh-warn); margin: 4px 8px; }
.hh .hint { padding: 6px 18px 0; color: var(--hh-muted); font-size: 12px; }
.hh .ctools { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
.hh .done { color: var(--hh-success); }
.hh .dlg { position: absolute; inset: 0; z-index: 10; display: grid; place-items: center; background: rgba(0,0,0,.55); padding: 16px; overflow: auto; }
.hh .dialog { width: min(480px, 100%); display: grid; gap: 10px; padding: 18px; border-radius: 14px; background: var(--hh-panel); border: 1px solid var(--hh-border); }
.hh .dialog h2 { margin: 0; font-size: 16px; color: var(--hh-contrast); }
.hh .dialog p { margin: 0; color: var(--hh-muted); font-size: 13px; }
.hh .dialog label { display: grid; gap: 3px; font-size: 12px; color: var(--hh-muted); }
.hh .dialog input, .hh .dialog textarea { background: var(--hh-bg); border: 1px solid var(--hh-border); border-radius: 10px; padding: 8px 10px; min-width: 0; }
.hh .dialog textarea { min-height: 110px; resize: vertical; }
.hh .dialog [aria-invalid="true"] { border-color: #ef4444; }
.hh .dialog .derr { color: var(--oh-danger-soft-foreground, #ef4444); font-size: 13px; min-height: 0; }
.hh .dialog .btns { display: flex; gap: 8px; justify-content: flex-end; }
.hh .dialog .primary.danger { background: #dc2626; color: #fff; }
.hh .dialog .primary:disabled { opacity: .5; cursor: default; }
.hh .md { display: grid; gap: 8px; min-width: 0; line-height: 1.5; }
.hh .md p, .hh .md ul, .hh .md ol, .hh .md blockquote, .hh .md h3, .hh .md h4, .hh .md h5, .hh .md h6, .hh .md hr { margin: 0; }
.hh .md h3, .hh .md h4, .hh .md h5, .hh .md h6 { font-weight: 650; color: var(--hh-contrast); }
.hh .md strong { font-weight: 650; color: var(--hh-contrast); }
.hh .md a { color: var(--hh-link); text-decoration: underline; text-underline-offset: 2px; }
.hh .md ul, .hh .md ol { padding-left: 22px; display: grid; gap: 3px; }
.hh .md blockquote { border-left: 3px solid var(--hh-border); padding: 2px 0 2px 12px; color: var(--hh-muted); }
.hh .md hr { border: 0; border-top: 1px solid var(--hh-border); }
.hh .md code { font: 12.5px ui-monospace, SF Mono, Menlo, monospace; background: rgba(255,255,255,.08); border-radius: 5px; padding: 1px 5px; overflow-wrap: anywhere; }
.hh .md .mdcode { border: 1px solid var(--hh-border); border-radius: 10px; overflow: hidden; background: #0e0e10; color: #eee; }
.hh .md .mdcodebar { display: flex; justify-content: space-between; padding: 4px 10px; font-size: 11px; color: #9a9a9a; border-bottom: 1px solid var(--hh-border); }
.hh .md .mdcodebar button { border: 0; background: transparent; color: #9a9a9a; cursor: pointer; font-size: 11px; }
.hh .md pre { margin: 0; padding: 10px 12px; overflow-x: auto; font: 12.5px/1.55 ui-monospace, SF Mono, Menlo, monospace; }
.hh .md pre code { background: none; padding: 0; }
.hh .md .mdtable { overflow-x: auto; border: 1px solid var(--hh-border); border-radius: 10px; }
.hh .md table { border-collapse: collapse; width: 100%; font-size: 13px; }
.hh .md th, .hh .md td { text-align: left; padding: 6px 10px; border-bottom: 1px solid var(--hh-border); }
.hh .md .mdnote { font-size: 12px; color: var(--hh-muted); }
@media (max-width: 900px) { .hh .shell { grid-template-columns: 56px 220px minmax(0, 1fr); } .hh .team { display: none; } }
/* Draggable column dividers. */
.grip { position: absolute; top: 0; bottom: 0; width: 11px; z-index: 6; cursor: col-resize; touch-action: none; outline: 0; }
.grip-left { transform: translateX(-50%); }
.grip-right { transform: translateX(50%); }
.grip::after { content: ""; position: absolute; top: 0; bottom: 0; left: 50%; width: 2px; margin-left: -1px; border-radius: 2px; background: transparent; transition: background .12s; }
.grip:hover::after, .grip:focus-visible::after, .grip.on::after { background: var(--oh-color-primary, #7c9dff); }
.gripping { user-select: none; cursor: col-resize; }
.gripping * { pointer-events: none; }
.gripping .grip { pointer-events: auto; }
@media (max-width: 720px) { .grip { display: none; } }

/* Feed app sizing: 14px text, 12px meta, 16px gutters, 12px gaps, 32px avatars, 16px section titles. */
.hh { font-size: 14px; line-height: 20px; }
.hh small, .hh .sub, .hh .sectionlabel, .hh .sect { font-size: 12px; line-height: 16px; }
.hh h1, .hh .lhead h2, .hh .chead h2, .hh .mhead h2, .hh .brand h1 { font-size: 16px; line-height: 24px; font-weight: 600; }
.hh .lhead, .hh .chead, .hh .mhead, .hh .brand { padding-left: 16px; padding-right: 16px; }
.hh .msg { gap: 12px; }
.hh .thread, .hh .body { padding: 12px 16px; gap: 12px; }
.hh .composerwrap { padding: 8px 16px 14px; }
.hh .row { gap: 12px; padding-left: 12px; padding-right: 12px; }
.hh .avatar { width: 32px; height: 32px; }
/* Fewer rules: the rails separate from the page by tone, not by lines. */
.hh .rail, .hh .list, .hh .team { border: 0; background: var(--hh-panel); }
.hh .lpowered, .hh .mhead, .hh .composer, .hh .note, .hh .setform { border: 0; }
.hh .replies { border-left: 0; padding-left: 0; }
`;

export function activate(host) {
  if (host.apiVersion !== "1") throw new Error("Holons requires Canvas host API 1.");
  return host.registerPage("holons-hangout", ({ container }) => mount(container));
}

const emptyMine = () => ({ posts: [], comments: [] });
function readSaved() {
  const base = { baseUrl: "", token: "", email: "", me: null, mine: emptyMine() };
  try { return { ...base, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; } catch { return base; }
}
// Only the base URL, token, email, user id and ids this browser created are stored. Never the password.
function writeSaved(saved) { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(saved)); } catch { /* storage blocked */ } }

const LOCAL_LABEL = "Local only, not saved to the server";
const NO_INVITE = "Invite by email or handle is not available: holons-api has no invite endpoint, and a membership needs a numeric member_id.";

function mount(container) {
  const shellHost = el("div", "hhshell");
  shellHost.style.height = "100%";
  const dialogHost = el("div", "hhdialogs");
  const root = el("div", "hh");
  root.append(shellHost, dialogHost);
  container.append(el("style", "", CSS), root);
  let disposed = false;
  let tmp = 0;
  const saved = readSaved();
  saved.mine = { ...emptyMine(), ...(saved.mine || {}) };
  const state = {
    backend: null, notice: "", error: "", success: "", holons: [], holonId: null, channel: "welcome", data: null, loading: true,
    openReplies: new Set(), refocus: false, docs: { open: false, page: DOCS[0].id, opener: "" }, me: null, owned: new Set(), joined: new Set(), titles: new Map(), busy: 0, dialog: null,
  };

  const holon = () => state.holons.find((h) => h.id === state.holonId);
  const live = () => state.backend && state.backend.mode === "live";
  const iso = () => new Date().toISOString();
  const safe = (fn) => async (...a) => { try { state.error = ""; state.success = ""; await fn(...a); } catch (e) { state.error = e.message || String(e); } if (!disposed) render(); };
  const remember = (kind, id) => { if (live() && id !== undefined) { saved.mine[kind].push(id); writeSaved(saved); } };
  const forget = (kind, id) => { saved.mine[kind] = saved.mine[kind].filter((x) => x !== id); writeSaved(saved); };
  const isMine = (kind, row) => (row.author_id !== undefined && row.author_id !== null ? Boolean(state.me) && row.author_id === state.me.id : saved.mine[kind].includes(row.id));
  const isOwner = () => state.owned.has(state.holonId);
  const isMember = () => state.joined.has(state.holonId);
  const canManagePost = (p) => !p.pending && (isMine("posts", p) || isOwner());
  const canManageComment = (c) => !c.pending && isMine("comments", c);

  async function connect(creds) {
    state.loading = true; render();
    const { backend, notice } = await chooseBackend({ baseUrl: creds.baseUrl, token: creds.token });
    if (disposed) return;
    state.backend = backend; state.notice = notice; state.error = "";
    if (backend.mode === "live") {
      if (saved.me) backend.me = saved.me;
      else {
        try { const me = await backend.whoami(); if (me) { saved.me = me; backend.me = me; writeSaved(saved); } } catch { /* UNVERIFIED route; joining stays disabled without a user id */ }
      }
    }
    state.me = backend.me || null;
    try { state.holons = await backend.listHolons(); } catch (e) { state.holons = []; state.error = e.message; }
    const ids = async (scope) => { try { return new Set((await backend.listHolons(scope)).map((h) => h.id)); } catch { return new Set(); } };
    [state.owned, state.joined] = await Promise.all([ids("created"), ids("joined")]);
    if (disposed) return;
    state.holonId = null; state.channel = "welcome"; state.data = null; state.loading = false;
    render();
  }

  const openHolon = safe(async (id) => {
    state.holonId = id; state.channel = "feed"; state.data = null; render();
    await refresh();
  });

  const refresh = async () => {
    const h = holon();
    if (!h) return;
    const data = await loadHolon(state.backend, h);
    // The API's JSON omits post titles, so keep the ones this browser wrote.
    data.feed.forEach((p) => { if (!p.title && state.titles.has(p.id)) p.title = state.titles.get(p.id); });
    state.data = data;
  };

  /** Optimistic write: apply now, call the API, restore everything if it fails (and rethrow), then reload. */
  async function mutate(apply, call, after) {
    const snap = { data: state.data, joined: new Set(state.joined), holons: state.holons, error: state.error };
    state.busy += 1; state.error = ""; state.success = "";
    apply(); render();
    let result;
    try { result = await call(); } catch (e) { Object.assign(state, snap, { error: "" }); state.busy -= 1; render(); throw e; }
    state.busy -= 1;
    if (after) after(result);
    try { await refresh(); } catch (e) { state.error = e.message; }
    return result;
  }
  const withFeed = (fn) => { state.data = { ...state.data, feed: fn(state.data.feed) }; };
  const mapPost = (id, fn) => withFeed((feed) => feed.map((p) => (p.id === id ? fn(p) : p)));
  const myName = () => (state.me && (state.me.name || state.me.email)) || "You";

  const post = safe((text) => createPostFlow(titleFrom(text), text).then(() => { state.refocus = true; }));
  function createPostFlow(title, content) {
    const holonId = state.holonId;
    const row = { id: `tmp-${++tmp}`, holon_id: holonId, title, content, author_id: state.me ? state.me.id : undefined, authorName: myName(), created_at: iso(), comments: [], pending: true };
    return mutate(() => withFeed((f) => [...f, row]), () => state.backend.createPost({ holon_id: holonId, title, content }), (r) => { remember("posts", r && r.id); if (r && r.id !== undefined) state.titles.set(r.id, title); });
  }
  const editPostFlow = (p, title, content) => mutate(
    () => mapPost(p.id, (x) => ({ ...x, title, content })),
    () => state.backend.updatePost(p.id, { title, content }),
    () => state.titles.set(p.id, title));
  const deletePostFlow = (p) => mutate(() => withFeed((f) => f.filter((x) => x.id !== p.id)), () => state.backend.deletePost(p.id), () => forget("posts", p.id));
  const reply = safe(async (postId, text) => {
    state.openReplies.add(postId);
    const row = { id: `tmp-${++tmp}`, post_id: postId, content: text, author_id: state.me ? state.me.id : undefined, authorName: myName(), created_at: iso(), pending: true };
    await mutate(() => mapPost(postId, (p) => ({ ...p, comments: [...p.comments, row] })), () => state.backend.createComment({ post_id: postId, content: text }), (r) => remember("comments", r && r.id));
  });
  const editCommentFlow = (postId, c, content) => mutate(
    () => mapPost(postId, (p) => ({ ...p, comments: p.comments.map((x) => (x.id === c.id ? { ...x, content } : x)) })),
    () => state.backend.updateComment(c.id, { content }));
  const deleteCommentFlow = (postId, c) => mutate(
    () => mapPost(postId, (p) => ({ ...p, comments: p.comments.filter((x) => x.id !== c.id) })),
    () => state.backend.deleteComment(c.id), () => forget("comments", c.id));

  const join = safe(async () => {
    if (!state.me) throw new Error("Joining needs your user id, which the server did not return. Sign in again.");
    const holonId = state.holonId;
    const me = state.me;
    await mutate(() => {
      state.joined.add(holonId);
      state.data = { ...state.data, members: [...state.data.members, { id: me.id, membershipId: null, name: myName(), role: "member" }] };
    }, () => state.backend.createMembership({ holon_id: holonId, member_id: me.id }));
    state.success = `You joined ${holon() ? holon().name : "the Holon"}.`;
  });
  const leave = safe(async () => {
    const holonId = state.holonId;
    const mine = () => state.data.members.find((m) => state.me && String(m.id) === String(state.me.id));
    if (!state.me || !mine() || !mine().membershipId) { await refresh(); if (!mine() || !mine().membershipId) throw new Error("Could not find your membership in this Holon."); }
    const membershipId = mine().membershipId;
    const name = holon().name;
    await mutate(() => {
      state.joined.delete(holonId);
      state.data = { ...state.data, members: state.data.members.filter((m) => m.membershipId !== membershipId) };
    }, () => state.backend.deleteMembership(membershipId));
    state.success = `You left ${name}.`;
  });

  // — dialogs —
  function closeDialog() {
    const d = state.dialog;
    state.dialog = null;
    dialogHost.replaceChildren();
    if (d && d.opener && d.opener.isConnected && d.opener.focus) d.opener.focus();
  }

  /** A modal form: validation, busy state, inline error, Escape to close, focus kept inside. */
  function openDialog(spec) {
    const opener = document.activeElement;
    dialogHost.replaceChildren();
    const overlay = el("div", "dlg");
    const form = el("form", "dialog");
    form.noValidate = true;
    form.setAttribute("role", "dialog"); form.setAttribute("aria-modal", "true");
    const titleId = `hhd-${++tmp}`;
    const h = el("h2", "", spec.title); h.id = titleId;
    form.setAttribute("aria-labelledby", titleId);
    form.append(h);
    if (spec.intro) form.append(el("p", "", spec.intro));
    const inputs = {};
    (spec.fields || []).forEach((f) => {
      const label = el("label", "", f.label + (f.required ? " (required)" : ""));
      const input = el(f.multiline ? "textarea" : "input");
      if (!f.multiline) input.type = f.type || "text";
      input.name = f.name; input.value = f.value || ""; input.autocomplete = f.autocomplete || "off";
      if (f.placeholder) input.placeholder = f.placeholder;
      if (f.required) input.setAttribute("aria-required", "true");
      label.append(input);
      inputs[f.name] = input;
      form.append(label);
    });
    if (spec.extra) spec.extra(form, inputs);
    const err = el("div", "derr"); err.setAttribute("role", "alert");
    const btns = el("div", "btns");
    const cancel = el("button", "ghost", "Cancel"); cancel.type = "button";
    const submit = el("button", `primary${spec.danger ? " danger" : ""}`, spec.submitLabel || "Save"); submit.type = "submit";
    btns.append(cancel, submit);
    form.append(err, btns);
    overlay.append(form);
    let busy = false;
    const setBusy = (on) => { busy = on; submit.disabled = on; cancel.disabled = on; form.setAttribute("aria-busy", String(on)); submit.textContent = on ? "Working..." : spec.submitLabel || "Save"; };
    cancel.addEventListener("click", closeDialog);
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !busy) { e.preventDefault(); closeDialog(); return; }
      if (e.key !== "Tab") return;
      const items = [...form.querySelectorAll("input, textarea, button")].filter((n) => !n.disabled);
      if (!items.length) return;
      const first = items[0]; const last = items.at(-1);
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (busy) return;
      err.textContent = "";
      Object.values(inputs).forEach((i) => i.removeAttribute("aria-invalid"));
      const values = Object.fromEntries(Object.entries(inputs).map(([k, i]) => [k, i.type === "password" ? i.value : i.value.trim()]));
      const missing = (spec.fields || []).find((f) => f.required && !values[f.name]);
      const problem = missing ? `${missing.label} is required.` : spec.validate ? spec.validate(values) : "";
      if (problem) {
        err.textContent = problem;
        const bad = missing ? inputs[missing.name] : inputs[(spec.invalidField && spec.invalidField(values)) || ""] || Object.values(inputs)[0];
        if (bad) { bad.setAttribute("aria-invalid", "true"); bad.focus(); }
        return;
      }
      setBusy(true);
      try {
        const message = await spec.onSubmit(values);
        closeDialog();
        state.error = "";
        state.success = typeof message === "string" ? message : spec.success || "";
        render();
      } catch (ex) {
        err.textContent = ex.message || String(ex);
        if (!disposed) setBusy(false);
      }
    });
    dialogHost.append(overlay);
    state.dialog = { opener };
    const firstField = form.querySelector("input, textarea") || submit;
    firstField.focus();
  }

  const confirmDialog = (title, intro, label, run, success) => openDialog({ title, intro, submitLabel: label, danger: true, onSubmit: async () => { await run(); return success; } });

  function accountDialog(mode = "signin", prefill = {}) {
    const signedIn = live() && saved.token;
    const up = mode === "signup";
    openDialog({
      title: signedIn ? "Account" : up ? "Sign up to holons-api" : "Sign in to holons-api",
      intro: signedIn ? `Signed in as ${saved.email || (state.me && state.me.email) || "your account"} on ${state.backend.base}.` : up ? "Create an account on the server. Sign-up is unverified against holons-api (devise-api source not available here). The password is sent once and never stored." : "The URL and token stay in this browser. The password is sent once and not stored.",
      submitLabel: signedIn ? "Sign out" : up ? "Sign up" : "Sign in",
      fields: signedIn ? [] : [
        { name: "base", label: "holons-api base URL", type: "url", value: prefill.base ?? saved.baseUrl, required: true, placeholder: "http://localhost:3000" },
        { name: "email", label: "Email", type: "email", value: prefill.email ?? saved.email, required: true, autocomplete: "email" },
        { name: "password", label: up ? "Password (at least 6 characters)" : "Password", type: "password", required: true, autocomplete: up ? "new-password" : "current-password" },
        ...(up ? [{ name: "name", label: "Name (optional)" }, { name: "nickname", label: "Nickname (optional)" }] : []),
      ],
      validate: (v) => (signedIn ? "" : !/^https?:\/\//i.test(v.base) ? "Base URL must start with http:// or https://." : !/^\S+@\S+\.\S+$/.test(v.email) ? "Enter a valid email address." : up && v.password.length < 6 ? "Password must be at least 6 characters." : ""),
      invalidField: (v) => (!/^https?:\/\//i.test(v.base) ? "base" : !/^\S+@\S+\.\S+$/.test(v.email) ? "email" : "password"),
      extra: (form) => {
        if (signedIn) return;
        const row = el("div", "btns");
        const other = el("button", "linkbtn", up ? "Have an account? Sign in" : "New here? Sign up"); other.type = "button";
        other.addEventListener("click", () => { const f = form.elements; accountDialog(up ? "signin" : "signup", { base: f.base.value.trim(), email: f.email.value.trim() }); });
        const demo = el("button", "linkbtn", "Use demo"); demo.type = "button";
        demo.addEventListener("click", async () => { closeDialog(); saved.baseUrl = ""; saved.token = ""; saved.me = null; writeSaved(saved); await connect(saved); state.success = "Using the in-memory demo."; render(); });
        row.append(other, demo);
        form.append(row);
      },
      onSubmit: async (v) => {
        if (signedIn) return signOutFlow();
        const base = normalizeBase(v.base);
        const client = createClient({ baseUrl: base });
        const body = up ? { email: v.email, password: v.password, ...(v.name ? { name: v.name } : {}), ...(v.nickname ? { nickname: v.nickname } : {}) } : { email: v.email, password: v.password };
        const { token, owner } = up ? await client.signUp(body) : await client.authenticate("/users/tokens/sign_in", body);
        if (!token) {
          if (up) return "Account created. Sign in to continue.";
          throw new ApiError("Signed in, but the server returned no token.");
        }
        if (!saved.me || !owner || saved.me.id !== owner.id) saved.mine = emptyMine();
        Object.assign(saved, { baseUrl: base, token, email: v.email, me: owner });
        writeSaved(saved);
        closeDialog();
        await connect(saved);
        return `${up ? "Account created and signed in" : "Signed in"} as ${v.email}.`;
      },
    });
  }

  async function signOutFlow() {
    let revoked = true;
    try { await state.backend.signOut(); } catch { revoked = false; }
    Object.assign(saved, { token: "", me: null, mine: emptyMine() });
    writeSaved(saved);
    closeDialog();
    await connect(saved);
    state.notice = "";
    return revoked ? "Signed out." : "Signed out here. The server could not revoke the token (that route is unverified); it will expire on its own.";
  }

  function holonDialog(h) {
    const editing = Boolean(h);
    openDialog({
      title: editing ? `Edit ${h.name}` : "Create a Holon",
      submitLabel: editing ? "Save" : "Create Holon",
      fields: [{ name: "name", label: "Name", value: h ? h.name : "", required: true }, { name: "description", label: "Description", value: h ? h.description || "" : "", multiline: true }],
      onSubmit: async (v) => {
        const body = { name: v.name, description: v.description };
        if (editing) {
          const row = await state.backend.updateHolon(h.id, body);
          state.holons = state.holons.map((x) => (x.id === h.id ? { ...x, ...body, ...(row && typeof row === "object" ? row : {}) } : x));
          return `Saved ${v.name}.`;
        }
        const row = await state.backend.createHolon(body);
        if (!row || row.id === undefined) throw new ApiError("The server did not return the new Holon.");
        state.holons = [...state.holons, row];
        state.owned.add(row.id);
        closeDialog();
        await openHolon(row.id);
        state.success = `Created ${v.name}. You are its owner.`;
        return state.success;
      },
    });
  }
  const deleteHolonDialog = (h) => confirmDialog(`Delete ${h.name}?`, "This removes the Holon and its posts. It cannot be undone.", "Delete Holon", async () => {
    await state.backend.deleteHolon(h.id);
    state.holons = state.holons.filter((x) => x.id !== h.id);
    state.owned.delete(h.id); state.joined.delete(h.id);
    state.holonId = null; state.channel = "welcome"; state.data = null;
  }, `Deleted ${h.name}.`);

  function postDialog(p) {
    openDialog({
      title: p ? "Edit post" : `New post in ${holon().name}`,
      submitLabel: p ? "Save post" : "Post",
      intro: "The body supports markdown.",
      fields: [{ name: "title", label: "Title", value: p ? p.title || "" : "", required: true }, { name: "content", label: "Body (markdown)", value: p ? p.content : "", multiline: true, required: true }],
      onSubmit: async (v) => { await (p ? editPostFlow(p, v.title, v.content) : createPostFlow(v.title, v.content)); return p ? "Post updated." : "Post published."; },
    });
  }
  const deletePostDialog = (p) => confirmDialog("Delete this post?", "Its replies go too.", "Delete post", () => deletePostFlow(p), "Post deleted.");
  const commentDialog = (postId, c) => openDialog({
    title: "Edit reply", submitLabel: "Save reply",
    fields: [{ name: "content", label: "Reply (markdown)", value: c.content, multiline: true, required: true }],
    onSubmit: async (v) => { await editCommentFlow(postId, c, v.content); return "Reply updated."; },
  });
  const deleteCommentDialog = (postId, c) => confirmDialog("Delete this reply?", "", "Delete reply", () => deleteCommentFlow(postId, c), "Reply deleted.");

  function courseDialog() {
    const localOnly = Boolean(state.backend.localCourses);
    openDialog({
      title: "New course", submitLabel: "Create course",
      intro: localOnly ? `${LOCAL_LABEL}. holons-api has no course routes.` : "Demo data lives in memory and resets when you reload.",
      fields: [{ name: "name", label: "Name", required: true }, { name: "description", label: "Description (markdown)", multiline: true }],
      onSubmit: async (v) => {
        const row = await state.backend.createCourse({ holon_id: state.holonId, name: v.name, description: v.description });
        await refresh();
        state.channel = `course:${row.id}`;
        return `Course "${v.name}" created${localOnly ? ` (${LOCAL_LABEL.toLowerCase()})` : ""}.`;
      },
    });
  }
  function moduleDialog(course) {
    openDialog({
      title: `New module in ${course.name}`, submitLabel: "Create module",
      intro: state.backend.localCourses ? `${LOCAL_LABEL}.` : "",
      fields: [{ name: "name", label: "Name", required: true }, { name: "body", label: "Content (markdown)", multiline: true }],
      onSubmit: async (v) => {
        const row = await state.backend.createModule({ course_id: course.id, name: v.name, body: v.body });
        await refresh();
        state.channel = `module:${row.id}`;
        return `Module "${v.name}" created.`;
      },
    });
  }
  const moveModule = safe(async (m, dir) => { await state.backend.moveModule(m.id, dir); await refresh(); });
  const toggleComplete = safe(async (m) => { await state.backend.setComplete(m.id, !m.completed); await refresh(); state.success = m.completed ? `"${m.name}" marked incomplete.` : `"${m.name}" marked complete.`; });

  // — pieces —
  const btn = (label, action, cls, onClick, aria) => {
    const b = el("button", cls || "ghost sm", label);
    b.type = "button"; b.dataset.action = action;
    if (aria) b.setAttribute("aria-label", aria);
    b.addEventListener("click", onClick);
    return b;
  };

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
    const add = el("button", "rbtn add", "+");
    add.type = "button"; add.title = "Create a Holon"; add.setAttribute("aria-label", "Create a Holon"); add.dataset.action = "new-holon";
    add.addEventListener("click", () => holonDialog());
    rail.append(add);
    return rail;
  }

  function holonActions(h) {
    const bar = el("div", "hactions");
    const owner = isOwner();
    bar.append(el("span", "badge", owner ? "Owner" : isMember() ? "Member" : "Not a member"));
    if (!owner && !isMember()) {
      const j = btn("Join", "join", "primary sm", join, `Join ${h.name}`);
      j.disabled = state.busy > 0 || !state.me;
      if (!state.me) j.title = "Joining needs your user id, which the server did not return.";
      bar.append(j);
    }
    if (!owner && isMember()) { const l = btn("Leave", "leave", "ghost sm", leave, `Leave ${h.name}`); l.disabled = state.busy > 0; bar.append(l); }
    if (owner) bar.append(btn("Edit", "edit-holon", "ghost sm", () => holonDialog(h), `Edit ${h.name}`), btn("Delete", "delete-holon", "ghost sm", () => deleteHolonDialog(h), `Delete ${h.name}`));
    return bar;
  }

  function listView() {
    const col = el("aside", "list");
    const head = el("div", "lhead");
    const h = holon();
    head.append(el("h2", "", h ? h.name : "Holons"), el("p", "", h ? h.description || "" : "Communities you belong to"));
    if (h) head.append(holonActions(h));
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
      if (!state.holons.length && !state.loading) rows.append(el("div", "empty", "No Holons yet. Use + to create one."));
    } else {
      rows.append(el("div", "lsect", "Channels"), row("#", "feed", "feed", "", state.data ? state.data.feed.length : undefined));
      rows.append(el("div", "lsect", "Courses"));
      if (state.data) {
        const b = state.backend;
        if (!b.coursesSupported) rows.append(el("div", "empty", b.localCourses ? "holons-api has no courses endpoint, so anything you create here stays in this browser." : "holons-api has no courses endpoint."));
        else if (!state.data.courses.length) rows.append(el("div", "empty", "No courses yet."));
        if (b.localCourses) rows.append(el("div", "localtag", LOCAL_LABEL));
        if (b.coursesSupported || b.localCourses) rows.append(btn("+ New course", "new-course", "ghost sm", courseDialog));
        state.data.courses.forEach((c) => {
          rows.append(row("▸", c.name, `course:${c.id}`));
          c.modules.forEach((m) => rows.append(row(m.completed ? "✓" : "•", m.name, `module:${m.id}`, "sub")));
        });
      }
    }
    col.append(head, rows, btn("Docs", "docs", "docslink", () => openDocs("index", ".docslink")), poweredBy("lpowered"));
    return col;
  }

  function messageView(name, authorId, time, bodyNode, small, pending) {
    const m = el("div", small ? "reply" : "msg");
    if (pending) m.setAttribute("aria-busy", "true");
    m.append(avatar(authorId, small));
    const body = el("div", "mbody");
    const meta = el("div", "mmeta");
    meta.append(el("span", "mname", name), el("span", "mtime", pending ? "Sending..." : time));
    body.append(meta, bodyNode);
    m.append(body);
    return m;
  }

  function feedView(thread) {
    if (!state.data.feed.length) thread.append(el("div", "empty", "No posts yet. Start the conversation."));
    state.data.feed.forEach((p) => {
      const body = el("div");
      body.append(el("div", "mtitle", p.title || ""), renderMarkdown(p.content || ""));
      const msg = messageView(p.authorName, p.author_id, shortTime(p.created_at), body, false, p.pending);
      msg.dataset.post = String(p.id);
      const open = state.openReplies.has(p.id);
      const toggle = el("button", "linkbtn", `${open ? "Hide" : "Show"} replies (${p.comments.length})`);
      toggle.type = "button";
      toggle.addEventListener("click", () => { if (open) state.openReplies.delete(p.id); else state.openReplies.add(p.id); render(); });
      const tools = el("div", "ctools");
      tools.append(toggle);
      if (canManagePost(p)) tools.append(btn("Edit", "edit-post", "linkbtn", () => postDialog(p), "Edit post"), btn("Delete", "delete-post", "linkbtn", () => deletePostDialog(p), "Delete post"));
      body.append(tools);
      if (open) {
        const replies = el("div", "replies");
        p.comments.forEach((c) => {
          const r = messageView(c.authorName, c.author_id, shortTime(c.created_at), renderMarkdown(c.content || ""), true, c.pending);
          r.dataset.comment = String(c.id);
          if (canManageComment(c)) r.querySelector(".mbody").append(btn("Edit", "edit-comment", "linkbtn", () => commentDialog(p.id, c), "Edit reply"), btn("Delete", "delete-comment", "linkbtn", () => deleteCommentDialog(p.id, c), "Delete reply"));
          replies.append(r);
        });
        const form = el("form", "rform");
        const input = el("input"); input.placeholder = "Reply..."; input.setAttribute("aria-label", "Reply");
        const go = el("button", "ghost", "Reply"); go.type = "submit"; go.disabled = state.busy > 0;
        form.append(input, go);
        form.addEventListener("submit", (e) => { e.preventDefault(); const t = input.value.trim(); if (t && !state.busy) reply(p.id, t); });
        replies.append(form);
        body.append(replies);
      }
      thread.append(msg);
    });
  }

  function courseView(thread, course) {
    const local = state.backend.localCourses;
    const intro = el("div");
    intro.append(renderMarkdown(`**${course.name}**\n\n${course.description || ""}`));
    const tools = el("div", "ctools");
    tools.append(btn("+ New module", "new-module", "ghost sm", () => moduleDialog(course)));
    if (local) tools.append(el("span", "localtag", LOCAL_LABEL));
    intro.append(tools);
    thread.append(messageView("Course", course.instructor_id || course.id, "", intro));
    course.modules.forEach((m, i) => {
      const body = el("div");
      body.append(renderMarkdown(m.body || m.description || ""), moduleTools(m, i, course.modules.length));
      const msg = messageView(m.name, m.id, "", body);
      msg.dataset.module = String(m.id);
      thread.append(msg);
    });
  }
  function moduleTools(m, i, n) {
    const tools = el("div", "ctools");
    const up = btn("Move up", "module-up", "linkbtn", () => moveModule(m, -1), `Move ${m.name} up`); up.disabled = i === 0;
    const down = btn("Move down", "module-down", "linkbtn", () => moveModule(m, 1), `Move ${m.name} down`); down.disabled = i === n - 1;
    const done = btn(m.completed ? "Completed (undo)" : "Mark complete", "module-complete", `linkbtn${m.completed ? " done" : ""}`, () => toggleComplete(m), `${m.completed ? "Mark incomplete" : "Mark complete"}: ${m.name}`);
    done.setAttribute("aria-pressed", String(Boolean(m.completed)));
    tools.append(up, down, done);
    return tools;
  }

  // ── Documentation reader: replaces the main column; the page list sits at its left ────────
  function openDocs(pageId = state.docs.page, opener = "") {
    state.docs.opener = opener;
    state.docs.page = DOCS.some((d) => d.id === pageId) ? pageId : DOCS[0].id;
    state.docs.open = true;
    render();
    focusDocHeading();
  }

  function closeDocs() {
    state.docs.open = false;
    render();
    if (state.docs.opener) root.querySelector(state.docs.opener)?.focus?.();
  }

  function focusDocHeading() { root.querySelector(".dpage h2")?.focus?.(); }

  function chooseDoc(id) {
    state.docs.page = id;
    render();
    focusDocHeading();
  }

  function downloadText(name, text) {
    try {
      const url = URL.createObjectURL(new Blob([text], { type: "text/markdown;charset=utf-8" }));
      const a = el("a");
      a.href = url; a.download = name;
      root.append(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
      return true;
    } catch { return false; }
  }

  function docsView() {
    const page = DOCS.find((d) => d.id === state.docs.page) || DOCS[0];
    const main = el("main", "main");
    const wrap = el("div", "docs");
    wrap.dataset.page = page.id;
    const head = el("div", "mhead");
    head.append(btn("Back", "docs-back", "headbtn docsback", closeDocs), el("h3", "", "Documentation"));
    const body = el("div", "dbody");

    const nav = el("nav", "dnav");
    nav.setAttribute("aria-label", "Documentation pages");
    DOCS.forEach((d) => {
      const b = btn(d.title, "docs-page", "row dlink", () => chooseDoc(d.id));
      if (d.id === page.id) b.setAttribute("aria-current", "page");
      nav.append(b);
    });

    const article = el("article", "dpage");
    const tools = el("div", "dtools");
    const note = el("span", "hint");
    note.setAttribute("role", "status");
    note.setAttribute("aria-live", "polite");
    note.style.padding = "0";
    tools.append(
      btn("Copy Markdown", "docs-copy", "headbtn dcopy", async () => {
        try { await navigator.clipboard.writeText(page.markdown); note.textContent = "Copied."; } catch { note.textContent = "Copy is not available in this browser."; }
      }),
      btn("Download .md", "docs-download", "headbtn ddownload", () => { note.textContent = downloadText(`holons-${page.id}.md`, page.markdown) ? "Download started." : "Download is not available in this browser."; }),
      note,
    );
    const title = el("h2", "", page.title);
    title.tabIndex = -1;
    // The page title is the heading above; drop the Markdown's own leading "# " line from the rendered body.
    const shown = page.markdown.replace(/^# .*\n+/, "");
    article.append(tools, title, renderMarkdown(shown, { httpOnly: true }));
    body.append(nav, article);
    wrap.append(head, body);
    main.append(wrap);
    return main;
  }

  function mainView() {
    if (state.docs.open) return docsView();
    const main = el("main", "main");
    const head = el("div", "mhead");
    const h = holon();
    const course = state.data && state.channel.startsWith("course:") ? state.data.courses.find((c) => `course:${c.id}` === state.channel) : null;
    const mod = state.data && state.channel.startsWith("module:") ? state.data.courses.flatMap((c) => c.modules.map((m) => ({ ...m, course: c }))).find((m) => `module:${m.id}` === state.channel) : null;
    const title = state.channel === "welcome" || !h ? "Welcome" : course ? course.name : mod ? `${mod.course.name} / ${mod.name}` : `${h.name} / feed`;
    head.append(el("h3", "", title));
    if (h && state.channel === "feed" && state.data) head.append(btn("New post", "new-post", "ghost sm", () => postDialog()));
    const who = state.me ? (live() ? `Signed in as ${saved.email || state.me.email || `user #${state.me.id}`}` : `Demo user: ${state.me.name}`) : live() ? "Signed in" : "Not signed in";
    head.append(el("span", "who", who));
    if (live()) head.append(btn("Sign out", "sign-out", "ghost sm", () => accountDialog()));
    else head.append(btn("Sign in", "sign-in", "ghost sm", () => accountDialog("signin")), btn("Sign up", "sign-up", "ghost sm", () => accountDialog("signup")));
    const status = el("button", "status");
    status.type = "button"; status.dataset.mode = state.backend ? state.backend.mode : "demo";
    status.title = "Account and connection";
    status.append(el("i"), el("span", "", state.loading ? "Connecting..." : live() ? "Connected" : "Demo"));
    status.addEventListener("click", () => accountDialog("signin"));
    head.append(status);
    main.append(head);
    if (state.notice) main.append(el("div", "banner", state.notice));
    if (state.success) { const b = el("div", "banner ok", state.success); b.setAttribute("role", "status"); main.append(b); }
    if (state.error) { const b = el("div", "banner error", state.error); b.setAttribute("role", "alert"); main.append(b); }

    if (state.channel === "welcome" || !h) {
      const w = el("div", "welcome");
      const big = el("span", "wbig"); big.append(blobSvg("violet"));
      w.append(big, el("h1", "", "Holons"),
        el("p", "", live() ? `Connected to ${state.backend.base}. Pick a Holon on the left, or press + to create one.` : "Chat with your Holons: feeds, courses and the people in them. You are in Demo mode with sample Holons."),
        poweredBy("wpowered"));
      const actions = el("div", "wactions");
      actions.append(btn("Learn about Holons", "docs-open", "wdocs", () => openDocs("index", ".wdocs")));
      w.insertBefore(actions, w.querySelector(".wpowered"));
      main.append(w);
      return main;
    }
    const thread = el("div", "thread");
    if (!state.data) thread.append(el("div", "empty", "Loading..."));
    else if (state.channel === "feed") feedView(thread);
    else if (course) courseView(thread, course);
    else if (mod) {
      const idx = mod.course.modules.findIndex((m) => m.id === mod.id);
      const body = el("div");
      body.append(renderMarkdown(mod.body || ""), moduleTools(mod, idx, mod.course.modules.length));
      thread.append(messageView(mod.name, mod.id, "", body));
    } else thread.append(el("div", "empty", "Nothing here."));
    main.append(thread);

    if (state.channel === "feed" && state.data) {
      if (!isOwner() && !isMember()) main.append(el("div", "hint", "You have not joined this Holon, so the server may refuse your post. Use Join in the left column."));
      const form = el("form", "composer");
      const ta = el("textarea"); ta.placeholder = `Post to ${h.name}`; ta.rows = 1; ta.setAttribute("aria-label", "Message");
      const send = el("button", "send", state.busy ? "Sending..." : "Send"); send.type = "submit"; send.disabled = state.busy > 0;
      form.append(ta, send);
      ta.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit", { cancelable: true })); } });
      form.addEventListener("submit", (e) => { e.preventDefault(); const t = ta.value.trim(); if (t && !state.busy) post(t); });
      main.append(form);
    } else if (state.backend && state.backend.localCourses) main.append(el("div", "note", `${LOCAL_LABEL}.`));
    return main;
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
    if (holon()) { const n = el("p", "hint invite-note", NO_INVITE); n.style.padding = "10px 0 0"; col.append(n); }
    return col;
  }

  let grips = { dispose() {} };
  function render() {
    if (disposed) return;
    fitRoot();
    grips.dispose();
    const shell = el("div", "shell");
    shell.classList.toggle("docsopen", state.docs.open);
    shell.append(railView(), listView(), mainView());
    if (!state.docs.open) shell.append(teamView());
    shellHost.replaceChildren(shell);
    grips = gripColumns({
      grid: shell, storageKey: "grip:holons-hangout", centerMin: 56 + 320, narrowQuery: "(max-width: 900px)",
      columns: [
        { el: shell.querySelector(":scope > .list"), edge: "left", min: 200, max: 480, initial: 300, label: "holons list" },
        ...(state.docs.open ? [] : [{ el: shell.querySelector(":scope > .team"), edge: "right", min: 160, max: 420, initial: 280, label: "team panel" }]),
      ],
    });
    // The rail sits left of the list, so its handle is 56px further in.
    shell.querySelectorAll(":scope > .grip-left").forEach((h) => { h.style.left = "calc(56px + var(--grip-0, 300px))"; });
    const ta = root.querySelector(".composer textarea");
    if (ta && state.refocus && !state.dialog) { ta.focus(); state.refocus = false; }
  }

  /** Fill the visible page below wherever the host put us (hosts may not give a definite height). */
  function fitRoot() {
    const top = Math.max(0, root.getBoundingClientRect().top);
    root.style.height = `${Math.max(480, (window.innerHeight || 800) - top)}px`;
  }
  const onWinResize = () => { if (!disposed) fitRoot(); };
  window.addEventListener("resize", onWinResize);
  const roFit = typeof ResizeObserver === "function" && container.parentElement ? new ResizeObserver(onWinResize) : null;
  roFit?.observe(container.parentElement || container);

  render();
  connect(saved);
  return () => { disposed = true; window.removeEventListener("resize", onWinResize); roFit?.disconnect(); grips.dispose(); root.remove(); };
}
