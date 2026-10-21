import React from "react";
import { useTranslation } from "react-i18next";
import { GripVertical, LayoutGrid } from "lucide-react";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { I18nKey } from "#/i18n/declaration";
import { ToggleSwitch } from "#/ui/toggle-switch";
import {
  HOME_DASHBOARD_REORDERABLE_IDS,
  useHomeDashboardVisibilityStore,
  type HomeDashboardComponentId,
  type HomeDashboardReorderableId,
} from "#/stores/home-dashboard-visibility-store";

const COMPONENT_LABEL_KEYS: Record<HomeDashboardComponentId, I18nKey> = {
  learnResources: I18nKey.HOME$DASHBOARD_LEARN_RESOURCES,
  recommendedAutomations: I18nKey.HOME$DASHBOARD_RECOMMENDED_AUTOMATIONS,
  pinnedAutomations: I18nKey.HOME$DASHBOARD_PINNED_AUTOMATIONS,
  runningAutomations: I18nKey.HOME$DASHBOARD_RUNNING_AUTOMATIONS,
};

const isReorderable = (
  id: HomeDashboardComponentId,
): id is HomeDashboardReorderableId =>
  (HOME_DASHBOARD_REORDERABLE_IDS as readonly string[]).includes(id);

/**
 * Lists each home dashboard component with a toggle to show or hide it. Drag
 * the grip on a reorderable section to change its position on the dashboard.
 */
export function HomeDashboardComponentsMenu() {
  const { t } = useTranslation("openhands");
  const [open, setOpen] = React.useState(false);
  const [draggedId, setDraggedId] =
    React.useState<HomeDashboardReorderableId | null>(null);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = useClickOutsideElement<HTMLDivElement>(
    () => setOpen(false),
    anchorRef,
  );
  const hiddenIds = useHomeDashboardVisibilityStore((state) => state.hiddenIds);
  const order = useHomeDashboardVisibilityStore((state) => state.order);
  const setHidden = useHomeDashboardVisibilityStore((state) => state.setHidden);
  const moveTo = useHomeDashboardVisibilityStore((state) => state.moveTo);

  const handleDrop = (targetId: HomeDashboardReorderableId) => {
    if (!draggedId || draggedId === targetId) return;
    moveTo(draggedId, order.indexOf(targetId));
    setDraggedId(null);
  };

  const renderRow = (id: HomeDashboardComponentId) => {
    const label = t(COMPONENT_LABEL_KEYS[id]);
    const reorderable = isReorderable(id);
    return (
      <div
        key={id}
        data-testid={`home-dashboard-row-${id}`}
        onDragOver={(event) => {
          if (reorderable && draggedId) event.preventDefault();
        }}
        onDrop={(event) => {
          event.preventDefault();
          if (reorderable) handleDrop(id);
        }}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-contrast hover:bg-surface-raised"
      >
        {reorderable ? (
          <button
            type="button"
            draggable
            data-testid={`home-dashboard-grip-${id}`}
            aria-label={`${t(I18nKey.HOME$DASHBOARD_REORDER)}: ${label}`}
            onDragStart={(event) => {
              const { dataTransfer } = event;
              dataTransfer.effectAllowed = "move";
              setDraggedId(id);
            }}
            onDragEnd={() => setDraggedId(null)}
            className="flex size-6 shrink-0 cursor-grab items-center justify-center rounded text-muted hover:text-contrast active:cursor-grabbing"
          >
            <GripVertical aria-hidden className="size-4" />
          </button>
        ) : (
          <span aria-hidden className="size-6 shrink-0" />
        )}
        <span className="flex-1">{label}</span>
        <ToggleSwitch
          enabled={!hiddenIds[id]}
          label={label}
          onToggle={() => setHidden(id, !hiddenIds[id])}
        />
      </div>
    );
  };

  return (
    <div className="relative flex justify-end">
      <button
        ref={anchorRef}
        type="button"
        data-testid="home-dashboard-components-trigger"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-md px-2 py-1 text-sm text-muted hover:bg-surface-raised hover:text-contrast"
      >
        <LayoutGrid aria-hidden className="size-4" />
        {t(I18nKey.HOME$DASHBOARD_COMPONENTS)}
      </button>
      {open ? (
        <div
          ref={menuRef}
          data-testid="home-dashboard-components-menu"
          className="absolute top-full right-0 z-50 mt-1 min-w-64 rounded-xl border border-border-subtle bg-tertiary p-2 shadow-lg"
        >
          {renderRow("learnResources")}
          {order.map(renderRow)}
        </div>
      ) : null}
    </div>
  );
}
