import React from "react";
import { useTranslation } from "react-i18next";
import { LoaderCircle } from "lucide-react";
import { OpenHandsEvent, ActionEvent } from "#/types/agent-server/core";
import {
  isActionEvent,
  isAgentErrorEvent,
  isObservationEvent,
  isUserRejectObservation,
} from "#/types/agent-server/type-guards";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { getEventContent } from "../event-content-helpers/get-event-content";
import { IsInEventGroupContext } from "../../../features/chat/is-in-event-group-context";
import { PathInteractiveContext } from "../../../features/chat/path-component";
import { ExpandChevron } from "#/components/shared/expand-chevron";
import { RotatingStatus } from "#/components/shared/rotating-status";
import { SkeletonLines } from "#/components/shared/skeleton-lines";
import { TokenMeter } from "#/components/shared/token-meter";
import { TurnDetailsPanel } from "#/components/shared/turn-details-panel";
import {
  getActionDetails,
  outcomeOf,
  resultText,
  type FeedUpdateDetails,
} from "#/utils/feed-updates";
import useMetricsStore from "#/stores/metrics-store";

/** Refresh rate of the live elapsed time, in milliseconds. */
const ELAPSED_TICK_MS = 250;

/** Event timestamps may omit the offset; treat those as UTC, as the chat does. */
function parseEventTime(timestamp?: string): number | null {
  if (!timestamp) return null;
  const utc = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(timestamp)
    ? timestamp
    : `${timestamp}Z`;
  const time = new Date(utc).getTime();
  return Number.isNaN(time) ? null : time;
}

/** Server-side span of a group, from its first event to its last. */
function eventSpanMs(events: OpenHandsEvent[]): number | null {
  const start = parseEventTime(events[0]?.timestamp);
  const end = parseEventTime(events.at(-1)?.timestamp);
  return start !== null && end !== null && end >= start ? end - start : null;
}

/** Formats seconds as a localised unit, for example "2.1s". */
function formatElapsed(ms: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "unit",
    unit: "second",
    unitDisplay: "narrow",
    maximumFractionDigits: 1,
  }).format(ms / 1000);
}

interface EventGroupProps {
  /** The events represented by this group. Used to compute the summary. */
  events: OpenHandsEvent[];
  /**
   * Full event history. Used to resolve the action that produced the latest
   * observation in the group so the summary title matches what the individual
   * card would show (e.g. "Editing path/to/file"), and to find the
   * `AgentErrorEvent` that resolved an action without an observation. Falls
   * back to `events` when omitted.
   */
  allEvents?: OpenHandsEvent[];
  /**
   * `true` once an event outside this group has been emitted after it, so the
   * group is no longer the "live" tail of the chat. While `false` (the
   * default), the group keeps showing the most recent action's title as its
   * prominent summary, with the count of completed actions shown subtly on
   * the right.
   */
  isFinalized?: boolean;
  /** The fully-rendered event messages to show when the group is expanded. */
  children: React.ReactNode;
  /**
   * `classic` keeps the original collapsed card. `rail` threads the steps on a
   * vertical line with a marker per run state, and opens itself while the group
   * is the live tail so the agent's work is visible without a click.
   */
  variant?: EventGroupVariant;
}

export type EventGroupVariant = "classic" | "rail";

/** Matches the accordion transition duration in `index.css`. */
const DISCLOSURE_HOLD_MS = 400;

/**
 * Stops the chat's bottom-follow loop from dragging the view down while a
 * disclosure animates. Without it, opening a group near the bottom of the
 * chat moves its header up instead of pushing the content down.
 */
function holdChatFollow(anchor: HTMLElement) {
  const scroller = anchor.closest<HTMLElement>(
    '[data-testid="chat-scroll-container"]',
  );
  if (!scroller) return;
  scroller.dataset.holdFollow = "true";
  window.setTimeout(() => {
    delete scroller.dataset.holdFollow;
  }, DISCLOSURE_HOLD_MS);
}

