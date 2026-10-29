import { useTranslation } from "react-i18next";
import { FeedRoleBadge } from "#/components/features/feed/feed-role-badge";
import { I18nKey } from "#/i18n/declaration";
import { getDemoAgentRole } from "#/utils/feed-agent-role";
import type { FactoryTarget } from "#/utils/factory-routing";
import { cn } from "#/utils/utils";
import { FeedIconTile } from "#/components/features/feed/feed-icon-tile";
import type { RosterAgent } from "./factory-routing-context";

interface FactoryAgentRailProps {
  coordinator: RosterAgent;
  others: RosterAgent[];
  target: FactoryTarget;
  onTarget: (target: FactoryTarget) => void;
}

function AgentButton({
  entry,
  selected,
  onSelect,
  large = false,
}: {
  entry: RosterAgent;
  selected: boolean;
  onSelect: () => void;
  large?: boolean;
}) {
  const { t } = useTranslation("openhands");
  const { agent, conversations, live } = entry;
  const { Icon } = agent;
  return (
    <button
      type="button"
      data-testid={large ? "factory-coordinator" : "factory-agent"}
      data-agent={agent.name}
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-raised",
        !large && "border border-border",
        selected && "bg-surface-raised ring-1 ring-focus",
      )}
    >
      <span className={cn("shrink-0", large ? "size-11" : "size-8")}>
        <FeedIconTile className={agent.className}>
          <Icon size={large ? 22 : 16} />
        </FeedIconTile>
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="truncate text-sm font-medium text-foreground">
            {agent.name}
          </span>
          {live > 0 ? (
            <span
              aria-label={t(I18nKey.FEED$FACTORY_LIVE, { count: live })}
              className="size-1.5 shrink-0 rounded-full bg-success"
            />
          ) : null}
        </span>
        <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted">
          <FeedRoleBadge role={getDemoAgentRole(agent)} />
          <span>
            {t(I18nKey.FEED$FACTORY_CONVERSATIONS, { count: conversations })}
          </span>
        </span>
      </span>
    </button>
  );
}

/**
 * Every agent working in a factory as a rail: the coordinator in its own spot
 * first, then the other agents side by side, scrolling when there are many.
 */
export function FactoryAgentRail({
  coordinator,
  others,
  target,
  onTarget,
}: FactoryAgentRailProps) {
  const { t } = useTranslation("openhands");
  const isTargeted = (name: string) =>
    target.kind === "agent" && target.agentName === name;

  return (
    <aside
      data-testid="factory-agent-rail"
      className="flex flex-col gap-3 md:flex-row md:items-stretch"
    >
      <section
        data-testid="factory-coordinator-spot"
        className="shrink-0 rounded-xl border border-border bg-surface-raised p-3 md:w-64"
      >
        <h2 className="text-xs font-semibold uppercase text-muted">
          {t(I18nKey.FACTORY$COORDINATOR)}
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          {t(I18nKey.FACTORY$COORDINATOR_HINT)}
        </p>
        <div className="mt-2">
          <AgentButton
            large
            entry={coordinator}
            selected={target.kind === "inbox"}
            onSelect={() => onTarget({ kind: "inbox" })}
          />
        </div>
      </section>
      <section className="flex min-w-0 flex-1 flex-col">
        <h2 className="mb-1 px-1 text-xs font-semibold uppercase text-muted">
          {t(I18nKey.FEED$AGENTS)}
        </h2>
        {others.length === 0 ? (
          <p className="px-1 text-xs text-muted">
            {t(I18nKey.AUTOMATE$FACTORY_EMPTY)}
          </p>
        ) : (
          <ul className="custom-scrollbar flex gap-2 overflow-x-auto pb-1">
            {others.map((entry) => (
              <li key={entry.agent.name} className="w-56 shrink-0">
                <AgentButton
                  entry={entry}
                  selected={isTargeted(entry.agent.name)}
                  onSelect={() =>
                    onTarget({ kind: "agent", agentName: entry.agent.name })
                  }
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
