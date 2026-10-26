// GitHub discovery adapter: fetches all repositories from the authenticated
// user's account including personal repos and all organizations they belong to.
// Also fetches detailed git history from GitHub API for repos without local clones.
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const run = (cmd, args, opts = {}) => {
  const result = spawnSync(cmd, args, { encoding: "utf8", ...opts });
  if (result.error) throw result.error;
  return result.stdout?.trim() ?? "";
};

const gh = (args) => {
  const out = run("gh", args);
  try { return JSON.parse(out || "[]"); } catch { return out; }
};

/**
 * Discovers all GitHub repos for the authenticated user.
 * @param {{ includePrivate?: boolean, includeArchived?: boolean, includeForks?: boolean, orgsOnly?: string[], reposOnly?: string[] }} options
 * @returns {{ repos: Array<{ owner: string, name: string, fullName: string, url: string, isPrivate: boolean, isArchived: boolean, isFork: boolean, defaultBranch: string, description: string, pushedAt: string }>, orgs: Array<{ login: string, name: string }>, user: string }}
 */
export async function discoverRepos({
  includePrivate = true,
  includeArchived = false,
  includeForks = false,
  orgsOnly = null,
  reposOnly = null,
  limit = 500,
} = {}) {
  // Get current user
  const user = gh(["api", "user", "--jq", ".login"]);
  if (!user) throw new Error("Not authenticated with GitHub. Run `gh auth login`.");

  const repos = [];
  const orgs = [];

  // Fetch user's personal repos
  const userRepos = gh([
    "api", "user/repos",
    "--paginate",
    "--jq", `[.[] | {owner: .owner.login, name: .name, fullName: .full_name, url: .html_url, isPrivate: .private, isArchived: .archived, isFork: .fork, defaultBranch: .default_branch, description: .description, pushedAt: .pushed_at}]`,
  ]);

  // Fetch orgs the user belongs to
  const userOrgs = gh(["api", "user/orgs", "--paginate", "--jq", "[.[] | {login: .login, name: (.name // .login)}]"]);

  for (const org of userOrgs) {
    if (orgsOnly && !orgsOnly.includes(org.login)) continue;
    orgs.push(org);

    // Fetch repos for each org
    const orgRepos = gh([
      "api", `orgs/${org.login}/repos`,
      "--paginate",
      "--jq", `[.[] | {owner: .owner.login, name: .name, fullName: .full_name, url: .html_url, isPrivate: .private, isArchived: .archived, isFork: .fork, defaultBranch: .default_branch, description: .description, pushedAt: .pushed_at}]`,
    ]);

    if (Array.isArray(orgRepos)) repos.push(...orgRepos);
  }

  // Add user's personal repos (not owned by an org)
  if (Array.isArray(userRepos)) {
    for (const r of userRepos) {
      if (r.owner === user && !repos.some((x) => x.fullName === r.fullName)) {
        repos.push(r);
      }
    }
  }

  // Filter based on options
  const filtered = repos.filter((r) => {
    if (!includePrivate && r.isPrivate) return false;
    if (!includeArchived && r.isArchived) return false;
    if (!includeForks && r.isFork) return false;
    if (reposOnly && !reposOnly.includes(r.fullName)) return false;
    return true;
  }).slice(0, limit);

  return { repos: filtered, orgs, user };
}

/**
 * Fetches git history from GitHub API for a repo without needing a local clone.
 * @param {string} owner
 * @param {string} repo
 * @param {{ since?: string, limit?: number }} options
 */
