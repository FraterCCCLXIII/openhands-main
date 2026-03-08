import { describe, expect, it } from "vitest";

import { getAuthSecret, getBaseUrl, getGoogleAuthSetupStatus, isAuthDisabled } from "@/src/lib/auth-config";

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

  it("reports the missing variables required for Google sign-in", () => {
    expect(getGoogleAuthSetupStatus(env({}))).toMatchObject({
      configured: false,
      missing: [
        "GOOGLE_CLIENT_ID",
        "GOOGLE_CLIENT_SECRET",
        "NEXTAUTH_SECRET or AUTH_SECRET",
        "NEXTAUTH_URL or AUTH_URL",
      ],
      callbackUrl: "http://localhost:3000/api/auth/callback/google",
    });
  });

  it("marks Google auth as configured when required values are present", () => {
    expect(
      getGoogleAuthSetupStatus(
        env({
          GOOGLE_CLIENT_ID: "google-id",
          GOOGLE_CLIENT_SECRET: "google-secret",
          NEXTAUTH_SECRET: "secret",
          NEXTAUTH_URL: "https://openhands-context-layer.vercel.app",
        }),
      ),
    ).toMatchObject({
      configured: true,
      missing: [],
      baseUrl: "https://openhands-context-layer.vercel.app",
      callbackUrl: "https://openhands-context-layer.vercel.app/api/auth/callback/google",
    });
  });
});
