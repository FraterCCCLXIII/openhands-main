// Collects the commits and pull requests a person authored across GitHub orgs
// and a list of personal repos, through the `gh` CLI (read-only calls).
import { execFileSync } from "node:child_process";

const itemId = (kind, name) => `${kind}:${name}`.replace(/[/\s]/g, "~");

const ghJson = (args) =>
  JSON.parse(execFileSync("gh", args, { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 }) || "[]");

/** First "(#123)" a squash-merge subject carries, or null. */
export function prNumberOf(subject) {
  const match = /\(#(\d+)\)\s*$/.exec(subject);
  return match ? Number(match[1]) : null;
}

export function toPr(raw) {
  const repo = raw.repository.nameWithOwner;
  return {
    repo,
    number: raw.number,
    title: raw.title,
    state: raw.state,
    draft: Boolean(raw.isDraft),
    createdAt: raw.createdAt.slice(0, 10),
    // gh reports an open PR's closedAt as the zero time.
    closedAt: raw.state === "open" || !raw.closedAt || raw.closedAt.startsWith("0001") ? "" : raw.closedAt.slice(0, 10),
    url: raw.url,
  };
}

export function toCommit(repo, sha, date, message, url) {
  const subject = message.split("\n")[0];
  return { repo, sha: sha.slice(0, 7), date: date.slice(0, 10), subject, pr: prNumberOf(subject), url };
}

export function collectGithub({ login, orgs = [], repos = [] }, run = ghJson) {
  const prs = {};
  const commits = {};
  const addPrs = (list) => {
    for (const raw of list) {
      const pr = toPr(raw);
      prs[itemId("pr", `${pr.repo}#${pr.number}`)] = pr;
    }
  };
  const addCommit = (repo, sha, date, message, url) => {
    const c = toCommit(repo, sha, date, message, url);
    commits[itemId("commit", `${repo}@${c.sha}`)] = c;
  };
  const prFields = "number,title,state,repository,createdAt,closedAt,url,isDraft";
  for (const org of orgs) {
    addPrs(run(["search", "prs", "--author", login, "--owner", org, "--limit", "1000", "--json", prFields]));
    for (const c of run([
      "api", "-X", "GET", "search/commits", "-f", `q=author:${login} org:${org}`,
      "-f", "per_page=100", "--paginate", "--slurp",
    ]).flatMap((page) => page.items ?? [])) {
      addCommit(c.repository.full_name, c.sha, c.commit.author.date, c.commit.message, c.html_url);
    }
  }
  for (const repo of repos) {
    // One empty, renamed or private repo must not lose the others.
    try {
      addPrs(run(["search", "prs", "--author", login, "--repo", repo, "--limit", "1000", "--json", prFields]));
      for (const c of run(["api", `repos/${repo}/commits?author=${login}&per_page=100`, "--paginate", "--slurp"]).flat()) {
        addCommit(repo, c.sha, c.commit.author.date, c.commit.message, c.html_url);
      }
    } catch (error) {
      console.warn(`Skipped ${repo}: ${String(error.stderr ?? error.message).trim().split("\n")[0]}`);
    }
  }
  return { commits, prs };
}
