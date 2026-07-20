// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import { fetchJson } from "@/src/lib/fetch-json";

describe("fetchJson", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("uses same-origin credentials for internal API requests", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      }),
    );

    await expect(fetchJson("/api/integrations")).resolves.toEqual({ ok: true });

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.credentials).toBe("same-origin");
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  });

  it("does not add auth options to external URLs", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json" },
      }),
    );

    await fetchJson("https://example.com/api/integrations");

    const [, init] = fetchMock.mock.calls[0] ?? [];
    expect(init?.credentials).toBeUndefined();
    expect(new Headers(init?.headers).has("Authorization")).toBe(false);
  });
});
