// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { clearStoredOpenHandsToken, setStoredOpenHandsToken } from "@/src/lib/cloud-auth-storage";
import { fetchJson } from "@/src/lib/fetch-json";

describe("fetchJson", () => {
  afterEach(() => {
    clearStoredOpenHandsToken();
    vi.restoreAllMocks();
  });

  it("adds the OpenHands bearer token to same-origin API requests", async () => {
    setStoredOpenHandsToken("oh-token");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(fetchJson("/api/integrations")).resolves.toEqual({ ok: true });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(new Headers(init?.headers).get("Authorization")).toBe("Bearer oh-token");
  });

  it("does not add auth headers to external URLs", async () => {
    setStoredOpenHandsToken("oh-token");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      }),
    );

    await fetchJson("https://example.com/api/integrations");

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  });
});
