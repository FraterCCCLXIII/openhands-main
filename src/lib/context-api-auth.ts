import { isAuthDisabled } from "@/src/lib/auth-config";

export const DEFAULT_LOCAL_CONTEXT_API_KEY = "local-dev-context-key";

const splitApiKeys = (value: string | undefined) =>
  (value ?? "")
    .split(/[\n,]/)
    .map((item) => item.trim())
    .filter(Boolean);

export const getContextApiKeys = (
  env: NodeJS.ProcessEnv = process.env,
): string[] => {
  const configuredKeys = [
    ...splitApiKeys(env.CONTEXT_LAYER_API_KEY),
    ...splitApiKeys(env.CONTEXT_LAYER_API_KEYS),
  ];
  const uniqueKeys = [...new Set(configuredKeys)];

  if (uniqueKeys.length > 0) {
    return uniqueKeys;
  }

  if (isAuthDisabled(env)) {
    return [DEFAULT_LOCAL_CONTEXT_API_KEY];
  }

  return [];
};

export const getContextApiAuthStatus = (
  env: NodeJS.ProcessEnv = process.env,
) => {
  const configuredKeys = [
    ...splitApiKeys(env.CONTEXT_LAYER_API_KEY),
    ...splitApiKeys(env.CONTEXT_LAYER_API_KEYS),
  ];
  const keys = getContextApiKeys(env);

  return {
    configured: keys.length > 0,
    keys,
    primaryKey: keys[0] ?? "",
    usingDefaultLocalKey:
      configuredKeys.length === 0 && isAuthDisabled(env) && keys.length > 0,
  };
};

export const extractContextApiKey = (requestHeaders: Headers) => {
  const authHeader = requestHeaders.get("authorization")?.trim();

  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return requestHeaders.get("x-api-key")?.trim() ?? "";
};

export const isContextApiKeyAuthorized = (
  requestHeaders: Headers,
  env: NodeJS.ProcessEnv = process.env,
) => {
  const providedKey = extractContextApiKey(requestHeaders);
  if (!providedKey) {
    return false;
  }

  return getContextApiKeys(env).includes(providedKey);
};