export async function fetchRemoteHistory(owner, repo, { since, limit = 500 } = {}) {
  const repoId = `${owner}/${repo}`;

  // Fetch commits
  const commitArgs = ["api", `repos/${repoId}/commits`, "--paginate", "--jq",
    `[.[] | {sha: .sha, date: .commit.author.date, author: .author.login, message: .commit.message, parents: [.parents[].sha]}]`];
  const commits = gh(commitArgs);

  // Fetch PRs (all states)
  const prArgs = ["api", `repos/${repoId}/pulls?state=all&per_page=100&sort=updated&direction=desc`, "--paginate", "--jq",
    `[.[] | {number, title, state, draft: .draft, createdAt: .created_at, mergedAt: .merged_at, closedAt: .closed_at, user: .user.login, head: .head.ref, base: .base.ref, additions, deletions, url: .html_url}]`];
  const prs = gh(prArgs);

  // Fetch issues
  const issueArgs = ["api", `repos/${repoId}/issues?state=all&per_page=100&sort=updated&direction=desc`, "--paginate", "--jq",
    `[.[] | select(.pull_request == null) | {number, title, state, labels: [.labels[].name], assignees: [.assignees[].login], milestone: .milestone.title, createdAt: .created_at, closedAt: .closed_at, url: .html_url, body}]`];
  const issues = gh(issueArgs);

  // Fetch branches
  const branchArgs = ["api", `repos/${repoId}/branches`, "--paginate", "--jq", "[.[] | {name, protected: .protected}]"];
  const branches = gh(branchArgs);

  // Fetch releases/tags
  const releaseArgs = ["api", `repos/${repoId}/releases?per_page=30`, "--jq",
    `[.[] | {tag: .tag_name, name, date: .published_at, draft: .draft, prerelease}]`];
  const releases = gh(releaseArgs);

  // Fetch contributors
  const contribArgs = ["api", `repos/${repoId}/contributors?per_page=50`, "--jq",
    "[.[] | {login, contributions}]"];
  const contributors = gh(contribArgs);

  // Fetch activity/events
  const eventsArgs = ["api", `repos/${repoId}/events?per_page=100`, "--jq",
    `[.[] | {type, actor: .actor.login, created_at, payload: (if .type == "PushEvent" then {commits: .payload.size} elif .type == "PullRequestEvent" then {action: .payload.action, number: .payload.number} elif .type == "IssuesEvent" then {action: .payload.action, number: .payload.issue.number} else {} end)}]`];
  const events = gh(eventsArgs);

  return {
    commits: Array.isArray(commits) ? commits.slice(0, limit) : [],
    prs: Array.isArray(prs) ? prs : [],
    issues: Array.isArray(issues) ? issues : [],
    branches: Array.isArray(branches) ? branches : [],
    releases: Array.isArray(releases) ? releases : [],
    contributors: Array.isArray(contributors) ? contributors : [],
    events: Array.isArray(events) ? events : [],
  };
}

/**
 * Fetches activity timeline across all repos.
 * @param {Array<{owner: string, name: string}>} repos
 * @param {{ days?: number }} options
 */
export async function fetchActivityTimeline(repos, { days = 30 } = {}) {
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const timeline = [];

  for (const { owner, name } of repos.slice(0, 20)) { // Limit to avoid rate limits
    try {
      const events = gh([
        "api", `repos/${owner}/${name}/events?per_page=50`,
        "--jq", `[.[] | select(.created_at >= "${since}") | {repo: "${owner}/${name}", type, actor: .actor.login, date: .created_at}]`,
      ]);
      if (Array.isArray(events)) timeline.push(...events);
    } catch {
      // Skip repos with access issues
    }
  }

  return timeline.sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * Finds local clones of discovered repos.
 * @param {Array<{fullName: string}>} repos
 * @param {string[]} searchPaths - Directories to search for clones
 */
export function findLocalClones(repos, searchPaths = []) {
  const found = new Map();

  for (const searchPath of searchPaths) {
    if (!existsSync(searchPath)) continue;

    try {
      // Find all git repos in the search path
      const result = spawnSync("find", [searchPath, "-name", ".git", "-type", "d", "-maxdepth", "4"], {
        encoding: "utf8",
        timeout: 30000,
      });

      for (const gitDir of (result.stdout || "").split("\n").filter(Boolean)) {
        const repoPath = join(gitDir, "..");
        try {
          const remoteUrl = run("git", ["remote", "get-url", "origin"], { cwd: repoPath });
          const match = remoteUrl.match(/github\.com[:/]([^/]+\/[^/]+?)(?:\.git)?$/);
          if (match) {
            const fullName = match[1];
            if (repos.some((r) => r.fullName === fullName)) {
              found.set(fullName, repoPath);
            }
          }
        } catch {
          // Not a valid git repo
        }
      }
    } catch {
      // Search path issues
    }
  }

  return found;
}
