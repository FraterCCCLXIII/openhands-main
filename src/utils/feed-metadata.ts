import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import type { Provider } from "#/types/settings";
import {
  constructBranchUrl,
  constructPullRequestUrl,
  constructRepositoryUrl,
  getGitProviderBaseUrl,
} from "#/utils/utils";

export interface FeedLink {
  label: string;
  /** Null when the value names an item but not where it lives. */
  url: string | null;
}

export interface FeedTicket extends FeedLink {
  tracker: "github" | "gitlab" | "linear" | "jira" | "other";
}

export interface FeedMetadata {
  repo: FeedLink | null;
  branch: FeedLink | null;
  /** Set when the conversation runs in its own worktree, not the chosen folder. */
  worktree: (FeedLink & { path: string }) | null;
  provider: Provider | null;
  pullRequests: FeedLink[];
  tickets: FeedTicket[];
}

// Conversation tag keys that name an issue-tracker item, normalized to
// lowercase. The value is a bare id ("123", "ENG-42") or a full URL.
const TICKET_TAG_TRACKERS: Record<string, FeedTicket["tracker"]> = {
  issue: "github",
  issue_number: "github",
  github_issue: "github",
  gitlab_issue: "gitlab",
  linear: "linear",
  linear_issue: "linear",
  jira: "jira",
  jira_issue: "jira",
  ticket: "other",
};

const LINEAR_ISSUE_BASE_URL = "https://linear.app/issue";
const URL_PATTERN = /^https?:\/\//i;

function ticketFromTag(
  tracker: FeedTicket["tracker"],
  value: string,
  repository: string | null,
  provider: Provider | null,
): FeedTicket {
  if (URL_PATTERN.test(value)) {
    const label = value.split("/").filter(Boolean).pop() ?? value;
    return { tracker, label, url: value };
  }
  if (tracker === "linear") {
    return { tracker, label: value, url: `${LINEAR_ISSUE_BASE_URL}/${value}` };
  }
  const number = value.replace(/^#/, "");
  if ((tracker === "github" || tracker === "gitlab") && /^\d+$/.test(number)) {
    const issueProvider =
      provider ?? (tracker === "gitlab" ? "gitlab" : "github");
    const base = repository
      ? `${getGitProviderBaseUrl(issueProvider)}/${repository}`
      : null;
    const path = issueProvider === "gitlab" ? "/-/issues/" : "/issues/";
    return {
      tracker,
      label: `#${number}`,
      url: base ? `${base}${path}${number}` : null,
    };
  }
  return { tracker, label: value, url: null };
}

const trimSlashes = (path: string): string => path.trim().replace(/\/+$/, "");

function getWorktree(conversation: AppConversation): FeedMetadata["worktree"] {
  const workingDir = trimSlashes(conversation.workspace?.working_dir ?? "");
  const selected = trimSlashes(conversation.selected_workspace ?? "");
  // A working dir that differs from the folder the user attached is the
  // per-conversation worktree the runtime created for it.
  if (!workingDir || !selected || workingDir === selected) return null;
  return {
    label: workingDir.split("/").pop() ?? workingDir,
    path: workingDir,
    url: null,
  };
}

/**
 * The repository, branch, pull-request and issue-tracker references a
 * conversation carries, with a link to each where the host is known.
 */
export function getFeedMetadata(conversation: AppConversation): FeedMetadata {
  const repository = conversation.selected_repository;
  const provider = conversation.git_provider;
  const branch = conversation.selected_branch;

  const tickets = Object.entries(conversation.tags ?? {}).flatMap(
    ([key, value]) => {
      const tracker = TICKET_TAG_TRACKERS[key.trim().toLowerCase()];
      const trimmed = typeof value === "string" ? value.trim() : "";
      return tracker && trimmed
        ? [ticketFromTag(tracker, trimmed, repository, provider)]
        : [];
    },
  );

  return {
    repo: repository
      ? {
          label: repository,
          url: provider ? constructRepositoryUrl(provider, repository) : null,
        }
      : null,
    branch: branch
      ? {
          label: branch,
          url:
            provider && repository
              ? constructBranchUrl(provider, repository, branch)
              : null,
        }
      : null,
    worktree: getWorktree(conversation),
    provider,
    pullRequests: (conversation.pr_number ?? []).map((number) => ({
      label: `#${number}`,
      url:
        provider && repository
          ? constructPullRequestUrl(number, provider, repository)
          : null,
    })),
    tickets,
  };
}
