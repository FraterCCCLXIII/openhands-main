import { useState } from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import { PLANNING_VIEWS, VIEW_LABEL_KEYS } from "#/planning/constants";
import type { PlanningView } from "#/planning/types";
import { cn } from "#/utils/utils";
import { CreateSprintForm, CreateTicketForm } from "./create-forms";
import { GanttView } from "./gantt-view";
import { KanbanView } from "./kanban-view";
import { SprintView } from "./sprint-view";
import { TicketPanel } from "./ticket-panel";

type CreateMode = "ticket" | "sprint" | null;

export function PlanningBoard() {
  const { t } = useTranslation("openhands");
  const [view, setView] = useState<PlanningView>("board");
  const [createMode, setCreateMode] = useState<CreateMode>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  const actionClass =
    "rounded border border-border px-3 py-1 text-sm text-content hover:bg-interactive-hover";

  return (
    <div className="flex h-full flex-col gap-4 overflow-auto p-6">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="font-inter text-xl font-normal text-content">
          {t(I18nKey.PLANNING$TITLE)}
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            className={actionClass}
            onClick={() => setCreateMode("ticket")}
          >
            {t(I18nKey.PLANNING$NEW_TICKET)}
          </button>
          <button
            type="button"
            className={actionClass}
            onClick={() => setCreateMode("sprint")}
          >
            {t(I18nKey.PLANNING$NEW_SPRINT)}
          </button>
        </div>
      </header>

      {createMode === "ticket" && (
        <CreateTicketForm
          onDone={(createdId) => {
            if (createdId) setSelectedTicketId(createdId);
            setCreateMode(null);
          }}
        />
      )}
      {createMode === "sprint" && (
        <CreateSprintForm onDone={() => setCreateMode(null)} />
      )}

      <div
        role="tablist"
        aria-label={t(I18nKey.PLANNING$TABS_LABEL)}
        className="flex gap-1 border-b border-border"
      >
        {PLANNING_VIEWS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={view === value}
            onClick={() => setView(value)}
            className={cn(
              "px-3 py-2 text-sm",
              view === value
                ? "border-b-2 border-primary text-content"
                : "text-muted hover:text-content",
            )}
          >
            {t(VIEW_LABEL_KEYS[value])}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 items-start gap-4">
        <div role="tabpanel" className="min-w-0 flex-1 overflow-x-auto">
          {view === "board" && (
            <KanbanView
              selectedTicketId={selectedTicketId}
              onSelectTicket={setSelectedTicketId}
            />
          )}
          {view === "sprint" && (
            <SprintView onSelectTicket={setSelectedTicketId} />
          )}
          {view === "timeline" && (
            <GanttView onSelectTicket={setSelectedTicketId} />
          )}
        </div>
        {selectedTicketId && (
          <TicketPanel
            ticketId={selectedTicketId}
            onClose={() => setSelectedTicketId(null)}
          />
        )}
      </div>
    </div>
  );
}
