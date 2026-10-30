import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import type { TeamClient } from "#/chat-transport/nostr";
import { shortNpub } from "#/chat-transport/nostr/keys";
import { FeedMentionText } from "#/components/features/feed/feed-mention-text";
import { FeedRoleBadge } from "#/components/features/feed/feed-role-badge";
import { I18nKey } from "#/i18n/declaration";
import { useTeamStore } from "#/stores/team-chat-store-context";
import { useTeamChatUiStore } from "#/stores/team-chat-ui-store";
import { memberProfile, type ActivityItem } from "#/utils/team-chat-profile";
import { cn } from "#/utils/utils";
import { MemberAvatar } from "./member-avatar";
import { primaryButtonClassName } from "./team-chat-ui";

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-1 flex-col rounded-lg bg-surface px-3 py-2">
      <span className="text-lg font-medium text-contrast">{value}</span>
      <span className="text-xs text-muted">{label}</span>
    </div>
  );
}

const STATUS_STYLE = {
  sent: "bg-surface-raised text-muted",
  waiting: "bg-amber-500/15 text-amber-300",
  answered: "bg-emerald-500/15 text-emerald-300",
} as const;

function ActivityRow({ item }: { item: ActivityItem }) {
  const { t } = useTranslation("openhands");
  const label = (() => {
    switch (item.kind) {
      case "asked":
        return t(I18nKey.TEAM_CHAT$ACT_ASKED, { agent: item.agentName });
      case "received":
        return t(I18nKey.TEAM_CHAT$ACT_RECEIVED, { name: item.askerName });
      case "agent_replied":
        return t(I18nKey.TEAM_CHAT$ACT_AGENT_REPLIED, {
          agent: item.agentName,
        });
      case "replied":
        return t(I18nKey.TEAM_CHAT$ACT_REPLIED);
      default:
        return t(I18nKey.TEAM_CHAT$ACT_POSTED);
    }
  })();
  const status =
    item.status === "waiting"
      ? t(I18nKey.TEAM_CHAT$ACT_WAITING)
      : item.status === "answered"
        ? t(I18nKey.TEAM_CHAT$ACT_ANSWERED)
        : null;
  return (
    <li
      data-testid="profile-activity"
      data-kind={item.kind}
      className="flex flex-col gap-1 rounded-lg border border-border bg-surface p-2.5"
    >
      <div className="flex items-center gap-2 text-xs text-muted">
        <span>{label}</span>
        {status && item.status ? (
          <span
            data-testid="profile-activity-status"
            data-status={item.status}
            className={cn(
              "rounded-full px-2 py-0.5",
              STATUS_STYLE[item.status],
            )}
          >
            {status}
          </span>
        ) : null}
        <time className="ml-auto">
          {new Date(item.at * 1000).toLocaleTimeString()}
        </time>
      </div>
      <p className="line-clamp-3 whitespace-pre-wrap break-words text-sm text-foreground">
        <FeedMentionText text={item.text} />
      </p>
    </li>
  );
}

/**
 * A team member's profile, in a panel beside the thread: who they are, how much they have been
 * doing, the agents they run (or who runs this agent), and their recent activity with agents.
 */
