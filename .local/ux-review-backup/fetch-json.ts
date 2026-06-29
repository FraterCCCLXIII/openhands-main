import { isUxReviewMode } from "@/src/lib/ux-review-mode";
import { apiPath } from "@/src/shared/paths";

export type ApiDebugDetails = Record<string, unknown>;

export function apiFetch(input: RequestInfo, init?: RequestInit): Promise<Response> {
  const nextInit: RequestInit = { ...init };
  const isInternalApiPath = typeof input === "string" && input.startsWith("/api/");

  if (isInternalApiPath) {
    nextInit.credentials = init?.credentials ?? "same-origin";
  }

  return fetch(isInternalApiPath ? apiPath(input as string) : input, nextInit);
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
  if (isUxReviewMode()) {
    const { resolveUxReviewFixture } = await import(
      "@/src/fixtures/ux-review/fixture-router"
    );
    return resolveUxReviewFixture(input, init) as T;
  }

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
