import { afterEach, describe, expect, it, vi } from "vitest";
import { activate, ApiError, chooseBackend, createClient, createDemo, loadHolon, normalizeBase, renderMarkdown, titleFrom } from "./extension.js";

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));
const json = (body, status = 200) => ({ ok: status < 400, status, json: async () => body });

function mountApp(saved) {
  localStorage.clear();
  if (saved) localStorage.setItem("holons-hangout:v1", JSON.stringify(saved));
  let mountFn;
  activate({ apiVersion: "1", registerPage: (_id, fn) => { mountFn = fn; return () => {}; } });
  const container = document.createElement("div");
  document.body.append(container);
  return { container, dispose: mountFn({ container }) };
}

afterEach(() => { vi.unstubAllGlobals(); document.body.replaceChildren(); });

describe("holons-api client", () => {
  it("signs in at the devise-api token route and returns the token", async () => {
    const fetchFn = vi.fn(async () => json({ token: "abc", refresh_token: "r" }));
    const token = await createClient({ baseUrl: "http://api.test/", fetchFn }).signIn("a@b.c", "pw");
    expect(token).toBe("abc");
    const [url, init] = fetchFn.mock.calls[0];
    expect(url).toBe("http://api.test/users/tokens/sign_in");
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body)).toEqual({ email: "a@b.c", password: "pw" });
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("sends the bearer token, wraps create bodies like Rails and filters posts by holon", async () => {
    const fetchFn = vi.fn(async (url) => json(String(url).endsWith("/posts") ? [{ id: 1, holon_id: 1 }, { id: 2, holon_id: 9 }] : { id: 5 }));
    const c = createClient({ baseUrl: "http://api.test", token: "tok", fetchFn });
    expect(await c.listPosts(1)).toEqual([{ id: 1, holon_id: 1 }]);
    expect(fetchFn.mock.calls[0][1].headers.Authorization).toBe("Bearer tok");
    await c.createPost({ holon_id: 1, title: "t", content: "c" });
    await c.createComment({ post_id: 1, content: "c" });
    await c.listMemberships(3);
    await c.listHolons("joined");
    expect(fetchFn.mock.calls.slice(1).map((x) => `${x[1].method} ${x[0]}`)).toEqual([
      "POST http://api.test/posts", "POST http://api.test/comments", "GET http://api.test/holon_memberships?holon_id=3", "GET http://api.test/holons?scope=joined"]);
    expect(JSON.parse(fetchFn.mock.calls[1][1].body)).toEqual({ post: { holon_id: 1, title: "t", content: "c" } });
  });

  it("turns 401, 422 and network failures into readable ApiErrors", async () => {
    const mk = (fetchFn) => createClient({ baseUrl: "http://api.test", token: "t", fetchFn });
    await expect(mk(async () => json({ error: "no" }, 401)).listHolons()).rejects.toMatchObject({ status: 401, message: expect.stringContaining("Not signed in") });
    await expect(mk(async () => json({ content: ["can't be blank"] }, 422)).createPost({})).rejects.toThrow(/422.*can't be blank/);
    await expect(mk(async () => { throw new TypeError("x"); }).listHolons()).rejects.toThrow(/Could not reach/);
    await expect(createClient({}).listHolons()).rejects.toBeInstanceOf(ApiError);
  });

  it("normalizes the base URL", () => expect(normalizeBase(" http://x:3000// ")).toBe("http://x:3000"));
});

describe("demo fallback", () => {
  it("uses Demo without an address or token, and when the API is unreachable", async () => {
    expect((await chooseBackend({ baseUrl: "" })).backend.mode).toBe("demo");
    expect((await chooseBackend({ baseUrl: "http://x", token: "" })).notice).toMatch(/Sign in/);
    const down = await chooseBackend({ baseUrl: "http://x", token: "t", fetchFn: async () => { throw new Error("offline"); } });
    expect(down.backend.mode).toBe("demo");
    expect(down.notice).toMatch(/Could not reach.*Showing the demo/);
  });

  it("uses the live client when holons answers", async () => {
    const r = await chooseBackend({ baseUrl: "http://x", token: "t", fetchFn: async () => json([]) });
    expect(r.backend.mode).toBe("live");
  });

  it("maps a demo Holon to members, courses with modules, and a feed with replies", async () => {
    const demo = createDemo();
    const [first] = await demo.listHolons();
    const data = await loadHolon(demo, first);
    expect(data.members.map((m) => m.name)).toContain("Ada Lovelace");
    expect(data.courses[0].modules.length).toBeGreaterThan(0);
    expect(data.feed[0].comments.length).toBe(2);
    await demo.createPost({ holon_id: first.id, title: "Hi", content: "there" });
    expect((await loadHolon(demo, first)).feed.at(-1).authorName).toBe("You");
  });

  it("derives a post title from the first line", () => {
    expect(titleFrom("## Big news\nmore")).toBe("Big news");
    expect(titleFrom("x".repeat(80))).toHaveLength(60);
  });
});

describe("rendering", () => {
  it("renders markdown as DOM and refuses unsafe links", () => {
    const md = renderMarkdown("**hi** `x` [bad](javascript:alert(1)) [ok](https://a.co)\n\n- one");
    expect(md.querySelector("strong").textContent).toBe("hi");
    expect(md.querySelectorAll("a")).toHaveLength(1);
    expect(md.querySelector("li").textContent).toBe("one");
  });

  it("starts in Demo, shows Holons, the feed, the team and the footer, and posts a message", async () => {
    const { container } = mountApp();
    await tick(10);
    expect(container.querySelector(".status").textContent).toBe("Demo");
    expect(container.querySelector(".welcome .wpowered").textContent).toContain("Built with");
    expect(container.querySelectorAll(".rail [data-holon]")).toHaveLength(3);
    container.querySelector(".rail [data-holon='1']").click();
    await tick(10);
    expect(container.querySelector(".mhead h3").textContent).toBe("Open Source Academy / feed");
    expect(container.querySelector(".msg").textContent).toContain("Welcome to Open Source Academy");
    expect(container.querySelectorAll(".member")).toHaveLength(5);
    expect(container.querySelector(".member .avatar svg")).not.toBeNull();
    const built = container.querySelector(".lpowered");
    expect(built.firstElementChild.textContent).toBe("Built with");
    expect([...built.querySelectorAll("a.plogo")].map((a) => [a.getAttribute("aria-label"), a.href, a.rel, a.target])).toEqual([
      ["Kamiji", "https://github.com/FraterCCCLXIII/kamiji", "noopener noreferrer", "_blank"],
      ["Kosmos", "https://kosmos.computer/", "noopener noreferrer", "_blank"],
    ]);
    expect(built.querySelectorAll("a.plogo svg[role='img'] path").length).toBeGreaterThan(2);
    container.querySelector("[data-channel='course:1']").click();
    expect(container.querySelector(".thread").textContent).toContain("Branching");

    container.querySelector("[data-channel='feed']").click();
    const ta = container.querySelector(".composer textarea");
    ta.value = "Hello **Holons**";
    container.querySelector(".composer").dispatchEvent(new Event("submit", { cancelable: true }));
    await tick(10);
    const last = [...container.querySelectorAll(".msg")].at(-1);
    expect(last.textContent).toContain("Hello Holons");
    expect(last.querySelector("strong")).not.toBeNull();
  });

  it("shows replies and sends one", async () => {
    const { container } = mountApp();
    await tick(10);
    container.querySelector(".rail [data-holon='1']").click();
    await tick(10);
    container.querySelector("[data-post='1'] .linkbtn").click();
    expect(container.querySelectorAll("[data-post='1'] .reply")).toHaveLength(2);
    const input = container.querySelector("[data-post='1'] .rform input");
    input.value = "Thanks!";
    container.querySelector("[data-post='1'] .rform").dispatchEvent(new Event("submit", { cancelable: true }));
    await tick(10);
    expect(container.querySelectorAll("[data-post='1'] .reply")).toHaveLength(3);
  });

  it("shows Connected with live data and a readable error when sending fails", async () => {
    const rows = { "/holons": [{ id: 7, name: "Live Holon", description: "d" }], "/posts": [{ id: 1, holon_id: 7, content: "from rails", title: "T" }], "/comments": [], "/holon_memberships?holon_id=7": [{ id: 1, holon_id: 7, member_id: 42 }] };
    vi.stubGlobal("fetch", vi.fn(async (url, init) => {
      const path = String(url).replace("http://api.test", "");
      if (init.method === "POST") return json({ content: ["can't be blank"] }, 422);
      return json(rows[path] ?? []);
    }));
    const { container } = mountApp({ baseUrl: "http://api.test", token: "tok" });
    await tick(10);
    expect(container.querySelector(".status").textContent).toBe("Connected");
    container.querySelector(".rail [data-holon='7']").click();
    await tick(10);
    expect(container.querySelector(".msg").textContent).toContain("from rails");
    expect(container.querySelector(".member").textContent).toContain("Member #42");
    expect(container.querySelector(".list").textContent).toContain("no courses");
    const ta = container.querySelector(".composer textarea");
    ta.value = "boom";
    container.querySelector(".composer").dispatchEvent(new Event("submit", { cancelable: true }));
    await tick(10);
    expect(container.querySelector(".banner.error").textContent).toContain("422");
  });

  it("falls back to Demo with a notice when the saved API is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("down"); }));
    const { container } = mountApp({ baseUrl: "http://api.test", token: "tok" });
    await tick(10);
    expect(container.querySelector(".status").textContent).toBe("Demo");
    expect(container.querySelector(".banner").textContent).toContain("Could not reach");
  });
});