/**
 * Collapsible container that wraps a run of consecutive agent action/observation
 * events into a single summary card.
 *
 * Collapsed, while the group is still the live tail of the chat
 * (`isFinalized=false`):
 *   - Left (prominent): the title of the most recent action/observation in
 *     the group — i.e. either the action currently in flight, or the latest
 *     completed step.
 *   - Right (subdued):  "{completed}/{total} actions completed" while at
 *     least one action is still pending (with a spinner), otherwise
 *     "{count} actions completed" followed by a success check.
 *
 * Collapsed, after the group has been "moved past" (`isFinalized=true`):
 *   - "{count} actions completed" is promoted to the prominent foreground
 *     style and the count is the only thing shown next to the chevron.
 *
 * Expanded:
 *   - Renders the children verbatim, so each individual action/observation can
 *     still be expanded the way it was before grouping.
 */
export function EventGroup({
  events,
  allEvents,
  isFinalized = false,
  children,
  variant = "classic",
}: EventGroupProps) {
  const { t } = useTranslation("openhands");
  // `null` until the reader toggles the group; then their choice wins over the
  // rail's auto-open rule.
  const [userExpanded, setUserExpanded] = React.useState<boolean | null>(null);
  const contentId = React.useId();
  const buttonId = `${contentId}-toggle`;

  // The live clock starts when this group first mounts while it is still the
  // chat's tail. Client time is used because server timestamps may be skewed.
  const isTicking = variant === "rail" && !isFinalized;
  const [mountedAt] = React.useState(() => Date.now());
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    if (!isTicking) return undefined;
    const timer = window.setInterval(() => setNow(Date.now()), ELAPSED_TICK_MS);
    return () => window.clearInterval(timer);
  }, [isTicking]);

  const usage = useMetricsStore((state) => state.usage);
  const [showDetails, setShowDetails] = React.useState(false);

  if (events.length === 0) {
    return null;
  }

  // Each ObservationEvent (or UserRejectObservation) in the group is a
  // resolved action. An ActionEvent that's still here (i.e. not yet replaced
  // in the UI events array) is an action currently in flight, unless an
  // AgentErrorEvent resolved it: that event carries no action id and renders
  // on its own, so it never replaces the action it answers.
  const lookupSource = allEvents ?? events;
  const steps = events.flatMap((e) => {
    const action = isActionEvent(e)
      ? e
      : lookupSource.find(
          (candidate): candidate is ActionEvent =>
            isActionEvent(candidate) &&
            "action_id" in e &&
            candidate.id === e.action_id,
        );
    if (!action) return [];
    const details = getActionDetails(action, outcomeOf(e), resultText(e));
    return [
      { id: e.id, label: action.summary?.trim() || action.tool_name, details },
    ];
  });
  const unreplacedActions = events.filter(isActionEvent);
  const erroredToolCallIds =
    unreplacedActions.length > 0
      ? new Set(
          lookupSource.filter(isAgentErrorEvent).map((e) => e.tool_call_id),
        )
      : null;
  const pendingActions = unreplacedActions.filter(
    (action) => !erroredToolCallIds?.has(action.tool_call_id),
  );
  const totalCount = events.length;
  const completedCount = totalCount - pendingActions.length;
  const isRunning = pendingActions.length > 0;

  // Title of the most recent groupable event. While running this is the
  // pending action; otherwise it's the latest observation (or rejection), with
  // its originating action looked up so the title can be the action-style
  // summary ("Editing path/to/file") instead of the observation default.
  const latestEvent = events[events.length - 1];
  let latestTitle: React.ReactNode = null;
  if (latestEvent) {
    if (isActionEvent(latestEvent)) {
      latestTitle = getEventContent(latestEvent).title;
    } else if (
      isObservationEvent(latestEvent) ||
      isUserRejectObservation(latestEvent)
    ) {
      const correspondingAction = lookupSource.find(
        (e): e is ActionEvent =>
          isActionEvent(e) && e.id === latestEvent.action_id,
      );
      latestTitle = getEventContent(latestEvent, correspondingAction).title;
    }
  }

  const countSummary = isRunning
    ? t(I18nKey.EVENT_GROUP$ACTIONS_PROGRESS, {
        completed: completedCount,
        total: totalCount,
      })
    : t(I18nKey.EVENT_GROUP$ACTIONS_COMPLETED, { count: totalCount });

  const isRail = variant === "rail";
  // Running shows time since mount; finished shows the group's total span.
  const elapsedMs = isRunning ? now - mountedAt : eventSpanMs(events);
  const elapsedLabel =
    isRail && elapsedMs !== null ? formatElapsed(elapsedMs) : null;
  const detailsBlock = (
    <div className="mt-1.5 ml-1 flex flex-col gap-1.5">
      <button
        type="button"
        data-testid="event-group-details-toggle"
        aria-expanded={showDetails}
        onClick={() => setShowDetails((open) => !open)}
        className="w-fit cursor-pointer text-xs text-muted transition-colors hover:text-foreground"
      >
        {t(I18nKey.CHAT_INTERFACE$DETAILS)}
      </button>
      {showDetails ? (
        <ul data-testid="event-group-details" className="flex flex-col gap-2">
          {steps.map((step) => (
            <li key={step.id}>
              <p className="text-xs font-medium text-foreground">
                {step.label}
              </p>
              <TurnDetailsPanel details={step.details as FeedUpdateDetails} />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
  const expanded = userExpanded ?? (isRail && isRunning && !isFinalized);
  return (
    <div
      className={cn("w-full text-sm", isRail ? "mt-0 mb-1" : "my-1 py-1")}
      data-testid="event-group"
      data-variant={variant}
    >
      <button
        id={buttonId}
        type="button"
        onClick={(event) => {
          if (isRail) holdChatFollow(event.currentTarget);
          setUserExpanded(!expanded);
        }}
        aria-controls={contentId}
        aria-expanded={expanded}
        aria-label={
          expanded
            ? t(I18nKey.EVENT_GROUP$COLLAPSE)
            : t(I18nKey.EVENT_GROUP$EXPAND)
        }
        data-testid="event-group-toggle"
        className="w-full flex items-center justify-between gap-2 text-left cursor-pointer"
      >
        {isRail ? (
          <span className="flex w-fit items-center gap-2 min-w-0 -my-1 -ml-1 rounded-xl py-1 pl-2.5 pr-3 text-muted transition-colors hover:bg-interactive-hover hover:text-foreground">
            <span
              data-testid="rail-marker"
              data-running={isRunning}
              aria-hidden
              className={cn(
                "relative z-10 flex size-3.5 flex-shrink-0 items-center justify-center rounded-full border",
                isRunning
                  ? "border-accent bg-accent/20 motion-safe:animate-pulse"
                  : "border-muted/60 bg-background",
              )}
            >
              {isRunning ? null : (
                // The check draws itself in when the group finishes.
                <svg
                  aria-hidden
                  viewBox="0 0 12 12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-2.5 text-muted"
                >
                  <path data-check-draw d="M2.5 6.5 5 9l4.5-5" />
                </svg>
              )}
            </span>
            <span
              data-live-title={isRunning && !isFinalized ? "" : undefined}
              className={cn(
                "truncate",
                isRunning && !isFinalized ? "text-foreground" : "text-muted",
              )}
            >
              <PathInteractiveContext.Provider value={false}>
                {isFinalized ? countSummary : (latestTitle ?? countSummary)}
              </PathInteractiveContext.Provider>
            </span>
            {elapsedLabel ? (
              <span className="flex-shrink-0 text-xs tabular-nums text-muted/80">
                {elapsedLabel}
              </span>
            ) : null}
            {!isFinalized && usage && usage.context_window > 0 ? (
              <TokenMeter
                used={usage.per_turn_token}
                limit={usage.context_window}
                title={t(I18nKey.CONVERSATION$TOKEN_USAGE)}
              />
            ) : null}
            {isFinalized && !isRunning ? null : (
              <span className="flex items-center flex-shrink-0 text-muted/80">
                {/* Keyed on the completed count, so the summary rolls in
                    each time another step finishes. */}
                <span
                  key={completedCount}
                  className="truncate text-xs animate-[status-roll-in_320ms_ease-out_both] motion-reduce:animate-none"
                >
                  {countSummary}
                </span>
                {isRunning ? (
                  <LoaderCircle
                    data-testid="spinner-icon"
                    className="h-3 w-3 ml-1.5 inline animate-spin text-muted"
                  />
                ) : null}
              </span>
            )}
            <ExpandChevron expanded={expanded} className="h-3 w-3 fill-muted" />
          </span>
        ) : isFinalized ? (
          <span className="flex items-center gap-2 min-w-0 font-normal text-muted">
            <ExpandChevron expanded={expanded} className="h-4 w-4 fill-muted" />
            <span className="truncate">{countSummary}</span>
          </span>
        ) : (
          <>
            <span className="flex items-center gap-2 min-w-0 font-normal text-muted">
              <ExpandChevron
                expanded={expanded}
                className="h-4 w-4 fill-muted"
              />
              <span className="truncate">
                <PathInteractiveContext.Provider value={false}>
                  {latestTitle ?? countSummary}
                </PathInteractiveContext.Provider>
              </span>
            </span>
            <span className="flex items-center flex-shrink-0 font-normal text-muted">
              <span className="truncate">{countSummary}</span>
              {isRunning ? (
                <LoaderCircle
                  data-testid="spinner-icon"
                  className="h-4 w-4 ml-2 inline animate-spin text-muted"
                />
              ) : null}
            </span>
          </>
        )}
      </button>

      {isRail ? (
        // The rail opens and closes as an accordion: the grid row animates
        // from 0fr to 1fr while the content stays mounted, and it is inert
        // while closed so hidden steps cannot take focus.
        <div
          className={cn(
            "grid transition-[grid-template-rows] duration-300 ease-out motion-reduce:transition-none",
            expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
          )}
        >
          <div
            id={contentId}
            role="region"
            aria-labelledby={buttonId}
            inert={!expanded}
            className="min-h-0 overflow-hidden"
            data-testid="event-group-content"
          >
            {detailsBlock}
            <div
              data-rail-thread
              className="relative ml-3.25 mt-1.5 flex flex-col"
            >
              <IsInEventGroupContext.Provider value>
                {children}
              </IsInEventGroupContext.Provider>
              {isRunning && !isFinalized ? (
                <SkeletonLines className="py-1.5 pr-6" />
              ) : null}
              {isRunning && !isFinalized ? (
                // The live tail: the agent is still working, so its status
                // rolls through short messages as the last branch of the tree.
                <RotatingStatus
                  className="py-1"
                  messages={[
                    t(I18nKey.ACTION_MESSAGE$THINK),
                    t(I18nKey.CHAT_INTERFACE$AGENT_RUNNING_MESSAGE),
                    t(
                      I18nKey.CHAT_INTERFACE$INITIALIZING_AGENT_LOADING_MESSAGE,
                    ),
                    t(I18nKey.CHAT_INTERFACE$AGENT_INIT_MESSAGE),
                  ]}
                />
              ) : null}
            </div>
          </div>
        </div>
      ) : (
        expanded && (
          <div
            id={contentId}
            role="region"
            aria-labelledby={buttonId}
            className="mt-1.5 flex flex-col"
            data-testid="event-group-content"
          >
            {detailsBlock}
            <IsInEventGroupContext.Provider value>
              {children}
            </IsInEventGroupContext.Provider>
          </div>
        )
      )}
    </div>
  );
}
