import { afterEach, describe, expect, it, vi } from "vitest";

import { refreshGitHubAdminClaims } from "@/src/lib/auth-admin-claims";

describe("refreshGitHubAdminClaims", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("marks a token as admin only after GitHub returns a verified allowlisted email", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");

    const token = await refreshGitHubAdminClaims(
      {},
      "github-token",
      vi.fn(async () => "admin@example.com"),
    );

    expect(token).toMatchObject({
      email: "admin@example.com",
      adminEmailVerified: true,
      isAdmin: true,
    });
  });

  it("fails closed when a profile email looks like an admin but GitHub verified email lookup fails", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");

    const token = await refreshGitHubAdminClaims(
      { email: "admin@example.com" },
      "github-token",
      vi.fn(async () => null),
    );

    expect(token).toMatchObject({
      email: "admin@example.com",
      adminEmailVerified: false,
      isAdmin: false,
    });
  });

  it("does not trust an injected isAdmin claim without a verified admin email", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");

    const token = await refreshGitHubAdminClaims({
      email: "user@example.com",
      isAdmin: true,
      adminEmailVerified: false,
    });

    expect(token.isAdmin).toBe(false);
  });

  it("preserves admin status on later JWT callbacks only when the email was already verified", async () => {
    vi.stubEnv("APP_ADMIN_EMAILS", "admin@example.com");

    const token = await refreshGitHubAdminClaims({
      email: "admin@example.com",
      adminEmailVerified: true,
    });

    expect(token.isAdmin).toBe(true);
  });
});