// ─── Create and add flows ────────────────────────────────────────────────────

const click = (c, sel) => { const n = typeof sel === "string" ? c.querySelector(sel) : sel; if (!n) throw new Error(`missing ${sel}`); n.click(); };
const act = (c, name) => c.querySelector(`[data-action='${name}']`);
const dialog = (c) => c.querySelector(".dialog");
async function submitDialog(c, values = {}) {
  const form = dialog(c);
  Object.entries(values).forEach(([k, v]) => { form.elements[k].value = v; });
  form.dispatchEvent(new Event("submit", { cancelable: true }));
  await tick(25);
}
const text = (c, sel) => c.querySelector(sel)?.textContent ?? "";

describe("Demo mode: add and create flows", () => {
  it("shows the demo user, the no-invite note and validates the Holon form", async () => {
    const { container } = mountApp();
    await tick(10);
    expect(text(container, ".who")).toBe("Demo user: You");
    container.querySelector("[data-holon='1']").click();
    await tick(10);
    expect(text(container, ".invite-note")).toContain("no invite endpoint");
    click(container, "[data-action='new-holon']");
    await submitDialog(container, { name: "  " });
    expect(text(container, ".derr")).toBe("Name is required.");
    expect(dialog(container).elements.name.getAttribute("aria-invalid")).toBe("true");
    dialog(container).dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(dialog(container)).toBeNull();
  });

  it("creates, edits and deletes your own Holon, and explains a duplicate name", async () => {
    const { container } = mountApp();
    await tick(10);
    click(container, "[data-action='new-holon']");
    await submitDialog(container, { name: "Open Source Academy" });
    expect(text(container, ".derr")).toMatch(/already been taken/);
    await submitDialog(container, { name: "Poetry Club", description: "Verse" });
    expect(dialog(container)).toBeNull();
    expect(container.querySelectorAll(".rail [data-holon]")).toHaveLength(4);
    expect(text(container, ".mhead h3")).toBe("Poetry Club / feed");
    expect(text(container, ".badge")).toBe("Owner");
    expect(text(container, ".banner.ok")).toContain("Created Poetry Club");
    click(container, act(container, "edit-holon"));
    await submitDialog(container, { name: "Poetry Circle" });
    expect(text(container, ".lhead h2")).toBe("Poetry Circle");
    click(container, act(container, "delete-holon"));
    await submitDialog(container);
    expect(container.querySelectorAll(".rail [data-holon]")).toHaveLength(3);
    expect(text(container, ".banner.ok")).toBe("Deleted Poetry Circle.");
  });

  it("leaves and joins a Holon with the membership shown in the team", async () => {
    const { container } = mountApp();
    await tick(10);
    container.querySelector("[data-holon='1']").click();
    await tick(10);
    expect(text(container, ".badge")).toBe("Member");
    click(container, act(container, "leave"));
    await tick(10);
    expect(text(container, ".badge")).toBe("Not a member");
    expect(container.querySelectorAll(".member")).toHaveLength(4);
    expect(text(container, ".banner.ok")).toBe("You left Open Source Academy.");
    expect(container.querySelector(".hint").textContent).toContain("not joined");
    click(container, act(container, "join"));
    await tick(10);
    expect(text(container, ".badge")).toBe("Member");
    expect(container.querySelectorAll(".member")).toHaveLength(5);
  });

  it("creates, edits and deletes a post and a reply with validation", async () => {
    const { container } = mountApp();
    await tick(10);
    container.querySelector("[data-holon='1']").click();
    await tick(10);
    expect(container.querySelector("[data-post='1'] [data-action='edit-post']")).toBeNull();
    click(container, act(container, "new-post"));
    await submitDialog(container, { title: "", content: "x" });
    expect(text(container, ".derr")).toBe("Title is required.");
    await submitDialog(container, { title: "Lab notes", content: "## Day 1\n**done**" });
    const created = [...container.querySelectorAll(".msg")].at(-1);
    expect(created.querySelector(".mtitle").textContent).toBe("Lab notes");
    expect(created.querySelector("h4").textContent).toBe("Day 1");
    click(created, "[data-action='edit-post']");
    await submitDialog(container, { title: "Lab notes v2", content: "edited" });
    const edited = [...container.querySelectorAll(".msg")].at(-1);
    expect(edited.textContent).toContain("Lab notes v2");
    expect(edited.textContent).toContain("edited");

    const last = () => [...container.querySelectorAll(".msg")].at(-1);
    click(last(), ".linkbtn");
    last().querySelector(".rform input").value = "first!";
    last().querySelector(".rform").dispatchEvent(new Event("submit", { cancelable: true }));
    await tick(15);
    expect(last().querySelectorAll(".reply")).toHaveLength(1);
    click(last(), "[data-action='edit-comment']");
    await submitDialog(container, { content: "second!" });
    expect(last().querySelector(".reply").textContent).toContain("second!");
    click([...container.querySelectorAll(".msg")].at(-1), "[data-action='delete-comment']");
    await submitDialog(container);
    expect([...container.querySelectorAll(".msg")].at(-1).querySelectorAll(".reply")).toHaveLength(0);
    click([...container.querySelectorAll(".msg")].at(-1), "[data-action='delete-post']");
    await submitDialog(container);
    expect(container.querySelectorAll(".msg")).toHaveLength(2);
    expect(text(container, ".banner.ok")).toBe("Post deleted.");
  });

  it("creates a course and a module, reorders modules and marks one complete", async () => {
    const { container } = mountApp();
    await tick(10);
    container.querySelector("[data-holon='1']").click();
    await tick(10);
    click(container, act(container, "new-course"));
    await submitDialog(container, { name: "" });
    expect(text(container, ".derr")).toBe("Name is required.");
    await submitDialog(container, { name: "Release Engineering", description: "Ship it" });
    expect(text(container, ".mhead h3")).toBe("Release Engineering");
    click(container, act(container, "new-module"));
    await submitDialog(container, { name: "Tags", body: "Use `git tag`" });
    await tick(5);
    expect(text(container, ".mhead h3")).toBe("Release Engineering / Tags");
    // two modules in the seeded Git course: move the second one up, then complete it
    click(container, "[data-channel='course:1']");
    const names = () => [...container.querySelectorAll("[data-module] .mname")].map((n) => n.textContent);
    expect(names()).toEqual(["Branching", "Opening a PR"]);
    click(container, "[data-module='2'] [data-action='module-up']");
    await tick(10);
    expect(names()).toEqual(["Opening a PR", "Branching"]);
    click(container, "[data-module='2'] [data-action='module-complete']");
    await tick(10);
    expect(container.querySelector("[data-module='2'] [data-action='module-complete']").getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector("[data-channel='module:2']").textContent).toContain("✓");
  });
});

