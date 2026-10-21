import React from "react";
import { useTranslation } from "react-i18next";
import { I18nKey } from "#/i18n/declaration";
import type { OpenHandsEvent } from "#/types/agent-server/core";
import { useAgentSuggestionRail } from "#/hooks/chat/use-agent-suggestion-rail";
import { cn } from "#/utils/utils";

interface AgentSuggestionRailProps {
  /** Conversation events; the latest agent choice block supplies the pills. */
  events: OpenHandsEvent[];
  /** Hides the rail and its shortcuts (composer unavailable). */
  disabled?: boolean;
  /** The composer; the rail renders directly above it. */
  children: React.ReactNode;
}

/**
 * Pill row above the composer offering the options of the agent's latest
 * `choice` block. Picking one sends its label as the user's next message.
 */
export function AgentSuggestionRail({
  events,
  disabled = false,
  children,
}: AgentSuggestionRailProps) {
  const { t } = useTranslation("openhands");
  const {
    labels,
    activeIndex,
    wrapperRef,
    railRef,
    pillRefs,
    select,
    setActiveIndex,
    onKeyDownCapture,
  } = useAgentSuggestionRail(events, disabled);

  return (
    <div
      ref={wrapperRef}
      className="flex w-full flex-col gap-2"
      onKeyDownCapture={onKeyDownCapture}
    >
      {labels && (
        <div className="flex flex-col gap-1">
          <div
            ref={railRef}
            role="toolbar"
            aria-label={t(I18nKey.CHAT$SUGGESTION_RAIL_LABEL)}
            className="flex flex-wrap gap-2"
          >
            {labels.map((label, index) => {
              const number = index + 1;
              const isActive = index === activeIndex;
              return (
                <button
                  key={label}
                  ref={(node) => {
                    pillRefs.current[index] = node;
                  }}
                  type="button"
                  tabIndex={isActive ? 0 : -1}
                  data-active={isActive}
                  aria-label={t(I18nKey.CHAT$SUGGESTION_RAIL_OPTION_LABEL, {
                    number,
                    label,
                  })}
                  className={cn(
                    "flex max-w-full cursor-pointer items-center gap-2 rounded-full border px-3 py-1 text-sm text-contrast outline-none focus-visible:ring-2 focus-visible:ring-primary",
                    isActive
                      ? "border-primary bg-surface-raised"
                      : "border-border bg-transparent hover:bg-surface-raised",
                  )}
                  onClick={() => select(index)}
                  onFocus={() => setActiveIndex(index)}
                >
                  <kbd className="rounded bg-white/10 px-1.5 text-xs font-medium text-muted">
                    {number}
                  </kbd>
                  <span className="truncate">{label}</span>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted">
            {t(I18nKey.CHAT$SUGGESTION_RAIL_HINT)}
          </p>
        </div>
      )}
      {children}
    </div>
  );
}
