export type McpTransportKind = "streamable_http" | "sse";

export interface McpTransportFallback {
  transport: McpTransportKind;
  url: string;
}

const hasOwn = (value: Record<string, unknown>, key: string) =>
  Object.prototype.hasOwnProperty.call(value, key);

const isMcpTransportKind = (value: unknown): value is McpTransportKind =>
  value === "streamable_http" || value === "sse";

const normalizeMcpTransportFallback = (
  value: unknown,
): McpTransportFallback | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const transport = (value as { transport?: unknown }).transport;
  const url = (value as { url?: unknown }).url;
  if (!isMcpTransportKind(transport) || typeof url !== "string") {
    return null;
  }

  const trimmedUrl = url.trim();
  if (!trimmedUrl) {
    return null;
  }

  try {
    new URL(trimmedUrl);
  } catch {
    return null;
  }

  return {
    transport,
    url: trimmedUrl,
  };
};

export const parseMcpTransportFallbacks = (
  value: unknown,
): McpTransportFallback[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(normalizeMcpTransportFallback)
    .filter((fallback): fallback is McpTransportFallback => fallback != null);
};

export const getMcpTransportFallbacks = (
  ...configs: Array<Record<string, unknown> | undefined>
): McpTransportFallback[] => {
  for (const config of configs) {
    if (!config || !hasOwn(config, "mcpTransportFallbacks")) {
      continue;
    }

    return parseMcpTransportFallbacks(config.mcpTransportFallbacks);
  }

  return [];
};
