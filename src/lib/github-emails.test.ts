import { describe, expect, it, vi } from "vitest";

import { fetchPrimaryVerifiedGitHubEmail, selectPrimaryVerifiedGitHubEmail } from "@/src/lib/github-emails";

describe("selectPrimaryVerifiedGitHubEmail", () => {
  it("prefers the primary verified email", () => {
    expect(
      selectPrimaryVerifiedGitHubEmail([
        { email: "secondary@example.com", primary: false, verified: true },
        { email: "primary@example.com", primary: true, verified: true },
      ]),
    ).toBe("primary@example.com");
  });

  it("falls back to the first verified email", () => {
    expect(
      selectPrimaryVerifiedGitHubEmail([
        { email: "private@example.com", primary: true, verified: false },
        { email: "verified@example.com", primary: false, verified: true },
      ]),
    ).toBe("verified@example.com");
  });

  it("returns null when GitHub returns no verified emails", () => {
    expect(
      selectPrimaryVerifiedGitHubEmail([
        { email: "private@example.com", primary: true, verified: false },
      ]),
    ).toBeNull();
  });
});

describe("fetchPrimaryVerifiedGitHubEmail", () => {
  it("fetches private GitHub emails with the OAuth access token", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      json: async () => [
        { email: "primary@example.com", primary: true, verified: true },
      ],
    })) as unknown as typeof fetch;

    await expect(fetchPrimaryVerifiedGitHubEmail("token-123", fetchImpl)).resolves.toBe(
      "primary@example.com",
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.github.com/user/emails",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token-123",
        }),
      }),
    );
  });

  it("returns null when GitHub rejects the email request", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: false,
    })) as unknown as typeof fetch;

    await expect(fetchPrimaryVerifiedGitHubEmail("token-123", fetchImpl)).resolves.toBeNull();
  });
});