export function TeamMemberProfile({
  client,
  pubkey,
  onClose,
  onOpen,
}: {
  client: TeamClient;
  pubkey: string;
  onClose: () => void;
  onOpen: (pubkey: string) => void;
}) {
  const { t } = useTranslation("openhands");
  const progress = useTeamStore((s) => s.requests);
  const requestMention = useTeamChatUiStore((s) => s.requestMention);
  const members = client.members();
  const messages = client.messages();
  const profile = useMemo(
    () => memberProfile({ members, messages, pubkey, progress }),
    [members, messages, pubkey, progress],
  );
  if (!profile) return null;
  const { member } = profile;
  const isAgent = member.kind === "agent";
  const isMe = member.pubkey === client.account.pubkey;
  return (
    <aside
      data-testid="team-profile"
      aria-label={t(I18nKey.TEAM_CHAT$PROFILE_TITLE)}
      className="custom-scrollbar flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-l border-border p-4"
    >
      <div className="flex items-start gap-3">
        <MemberAvatar member={member} size={44} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-medium text-contrast">
            {member.name}
          </h2>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {isMe ? (
              <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted">
                {t(I18nKey.TEAM_CHAT$YOU)}
              </span>
            ) : null}
            {member.roles.includes("admin") ? (
              <span className="rounded-full bg-surface-raised px-2 py-0.5 text-xs text-muted">
                {t(I18nKey.TEAM_CHAT$ADMIN)}
              </span>
            ) : null}
            {member.agentRole ? (
              <FeedRoleBadge role={member.agentRole} />
            ) : null}
            {member.online !== undefined ? (
              <span className="text-xs text-muted">
                {t(
                  member.online
                    ? I18nKey.TEAM_CHAT$PRESENCE_ONLINE
                    : I18nKey.TEAM_CHAT$PRESENCE_AWAY,
                )}
              </span>
            ) : null}
          </div>
          <p className="mt-1 truncate font-mono text-xs text-muted">
            {shortNpub(member.pubkey)}
          </p>
        </div>
        <button
          type="button"
          data-testid="team-profile-close"
          aria-label={t(I18nKey.BUTTON$CLOSE)}
          className="rounded-full p-1 text-muted hover:bg-surface-raised hover:text-contrast"
          onClick={onClose}
        >
          <X size={16} aria-hidden />
        </button>
      </div>

      {isMe ? null : (
        <button
          type="button"
          data-testid="team-profile-message"
          className={primaryButtonClassName}
          onClick={() => requestMention(member.name)}
        >
          {t(I18nKey.TEAM_CHAT$PROFILE_MESSAGE, { name: member.name })}
        </button>
      )}

      <div className="flex gap-2">
        <Stat
          label={t(I18nKey.TEAM_CHAT$STAT_MESSAGES)}
          value={profile.stats.messages}
        />
        <Stat
          label={t(
            isAgent
              ? I18nKey.TEAM_CHAT$STAT_RECEIVED
              : I18nKey.TEAM_CHAT$STAT_REQUESTS,
          )}
          value={profile.stats.requests}
        />
        <Stat
          label={t(I18nKey.TEAM_CHAT$STAT_HANDLED)}
          value={profile.stats.handled}
        />
      </div>

      {isAgent && profile.owner ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-contrast">
            {t(I18nKey.TEAM_CHAT$PROFILE_OWNER)}
          </h3>
          <button
            type="button"
            data-testid="team-profile-owner"
            className="flex items-center gap-2 rounded-lg border border-border bg-surface p-2 text-left hover:bg-surface-raised"
            onClick={() => onOpen(profile.owner?.pubkey ?? "")}
          >
            <MemberAvatar member={profile.owner} />
            <span className="text-sm text-contrast">{profile.owner.name}</span>
          </button>
        </section>
      ) : null}

      {profile.agents.length > 0 ? (
        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium text-contrast">
            {t(I18nKey.TEAM_CHAT$PROFILE_AGENTS)}
          </h3>
          <ul className="flex flex-col gap-2">
            {profile.agents.map((a) => (
              <li key={a.member.pubkey}>
                <button
                  type="button"
                  data-testid="team-profile-agent"
                  className="flex w-full items-center gap-2 rounded-lg border border-border bg-surface p-2 text-left hover:bg-surface-raised"
                  onClick={() => onOpen(a.member.pubkey)}
                >
                  <MemberAvatar member={a.member} />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm text-contrast">
                      {a.member.name}
                    </span>
                    <span className="text-xs text-muted">
                      {t(I18nKey.TEAM_CHAT$AGENT_QUEUE, {
                        waiting: a.waiting,
                        handled: a.handled,
                      })}
                    </span>
                  </span>
                  {a.member.agentRole ? (
                    <FeedRoleBadge role={a.member.agentRole} />
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="flex flex-col gap-2">
        <h3 className="text-sm font-medium text-contrast">
          {t(I18nKey.TEAM_CHAT$PROFILE_ACTIVITY)}
        </h3>
        {profile.timeline.length === 0 ? (
          <p className="text-xs text-muted">{t(I18nKey.TEAM_CHAT$ACT_NONE)}</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {profile.timeline.map((item) => (
              <ActivityRow key={item.id} item={item} />
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
