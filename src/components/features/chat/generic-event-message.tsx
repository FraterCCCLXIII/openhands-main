import React from "react";
import { useTranslation } from "react-i18next";
import { SuccessIndicator } from "./success-indicator";
import { ObservationResultStatus } from "#/components/conversation-events/chat/event-content-helpers/get-observation-result";
import { MarkdownRenderer } from "../markdown/markdown-renderer";
import { cn } from "#/utils/utils";
import { I18nKey } from "#/i18n/declaration";
import { ExpandChevron } from "#/components/shared/expand-chevron";
import { AnimatedCollapse } from "#/components/shared/animated-collapse";
import { formatEventTimestamp } from "#/utils/format-event-timestamp";

interface GenericEventMessageProps {
  title: React.ReactNode;
  details: string | React.ReactNode;
  success?: ObservationResultStatus;
  initiallyExpanded?: boolean;
  /** Where to place the expand/collapse chevron relative to the title. */
  chevronPosition?: "before" | "after";
  /** Extra content rendered at the end of the title row (right side). */
  titleTrailing?: React.ReactNode;
  /** Optional icon rendered before the title text. */
  titleIcon?: React.ReactNode;
  timestamp?: string;
}

export function GenericEventMessage({
  title,
  details,
  success,
  initiallyExpanded = false,
  chevronPosition = "after",
  titleTrailing,
  titleIcon,
  timestamp,
}: GenericEventMessageProps) {
  const { t, i18n } = useTranslation("openhands");
  const [showDetails, setShowDetails] = React.useState(initiallyExpanded);
  const timestampLabel = formatEventTimestamp(timestamp, i18n?.language);

  const toggleDetails = (event: React.MouseEvent<HTMLElement>) => {
    setShowDetails((prev) => !prev);
    if (event.detail > 0) {
      event.currentTarget.blur();
    }
  };

  const chevron = details ? (
    <ExpandChevron
      expanded={showDetails}
      className={cn(
        "h-3 w-3 inline fill-muted",
        chevronPosition === "after" ? "ml-1.5" : "mr-1.5",
      )}
    />
  ) : null;

  // With details, the whole title row is the disclosure button, so clicking
  // the text opens it as well as clicking the caret.
  const disclosureProps = details
    ? {
        type: "button" as const,
        onClick: toggleDetails,
        "aria-expanded": showDetails,
        "aria-label": showDetails
          ? t(I18nKey.BUTTON$COLLAPSE)
          : t(I18nKey.BUTTON$EXPAND),
      }
    : {};

  const TitleTag = details ? "button" : "div";

  const titleContent = (
    <TitleTag
      data-testid="generic-event-message-title"
      className={cn(
        "flex items-center",
        details &&
          "w-fit cursor-pointer text-left rounded-xl py-0.5 pl-2.5 pr-3 -my-0.5 -ml-1 transition-colors hover:bg-interactive-hover hover:text-foreground",
      )}
      {...disclosureProps}
    >
      {chevronPosition === "before" && chevron}
      {titleIcon}
      {/* Wrap the title in a span so any whitespace inside Trans-rendered
          fragments (e.g. "Editing <path>...</path>") is preserved by
          normal inline flow instead of being collapsed between
          anonymous flex items. */}
      <span>{title}</span>
      {chevronPosition === "after" && chevron}
    </TitleTag>
  );

  // The timestamp sits to the right of the caret. It keeps its space and fades
  // in when the row is hovered or focused, so the title does not shift.
  const timeLabel = timestampLabel ? (
    <time
      dateTime={timestamp}
      className="ml-1.5 whitespace-nowrap text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
    >
      {timestampLabel}
    </time>
  ) : null;

  const titleRow = (
    <div className="group flex items-center justify-between font-normal text-muted">
      <div className="flex min-w-0 items-center">
        {titleContent}
        {timeLabel}
      </div>
      <div className="flex items-center">
        {titleTrailing}
        {success && <SuccessIndicator status={success} />}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-1.5 my-1 py-1 text-sm w-full">
      {titleRow}
      {details ? (
        <AnimatedCollapse open={showDetails}>
          {typeof details === "string" ? (
            <MarkdownRenderer>{details}</MarkdownRenderer>
          ) : (
            details
          )}
        </AnimatedCollapse>
      ) : null}
    </div>
  );
}
