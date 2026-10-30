import { afterEach, describe, expect, it, vi } from "vitest";
import { techRail, activate, cleanName, connectedGithubToken, fetchGithubPeople, parseGithubRef, signToken, httpUrl, probeLivekit, probeToken, probeMedia, startCommands, directRoom, inviteLink, inviteMessage, mailtoLink, mergeContacts, parseContacts, qrSvg, randomRoomCode, smsLink, decodeChat, encodeChat, gridColumns, initials, DEMO_PEOPLE, DEMO_NAMES, participantInfo, miniAppScreen, DEMO_SCRIPT, agentReply, speechSupport, isLocalOnly, shareBaseUrl, kamijiHue, parseInvite, lobbyWarnings } from "./extension.js";

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

describe("sharing", () => {
  it("flags links that only work on this computer and honours a public address", () => {
    expect(isLocalOnly("http://localhost:8000/x")).toBe(true);
    expect(isLocalOnly("http://127.0.0.1:8000/")).toBe(true);
    expect(isLocalOnly("https://meet.example.com/")).toBe(false);
    const base = shareBaseUrl("meet.example.com", "http://localhost:8000/x");
    expect(inviteLink(base, "standup")).toBe("https://meet.example.com/?room=standup");
    expect(shareBaseUrl("", "http://localhost:8000/x")).toBe("http://localhost:8000/x");
  });
});

describe("people and agents", () => {
  it("tells agents from humans and reads role and model", () => {
    expect(participantInfo({ metadata: JSON.stringify({ kind: "agent", role: "Reviewer", model: "Claude" }) })).toEqual({ kind: "agent", role: "Reviewer", model: "Claude" });
    expect(participantInfo({ kind: 4 }).kind).toBe("agent");
    expect(participantInfo({ metadata: "not json" })).toEqual({ kind: "human", role: "", model: "" });
  });
  it("marks both humans and agents in the demo", () => {
    expect(new Set(DEMO_PEOPLE.map((p) => p.kind))).toEqual(new Set(["human", "agent"]));
    expect(DEMO_PEOPLE.filter((p) => p.kind === "agent").every((p) => p.model)).toBe(true);
  });
});

describe("shared screen demo", () => {
  it("draws a miniature app with a chat and a diff", () => {
    const screen = miniAppScreen();
    expect(screen.querySelector(".machat")).not.toBeNull();
    expect(screen.querySelectorAll(".madiff .add").length).toBeGreaterThan(0);
  });
});

describe("kamiji avatars", () => {
  it("gives each name a stable colour that differs between people", () => {
    expect(kamijiHue("Ada")).toBe(kamijiHue("Ada"));
    expect(kamijiHue("Ada")).not.toBe(kamijiHue("Grace"));
  });
});

describe("agent", () => {
  it("replies to what it heard and stays quiet on silence", () => {
    expect(agentReply("")).toBe("");
    expect(agentReply("hello there")).toMatch(/listening/);
    expect(agentReply("ship it")).toBe("Got it: ship it");
  });
  it("reports which speech features a window offers", () => {
    expect(speechSupport({})).toEqual({ listen: false, speak: false });
    expect(speechSupport({ webkitSpeechRecognition: class {}, speechSynthesis: {}, SpeechSynthesisUtterance: class {} })).toEqual({ listen: true, speak: true });
  });
});

describe("demo", () => {
  it("scripts a call from the demo people only", () => {
    const speakers = DEMO_SCRIPT.filter((m) => m.from).map((m) => m.from);
    expect(speakers.every((n) => DEMO_NAMES.includes(n))).toBe(true);
  });
});

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
    container.querySelector(".navhead .newroom").click();
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
    container.querySelector(".navhead [aria-label=\"Settings\"]").click();
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

