import { describe, expect, it } from "vitest";

import {
  getAuthSecret,
  getBaseUrl,
  getGithubAuthSetupStatus,
  getGithubCallbackUrl,
  getGithubClientId,
  getGithubClientSecret,
  getOAuthCallbackBaseUrl,
  getOAuthCallbackUrl,
  getRedirectProxyUrl,
  isAuthDisabled,
} from "@/src/lib/auth-config";

const env = (values: Record<string, string>) => values as unknown as NodeJS.ProcessEnv;

describe("auth-config", () => {
  it("detects when auth is disabled", () => {
    expect(isAuthDisabled(env({ DISABLE_AUTH: "true" }))).toBe(true);
    expect(isAuthDisabled(env({ DISABLE_AUTH: "false" }))).toBe(false);
  });

  it("prefers explicit auth URLs over inferred Vercel URLs", () => {
    expect(getBaseUrl(env({ AUTH_URL: "https://example.com/", VERCEL_URL: "preview.vercel.app" }))).toBe(
      "https://example.com",
    );
  });

  it("derives the base URL from Vercel when explicit auth URLs are absent", () => {
    expect(getBaseUrl(env({ VERCEL_URL: "openhands-context-layer.vercel.app" }))).toBe(
      "https://openhands-context-layer.vercel.app",
    );
  });

  it("supports AUTH_SECRET as a fallback for NEXTAUTH_SECRET", () => {
    expect(getAuthSecret(env({ AUTH_SECRET: "top-secret" }))).toBe("top-secret");
  });

  it("prefers the KPI tracker GitHub client variable names", () => {
    expect(getGithubClientId(env({ GITHUB_CLIENT_ID: "github-id", AUTH_GITHUB_ID: "auth-id" }))).toBe(
      "github-id",
    );
    expect(
      getGithubClientSecret(
        env({ GITHUB_CLIENT_SECRET: "github-secret", AUTH_GITHUB_SECRET: "auth-secret" }),
      ),
    ).toBe("github-secret");
  });

  it("supports Auth.js GitHub inference names as a fallback", () => {
    expect(getGithubClientId(env({ AUTH_GITHUB_ID: "auth-id" }))).toBe("auth-id");
    expect(getGithubClientSecret(env({ AUTH_GITHUB_SECRET: "auth-secret" }))).toBe("auth-secret");
  });

  it("uses the redirect proxy URL when preview deployment support is enabled", () => {
    const previewEnv = env({
      AUTH_REDIRECT_PROXY_URL: "https://openhands-context-layer.vercel.app/api/auth/",
      VERCEL_URL: "openhands-context-layer-git-feature.vercel.app",
    });

    expect(getRedirectProxyUrl(previewEnv)).toBe("https://openhands-context-layer.vercel.app/api/auth");
    expect(getGithubCallbackUrl(previewEnv)).toBe(
      "https://openhands-context-layer.vercel.app/api/auth/callback/github",
    );
  });


  it("uses the redirect proxy origin for service OAuth callbacks on preview deployments", () => {
    const previewEnv = env({
      AUTH_REDIRECT_PROXY_URL: "https://openhands-context-layer.vercel.app/api/auth/",
      VERCEL_URL: "openhands-context-layer-git-feature.vercel.app",
    });

    expect(getOAuthCallbackBaseUrl(previewEnv)).toBe(
      "https://openhands-context-layer.vercel.app/api/oauth",
    );
    expect(getOAuthCallbackUrl("notion", previewEnv)).toBe(
      "https://openhands-context-layer.vercel.app/api/oauth/notion/callback",
    );
  });

  it("reports the missing variables required for GitHub sign-in", () => {
    expect(getGithubAuthSetupStatus(env({}))).toMatchObject({
      configured: false,
      missing: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "AUTH_SECRET or NEXTAUTH_SECRET"],
      callbackUrl: "http://localhost:3000/api/auth/callback/github",
      previewDeploymentsEnabled: false,
    });
  });

  it("marks GitHub auth as configured when required values are present", () => {
    expect(
      getGithubAuthSetupStatus(
        env({
          GITHUB_CLIENT_ID: "github-id",
          GITHUB_CLIENT_SECRET: "github-secret",
          AUTH_SECRET: "secret",
          NEXTAUTH_URL: "https://openhands-context-layer.vercel.app",
          AUTH_REDIRECT_PROXY_URL: "https://openhands-context-layer.vercel.app/api/auth",
        }),
      ),
    ).toMatchObject({
      configured: true,
      missing: [],
      baseUrl: "https://openhands-context-layer.vercel.app",
      callbackUrl: "https://openhands-context-layer.vercel.app/api/auth/callback/github",
      previewDeploymentsEnabled: true,
      redirectProxyUrl: "https://openhands-context-layer.vercel.app/api/auth",
    });
  });
});
