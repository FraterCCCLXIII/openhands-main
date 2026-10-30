import { afterEach, describe, expect, it, vi } from "vitest";
import { techRail, activate, cleanName, connectedGithubToken, fetchGithubPeople, parseGithubRef, signToken, httpUrl, probeLivekit, probeToken, probeMedia, startCommands, directRoom, inviteLink, inviteMessage, mailtoLink, mergeContacts, parseContacts, qrSvg, randomRoomCode, smsLink, decodeChat, encodeChat, gridColumns, initials } from "./extension.js";

function mountMeet(saved = {}) {
  localStorage.clear();
  localStorage.setItem("meet:v1", JSON.stringify(saved));
  let mountFn;
  activate({ apiVersion: "1", registerPage: (_id, fn) => { mountFn = fn; return () => {}; } });
  const container = document.createElement("div");
  document.body.append(container);
  return { container, dispose: mountFn({ container }) };
}
const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

function fakeLivekit() {
  const handlers = {};
  const local = { identity: "ada", isSpeaking: false, getTrackPublication: () => undefined, setMicrophoneEnabled: vi.fn(), setCameraEnabled: vi.fn(), setScreenShareEnabled: vi.fn(), publishData: vi.fn() };
  const room = { localParticipant: local, remoteParticipants: new Map(), connect: vi.fn(async () => {}), disconnect: vi.fn(), on: (ev, fn) => { handlers[ev] = fn; } };
  const names = ["ParticipantConnected", "ParticipantDisconnected", "TrackSubscribed", "TrackUnsubscribed", "TrackMuted", "TrackUnmuted", "LocalTrackPublished", "LocalTrackUnpublished", "ActiveSpeakersChanged", "DataReceived", "Disconnected"];
  const RoomEvent = Object.fromEntries(names.map((n) => [n, n]));
  return { room, handlers, lk: { Room: function () { return room; }, RoomEvent, Track: { Source: { Camera: "camera", Microphone: "microphone", ScreenShare: "screen_share" } } } };
}

afterEach(() => { delete globalThis.__meetLivekit; vi.unstubAllGlobals(); document.body.replaceChildren(); });

describe("helpers", () => {
  it("round-trips chat and ignores foreign data messages", () => {
    expect(decodeChat(encodeChat("hi there"))).toBe("hi there");
    expect(decodeChat(new TextEncoder().encode('{"t":"other"}'))).toBeNull();
    expect(decodeChat(new Uint8Array([1, 2, 3]))).toBeNull();
  });
  it("sizes the grid and cleans names", () => {
    expect([1, 2, 4, 5, 9, 40].map(gridColumns)).toEqual([1, 2, 2, 3, 3, 6]);
    expect(cleanName("  a<b>c/d  ")).toBe("abcd");
    expect(initials("Ada Lovelace Byron")).toBe("AL");
  });
});

describe("joining a meeting", () => {
  it("asks for a token, connects, shows the grid, and sends chat", async () => {
    const { room, handlers, lk } = fakeLivekit();
    globalThis.__meetLivekit = lk;
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ token: "jwt" }) }));
    vi.stubGlobal("fetch", fetchMock);
    const { container } = mountMeet({ tokenUrl: "http://127.0.0.1:7891/token" });
    const name = container.querySelector(".lobby input");
    name.value = "ada"; name.dispatchEvent(new Event("input"));
    container.querySelector("form").dispatchEvent(new Event("submit", { cancelable: true }));
    await tick(5);
    expect(fetchMock.mock.calls.map((c) => c[0]).find((u) => String(u).includes("identity="))).toContain("room=standup&identity=ada");
    expect(room.connect).toHaveBeenCalledWith("ws://127.0.0.1:7880", "jwt");
    expect(container.querySelectorAll(".tile")).toHaveLength(1);

    const input = container.querySelector(".chatform input");
    input.value = "hello"; input.dispatchEvent(new Event("input"));
    container.querySelector(".chatform").dispatchEvent(new Event("submit", { cancelable: true }));
    expect(room.localParticipant.publishData).toHaveBeenCalled();
    handlers.DataReceived(encodeChat("hey ada"), { identity: "grace" });
    expect(container.querySelector(".chatlog").textContent).toContain("grace: hey ada");

    container.querySelector(".leave").click();
    expect(room.disconnect).toHaveBeenCalled();
    expect(container.querySelector(".lobby")).not.toBeNull();
  });

  it("stays in the lobby with an error when the token endpoint fails", async () => {
    globalThis.__meetLivekit = fakeLivekit().lk;
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false, status: 500 })));
    const { container } = mountMeet({ tokenUrl: "http://127.0.0.1:7891/token" });
    const name = container.querySelector(".lobby input");
    name.value = "ada"; name.dispatchEvent(new Event("input"));
    container.querySelector("form").dispatchEvent(new Event("submit", { cancelable: true }));
    await tick(5);
    expect(container.querySelector(".err").textContent).toContain("500");
  });
});

