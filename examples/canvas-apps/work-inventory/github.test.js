import { describe, expect, it } from "vitest";
import { collectGithub, prNumberOf, toCommit, toPr } from "./github.mjs";

describe("prNumberOf", () => {
  it("reads the squash-merge PR number from the end of a subject", () => {
    expect(prNumberOf("feat(x): add y (#16343)")).toBe(16343);
    expect(prNumberOf("fix: mention (#12) in the middle")).toBeNull();
  });
});

describe("collectGithub", () => {
  const login = "me";
  const pr = (repo, number, state) => ({
    number, title: `PR ${number}`, state, repository: { nameWithOwner: repo },
    createdAt: "2026-10-01T10:00:00Z", closedAt: state === "open" ? null : "2026-10-02T10:00:00Z", url: `https://x/${number}`, isDraft: false,
  });
  const commit = (sha, message) => ({ sha, commit: { author: { date: "2026-10-01T10:00:00-07:00" }, message }, html_url: `https://x/${sha}`, repository: { full_name: "Org/r" } });

  it("keys PRs and commits by repo and skips a repo that errors", () => {
    const run = (args) => {
      if (args[0] === "search") return [pr(args.includes("--owner") ? "Org/r" : "me/ok", 5, "merged")];
      if (args[1] === "-X") return [{ items: [commit("abcdef0123", "feat: a (#5)\n\nbody")] }];
      if (args[1].includes("me/broken")) throw Object.assign(new Error("boom"), { stderr: "HTTP 409" });
      return [[commit("1234567abc", "fix: b")]];
    };
    const { commits, prs } = collectGithub({ login, orgs: ["Org"], repos: ["me/ok", "me/broken"] }, run);
    expect(Object.keys(prs).sort()).toEqual(["pr:Org~r#5", "pr:me~ok#5"]);
    expect(commits["commit:Org~r@abcdef0"]).toMatchObject({ pr: 5, subject: "feat: a (#5)", date: "2026-10-01" });
    expect(Object.keys(commits)).toContain("commit:me~ok@1234567");
  });

  it("builds a commit from a multi-line message", () => {
    expect(toCommit("a/b", "0123456789", "2026-01-02T00:00:00Z", "subject\nmore", "u")).toMatchObject({ sha: "0123456", subject: "subject", pr: null });
  });
});

describe("toPr", () => {
  it("leaves closedAt empty for an open PR whose closedAt is the zero time", () => {
    const raw = { number: 1, title: "t", state: "open", repository: { nameWithOwner: "a/b" }, createdAt: "2026-10-01T00:00:00Z", closedAt: "0001-01-01T00:00:00Z", url: "u" };
    expect(toPr(raw).closedAt).toBe("");
    expect(toPr({ ...raw, state: "merged", closedAt: "2026-10-03T00:00:00Z" }).closedAt).toBe("2026-10-03");
  });
});
