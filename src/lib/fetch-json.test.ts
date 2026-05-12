// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchJson } from "@/src/lib/fetch-json";

describe("fetchJson", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    delete window.__INTEGRATIONS_HUB_OWNER_ID__;
  });

  it("adds the signed-in owner header to same-origin API requests", async () => {
    window.__INTEGRATIONS_HUB_OWNER_ID__ = "user@example.com";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(fetchJson("/api/integrations")).resolves.toEqual({ ok: true });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(new Headers(init?.headers).get("X-Owner-Id")).toBe("user@example.com");
  });

  it("does not add owner headers to external URLs", async () => {
    window.__INTEGRATIONS_HUB_OWNER_ID__ = "user@example.com";
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      }),
    );

    await fetchJson("https://example.com/api/integrations");

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(new Headers(init?.headers).has("X-Owner-Id")).toBe(false);
  });
});
