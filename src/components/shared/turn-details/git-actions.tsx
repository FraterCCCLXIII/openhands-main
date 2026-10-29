import {
  ArrowDownToLine,
  ArrowUpFromLine,
  GitBranch,
  GitCommitHorizontal,
  GitMerge,
  GitPullRequest,
  GitFork,
  Terminal,
} from "lucide-react";
import type { GitAction } from "#/utils/code-activity";
import { Chip } from "./chip";

function iconFor(command: string) {
  if (command.includes("commit")) return <GitCommitHorizontal />;
  if (command.includes("push")) return <ArrowUpFromLine />;
  if (command.includes("pull") || command.includes("fetch"))
    return <ArrowDownToLine />;
  if (
    command.includes("merge") ||
    command.includes("rebase") ||
    command.includes("cherry")
  )
    return <GitMerge />;
  if (command.startsWith("gh pr")) return <GitPullRequest />;
  if (command.startsWith("gh")) return <GitFork />;
  if (
    command.includes("branch") ||
    command.includes("checkout") ||
    command.includes("switch") ||
    command.includes("worktree")
  )
    return <GitBranch />;
  return <Terminal />;
}

/** The git and GitHub commands an agent ran, each as a chip with what it touched. */
export function GitActionList({ actions }: { actions: GitAction[] }) {
  return (
    <ul
      className="flex flex-col gap-1.5"
      data-testid="turn-details-git-actions"
    >
      {actions.map((a, index) => (
        <li
          // The same command can run twice; order is the identity.
          // eslint-disable-next-line react/no-array-index-key
          key={index}
          className="flex flex-wrap items-center gap-1.5"
        >
          <Chip
            mono
            icon={iconFor(a.command)}
            tone={a.warn ? "warning" : "neutral"}
          >
            {a.command}
          </Chip>
          {a.sha ? (
            <Chip mono tone="success">
              {a.sha.slice(0, 7)}
            </Chip>
          ) : null}
          {a.detail ? (
            <span
              className="min-w-0 truncate font-mono text-xs text-foreground"
              title={a.detail}
            >
              {a.detail}
            </span>
          ) : null}
          {a.url ? (
            <a
              href={a.url}
              target="_blank"
              rel="noreferrer"
              className="truncate text-xs text-accent-text underline underline-offset-2"
            >
              {a.url.replace("https://github.com/", "")}
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