describe("add contacts modal", () => {
  const open = (container) => container.querySelector('.navhead [aria-label="Add contacts"]').click();
  const type = (input, value) => { input.value = value; input.dispatchEvent(new Event("input", { bubbles: true })); };

  it("opens from the rail, adds one person, and shows them in the list", () => {
    const { container } = mountMeet();
    open(container);
    const dialog = container.querySelector('[role="dialog"][aria-label="Add contacts"]');
    expect([...dialog.querySelectorAll(".sharetabs button")].map((b) => b.textContent)).toEqual(["Person", "Bulk import"]);
    const [name, email] = dialog.querySelectorAll("input");
    type(name, "Grace Hopper");
    type(email, "grace@example.com");
    [...dialog.querySelectorAll("button")].find((b) => b.textContent === "Add contact").click();
    expect(container.querySelector('[role="dialog"]').textContent).toContain("Added Grace Hopper.");
    expect(container.querySelector(".nav").textContent).toContain("Grace Hopper");
  });

  it("imports many people from pasted vCards on the Bulk import tab", () => {
    const { container } = mountMeet();
    open(container);
    [...container.querySelectorAll(".sharetabs button")].find((b) => b.textContent === "Bulk import").click();
    const area = container.querySelector(".importbox textarea");
    type(area, "BEGIN:VCARD\nVERSION:3.0\nFN:Ada Lovelace\nEMAIL:ada@example.com\nEND:VCARD\nBEGIN:VCARD\nVERSION:3.0\nFN:Alan Turing\nEMAIL:alan@example.com\nEND:VCARD\n");
    [...container.querySelectorAll(".importbox button")].find((b) => b.textContent === "Import").click();
    expect(container.querySelector('[role="dialog"]').textContent).toContain("Added 2 of 2");
    expect(container.querySelector(".nav").textContent).toContain("Alan Turing");
  });

  it("closes with Done", () => {
    const { container } = mountMeet();
    open(container);
    [...container.querySelectorAll(".modalfoot button")].find((b) => b.textContent === "Done").click();
    expect(container.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe("resizable columns", () => {
  const drag = (handle, from, to) => {
    handle.dispatchEvent(new MouseEvent("pointerdown", { clientX: from, bubbles: true }));
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: to, bubbles: true }));
    document.dispatchEvent(new MouseEvent("pointerup", { bubbles: true }));
  };
  const remount = () => {
    let mountFn;
    activate({ apiVersion: "1", registerPage: (_id, fn) => { mountFn = fn; return () => {}; } });
    const container = document.createElement("div");
    document.body.append(container);
    return { container, dispose: mountFn({ container }) };
  };

  it("drags the contacts edge, keeps one handle across renders, and restores the width on remount", () => {
    const { container, dispose } = mountMeet();
    const root = container.querySelector(".mt");
    const handle = root.querySelector(".grip");
    expect(handle.getAttribute("role")).toBe("separator");

    drag(handle, 260, 300);
    expect(root.style.getPropertyValue("--grip-0")).toBe("300px");

    container.querySelector('.navhead [aria-label="Settings"]').click();
    expect(container.querySelectorAll(".mt > .grip").length).toBe(1);
    dispose();

    const again = remount();
    expect(again.container.querySelector(".mt").style.getPropertyValue("--grip-0")).toBe("300px");
    again.dispose();
  });

  it("also lets the in-call chat column be dragged", () => {
    const { container, dispose } = mountMeet();
    [...container.querySelectorAll("button")].find((b) => b.textContent.includes("Preview the UI")).click();
    const meeting = container.querySelector(".meeting");
    const handle = meeting.querySelector(".grip");
    expect(handle.getAttribute("role")).toBe("separator");

    drag(handle, 600, 560);
    expect(meeting.style.getPropertyValue("--grip-0")).toBe("340px");
    dispose();
  });
});

describe("remote invites", () => {
  const remote = { serverUrl: "wss://lk.example.com", tokenUrl: "https://tok.example.com/token" };
  afterEach(() => history.replaceState({}, "", "/"));

  it("carries a remote server and token endpoint in the link, and parses them back", () => {
    const link = inviteLink("https://app.test/meet", "team", remote);
    expect(parseInvite(new URL(link).search)).toEqual({ room: "team", serverUrl: "wss://lk.example.com/", tokenUrl: "https://tok.example.com/token" });
  });

  it("leaves local-only and invalid servers out of the link", () => {
    expect(inviteLink("https://app.test/", "r", { serverUrl: "ws://127.0.0.1:7880", tokenUrl: "http://localhost:7891/token" })).toBe("https://app.test/?room=r");
    expect(inviteLink("https://app.test/", "r", { serverUrl: "javascript:alert(1)", tokenUrl: "file:///etc/passwd" })).toBe("https://app.test/?room=r");
    expect(inviteLink("https://app.test/", "r", { serverUrl: "wss://k:secret@lk.example.com", tokenUrl: "" })).toBe("https://app.test/?room=r");
  });

  it("ignores unsafe schemes when reading a link", () => {
    expect(parseInvite("?room=r&lk=javascript:alert(1)&tok=file:///x")).toEqual({ room: "r", serverUrl: "", tokenUrl: "" });
    expect(parseInvite("?room=r&lk=https://a.test&tok=wss://a.test")).toEqual({ room: "r", serverUrl: "", tokenUrl: "" });
  });

  it("pre-fills the lobby from the link and saves nothing until Join", async () => {
    history.replaceState({}, "", "/?room=team&lk=wss%3A%2F%2Flk.example.com&tok=https%3A%2F%2Ftok.example.com%2Ftoken");
    globalThis.__meetLivekit = fakeLivekit().lk;
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ token: "jwt" }) })));
    const { container } = mountMeet({ serverUrl: "ws://127.0.0.1:7880" });
    const val = (label) => [...container.querySelectorAll(".lobby label")].find((l) => l.textContent.startsWith(label)).querySelector("input").value;
    expect(val("Room")).toBe("team");
    expect(val("LiveKit server")).toBe("wss://lk.example.com/");
    expect(val("Token endpoint")).toBe("https://tok.example.com/token");
    expect(container.textContent).toContain("Server settings came from the invite link.");
    expect(container.textContent).toContain("You were invited");
    expect(JSON.parse(localStorage.getItem("meet:v1")).serverUrl).toBe("ws://127.0.0.1:7880");
    const name = container.querySelector(".lobby input");
    name.value = "ada"; name.dispatchEvent(new Event("input"));
    container.querySelector("form").dispatchEvent(new Event("submit", { cancelable: true }));
    await tick(5);
    expect(JSON.parse(localStorage.getItem("meet:v1")).serverUrl).toBe("wss://lk.example.com/");
  });
});

