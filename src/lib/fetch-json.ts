import { getStoredOpenHandsToken } from "@/src/lib/cloud-auth-storage";

export type ApiDebugDetails = Record<string, unknown>;

export function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const nextInit: RequestInit = { ...init };

  if (typeof input === "string" && input.startsWith("/api/")) {
    const token = getStoredOpenHandsToken();
    if (token) {
      const headers = new Headers(init?.headers);
      headers.set("Authorization", `Bearer ${token}`);
      nextInit.headers = headers;
    }
  }

  return fetch(input, nextInit);
}

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
  const response = await apiFetch(input, init);

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
