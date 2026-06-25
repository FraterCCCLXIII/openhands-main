// @vitest-environment jsdom

import { afterEach, describe, expect, it, vi } from "vitest";

import {
  DeviceFlowError,
  fetchAuthConfig,
  isOpenHandsCloudHost,
  pollForDeviceToken,
  startDeviceFlow,
} from "@/src/lib/cloud-device-flow";

describe("cloud device flow", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("loads the OpenHands Cloud URL from FastAPI auth config", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({ openhandsBaseUrl: "https://staging.all-hands.dev" }),
    );

    await expect(fetchAuthConfig()).resolves.toEqual({
      openhandsBaseUrl: "https://staging.all-hands.dev",
    });
    expect(fetchMock).toHaveBeenCalledWith("/api/auth/config", {
      method: "GET",
      credentials: "same-origin",
    });
  });

  it("recognizes OpenHands Cloud hosts without substring matching", () => {
    expect(isOpenHandsCloudHost("https://staging.all-hands.dev")).toBe(true);
    expect(isOpenHandsCloudHost("app.all-hands.dev")).toBe(true);
    expect(isOpenHandsCloudHost("https://app.openhands.dev")).toBe(true);
    expect(isOpenHandsCloudHost("https://all-hands.dev.evil.example")).toBe(false);
    expect(isOpenHandsCloudHost("https://example.com")).toBe(false);
  });

  it("starts device flow against the configured cloud host", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      Response.json({
        device_code: "device-code",
        user_code: "USER-CODE",
        verification_uri: "https://staging.all-hands.dev/device",
        expires_in: 600,
        interval: 1,
      }),
    );

    await expect(startDeviceFlow("https://staging.all-hands.dev/")).resolves.toMatchObject({
      device_code: "device-code",
      user_code: "USER-CODE",
      verification_uri_complete: "https://staging.all-hands.dev/device?user_code=USER-CODE",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://staging.all-hands.dev/oauth/device/authorize",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("polls until OpenHands Cloud returns an access token", async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        Response.json({ error: "authorization_pending" }, { status: 400 }),
      )
      .mockResolvedValueOnce(
        Response.json({ access_token: "oh-token", token_type: "Bearer" }),
      );

    const tokenPromise = pollForDeviceToken("https://staging.all-hands.dev", "device-code", {
      interval: 1,
      timeoutMs: 5_000,
    });

    await vi.advanceTimersByTimeAsync(1_000);
    await vi.advanceTimersByTimeAsync(1_000);

    await expect(tokenPromise).resolves.toBe("oh-token");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0]?.[0]).toBe(
      "https://staging.all-hands.dev/oauth/device/token",
    );
    vi.useRealTimers();
  });

  it("rejects non-OpenHands hosts", async () => {
    await expect(startDeviceFlow("https://evil.example")).rejects.toBeInstanceOf(
      DeviceFlowError,
    );
  });
});
