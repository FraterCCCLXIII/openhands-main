export class DeviceFlowError extends Error {
  constructor(
    message: string,
    public readonly code?: string,
  ) {
    super(message);
    this.name = "DeviceFlowError";
  }
}

export interface DeviceAuthorizationResponse {
  device_code: string;
  user_code: string;
  verification_uri: string;
  verification_uri_complete: string;
  expires_in: number;
  interval: number;
}

interface DeviceTokenResponse {
  access_token: string;
}

const DEFAULT_TIMEOUT_MS = 10 * 60 * 1000;
const MAX_POLL_INTERVAL_MS = 30 * 1000;

export function isOpenHandsCloudHost(host: string): boolean {
  try {
    const trimmed = host.trim().toLowerCase();
    const withProtocol = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    const hostname = new URL(withProtocol).hostname;
    return (
      hostname === "all-hands.dev" ||
      hostname.endsWith(".all-hands.dev") ||
      hostname === "openhands.dev" ||
      hostname.endsWith(".openhands.dev")
    );
  } catch {
    return false;
  }
}

function normalizeCloudUrl(value: string): string {
  const trimmed = value.trim().replace(/\/+$/, "");
  if (!trimmed) throw new DeviceFlowError("OpenHands Cloud URL is not configured.");
  const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  if (!isOpenHandsCloudHost(normalized)) {
    throw new DeviceFlowError("OpenHands Cloud URL must be an OpenHands Cloud host.");
  }
  return normalized;
}

async function requestJson<T>(
  cloudUrl: string,
  path: string,
  init: RequestInit,
): Promise<T> {
  const response = await fetch(`${normalizeCloudUrl(cloudUrl)}${path}`, init);
  const body = (await response.json().catch(() => null)) as T | null;
  if (!response.ok || body === null) {
    throw new DeviceFlowError(`OpenHands Cloud returned ${response.status}.`);
  }
  return body;
}

export async function fetchAuthConfig(): Promise<{ openhandsBaseUrl: string }> {
  const response = await fetch("/api/auth/config", {
    method: "GET",
    credentials: "same-origin",
  });
  const body = (await response.json().catch(() => null)) as
    | { openhandsBaseUrl?: string }
    | null;
  if (!response.ok || !body?.openhandsBaseUrl) {
    throw new DeviceFlowError("OpenHands Cloud URL is not configured.");
  }
  return { openhandsBaseUrl: body.openhandsBaseUrl };
}

export async function startDeviceFlow(
  cloudUrl: string,
): Promise<DeviceAuthorizationResponse> {
  const data = await requestJson<Partial<DeviceAuthorizationResponse>>(
    cloudUrl,
    "/oauth/device/authorize",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    },
  );

  if (!data.device_code || !data.user_code || !data.verification_uri) {
    throw new DeviceFlowError("OpenHands Cloud returned an invalid device code.");
  }

  return {
    device_code: data.device_code,
    user_code: data.user_code,
    verification_uri: data.verification_uri,
    verification_uri_complete:
      data.verification_uri_complete ??
      `${data.verification_uri}?user_code=${encodeURIComponent(data.user_code)}`,
    expires_in: data.expires_in ?? 600,
    interval: data.interval ?? 5,
  };
}

export async function pollForDeviceToken(
  cloudUrl: string,
  deviceCode: string,
  options: { interval: number; signal?: AbortSignal; timeoutMs?: number },
): Promise<string> {
  const startedAt = Date.now();
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let intervalMs = Math.max(1, options.interval) * 1000;

  while (Date.now() - startedAt < timeoutMs) {
    if (options.signal?.aborted) {
      throw new DeviceFlowError("Authorization cancelled.", "cancelled");
    }

    await new Promise((resolve) => setTimeout(resolve, intervalMs));

    const body = new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:device_code",
      device_code: deviceCode,
    });

    const response = await fetch(`${normalizeCloudUrl(cloudUrl)}/oauth/device/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      signal: options.signal,
    });

    const data = (await response.json().catch(() => null)) as
      | Partial<DeviceTokenResponse> & { error?: string; interval?: number }
      | null;

    if (response.ok && data?.access_token) return data.access_token;

    if (data?.error === "authorization_pending") continue;
    if (data?.error === "slow_down") {
      intervalMs =
        typeof data.interval === "number" &&
        Number.isFinite(data.interval) &&
        data.interval > 0
          ? Math.min(data.interval * 1000, MAX_POLL_INTERVAL_MS)
          : Math.min(intervalMs + 5000, MAX_POLL_INTERVAL_MS);
      continue;
    }
    if (data?.error === "expired_token") {
      throw new DeviceFlowError("The device code expired. Please try again.");
    }
    if (data?.error === "access_denied") {
      throw new DeviceFlowError("Authorization was denied.");
    }
    throw new DeviceFlowError(data?.error ?? "Authorization failed.");
  }

  throw new DeviceFlowError("Authorization timed out. Please try again.");
}
