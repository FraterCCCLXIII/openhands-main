import { describe, expect, it, vi } from "vitest";
import {
  detectLocalBackends,
  localBackendCandidatePorts,
} from "#/api/detect-local-backends";

const json = (body: unknown, ok = true, status = ok ? 200 : 404) =>
  Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(body),
  } as Response);

/** A fetch where each port behaves as the map says; anything else is closed. */
const fakeFetch = (
  ports: Record<
    number,
    "agent" | "agent-open" | "other" | "blocked" | "no-info"
  >,
) =>
  vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
    const url = new URL(String(input));
    const behavior = ports[Number(url.port)];
    if (!behavior) return Promise.reject(new TypeError("refused"));
    if (init?.mode === "no-cors") return Promise.resolve({} as Response);
    if (behavior === "blocked") return Promise.reject(new TypeError("cors"));
    if (behavior === "other") return json({}, false);
    if (behavior === "no-info") return json({ hello: "world" });
    if (url.pathname === "/api/settings") {
      return behavior === "agent-open" ? json({}) : json({}, false, 401);
    }
    return json({ version: "1.30.0", sdk_version: "1.30.0" });
  }) as unknown as typeof fetch;

describe("detectLocalBackends", () => {
  it("lists agent servers first, then listeners it cannot identify", async () => {
    const found = await detectLocalBackends({
      ports: [8000, 8001, 8002, 8003, 18000],
      fetchFn: fakeFetch({
        8000: "agent",
        8001: "blocked",
        8002: "other",
        8003: "no-info",
      }),
    });

    expect(found.map((b) => [b.host, b.identified])).toEqual([
      ["http://localhost:8000", true],
      ["http://localhost:8001", false],
    ]);
    expect(found[0].version).toBe("1.30.0");
  });

  it("says whether a server needs an API key", async () => {
    const found = await detectLocalBackends({
      ports: [8000, 8001],
      fetchFn: fakeFetch({ 8000: "agent", 8001: "agent-open" }),
    });

    expect(found.map((b) => [b.port, b.requiresApiKey])).toEqual([
      [8000, true],
      [8001, false],
    ]);
  });

  it("returns nothing when no port answers", async () => {
    expect(
      await detectLocalBackends({ ports: [8000], fetchFn: fakeFetch({}) }),
    ).toEqual([]);
  });

  it("probes the default proxy and agent server ports, never the page's own", () => {
    const ports = localBackendCandidatePorts(8001);
    expect(ports).toContain(8000);
    expect(ports).toContain(18000);
    expect(ports).not.toContain(8001);
  });
});
