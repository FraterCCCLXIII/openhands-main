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

export const getGoogleAuthSetupStatus = (env: NodeJS.ProcessEnv = process.env) => {
  const missing: string[] = [];

  if (!env.GOOGLE_CLIENT_ID) {
    missing.push("GOOGLE_CLIENT_ID");
  }

  if (!env.GOOGLE_CLIENT_SECRET) {
    missing.push("GOOGLE_CLIENT_SECRET");
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
    callbackUrl: `${baseUrl}/api/auth/callback/google`,
    configured: missing.length === 0,
    missing,
  };
};