// A tiny stateful stand-in for holons-api that records every request. Like the real jbuilder views it omits post titles.
function fakeApi(over = {}) {
  const db = { holons: [{ id: 7, name: "Live Holon", description: "d" }], created: [7], joined: [], posts: [], comments: [], memberships: [], next: 50, ...over.db };
  const calls = [];
  const fail = new Set(over.fail || []);
  const ok = (body, status = 200) => ({ ok: true, status, json: async () => body });
  const fetchFn = vi.fn(async (url, init = {}) => {
    const u = new URL(String(url));
    const path = u.pathname;
    const method = init.method || "GET";
    const body = init.body ? JSON.parse(init.body) : undefined;
    calls.push({ method, path, search: u.search, headers: init.headers, body });
    if (fail.has(`${method} ${path}`)) return json({ error: "boom" }, 500);
    const idOf = () => Number(path.split("/")[2]);
    if (path === "/up") return ok({});
    if (path === "/users/tokens/sign_in" || path === "/users/tokens/sign_up") return ok({ token: "tok-1", refresh_token: "r", resource_owner: { id: 42, email: body.email } });
    if (path === "/users/tokens/revoke") return ok({}, 200);
    if (path === "/users/tokens/info") return json({}, 404);
    const [, coll, id] = path.split("/");
    if (coll === "holons") {
      if (method === "GET") { const s = u.searchParams.get("scope"); return ok(db.holons.filter((h) => !s || (s === "created" ? db.created : db.joined).includes(h.id))); }
      if (method === "POST") { const h = { id: db.next++, ...body.holon }; db.holons.push(h); db.created.push(h.id); return ok(h, 201); }
      if (method === "PATCH") { Object.assign(db.holons.find((h) => h.id === idOf()), body.holon); return ok({ id: idOf(), ...body.holon }); }
      if (method === "DELETE") { db.holons = db.holons.filter((h) => h.id !== idOf()); return { ok: true, status: 204 }; }
    }
    if (coll === "holon_memberships") {
      if (method === "GET") return ok(db.memberships.filter((m) => m.holon_id === Number(u.searchParams.get("holon_id"))));
      if (method === "POST") { const m = { id: db.next++, ...body.holon_membership }; db.memberships.push(m); db.joined.push(m.holon_id); return ok(m, 201); }
      if (method === "DELETE") { const m = db.memberships.find((x) => x.id === Number(id)); db.memberships = db.memberships.filter((x) => x !== m); db.joined = db.joined.filter((x) => x !== m.holon_id); return { ok: true, status: 204 }; }
    }
    if (coll === "posts" || coll === "comments") {
      const list = db[coll];
      const key = coll === "posts" ? "post" : "comment";
      const strip = ({ title, ...r }) => r;
      if (method === "GET") return ok(list.map(strip));
      if (method === "POST") { const r = { id: db.next++, ...body[key] }; list.push(r); return ok(strip(r), 201); }
      if (method === "PATCH") { Object.assign(list.find((x) => x.id === Number(id)), body[key]); return ok({ id: Number(id) }); }
      if (method === "DELETE") { db[coll] = list.filter((x) => x.id !== Number(id)); return { ok: true, status: 204 }; }
    }
    return json({}, 404);
  });
  return { db, calls, fetchFn, fail, calledWith: (method, path) => calls.filter((c) => c.method === method && c.path === path) };
}
const SAVED = { baseUrl: "http://api.test", token: "tok", email: "me@x.io", me: { id: 42, email: "me@x.io" } };
async function mountConnected(api, saved = SAVED) {
  vi.stubGlobal("fetch", api.fetchFn);
  const m = mountApp(saved);
  await tick(20);
  return m;
}
async function openLive(api, id = 7, saved) {
  const m = await mountConnected(api, saved);
  m.container.querySelector(`[data-holon='${id}']`).click();
  await tick(20);
  return m;
}

