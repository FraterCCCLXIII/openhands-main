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
    expect(container.querySelector(".welcome").textContent).toContain("Powered by");
    expect(container.querySelectorAll(".rail [data-holon]")).toHaveLength(3);
    container.querySelector(".rail [data-holon='1']").click();
    await tick(10);
    expect(container.querySelector(".mhead h3").textContent).toBe("Open Source Academy / feed");
    expect(container.querySelector(".msg").textContent).toContain("Welcome to Open Source Academy");
    expect(container.querySelectorAll(".member")).toHaveLength(5);
    expect(container.querySelector(".member .avatar svg")).not.toBeNull();
    expect(container.querySelector(".lpowered").textContent).toContain("Kamiji");
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