describe("contacts and invites", () => {
  it("imports CSV and vCard, skipping people already in the book", () => {
    const csv = 'First Name,Last Name,E-mail 1 - Value,Phone 1 - Value\nAda,Lovelace,ada@x.org,+1 555 0100\n"Hopper, G",,grace@x.org,\n';
    const vcf = "BEGIN:VCARD\nFN:Linus T\nEMAIL;TYPE=work:linus@x.org\nTEL:555-0111\nEND:VCARD";
    expect(parseContacts(csv).map((c) => [c.name, c.email, c.phone])).toEqual([["Ada Lovelace", "ada@x.org", "+1 555 0100"], ["Hopper G", "grace@x.org", ""]]);
    expect(parseContacts(vcf)[0]).toMatchObject({ name: "Linus T", email: "linus@x.org", phone: "555-0111" });
    const first = mergeContacts([], parseContacts(csv));
    expect(mergeContacts(first.book, parseContacts(csv)).added).toBe(0);
  });

  it("builds one room for a pair and invite links that keep invitees private", () => {
    expect(directRoom("Ada", "Grace")).toBe(directRoom("grace", "ADA"));
    const link = inviteLink("https://app.test/meet?old=1#x", "team sync");
    expect(link).toBe("https://app.test/meet?room=team+sync");
    const msg = inviteMessage("Ada", "team sync", link);
    expect(mailtoLink(["a@x.org", "b@x.org"], msg)).toMatch(/^mailto:\?bcc=a%40x\.org,b%40x\.org&subject=/);
    expect(smsLink(["+1 (555) 010-0", "x"], msg)).toMatch(/^sms:\+15550100\?&body=/);
  });
});

describe("create room and share", () => {
  it("makes speakable room codes that pass the token server's name rules", () => {
    const code = randomRoomCode(() => 0.5);
    expect(code).toMatch(/^[a-z]+-[a-z]+-\d\d$/);
    expect(cleanName(code)).toBe(code);
  });

  it("draws a QR code from the encoder's modules, and gives up quietly when it cannot load", async () => {
    globalThis.__meetQr = () => ({ addData() {}, make() {}, getModuleCount: () => 2, isDark: (r, c) => r === c });
    const svg = await qrSvg("https://app.test/meet?room=x");
    expect(svg.querySelector("path").getAttribute("d")).toBe("M4 4h1v1h-1zM5 5h1v1h-1z");
    globalThis.__meetQr = () => { throw new Error("boom"); };
    expect(await qrSvg("x")).toBeNull();
    delete globalThis.__meetQr;
  });

  it("New room opens a lobby with a fresh code and the share panel open", () => {
    const { container } = mountMeet();
    container.querySelector(".navhead .mini").click();
    expect([...container.querySelectorAll(".lobby label")].find((l) => l.textContent.startsWith("Room")).querySelector("input").value).toMatch(/^[a-z]+-[a-z]+-\d\d$/);
    expect(container.querySelector(".invitebox")).not.toBeNull();
  });
});

