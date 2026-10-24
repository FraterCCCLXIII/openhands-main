import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import type { FeedAgentRole, FeedAgentRoleKey } from "#/utils/feed-agent-role";
import { cn } from "#/utils/utils";

const ROLE_LABEL: Record<FeedAgentRoleKey, I18nKey> = {
  conductor: I18nKey.FEED$AGENT_ROLE_CONDUCTOR,
  dispatcher: I18nKey.FEED$AGENT_ROLE_DISPATCHER,
  worker: I18nKey.FEED$AGENT_ROLE_WORKER,
  verifier: I18nKey.FEED$AGENT_ROLE_VERIFIER,
  janitor: I18nKey.FEED$AGENT_ROLE_JANITOR,
  scout: I18nKey.FEED$AGENT_ROLE_SCOUT,
};

const ROLE_STYLE: Record<FeedAgentRoleKey, string> = {
  conductor: "bg-amber-500/15 text-amber-300",
  dispatcher: "bg-slate-500/20 text-slate-300",
  worker: "bg-sky-500/15 text-sky-300",
  verifier: "bg-emerald-500/15 text-emerald-300",
  janitor: "bg-teal-500/15 text-teal-300",
  scout: "bg-violet-500/15 text-violet-300",
};

/** The agent's orchestration role, with its model tier (e.g. "Worker · T3 Opus"). */
export function FeedRoleBadge({ role }: { role: FeedAgentRole }) {
  const { t } = useTranslation("openhands");
  return (
    <span
      data-testid="feed-role-badge"
      data-role={role.role}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-normal",
        ROLE_STYLE[role.role],
      )}
    >
      {t(ROLE_LABEL[role.role])}
      {role.tier ? (
        <span data-testid="feed-role-tier" className="opacity-80">
          {`· T${role.tier} ${role.model}`}
        </span>
      ) : null}
    </span>
  );
}
