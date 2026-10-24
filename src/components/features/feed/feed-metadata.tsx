import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
  ExternalLink,
  FileDiff,
  GitBranch,
  GitFork,
  GitPullRequest,
  Ticket,
} from "lucide-react";
import { FaBitbucket, FaGithub, FaGitlab } from "react-icons/fa6";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useFeedChanges } from "#/hooks/query/use-feed-changes";
import { I18nKey } from "#/i18n/declaration";
import {
  getFeedMetadata,
  type FeedLink,
  type FeedTicket,
} from "#/utils/feed-metadata";

const CHIP_CLASS =
  "inline-flex max-w-full items-center gap-1 rounded-md bg-surface px-2 py-1 text-xs text-muted";

function Chip({
  link,
  icon,
  testId,
}: {
  link: FeedLink;
  icon: ReactNode;
  testId: string;
}) {
  const content = (
    <>
      {icon}
      <span className="truncate">{link.label}</span>
    </>
  );
  if (!link.url) {
    return (
      <span data-testid={testId} className={CHIP_CLASS}>
        {content}
      </span>
    );
  }
  return (
    <a
      data-testid={testId}
      href={link.url}
      target="_blank"
      rel="noreferrer"
      className={`${CHIP_CLASS} hover:text-contrast`}
    >
      {content}
      <ExternalLink size={10} className="shrink-0" />
    </a>
  );
}

const TICKET_TRACKER_ICON: Record<FeedTicket["tracker"], ReactNode> = {
  github: <FaGithub size={12} />,
  gitlab: <FaGitlab size={12} />,
  linear: <Ticket size={12} />,
  jira: <Ticket size={12} />,
  other: <Ticket size={12} />,
};

function providerIcon(provider: AppConversation["git_provider"]): ReactNode {
  if (provider === "gitlab") return <FaGitlab size={12} />;
  if (provider === "bitbucket" || provider === "bitbucket_data_center") {
    return <FaBitbucket size={12} />;
  }
  return <FaGithub size={12} />;
}

interface FeedMetadataProps {
  conversation: AppConversation;
  inView: boolean;
}

const BUBBLE_CLASS =
  "inline-flex items-center gap-1 rounded-full bg-contrast px-2.5 py-0.5 text-xs font-semibold text-contrast-foreground";

/** Issue, ticket and pull-request numbers as bubbles that link out. */
export function FeedRefBubbles({
  conversation,
}: {
  conversation: AppConversation;
}) {
  const { pullRequests, tickets } = getFeedMetadata(conversation);
  const refs = [
    ...tickets.map((ticket) => ({
      key: `${ticket.tracker}:${ticket.label}`,
      link: ticket as FeedLink,
      icon: TICKET_TRACKER_ICON[ticket.tracker],
      testId: "feed-card-ticket",
    })),
    ...pullRequests.map((pr) => ({
      key: `pr:${pr.label}`,
      link: pr,
      icon: <GitPullRequest size={12} />,
      testId: "feed-card-pr",
    })),
  ];
  if (refs.length === 0) return null;
  return (
    <div className="flex flex-wrap justify-end gap-1">
      {refs.map(({ key, link, icon, testId }) => {
        const content = (
          <>
            {icon}
            {link.label}
          </>
        );
        return link.url ? (
          <a
            key={key}
            data-testid={testId}
            href={link.url}
            target="_blank"
            rel="noreferrer"
            className={`${BUBBLE_CLASS} hover:opacity-80`}
          >
            {content}
          </a>
        ) : (
          <span key={key} data-testid={testId} className={BUBBLE_CLASS}>
            {content}
          </span>
        );
      })}
    </div>
  );
}

/** Repo, branch, worktree and changed-file chips for a feed card. */
export function FeedMetadata({ conversation, inView }: FeedMetadataProps) {
  const { t } = useTranslation("openhands");
  const { repo, branch, worktree, provider } = getFeedMetadata(conversation);
  const { data: changes } = useFeedChanges(conversation, inView);
  const changedFiles = Array.isArray(changes) ? changes.length : 0;

  if (!repo && !branch && !worktree && changedFiles === 0) {
    return null;
  }

  return (
    <div
      data-testid="feed-card-metadata"
      className="mt-2 flex flex-wrap gap-1.5 px-4"
    >
      {repo ? (
        <Chip
          testId="feed-card-repo"
          link={repo}
          icon={providerIcon(provider)}
        />
      ) : null}
      {branch ? (
        <Chip
          testId="feed-card-branch"
          link={branch}
          icon={<GitBranch size={12} />}
        />
      ) : null}
      {worktree ? (
        <span
          data-testid="feed-card-worktree"
          title={worktree.path}
          className={CHIP_CLASS}
        >
          <GitFork size={12} />
          <span className="truncate">{worktree.label}</span>
        </span>
      ) : null}
      {changedFiles > 0 ? (
        <span data-testid="feed-card-changes" className={CHIP_CLASS}>
          <FileDiff size={12} />
          {t(I18nKey.FEED$FILES_CHANGED, { count: changedFiles })}
        </span>
      ) : null}
    </div>
  );
}
