import { useCallback, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { RefObject } from "react";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import type { ConversationMinimapSegment } from "./build-conversation-minimap-segments";
import { useConversationMinimapScrollRegistration } from "./conversation-minimap-context";
import { useConversationMinimapSegments } from "./use-conversation-minimap-segments";
import { useOptionalConversationId } from "#/hooks/use-conversation-id";
import {
  CONVERSATION_MINIMAP_BAR_HEIGHT_PX,
  CONVERSATION_MINIMAP_BAR_HOVER_HEIGHT_PX,
  CONVERSATION_MINIMAP_TRACK_WIDTH_PX,
  agentResponseLengthToMinimapBarWidthPx,
  minimapBarHoverWidthPx,
} from "./conversation-minimap-metrics";
import { scrollToConversationTurn } from "./conversation-minimap-turn";
import { scrollMinimapPanelItemIntoView } from "./scroll-minimap-panel-item-into-view";
import { ConversationMinimapVerticalScroll } from "./conversation-minimap-vertical-scroll";

interface ConversationMinimapProps {
  segments: readonly ConversationMinimapSegment[];
  scrollContainerRef: RefObject<HTMLElement | null>;
  navigateToTurn?: (userEventId: string) => void | Promise<void>;
  testId?: string;
}

const HOVER_PANEL_WIDTH_PX = 260;
const HOVER_PANEL_MAX_HEIGHT_CLASS = "max-h-[min(420px,70vh)]";

function getSegmentPreview(
  segment: ConversationMinimapSegment,
  emptyPreview: string,
): string {
  return segment.userPreview.length > 0 ? segment.userPreview : emptyPreview;
}

const MINIMAP_BAR_TRANSITION_CLASS =
  "transition-[width,height,background-color] duration-200 ease-[cubic-bezier(0.34,1.28,0.64,1)] motion-reduce:transition-none";

function MinimapBar({
  segment,
  isActive,
  onActivate,
  onSelect,
}: {
  segment: ConversationMinimapSegment;
  isActive: boolean;
  onActivate: (userEventId: string) => void;
  onSelect: (userEventId: string) => void;
}) {
  const { t } = useTranslation("openhands");
  const barWidthPx = agentResponseLengthToMinimapBarWidthPx(
    segment.agentResponseLength,
  );
  const hoverWidthPx = minimapBarHoverWidthPx(barWidthPx);
  const preview = getSegmentPreview(
    segment,
    t(I18nKey.CHAT_INTERFACE$MINIMAP_EMPTY_PREVIEW),
  );

  return (
    <button
      type="button"
      data-testid={`conversation-minimap-bar-${segment.userEventId}`}
      aria-label={preview}
      className="group/minimap-bar flex w-full items-center justify-end rounded-sm px-[2px] py-[3px] focus:outline-none focus-visible:ring-1 focus-visible:ring-[var(--oh-focus)]"
      onPointerEnter={() => onActivate(segment.userEventId)}
      onFocus={() => onActivate(segment.userEventId)}
      onClick={() => onSelect(segment.userEventId)}
    >
      <span
        aria-hidden="true"
        className={cn(
          "block h-[var(--minimap-bar-height)] w-[var(--minimap-bar-width)] shrink-0 rounded-[1px] bg-white/25",
          MINIMAP_BAR_TRANSITION_CLASS,
          "group-hover/minimap-bar:h-[var(--minimap-bar-hover-height)] group-hover/minimap-bar:w-[var(--minimap-bar-hover-width)] group-hover/minimap-bar:bg-white",
          "group-focus-visible/minimap-bar:h-[var(--minimap-bar-hover-height)] group-focus-visible/minimap-bar:w-[var(--minimap-bar-hover-width)] group-focus-visible/minimap-bar:bg-white",
          isActive &&
            "h-[var(--minimap-bar-hover-height)] w-[var(--minimap-bar-hover-width)] bg-white",
        )}
        style={{
          ["--minimap-bar-width" as string]: `${barWidthPx}px`,
          ["--minimap-bar-hover-width" as string]: `${hoverWidthPx}px`,
          ["--minimap-bar-height" as string]: `${CONVERSATION_MINIMAP_BAR_HEIGHT_PX}px`,
          ["--minimap-bar-hover-height" as string]: `${CONVERSATION_MINIMAP_BAR_HOVER_HEIGHT_PX}px`,
        }}
      />
    </button>
  );
}

function MinimapHoverPanel({
  listId,
  segments,
  activeSegmentId,
  onActivate,
  onSelect,
}: {
  listId: string;
  segments: readonly ConversationMinimapSegment[];
  activeSegmentId: string | null;
  onActivate: (userEventId: string) => void;
  onSelect: (userEventId: string) => void;
}) {
  const { t } = useTranslation("openhands");
  const emptyPreview = t(I18nKey.CHAT_INTERFACE$MINIMAP_EMPTY_PREVIEW);
  const panelScrollRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  useEffect(() => {
    if (!activeSegmentId || !panelScrollRef.current) {
      return;
    }

    const activeItem = itemRefs.current.get(activeSegmentId);
    if (!activeItem) {
      return;
    }

    scrollMinimapPanelItemIntoView(panelScrollRef.current, activeItem);
  }, [activeSegmentId, segments]);

  const observeKey = segments.map((segment) => segment.userEventId).join(",");

  return (
    <ConversationMinimapVerticalScroll
      ref={panelScrollRef}
      testId="conversation-minimap-hover-panel"
      fadeTestIdPrefix="conversation-minimap-hover-panel"
      observeKey={observeKey}
      showScrollbar
      className={cn(
        "shrink-0 overflow-hidden rounded-xl border border-[var(--oh-border)]",
        "bg-base-secondary shadow-xl [--oh-scroll-fade-from:var(--oh-color-base-secondary)]",
      )}
      scrollClassName={cn(HOVER_PANEL_MAX_HEIGHT_CLASS, "px-1 py-1")}
      style={{ width: HOVER_PANEL_WIDTH_PX }}
      id={listId}
      role="listbox"
      aria-label={t(I18nKey.CHAT_INTERFACE$MINIMAP_LABEL, {
        count: segments.length,
      })}
    >
      {segments.map((segment) => {
        const preview = getSegmentPreview(segment, emptyPreview);
        const isActive = activeSegmentId === segment.userEventId;
        return (
          <button
            key={segment.userEventId}
            type="button"
            role="option"
            aria-selected={isActive}
            data-testid={`conversation-minimap-hover-item-${segment.userEventId}`}
            ref={(node) => {
              if (node) {
                itemRefs.current.set(segment.userEventId, node);
              } else {
                itemRefs.current.delete(segment.userEventId);
              }
            }}
            className={cn(
              "flex w-full rounded-lg px-3 py-2 text-left text-xs leading-relaxed",
              isActive
                ? "bg-white/10 text-white"
                : "text-white/80 hover:bg-white/5 hover:text-white",
            )}
            onPointerEnter={() => onActivate(segment.userEventId)}
            onFocus={() => onActivate(segment.userEventId)}
            onClick={() => onSelect(segment.userEventId)}
          >
            <span className="min-w-0 flex-1 line-clamp-3">{preview}</span>
          </button>
        );
      })}
    </ConversationMinimapVerticalScroll>
  );
}

/**
 * Vertical minimap of conversation turns. Hovering the strip opens one shared
 * scrollable panel listing every turn; clicking a bar or panel row scrolls
 * to that turn.
 */
export function ConversationMinimap({
  segments,
  scrollContainerRef,
  navigateToTurn,
  testId = "conversation-minimap",
}: ConversationMinimapProps) {
  const { t } = useTranslation("openhands");
  const listId = useId();
  const hoverZoneRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveSegmentId(null);
  }, []);

  const activateSegment = useCallback((userEventId: string) => {
    setActiveSegmentId(userEventId);
  }, []);

  const selectSegment = useCallback(
    (userEventId: string) => {
      setActiveSegmentId(userEventId);
      if (navigateToTurn) {
        void navigateToTurn(userEventId);
        return;
      }
      scrollToConversationTurn(scrollContainerRef.current, userEventId);
    },
    [navigateToTurn, scrollContainerRef],
  );

  const handlePointerLeave = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const nextTarget = event.relatedTarget;
      if (
        nextTarget instanceof Node &&
        hoverZoneRef.current?.contains(nextTarget)
      ) {
        return;
      }
      close();
    },
    [close],
  );

  if (segments.length === 0) {
    return null;
  }

  const segmentObserveKey = segments
    .map((segment) => segment.userEventId)
    .join(",");

  return (
    <aside
      data-testid={testId}
      aria-label={t(I18nKey.CHAT_INTERFACE$MINIMAP_LABEL, {
        count: segments.length,
      })}
      className="pointer-events-none absolute inset-y-0 right-0 z-10 hidden md:flex md:items-center md:justify-end md:py-16"
    >
      <div
        ref={hoverZoneRef}
        className="pointer-events-auto flex items-center gap-2"
        onPointerEnter={() => setIsOpen(true)}
        onPointerLeave={handlePointerLeave}
      >
        {isOpen ? (
          <MinimapHoverPanel
            listId={listId}
            segments={segments}
            activeSegmentId={activeSegmentId}
            onActivate={activateSegment}
            onSelect={selectSegment}
          />
        ) : null}

        <ConversationMinimapVerticalScroll
          testId="conversation-minimap-track-scroll"
          fadeTestIdPrefix="conversation-minimap-track"
          observeKey={segmentObserveKey}
          className="[--oh-scroll-fade-from:var(--oh-color-base)]"
          scrollClassName="max-h-[min(420px,70vh)] pb-2 pt-0 pl-0 pr-1"
          style={{ width: CONVERSATION_MINIMAP_TRACK_WIDTH_PX }}
        >
          <div className="flex flex-col gap-0.5 mt-auto mb-auto [&>button:first-child]:-mt-0.5">
            {segments.map((segment) => (
              <MinimapBar
                key={segment.userEventId}
                segment={segment}
                isActive={activeSegmentId === segment.userEventId}
                onActivate={activateSegment}
                onSelect={selectSegment}
              />
            ))}
          </div>
        </ConversationMinimapVerticalScroll>
      </div>
    </aside>
  );
}

/** Renders the minimap at the far right of the chat pane (see ChatInterfaceWrapper). */
export function ConversationMinimapHost() {
  const { conversationId } = useOptionalConversationId();
  const scrollRegistration = useConversationMinimapScrollRegistration();
  const segments = useConversationMinimapSegments(conversationId);

  if (
    !scrollRegistration?.visible ||
    !scrollRegistration.scrollContainerRef ||
    segments.length === 0
  ) {
    return null;
  }

  return (
    <ConversationMinimap
      segments={segments}
      scrollContainerRef={scrollRegistration.scrollContainerRef}
      navigateToTurn={scrollRegistration.navigateToTurn}
    />
  );
}