describe("Connected mode: account", () => {
  it("signs in, stores the token but never the password, shows the user and signs out", async () => {
    const api = fakeApi();
    const { container } = await mountConnected(api, null);
    expect(text(container, ".who")).toBe("Demo user: You");
    click(container, act(container, "sign-in"));
    await submitDialog(container, { base: "ftp://x", email: "a@b.co", password: "pw" });
    expect(text(container, ".derr")).toMatch(/http/);
    await submitDialog(container, { base: "http://api.test/", email: "a@b.co", password: "s3cret-pw" });
    const [call] = api.calledWith("POST", "/users/tokens/sign_in");
    expect(call.body).toEqual({ email: "a@b.co", password: "s3cret-pw" });
    expect(call.headers.Authorization).toBeUndefined();
    expect(call.headers["Content-Type"]).toBe("application/json");
    expect(text(container, ".status")).toBe("Connected");
    expect(text(container, ".who")).toBe("Signed in as a@b.co");
    expect(text(container, ".banner.ok")).toBe("Signed in as a@b.co.");
    const stored = localStorage.getItem("holons-hangout:v1");
    expect(JSON.parse(stored)).toMatchObject({ baseUrl: "http://api.test", token: "tok-1", email: "a@b.co", me: { id: 42 } });
    expect(stored).not.toContain("s3cret-pw");
    expect(api.calledWith("GET", "/holons")[0].headers.Authorization).toBe("Bearer tok-1");

    click(container, act(container, "sign-out"));
    await submitDialog(container);
    const [rev] = api.calledWith("POST", "/users/tokens/revoke");
    expect(rev.headers.Authorization).toBe("Bearer tok-1");
    expect(JSON.parse(localStorage.getItem("holons-hangout:v1")).token).toBe("");
    expect(text(container, ".status")).toBe("Demo");
    expect(text(container, ".banner.ok")).toBe("Signed out.");
  });

  it("shows a server error in the dialog and keeps it open", async () => {
    const api = fakeApi({ fail: ["POST /users/tokens/sign_in"] });
    const { container } = await mountConnected(api, null);
    click(container, act(container, "sign-in"));
    await submitDialog(container, { base: "http://api.test", email: "a@b.co", password: "pw" });
    expect(text(container, ".derr")).toContain("500");
    expect(dialog(container)).not.toBeNull();
    expect(dialog(container).querySelector(".primary").disabled).toBe(false);
  });

  it("signs up at the (unverified) sign_up route with extra fields, and enforces password length", async () => {
    const api = fakeApi();
    const { container } = await mountConnected(api, null);
    click(container, act(container, "sign-up"));
    expect(text(container, ".dialog")).toContain("unverified");
    await submitDialog(container, { base: "http://api.test", email: "new@b.co", password: "123" });
    expect(text(container, ".derr")).toMatch(/at least 6/);
    expect(api.calledWith("POST", "/users/tokens/sign_up")).toHaveLength(0);
    await submitDialog(container, { password: "longenough", name: "New Person", nickname: "np" });
    const [call] = api.calledWith("POST", "/users/tokens/sign_up");
    expect(call.body).toEqual({ email: "new@b.co", password: "longenough", name: "New Person", nickname: "np" });
    expect(text(container, ".who")).toBe("Signed in as new@b.co");
    expect(text(container, ".banner.ok")).toBe("Account created and signed in as new@b.co.");
  });
});

