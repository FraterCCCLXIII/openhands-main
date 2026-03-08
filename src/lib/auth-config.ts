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

export const getGithubClientId = (env: NodeJS.ProcessEnv = process.env) =>
  env.AUTH_GITHUB_ID ?? env.GITHUB_CLIENT_ID ?? "";

export const getGithubClientSecret = (env: NodeJS.ProcessEnv = process.env) =>
  env.AUTH_GITHUB_SECRET ?? env.GITHUB_CLIENT_SECRET ?? "";

export const getGithubAuthSetupStatus = (env: NodeJS.ProcessEnv = process.env) => {
  const missing: string[] = [];

  if (!getGithubClientId(env)) {
    missing.push("AUTH_GITHUB_ID or GITHUB_CLIENT_ID");
  }

  if (!getGithubClientSecret(env)) {
    missing.push("AUTH_GITHUB_SECRET or GITHUB_CLIENT_SECRET");
  }

  if (!getAuthSecret(env)) {
    missing.push("NEXTAUTH_SECRET or AUTH_SECRET");
  }

  if (!(env.AUTH_URL ?? env.NEXTAUTH_URL ?? env.VERCEL_URL)) {
    missing.push("NEXTAUTH_URL or AUTH_URL");
  }

  const baseUrl = getBaseUrl(env);

  return {
    authDisabled: isAuthDisabled(env),
    baseUrl,
    callbackUrl: `${baseUrl}/api/auth/callback/github`,
    configured: missing.length === 0,
    missing,
  };
};
