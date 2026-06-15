import { describe, expect, it } from "vitest";

import { mapGitHubProfile } from "@/src/lib/github-profile";

describe("mapGitHubProfile", () => {
  it("maps the standard numeric GitHub id", () => {
    expect(
      mapGitHubProfile({
        id: 12345,
        login: "octocat",
        name: "The Octocat",
        email: "octocat@example.com",
        avatar_url: "https://github.com/images/error/octocat_happy.gif",
      }),
    ).toEqual({
      id: "12345",
      name: "The Octocat",
      email: "octocat@example.com",
      image: "https://github.com/images/error/octocat_happy.gif",
    });
  });

  it("falls back to node_id when GitHub omits the numeric id", () => {
    expect(
      mapGitHubProfile({
        node_id: "U_kgDOBuC2BA",
        login: "octocat",
        email: null,
        avatar_url: null,
      }),
    ).toEqual({
      id: "U_kgDOBuC2BA",
      name: "octocat",
      email: null,
      image: null,
    });
  });

  it("falls back to login when GitHub only returns basic profile fields", () => {
    expect(
      mapGitHubProfile({
        login: "octocat",
        email: "octocat@example.com",
        avatar_url: null,
      }),
    ).toEqual({
      id: "login:octocat",
      name: "octocat",
      email: "octocat@example.com",
      image: null,
    });
  });

  it("throws a clear error when GitHub returns no usable identifier", () => {
    expect(() => mapGitHubProfile({ avatar_url: null })).toThrow(
      "GitHub OAuth profile response did not include a usable identifier. Response keys: avatar_url.",
    );
  });
});