describe("Connected mode: Holons, membership, posts and comments", () => {
  it("creates, edits and deletes a Holon with the exact Rails params", async () => {
    const api = fakeApi();
    const { container } = await mountConnected(api);
    click(container, act(container, "new-holon"));
    await submitDialog(container, { name: "Fresh Holon", description: "About it" });
    const [created] = api.calledWith("POST", "/holons");
    expect(created.body).toEqual({ holon: { name: "Fresh Holon", description: "About it" } });
    expect(created.headers.Authorization).toBe("Bearer tok");
    expect(text(container, ".badge")).toBe("Owner");
    click(container, act(container, "edit-holon"));
    await submitDialog(container, { name: "Fresher" });
    const [patch] = api.calledWith("PATCH", "/holons/50");
    expect(patch.body).toEqual({ holon: { name: "Fresher", description: "About it" } });
    click(container, act(container, "delete-holon"));
    await submitDialog(container);
    expect(api.calledWith("DELETE", "/holons/50")).toHaveLength(1);
    expect(container.querySelector("[data-holon='50']")).toBeNull();
  });

  it("joins with POST /holon_memberships and leaves with DELETE of the membership id", async () => {
    const api = fakeApi({ db: { created: [] } });
    const { container } = await openLive(api);
    expect(text(container, ".badge")).toBe("Not a member");
    click(container, act(container, "join"));
    await tick(25);
    const [join] = api.calledWith("POST", "/holon_memberships");
    expect(join.body).toEqual({ holon_membership: { holon_id: 7, member_id: 42 } });
    expect(text(container, ".badge")).toBe("Member");
    expect(text(container, ".member")).toContain("Member #42");
    click(container, act(container, "leave"));
    await tick(25);
    const membershipId = api.calledWith("POST", "/holon_memberships").length && api.calls.find((c) => c.method === "DELETE").path;
    expect(membershipId).toMatch(/^\/holon_memberships\/\d+$/);
    expect(api.calls.find((c) => c.method === "DELETE").headers.Authorization).toBe("Bearer tok");
    expect(text(container, ".badge")).toBe("Not a member");
    expect(text(container, ".banner.ok")).toBe("You left Live Holon.");
  });

  it("disables Join when the server gave no user id", async () => {
    const api = fakeApi({ db: { created: [] } });
    const { container } = await openLive(api, 7, { ...SAVED, me: null });
    expect(act(container, "join").disabled).toBe(true);
  });

  it("creates, edits and deletes a post and a comment, keeping the title the API omits", async () => {
    const api = fakeApi();
    const { container } = await openLive(api);
    click(container, act(container, "new-post"));
    await submitDialog(container, { title: "Hello", content: "**body**" });
    const [p] = api.calledWith("POST", "/posts");
    expect(p.body).toEqual({ post: { holon_id: 7, title: "Hello", content: "**body**" } });
    expect(p.headers.Authorization).toBe("Bearer tok");
    expect(text(container, ".msg .mtitle")).toBe("Hello");
    const id = api.db.posts[0].id;
    click(container, "[data-action='edit-post']");
    await submitDialog(container, { title: "Hello 2", content: "changed" });
    expect(api.calledWith("PATCH", `/posts/${id}`)[0].body).toEqual({ post: { title: "Hello 2", content: "changed" } });
    expect(text(container, ".msg .mtitle")).toBe("Hello 2");

    click(container, ".msg .linkbtn");
    const input = container.querySelector(".rform input");
    input.value = "a reply";
    container.querySelector(".rform").dispatchEvent(new Event("submit", { cancelable: true }));
    await tick(25);
    expect(api.calledWith("POST", "/comments")[0].body).toEqual({ comment: { post_id: id, content: "a reply" } });
    const cid = api.db.comments[0].id;
    click(container, "[data-action='edit-comment']");
    await submitDialog(container, { content: "edited reply" });
    expect(api.calledWith("PATCH", `/comments/${cid}`)[0].body).toEqual({ comment: { content: "edited reply" } });
    click(container, "[data-action='delete-comment']");
    await submitDialog(container);
    expect(api.calledWith("DELETE", `/comments/${cid}`)).toHaveLength(1);
    expect(container.querySelectorAll(".reply")).toHaveLength(0);
    click(container, "[data-action='delete-post']");
    await submitDialog(container);
    expect(api.calledWith("DELETE", `/posts/${id}`)).toHaveLength(1);
    expect(container.querySelectorAll(".msg")).toHaveLength(0);
  });

  it("does not offer edit or delete on posts this browser did not create unless you own the Holon", async () => {
    const api = fakeApi({ db: { created: [], posts: [{ id: 3, holon_id: 7, content: "theirs" }] } });
    const { container } = await openLive(api);
    expect(container.querySelector(".msg").textContent).toContain("theirs");
    expect(container.querySelector("[data-action='edit-post']")).toBeNull();
  });

  it("shows the post at once, then rolls it back and keeps the dialog open with the error when the server refuses", async () => {
    const api = fakeApi({ fail: ["POST /posts"] });
    const { container } = await openLive(api);
    let seenWhilePending = "";
    const real = api.fetchFn.getMockImplementation();
    api.fetchFn.mockImplementation(async (url, init) => {
      if (init?.method === "POST") seenWhilePending = container.querySelector(".msg")?.textContent ?? "";
      return real(url, init);
    });
    click(container, act(container, "new-post"));
    await submitDialog(container, { title: "Doomed", content: "text" });
    expect(seenWhilePending).toContain("Doomed");
    expect(container.querySelectorAll(".msg")).toHaveLength(0);
    expect(text(container, ".derr")).toContain("500");
    expect(dialog(container)).not.toBeNull();
  });

  it("rolls back an optimistic delete when the server refuses", async () => {
    const api = fakeApi({ db: { posts: [{ id: 3, holon_id: 7, content: "keep me" }] }, fail: ["DELETE /posts/3"] });
    const { container } = await openLive(api);
    click(container, "[data-action='delete-post']");
    await submitDialog(container);
    expect(text(container, ".derr")).toContain("500");
    expect(container.querySelector(".msg").textContent).toContain("keep me");
  });
});