describe("lobby warnings", () => {
  it("warns that an https page cannot use ws://", () => {
    expect(lobbyWarnings({ pageUrl: "https://meet.example.com/", serverUrl: "ws://lk.example.com:7880", tokenUrl: "https://t.example.com" })).toEqual(["This page is https, so the browser will block ws://. Use a wss:// server."]);
    expect(lobbyWarnings({ pageUrl: "https://meet.example.com/", serverUrl: "ws://localhost:7880", tokenUrl: "x" })).not.toContain("This page is https, so the browser will block ws://. Use a wss:// server.");
  });

  it("warns that camera and microphone need https or localhost", () => {
    expect(lobbyWarnings({ pageUrl: "http://192.168.1.5:8000/", serverUrl: "wss://lk.example.com", tokenUrl: "https://t.example.com" })).toEqual(["Camera and microphone need https or localhost."]);
    expect(lobbyWarnings({ pageUrl: "http://localhost:8000/", serverUrl: "wss://lk.example.com", tokenUrl: "https://t.example.com" })).toEqual([]);
  });

  it("tells a remote invitee that the default server is their own computer", () => {
    expect(lobbyWarnings({ pageUrl: "https://meet.example.com/", serverUrl: "ws://127.0.0.1:7880" })).toEqual(["This points at your own computer. Ask the host for their LiveKit server and token endpoint, or open their invite link."]);
    expect(lobbyWarnings({ pageUrl: "http://localhost:8000/", serverUrl: "ws://127.0.0.1:7880" })).toEqual([]);
  });

  it("is honest about browser-signed tokens for a non-local server", () => {
    const msg = "No token endpoint: the browser will sign its own token with the key in Settings. Use a token endpoint for anything other than local testing.";
    expect(lobbyWarnings({ pageUrl: "https://meet.example.com/", serverUrl: "wss://lk.example.com", tokenUrl: "" })).toEqual([msg]);
    expect(lobbyWarnings({ pageUrl: "http://localhost:8000/", serverUrl: "ws://127.0.0.1:7880", tokenUrl: "" })).toEqual([]);
  });
});

describe("meeting header", () => {
  it("updates the people count when someone joins or leaves", async () => {
    const { room, handlers, lk } = fakeLivekit();
    globalThis.__meetLivekit = lk;
    vi.stubGlobal("fetch", vi.fn(async () => ({ ok: true, json: async () => ({ token: "jwt" }) })));
    const { container } = mountMeet({ tokenUrl: "http://127.0.0.1:7891/token" });
    const name = container.querySelector(".lobby input");
    name.value = "ada"; name.dispatchEvent(new Event("input"));
    container.querySelector("form").dispatchEvent(new Event("submit", { cancelable: true }));
    await tick(5);
    expect(container.querySelector(".mhead small").textContent).toBe("1 person · ada");
    room.remoteParticipants.set("grace", { identity: "grace", isSpeaking: false, getTrackPublication: () => undefined });
    handlers.ParticipantConnected();
    expect(container.querySelector(".mhead small").textContent).toBe("2 people · ada");
    room.remoteParticipants.delete("grace");
    handlers.ParticipantDisconnected();
    expect(container.querySelector(".mhead small").textContent).toBe("1 person · ada");
  });
});

