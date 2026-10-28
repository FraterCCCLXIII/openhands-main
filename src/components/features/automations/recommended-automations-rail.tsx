import {
  createElement,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import type { RecommendedAutomation } from "@openhands/extensions/automations";
import {
  INTEGRATION_CATALOG as MCP_MARKETPLACE,
  type IntegrationCatalogEntry as MarketplaceEntry,
} from "@openhands/extensions/integrations";
import { I18nKey } from "#/i18n/declaration";
import { McpLogoBadge } from "#/components/features/mcp-logo-badge";
import { getMarketplaceEntryById } from "#/utils/mcp-marketplace-utils";
import {
  getAutomationIcon,
  getIntegrationIds,
} from "#/utils/automation-catalog";
import {
  flattenRecommendedRailGroups,
  getRecommendedRailGroups,
} from "#/utils/recommended-automation-rail";
import { readScrollFadeState } from "#/utils/scroll-fade-state";
import { useDragScroll } from "#/hooks/use-drag-scroll";
import type { Automation } from "#/types/automation";
import { AUTOMATION_STACK_SECTION_BOTTOM_CLASS } from "#/utils/automation-stack-section";
import { cn } from "#/utils/utils";
import {
  extensionModuleCardInteractiveClassName,
  extensionModuleCardSurfaceClassName,
} from "#/utils/extension-module-card-classes";
import { Check, ChevronDown, MoreHorizontal, X } from "lucide-react";
import { useClickOutsideElement } from "#/hooks/use-click-outside-element";
import { useCloseOnEscape } from "#/hooks/use-close-on-escape";
import { hoverRevealActionClassName } from "#/utils/hover-reveal-classes";

interface RecommendedAutomationsRailProps {
  installedAutomations: readonly Pick<Automation, "name">[];
  /** Catalog entries the active backend's deployment does not offer. */
  hiddenAutomationIds?: ReadonlySet<string>;
  onSelect: (automation: RecommendedAutomation) => void;
  className?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

/** Current catalog tiles reserve 40px for the icon; keep that row height. */
const RAIL_ICON_ROW_CLASS_NAME = "flex h-10 items-start";

function integrationEntries(
  automation: RecommendedAutomation,
): MarketplaceEntry[] {
  return getIntegrationIds(automation).flatMap((id) => {
    const entry = getMarketplaceEntryById(id, MCP_MARKETPLACE);
    return entry ? [entry] : [];
  });
}

function RailIntegrationIcons({
  automation,
  entries,
  testId,
}: {
  automation: RecommendedAutomation;
  entries: MarketplaceEntry[];
  testId: string;
}) {
  const visibleEntries = entries.slice(0, 4);
  const isOverlap = visibleEntries.length > 1;
  // A declared glyph replaces the logos rather than joining them: it is the
  // whole identity of an entry that names one.
  const Icon = getAutomationIcon(automation);

  return (
    <span
      aria-hidden="true"
      data-testid={testId}
      data-layout={isOverlap && !Icon ? "overlap" : undefined}
      className={cn(
        RAIL_ICON_ROW_CLASS_NAME,
        isOverlap && !Icon && "-space-x-2",
      )}
    >
      {Icon ? (
        <McpLogoBadge
          entry={null}
          size="base"
          fallback={createElement(Icon, {
            className: "h-5 w-5",
            strokeWidth: 2.25,
          })}
        />
      ) : visibleEntries.length === 0 ? (
        <McpLogoBadge entry={null} size="base" />
      ) : (
        visibleEntries.map((entry) => (
          <McpLogoBadge
            key={entry.id}
            entry={entry}
            size="base"
            className={isOverlap ? "ring-2 ring-base-secondary" : undefined}
          />
        ))
      )}
    </span>
  );
}

type RailViewMode = "scroll" | "grid" | "list";

/** Three-dot menu: switches the rail's layout and removes it for the session. */
function RailViewMenu({
  viewMode,
  onViewModeChange,
  onRemove,
}: {
  viewMode: RailViewMode;
  onViewModeChange: (mode: RailViewMode) => void;
  onRemove: () => void;
}) {
  const { t } = useTranslation("openhands");
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setIsOpen(false), []);
  const menuRef = useClickOutsideElement<HTMLDivElement>(close, triggerRef);
  useCloseOnEscape(isOpen, close, triggerRef);

  const modes: { mode: RailViewMode; label: string }[] = [
    { mode: "scroll", label: t(I18nKey.RECOMMENDED_AUTOMATIONS$VIEW_SCROLL) },
    { mode: "grid", label: t(I18nKey.RECOMMENDED_AUTOMATIONS$VIEW_GRID) },
    { mode: "list", label: t(I18nKey.RECOMMENDED_AUTOMATIONS$VIEW_LIST) },
  ];

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        data-testid="recommended-automations-rail-menu"
        aria-label={t(I18nKey.COMMON$MORE_OPTIONS)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className={cn(
          "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-interactive-hover hover:text-content",
          hoverRevealActionClassName(isOpen),
        )}
      >
        <MoreHorizontal className="size-4" aria-hidden />
      </button>
      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          data-testid="recommended-automations-rail-menu-panel"
          className="absolute top-full right-0 z-20 mt-1 flex w-40 flex-col gap-0.5 rounded-md border border-border bg-surface p-1 shadow-lg"
        >
          {modes.map(({ mode, label }) => (
            <button
              key={mode}
              type="button"
              role="menuitemradio"
              aria-checked={viewMode === mode}
              onClick={() => {
                onViewModeChange(mode);
                close();
              }}
              className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-left text-sm text-foreground hover:bg-interactive-hover"
            >
              <span>{label}</span>
              {viewMode === mode && <Check className="size-3.5" aria-hidden />}
            </button>
          ))}
          <div className="my-1 border-t border-border-subtle" />
          <button
            type="button"
            role="menuitem"
            data-testid="recommended-automations-rail-remove"
            onClick={() => {
              close();
              onRemove();
            }}
            className="rounded px-2 py-1.5 text-left text-sm text-feedback-error hover:bg-interactive-hover"
          >
            {t(I18nKey.COMMON$REMOVE)}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * A title-only row for list mode. The chevron expands it to the full card,
 * which opens the automation on click like the card does in other modes.
 */
function RailListItem({
  automation,
  isExpanded,
  onToggle,
  onSelect,
}: {
  automation: RecommendedAutomation;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (automation: RecommendedAutomation) => void;
}) {
  return (
    <div
      role="listitem"
      data-testid={`recommended-automation-rail-row-${automation.id}`}
      className="flex flex-col"
    >
      <button
        type="button"
        aria-expanded={isExpanded}
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left transition-colors hover:bg-interactive-hover"
      >
        <span className="truncate text-sm font-medium text-contrast">
          {automation.name}
        </span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-muted transition-transform",
            isExpanded && "rotate-180",
          )}
          aria-hidden
        />
      </button>
      {isExpanded && (
        <button
          type="button"
          data-testid={`recommended-automation-rail-card-${automation.id}`}
          onClick={() => onSelect(automation)}
          className={cn(
            "mb-1 flex w-full flex-col gap-3 p-3 text-left",
            extensionModuleCardSurfaceClassName,
            extensionModuleCardInteractiveClassName,
          )}
        >
          <RailIntegrationIcons
            automation={automation}
            entries={integrationEntries(automation)}
            testId={`recommended-automation-rail-icon-${automation.id}`}
          />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-contrast">
              {automation.name}
            </h3>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-tertiary-light">
              {automation.description}
            </p>
          </div>
        </button>
      )}
    </div>
  );
}

export function RecommendedAutomationsRail({
  installedAutomations,
  hiddenAutomationIds,
  onSelect,
  className,
  dismissible = false,
  onDismiss,
}: RecommendedAutomationsRailProps) {
  const { t } = useTranslation("openhands");
  const items = flattenRecommendedRailGroups(
    getRecommendedRailGroups(installedAutomations, hiddenAutomationIds),
  );
  const [viewMode, setViewMode] = useState<RailViewMode>("scroll");
  const [isRemoved, setIsRemoved] = useState(false);
  const [expandedIds, setExpandedIds] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const toggleExpanded = (id: string) =>
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const scrollRef = useRef<HTMLDivElement>(null);
  const { handleMouseDown, handleClickCapture, handleDragStart } =
    useDragScroll(scrollRef);
  const [fadeState, setFadeState] = useState({ left: false, right: false });

  const updateFadeState = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;
    const next = readScrollFadeState(element);
    setFadeState((current) =>
      current.left === next.left && current.right === next.right
        ? current
        : next,
    );
  }, []);

  const itemIds = items.map((item) => item.id).join(",");

  useLayoutEffect(() => {
    updateFadeState();

    const element = scrollRef.current;
    if (!element) return undefined;

    const resizeObserver = new ResizeObserver(updateFadeState);
    resizeObserver.observe(element);
    Array.from(element.children).forEach((child) => {
      resizeObserver.observe(child);
    });

    return () => resizeObserver.disconnect();
  }, [updateFadeState, itemIds]);

  if (isRemoved || items.length === 0) return null;

  const isScroll = viewMode === "scroll";
  const listClassName = cn(
    "select-none",
    viewMode === "scroll" &&
      "flex flex-nowrap gap-3 overflow-x-auto scrollbar-hide",
    viewMode === "grid" && "flex flex-wrap gap-3",
    viewMode === "list" && "flex flex-col gap-2",
  );
  const cardWidthClassName = viewMode === "list" ? "w-full" : "w-55 shrink-0";

  return (
    <section
      data-testid="recommended-automations-rail"
      aria-label={t(I18nKey.RECOMMENDED_AUTOMATIONS$SECTION_LABEL)}
      className={cn(
        "group w-full",
        AUTOMATION_STACK_SECTION_BOTTOM_CLASS,
        className,
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h2 className="text-sm font-medium text-foreground">
          {t(I18nKey.RECOMMENDED_AUTOMATIONS$SECTION_LABEL)}
        </h2>
        <div className="flex items-center gap-1">
          <RailViewMenu
            viewMode={viewMode}
            onViewModeChange={setViewMode}
            onRemove={() => {
              setIsRemoved(true);
              onDismiss?.();
            }}
          />
          {/* @spec HL-002 — Named X, revealed on hover or focus, always visible on touch */}
          {dismissible && onDismiss && (
            <button
              type="button"
              data-testid="recommended-automations-rail-dismiss"
              aria-label={t(I18nKey.RECOMMENDED_AUTOMATIONS$DISMISS_LABEL)}
              onClick={onDismiss}
              className={cn(
                "inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted",
                "transition-opacity motion-reduce:transition-none hover:text-content",
                hoverRevealActionClassName(),
              )}
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      <div className="relative">
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- mouse drag-to-scroll is a pointer convenience; keyboard users scroll the list natively via the focusable cards. */}
        <div
          ref={scrollRef}
          role="list"
          data-testid="recommended-automations-rail-scroll"
          onScroll={updateFadeState}
          onMouseDown={handleMouseDown}
          onClickCapture={handleClickCapture}
          onDragStart={handleDragStart}
          className={listClassName}
        >
          {items.map((automation) =>
            viewMode === "list" ? (
              <RailListItem
                key={automation.id}
                automation={automation}
                isExpanded={expandedIds.has(automation.id)}
                onToggle={() => toggleExpanded(automation.id)}
                onSelect={onSelect}
              />
            ) : (
              <div key={automation.id} role="listitem">
                <button
                  type="button"
                  data-testid={`recommended-automation-rail-card-${automation.id}`}
                  onClick={() => onSelect(automation)}
                  className={cn(
                    cn("flex flex-col gap-3 p-3 text-left", cardWidthClassName),
                    extensionModuleCardSurfaceClassName,
                    extensionModuleCardInteractiveClassName,
                  )}
                >
                  <RailIntegrationIcons
                    automation={automation}
                    entries={integrationEntries(automation)}
                    testId={`recommended-automation-rail-icon-${automation.id}`}
                  />
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-contrast">
                      {automation.name}
                    </h3>
                    <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-tertiary-light">
                      {automation.description}
                    </p>
                  </div>
                </button>
              </div>
            ),
          )}
        </div>
        {isScroll && (
          <div
            aria-hidden
            data-testid="recommended-automations-rail-fade-left"
            data-visible={fadeState.left ? "true" : "false"}
            className={cn(
              "pointer-events-none absolute inset-y-0 left-0 z-10 w-10",
              "bg-gradient-to-r from-[var(--oh-scroll-fade-from,var(--oh-color-base))] to-transparent",
              "transition-opacity duration-300 ease-out motion-reduce:transition-none",
              fadeState.left ? "opacity-100" : "opacity-0",
            )}
          />
        )}
        {isScroll && (
          <div
            aria-hidden
            data-testid="recommended-automations-rail-fade-right"
            data-visible={fadeState.right ? "true" : "false"}
            className={cn(
              "pointer-events-none absolute inset-y-0 right-0 z-10 w-10",
              "bg-gradient-to-l from-[var(--oh-scroll-fade-from,var(--oh-color-base))] to-transparent",
              "transition-opacity duration-300 ease-out motion-reduce:transition-none",
              fadeState.right ? "opacity-100" : "opacity-0",
            )}
          />
        )}
      </div>
    </section>
  );
}
