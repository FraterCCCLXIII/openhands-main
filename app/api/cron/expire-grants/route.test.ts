import { afterEach, describe, expect, it, vi } from "vitest";

import { GET } from "./route";

const purgeExpiredGrantsMock = vi.fn<() => Promise<number>>();

const setRuntimeService = () => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerService?: unknown;
  };
  runtime.contextLayerService = {
    purgeExpiredGrants: purgeExpiredGrantsMock,
  };
};

const resetRuntime = () => {
  const runtime = globalThis as typeof globalThis & {
    contextLayerService?: unknown;
  };
  delete runtime.contextLayerService;
};

afterEach(() => {
  purgeExpiredGrantsMock.mockReset();
  vi.unstubAllEnvs();
  resetRuntime();
});

describe("GET /api/cron/expire-grants", () => {
  it("fails closed when CRON_SECRET is missing", async () => {
    setRuntimeService();

    const response = await GET(
      new Request("https://context-layer.example.com/api/cron/expire-grants"),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toMatchObject({
      detail: "CRON_SECRET must be configured for the expire-grants cron route.",
    });
    expect(purgeExpiredGrantsMock).not.toHaveBeenCalled();
  });

  it("rejects requests without the expected bearer token", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");
    setRuntimeService();

    const response = await GET(
      new Request("https://context-layer.example.com/api/cron/expire-grants", {
        headers: {
          authorization: "Bearer wrong-secret",
        },
      }),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ detail: "Unauthorized" });
    expect(purgeExpiredGrantsMock).not.toHaveBeenCalled();
  });

  it("purges expired grants when the bearer token matches", async () => {
    vi.stubEnv("CRON_SECRET", "cron-secret");
    purgeExpiredGrantsMock.mockResolvedValue(3);
    setRuntimeService();

    const response = await GET(
      new Request("https://context-layer.example.com/api/cron/expire-grants", {
        headers: {
          authorization: "Bearer cron-secret",
        },
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ purged: 3 });
    expect(purgeExpiredGrantsMock).toHaveBeenCalledTimes(1);
  });
});