describe("Connected mode: courses are local only", () => {
  it("explains that holons-api has no course routes, and creates courses and modules in this browser without any request", async () => {
    const api = fakeApi();
    const { container } = await openLive(api);
    expect(text(container, ".list")).toContain("no courses endpoint");
    expect(text(container, ".list .localtag")).toBe("Local only, not saved to the server");
    const before = api.calls.length;
    click(container, act(container, "new-course"));
    expect(text(container, ".dialog")).toContain("Local only, not saved to the server");
    await submitDialog(container, { name: "Mine", description: "d" });
    click(container, act(container, "new-module"));
    await submitDialog(container, { name: "Lesson 1", body: "hi" });
    expect(text(container, ".mhead h3")).toBe("Mine / Lesson 1");
    click(container, "[data-action='module-complete']");
    await tick(10);
    expect(container.querySelector("[data-channel^='module:']").textContent).toContain("✓");
    expect(api.calls.slice(before).filter((c) => /course|module/.test(c.path))).toEqual([]);
    const stored = JSON.parse(localStorage.getItem("holons-hangout:local-courses:v1"));
    expect(stored["http://api.test"].courses[0]).toMatchObject({ name: "Mine", holon_id: 7, local: true });
    expect(stored["http://api.test"].modules[0]).toMatchObject({ name: "Lesson 1", completed: true });
  });
});

