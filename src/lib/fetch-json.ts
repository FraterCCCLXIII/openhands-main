export type ApiDebugDetails = Record<string, unknown>;

declare global {
  interface Window {
    __INTEGRATIONS_HUB_OWNER_ID__?: string;
  }
}

const withOwnerHeader = (input: RequestInfo, init?: RequestInit): RequestInit | undefined => {
  if (typeof window === "undefined" || typeof input !== "string" || !input.startsWith("/api/")) {
    return init;
  }

  const ownerId = window.__INTEGRATIONS_HUB_OWNER_ID__;
  if (!ownerId) {
    return init;
  }

  const headers = new Headers(init?.headers);
  headers.set("X-Owner-Id", ownerId);
  return { ...init, headers };
};

export class ApiRequestError extends Error {
  public readonly debugDetails?: ApiDebugDetails;

  constructor(message: string, debugDetails?: ApiDebugDetails) {
    super(message);
    this.name = "ApiRequestError";
    this.debugDetails = debugDetails;
  }
}

export const fetchJson = async <T,>(
  input: RequestInfo,
  init?: RequestInit,
): Promise<T> => {
  const response = await fetch(input, withOwnerHeader(input, init));

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string;
      debug?: ApiDebugDetails;
    } | null;
    throw new ApiRequestError(
      body?.detail ?? `Request failed with status ${response.status}`,
      body?.debug,
    );
  }

  return (await response.json()) as T;
};