// --- text/background legibility of solid buttons, resolved through the real cascade ---
// The host's own tokens for dark and light (src/tailwind.css, light-plus.ts); jsdom resolves the
// cascade but not var(), so chains are followed by hand.
const HOST_THEMES = {
  dark: { "--oh-contrast": "#ffffff", "--oh-contrast-foreground": "#000000", "--oh-color-base": "#0b0e14", "--oh-color-base-secondary": "#21252f", "--oh-foreground": "#eef2f7", "--oh-muted": "#a3b0c4", "--oh-border-subtle": "#383f50", "--oh-danger": "#e76a5e" },
  "inverted-page": { "--oh-contrast": "#ffffff", "--oh-contrast-foreground": "#000000", "--oh-color-base": "#ffffff", "--oh-color-base-secondary": "#eeeeee", "--oh-foreground": "#111111", "--oh-muted": "#555555", "--oh-border-subtle": "#cccccc", "--oh-danger": "#c12a1c" },
  light: { "--oh-contrast": "#1f1f1f", "--oh-contrast-foreground": "#ffffff", "--oh-color-base": "#ffffff", "--oh-color-base-secondary": "#f3f3f3", "--oh-foreground": "#1f1f1f", "--oh-muted": "#616161", "--oh-border-subtle": "#d1d1d1", "--oh-danger": "#c12a1c" },
};
function resolveVars(el, value, depth = 0) {
  return value.replace(/var\(\s*(--[\w-]+)\s*(?:,\s*([^()]*))?\)/g, (_m, name, fallback) => {
    let v = "";
    for (let e = el; e && !v; e = e.parentElement) v = getComputedStyle(e).getPropertyValue(name).trim();
    v = v || (fallback || "").trim();
    return depth < 10 ? resolveVars(el, v, depth + 1) : v;
  });
}
function luminance(css) {
  const rgb = css.match(/rgba?\(([^)]+)\)/);
  const parts = rgb ? rgb[1].split(",").map((n) => parseFloat(n) / 255)
    : (() => { const h = css.replace("#", "").replace(/^(.)(.)(.)$/, "$1$1$2$2$3$3"); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); })();
  const [r, g, bl] = parts.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
}
function contrastRatio(el) {
  const cs = getComputedStyle(el);
  const color = resolveVars(el, cs.color).trim();
  const background = resolveVars(el, cs.backgroundColor !== "rgba(0, 0, 0, 0)" ? cs.backgroundColor : cs.getPropertyValue("background")).trim();
  const [a, b] = [luminance(color), luminance(background)];
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}
const useHostTheme = (name) => Object.entries(HOST_THEMES[name]).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));

describe("solid button legibility", () => {
  afterEach(() => { document.documentElement.removeAttribute("style"); });

  it.each(["dark", "light", "inverted-page"])("keeps contrast, danger and agent fills readable in the %s host theme", (theme) => {
    useHostTheme(theme);
    const { container, dispose } = mountMeet();
    const root = container.querySelector(".mt");
    // controls that only exist inside a call are probed with the same classes the call view gives them
    const probe = (html) => { const w = document.createElement("div"); w.innerHTML = html; root.append(w); return w.firstElementChild; };
    const solid = [
      ...container.querySelectorAll(".newroom, .primary"),
      probe('<button class="ctl leave">Leave</button>'),
      probe('<button class="ctl" aria-pressed="false">Mic</button>'),
      probe('<div class="views"><button class="ctl" aria-pressed="true">Grid</button></div>').firstElementChild,
      probe('<div class="tile"><span class="badge agent">Agent</span></div>').firstElementChild,
    ];
    expect(solid.length).toBeGreaterThan(4);
    for (const b of solid) expect(contrastRatio(b), b.textContent).toBeGreaterThanOrEqual(4.5);
    dispose();
  });
});

describe("page height", () => {
  it("fills the visible page on mount and follows window resizes", () => {
    const original = window.innerHeight;
    try {
      window.innerHeight = 900;
      const { container, dispose } = mountMeet();
      const root = container.querySelector(".mt");
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
