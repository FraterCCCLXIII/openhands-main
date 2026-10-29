import { Activity, Info, Pencil, Plus } from "lucide-react";
import { useTranslation } from "react-i18next";
import { FeedRoleBadge } from "#/components/features/feed/feed-role-badge";
import { I18nKey } from "#/i18n/declaration";
import { getDemoAgentRole } from "#/utils/feed-agent-role";
import type { FactoryTarget } from "#/utils/factory-routing";
import { cn } from "#/utils/utils";
import { StyledTooltip } from "#/components/shared/buttons/styled-tooltip";
import { FeedIconTile } from "#/components/features/feed/feed-icon-tile";
import type { RosterAgent } from "./factory-routing-context";

interface FactoryAgentRailProps {
  coordinator: RosterAgent;
  others: RosterAgent[];
  target: FactoryTarget;
  onTarget: (target: FactoryTarget) => void;
  onAdd: () => void;
  onEdit: (agentName: string) => void;
}

function AgentButton({
  entry,
  selected,
  onSelect,
  onEdit,
  large = false,
}: {
  entry: RosterAgent;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  large?: boolean;
}) {
  const { t } = useTranslation("openhands");
  const { agent, live } = entry;
  const { Icon } = agent;
  return (
    <div className="group relative">
      <button
        type="button"
        data-testid={large ? "factory-coordinator" : "factory-agent"}
        data-agent={agent.name}
        aria-pressed={selected}
        onClick={onSelect}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-lg px-1 py-3 text-center",
        )}
      >
        <span
          className={cn(
            "shrink-0 rounded-xl",
            large ? "size-12" : "size-10",
            selected &&
              "ring-2 ring-focus ring-offset-2 ring-offset-canvas-base",
          )}
        >
          <FeedIconTile className={agent.className}>
            <Icon size={large ? 24 : 20} />
          </FeedIconTile>
        </span>
        <span className="truncate text-sm font-medium text-foreground">
          {agent.name}
        </span>
        <FeedRoleBadge role={getDemoAgentRole(agent)} />
        <StyledTooltip
          content={t(I18nKey.FEED$FACTORY_LIVE, { count: live })}
          placement="bottom"
        >
          <span
            data-testid="factory-agent-live"
            aria-label={t(I18nKey.FEED$FACTORY_LIVE, { count: live })}
            className={cn(
              "flex items-center gap-1 text-xs text-muted",
              live > 0 && "text-success",
            )}
          >
            <Activity size={12} aria-hidden />
            {live}
          </span>
        </StyledTooltip>
      </button>
      <button
        type="button"
        data-testid="factory-edit-agent"
        aria-label={t(I18nKey.FACTORY$EDIT_AGENT)}
        onClick={onEdit}
        className="absolute right-1.5 top-1.5 flex size-6 items-center justify-center rounded-md text-muted opacity-0 hover:bg-base-secondary hover:text-contrast focus-visible:opacity-100 group-hover:opacity-100"
      >
        <Pencil size={12} aria-hidden />
      </button>
    </div>
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
  onAdd,
  onEdit,
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
        className="shrink-0 md:w-44"
      >
        <div className="flex items-center gap-1">
          <h2 className="text-xs font-semibold uppercase text-muted">
            {t(I18nKey.FACTORY$COORDINATOR)}
          </h2>
          <StyledTooltip
            content={t(I18nKey.FACTORY$COORDINATOR_HINT)}
            placement="bottom"
          >
            <span
              data-testid="factory-coordinator-info"
              role="img"
              tabIndex={0}
              aria-label={t(I18nKey.FACTORY$COORDINATOR_HINT)}
              className="flex text-muted hover:text-contrast"
            >
              <Info size={12} aria-hidden />
            </span>
          </StyledTooltip>
        </div>
        <div className="mt-2">
          <AgentButton
            large
            entry={coordinator}
            selected={target.kind === "inbox"}
            onSelect={() => onTarget({ kind: "inbox" })}
            onEdit={() => onEdit(coordinator.agent.name)}
          />
        </div>
      </section>
      <section className="flex min-w-0 flex-1 flex-col">
        <div className="mb-1 flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold uppercase text-muted">
            {t(I18nKey.FEED$AGENTS)}
          </h2>
          <button
            type="button"
            data-testid="factory-add-agent"
            onClick={onAdd}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs text-muted hover:bg-surface-raised hover:text-contrast"
          >
            <Plus size={12} aria-hidden />
            {t(I18nKey.FACTORY$ADD_AGENT)}
          </button>
        </div>
        {others.length === 0 ? (
          <p className="px-1 text-xs text-muted">
            {t(I18nKey.AUTOMATE$FACTORY_EMPTY)}
          </p>
        ) : (
          <ul className="custom-scrollbar flex gap-2 overflow-x-auto pb-1">
            {others.map((entry) => (
              <li key={entry.agent.name} className="w-40 shrink-0">
                <AgentButton
                  entry={entry}
                  selected={isTargeted(entry.agent.name)}
                  onSelect={() =>
                    onTarget({ kind: "agent", agentName: entry.agent.name })
                  }
                  onEdit={() => onEdit(entry.agent.name)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
