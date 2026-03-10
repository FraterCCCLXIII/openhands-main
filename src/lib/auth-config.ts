const DEFAULT_LOCAL_URL = "http://localhost:3000";

export const isAuthDisabled = (env: NodeJS.ProcessEnv = process.env) => env.DISABLE_AUTH === "true";

export const getAuthSecret = (env: NodeJS.ProcessEnv = process.env) =>
  env.AUTH_SECRET ?? env.NEXTAUTH_SECRET ?? "";

export const getBaseUrl = (env: NodeJS.ProcessEnv = process.env) => {
  const explicitUrl = env.AUTH_URL ?? env.NEXTAUTH_URL;
  if (explicitUrl) {
    return explicitUrl.replace(/\/$/, "");
  }

  if (env.VERCEL_URL) {
    const normalizedHost = env.VERCEL_URL.replace(/^https?:\/\//, "");
    return `https://${normalizedHost}`;
  }

  return DEFAULT_LOCAL_URL;
};

export const getRedirectProxyUrl = (env: NodeJS.ProcessEnv = process.env) =>
  env.AUTH_REDIRECT_PROXY_URL?.replace(/\/$/, "") ?? "";

export const getOAuthCallbackBaseUrl = (env: NodeJS.ProcessEnv = process.env) => {
  const redirectProxyUrl = getRedirectProxyUrl(env);
  if (redirectProxyUrl) {
    return `${new URL(redirectProxyUrl).origin}/api/oauth`;
  }

  return `${getBaseUrl(env)}/api/oauth`;
};

export const getOAuthCallbackUrl = (
  provider: string,
  env: NodeJS.ProcessEnv = process.env,
) => `${getOAuthCallbackBaseUrl(env)}/${provider}/callback`;

export const getGithubClientId = (env: NodeJS.ProcessEnv = process.env) =>
  env.GITHUB_CLIENT_ID ?? env.AUTH_GITHUB_ID ?? "";

export const getGithubClientSecret = (env: NodeJS.ProcessEnv = process.env) =>
  env.GITHUB_CLIENT_SECRET ?? env.AUTH_GITHUB_SECRET ?? "";

export const getGithubCallbackUrl = (env: NodeJS.ProcessEnv = process.env) => {
  const redirectProxyUrl = getRedirectProxyUrl(env);
  if (redirectProxyUrl) {
    return `${redirectProxyUrl}/callback/github`;
  }

  return `${getBaseUrl(env)}/api/auth/callback/github`;
};

export const getGithubAuthSetupStatus = (env: NodeJS.ProcessEnv = process.env) => {
  const missing: string[] = [];

  if (!getGithubClientId(env)) {
    missing.push("GITHUB_CLIENT_ID");
  }

  if (!getGithubClientSecret(env)) {
    missing.push("GITHUB_CLIENT_SECRET");
  }

  if (!getAuthSecret(env)) {
    missing.push("AUTH_SECRET or NEXTAUTH_SECRET");
  }

  return {
    authDisabled: isAuthDisabled(env),
    baseUrl: getBaseUrl(env),
    callbackUrl: getGithubCallbackUrl(env),
    configured: missing.length === 0,
    missing,
    previewDeploymentsEnabled: Boolean(getRedirectProxyUrl(env)),
    redirectProxyUrl: getRedirectProxyUrl(env),
  };
};
