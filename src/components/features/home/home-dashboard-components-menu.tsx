import React from "react";
import { useTranslation } from "react-i18next";
import { LayoutGrid } from "lucide-react";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { useReorderDrag } from "#/components/shared/use-reorder-drag";
import { ReorderGrip } from "#/components/shared/reorder-grip";
import { useFlipReorder } from "#/components/shared/use-flip-reorder";
import { cn } from "#/utils/utils";
import { I18nKey } from "#/i18n/declaration";
import { getHomeDashboardWidget } from "./home-dashboard-widgets";
import { ToggleSwitch } from "#/ui/toggle-switch";
import {
  isHomeDashboardComponentHidden,
  useHomeDashboardVisibilityStore,
} from "#/stores/home-dashboard-visibility-store";

/**
 * Lists each home dashboard component with a toggle to show or hide it. Drag
 * the grip to change the order; rows are separated by hairlines.
 */
export function HomeDashboardComponentsMenu() {
  const { t } = useTranslation("openhands");
  const [open, setOpen] = React.useState(false);
  const anchorRef = React.useRef<HTMLButtonElement>(null);
  const menuRef = useClickOutsideElement<HTMLDivElement>(
    () => setOpen(false),
    anchorRef,
  );
  const visibility = useHomeDashboardVisibilityStore((state) => state);
  const order = useHomeDashboardVisibilityStore((state) => state.order);
  const setHidden = useHomeDashboardVisibilityStore((state) => state.setHidden);
  const moveTo = useHomeDashboardVisibilityStore((state) => state.moveTo);
  const { draggedId, overId, gripProps, rowProps } = useReorderDrag(
    order,
    moveTo,
  );
  const listRef = useFlipReorder<HTMLDivElement>(order, open);

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
          ref={(node) => {
            menuRef.current = node;
            listRef.current = node;
          }}
          data-testid="home-dashboard-components-menu"
          className="absolute top-full right-0 z-50 mt-1 min-w-64 divide-y divide-border-subtle rounded-xl border border-border-subtle bg-tertiary px-2 shadow-lg"
        >
          {order.map((id) => {
            const label = t(getHomeDashboardWidget(id).labelKey);
            const hidden = isHomeDashboardComponentHidden(visibility, id);
            return (
              <div
                key={id}
                data-testid={`home-dashboard-row-${id}`}
                data-flip-id={id}
                {...rowProps(id)}
                className={cn(
                  "flex items-center gap-2 py-1.5 text-sm text-contrast",
                  draggedId === id && "opacity-40",
                  draggedId &&
                    overId === id &&
                    draggedId !== id &&
                    (order.indexOf(draggedId) < order.indexOf(id)
                      ? "shadow-[inset_0_-2px_0_0_var(--oh-focus)]"
                      : "shadow-[inset_0_2px_0_0_var(--oh-focus)]"),
                )}
              >
                <ReorderGrip
                  data-testid={`home-dashboard-grip-${id}`}
                  label={`${t(I18nKey.HOME$DASHBOARD_REORDER)}: ${label}`}
                  {...gripProps(id)}
                />
                <span className="flex-1">{label}</span>
                <ToggleSwitch
                  enabled={!hidden}
                  label={label}
                  size="sm"
                  onToggle={() => setHidden(id, !hidden)}
                />
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