describe("settings detection", () => {
  it("reports each service as up or down with a reason", async () => {
    expect(httpUrl("wss://lk.test:7880")).toBe("https://lk.test:7880");
    expect((await probeLivekit(async () => ({ type: "opaque" }), "ws://127.0.0.1:7880")).ok).toBe(true);
    expect((await probeLivekit(async () => { throw new TypeError("blocked"); }, "ws://127.0.0.1:7880")).ok).toBe(false);
    expect((await probeToken(async () => ({ ok: true, json: async () => ({ token: "t" }) }), "http://x/token")).ok).toBe(true);
    expect((await probeToken(async () => ({ ok: true, json: async () => ({}) }), "http://x/token")).ok).toBe(false);
    expect((await probeMedia({ mediaDevices: { enumerateDevices: async () => [{ kind: "videoinput" }, { kind: "audioinput" }] } })).ok).toBe(true);
    expect((await probeMedia({})).ok).toBe(false);
  });

  it("runs start commands in the configured folder and refuses without one", () => {
    expect(startCommands("/x/meet").token).toMatchObject({ command: "node token-server.mjs", cwd: "/x/meet" });
    expect(startCommands("").token.cwd).toBeUndefined();
  });

  it("opens the settings modal from the nav and closes it with Done", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("down"); }));
    const { container } = mountMeet();
    [...container.querySelectorAll(".navhead .mini")].find((b) => b.textContent === "Settings").click();
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    await tick(5);
    expect(container.querySelectorAll(".check .pres.bad").length).toBeGreaterThan(0);
    container.querySelector(".modalfoot .primary").click();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe("built-in dev tokens", () => {
  it("signs a LiveKit token that carries the room grant and verifies with the secret", async () => {
    const token = await signToken({ key: "devkey", secret: "secret", room: "standup", identity: "ada", now: 1_000_000 });
    const [head, body, sig] = token.split(".");
    const claims = JSON.parse(atob(body.replace(/-/g, "+").replace(/_/g, "/")));
    expect(claims).toMatchObject({ iss: "devkey", sub: "ada", video: { room: "standup", roomJoin: true } });
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode("secret"), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const expected = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${head}.${body}`)));
    expect(sig).toBe(btoa(String.fromCharCode(...expected)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, ""));
  });
});

describe("zero-setup join", () => {
  it("joins with a locally signed token when no token endpoint is set, and offers to start a down server", async () => {
    const { room, lk } = fakeLivekit();
    globalThis.__meetLivekit = lk;
    vi.stubGlobal("fetch", vi.fn(async () => { throw new TypeError("down"); }));
    const { container } = mountMeet();
    await tick(5);
    expect(container.querySelector(".lobby .check .mini").textContent).toBe("Start it");
    const name = container.querySelector(".lobby input");
    name.value = "ada"; name.dispatchEvent(new Event("input"));
    container.querySelector("form").dispatchEvent(new Event("submit", { cancelable: true }));
    await tick(20);
    expect(room.connect.mock.calls[0][1].split(".")).toHaveLength(3);
  });
});

describe("people from GitHub", () => {
  it("reads repo and PR references", () => {
    expect(parseGithubRef("OpenHands/OpenHands#12")).toEqual({ owner: "OpenHands", repo: "OpenHands", pr: 12 });
    expect(parseGithubRef("https://github.com/o/r/pull/7/files")).toEqual({ owner: "o", repo: "r", pr: 7 });
    expect(parseGithubRef("https://github.com/o/r")).toEqual({ owner: "o", repo: "r", pr: null });
    expect(parseGithubRef("nonsense")).toBeNull();
  });

  it("collects a PR's people once each, skipping bots, with their role", async () => {
    const data = {
      "/repos/o/r/pulls/7": { user: { login: "ada" }, requested_reviewers: [{ login: "grace" }] },
      "/repos/o/r/pulls/7/reviews?per_page=100": [{ user: { login: "grace" } }, { user: { login: "ci[bot]", type: "Bot" } }],
      "/repos/o/r/issues/7/comments?per_page=100": [{ user: { login: "linus" } }],
      "/repos/o/r/pulls/7/commits?per_page=100": [{ author: { login: "ada" } }],
      "/users/ada": { name: "Ada Lovelace", email: "ada@x.org" }, "/users/grace": {}, "/users/linus": { name: "Linus T" },
    };
    const fetchFn = async (url) => {
      const key = url.replace("https://api.github.com", "");
      return key in data ? { ok: true, json: async () => data[key] } : { ok: false, status: 404 };
    };
    const people = await fetchGithubPeople(fetchFn, { owner: "o", repo: "r", pr: 7 });
    expect(people.map((p) => [p.github, p.name, p.note])).toEqual([["ada", "Ada Lovelace", "PR author"], ["grace", "grace", "Requested reviewer"], ["linus", "Linus T", "Commenter"]]);
    await expect(fetchGithubPeople(async () => ({ ok: false, status: 404 }), { owner: "o", repo: "x", pr: null })).rejects.toThrow(/private repos need a token/);
  });
});

describe("connected GitHub", () => {
  it("reads the token OpenHands holds, and falls back to public data without one", async () => {
    const withToken = async ({ path }) => (path.endsWith("/secrets") ? { secrets: [{ name: "OTHER" }, { name: "GITHUB_TOKEN" }] } : "ghp_abc\n");
    expect(await connectedGithubToken(withToken)).toBe("ghp_abc");
    expect(await connectedGithubToken(async () => ({ secrets: [{ name: "OTHER" }] }))).toBe("");
    expect(await connectedGithubToken(async () => { throw new Error("401"); })).toBe("");
  });
});

describe("built-with rail", () => {
  it("links each technology by name, and falls back to a letter when its logo cannot load", () => {
    const rail = techRail(["webrtc", "nostr", "unknown"]);
    const links = [...rail.querySelectorAll("a.tech")];
    expect(links.map((a) => a.title)).toEqual(["WebRTC", "Nostr"]);
    expect(links.every((a) => a.rel.includes("noopener"))).toBe(true);
    expect(links[1].textContent).toBe("N");
    links[0].querySelector("img").dispatchEvent(new Event("error"));
    expect(links[0].querySelector("img")).toBeNull();
    expect(links[0].textContent).toBe("W");
  });
});
