import { getBaseUrl, isAuthDisabled } from "@/src/lib/auth-config";

const stripHostPort = (value: string) => {
  if (!value) {
    return "";
  }

  const trimmed = value.trim().toLowerCase();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return new URL(trimmed).hostname.toLowerCase();
  }

  if (trimmed.startsWith("[")) {
    const endIndex = trimmed.indexOf("]");
    return endIndex >= 0 ? trimmed.slice(1, endIndex) : trimmed;
  }

  return trimmed.split(":")[0] ?? "";
};

export const getRequestHost = (requestHeaders: Headers) =>
  requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "";

export const isLoopbackHost = (value: string | null | undefined) => {
  const host = stripHostPort(value ?? "");
  return (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "::1" ||
    host.endsWith(".localhost")
  );
};

export const isAllowedWhenAuthDisabled = (
  requestHeaders: Headers,
  env: NodeJS.ProcessEnv = process.env,
) => !isAuthDisabled(env) || isLoopbackHost(getRequestHost(requestHeaders));

export const getRequestOrigin = (
  requestHeaders: Headers,
  env: NodeJS.ProcessEnv = process.env,
) => {
  const host = getRequestHost(requestHeaders);

  if (!host) {
    return getBaseUrl(env);
  }

  const forwardedProto = requestHeaders.get("x-forwarded-proto");
  const protocol = forwardedProto || (isLoopbackHost(host) ? "http" : "https");
  return `${protocol}://${host}`;
};