describe("draggable column dividers", () => {
  it("renders separators, resizes a column by dragging and restores the saved width after a remount", async () => {
    const { container, dispose } = mountApp();
    await tick();
    const grid = container.querySelector(".shell");
    const handle = grid.querySelector(":scope > .grip");
    expect(handle.getAttribute("role")).toBe("separator");
    expect(grid.style.getPropertyValue("--grip-0")).toBe("300px");
    handle.dispatchEvent(new MouseEvent("pointerdown", { clientX: 100, bubbles: true }));
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: 150, bubbles: true }));
    document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
    expect(grid.style.getPropertyValue("--grip-0")).toBe("350px");
    const handleCount = grid.querySelectorAll(".grip").length;
    dispose();
    container.remove();
    // The mount helper clears storage first; keep the saved width for the remount.
    vi.spyOn(Storage.prototype, "clear").mockImplementation(() => {});
    const again = mountApp();
    await tick();
    const grid2 = again.container.querySelector(".shell");
    expect(grid2.style.getPropertyValue("--grip-0")).toBe("350px");
    expect(grid2.querySelectorAll(".grip").length).toBe(handleCount);
    vi.restoreAllMocks();
  });
});

describe("button colours", () => {
  it("gives every solid contrast or primary fill its own foreground token, and fixed dark panels their own text colour", () => {
    const { container } = mountApp();
    const css = container.querySelector("style").textContent;
    const rules = [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map(([, sel, body]) => ({ sel: sel.trim(), body }));
    const decl = (body, prop) => new RegExp(`(?:^|[;\\s])${prop}\\s*:\\s*([^;]+)`).exec(body)?.[1].trim();
    const darkHex = (v) => /^#[0-9a-f]{6}$/i.test(v || "") && [1, 3, 5].reduce((n, i) => n + parseInt(v.slice(i, i + 2), 16), 0) < 150;
    for (const { sel, body } of rules) {
      if (/::|\binput\b/.test(sel)) continue; // pseudo-element marks and switch tracks carry no text
      const bg = decl(body, "background");
      const color = decl(body, "color");
      if (bg === "var(--hh-contrast)") expect(color, sel).toBe("var(--hh-on-contrast)");
      if (bg === "var(--hh-primary)") expect(color, sel).toBe("var(--hh-on-primary)");
      if (darkHex(bg)) expect(color, sel).toMatch(/^#[0-9a-f]{3,6}$/i);
    }
  });
});

describe("page height", () => {
  it("fills the visible page on mount and follows window resizes", () => {
    const original = window.innerHeight;
    try {
      window.innerHeight = 900;
      const { container, dispose } = mountApp();
      const root = container.querySelector(".hh");
      expect(root.style.height).toBe("900px");
      window.innerHeight = 1100;
      window.dispatchEvent(new Event("resize"));
      expect(root.style.height).toBe("1100px");
      dispose();
    } finally {
      window.innerHeight = original;
    }
  });
});
