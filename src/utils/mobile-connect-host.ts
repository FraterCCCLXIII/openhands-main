import { normalizeConnectHost } from "./mobile-connect-payload";

export const CONNECT_HOSTS_PATH = "/__oh/connect-hosts";
export const CONNECT_TUNNEL_PATH = "/__oh/connect-tunnel";

export function isUnreachableFromPhone(host: string): boolean {
  const normalized = normalizeConnectHost(host);
  if (!normalized) {
    return true;
  }
  let hostname: string;
  try {
    hostname = new URL(normalized).hostname.toLowerCase();
  } catch {
    return true;
  }
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]"
  ) {
    return true;
  }
  if (hostname.startsWith("127.") || hostname.startsWith("169.254.")) {
    return true;
  }
  return false;
}

export function suggestMobileConnectHost(options: {
  backendHost: string;
  pageOrigin: string;
  lanOrigins: readonly string[];
}): string {
  const candidates = [
    ...options.lanOrigins,
    options.pageOrigin,
    options.backendHost,
  ]
    .map((value) => normalizeConnectHost(value))
    .filter(Boolean);
  const reachable = candidates.find(
    (candidate) => !isUnreachableFromPhone(candidate),
  );
  return (
    reachable ??
    normalizeConnectHost(options.backendHost) ??
    normalizeConnectHost(options.pageOrigin)
  );
}
