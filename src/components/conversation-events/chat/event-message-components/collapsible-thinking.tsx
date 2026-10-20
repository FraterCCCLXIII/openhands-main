import React from "react";
import { useTranslation } from "react-i18next";
import LightbulbIcon from "#/icons/lightbulb.svg?react";
import { I18nKey } from "#/i18n/declaration";
import { ExpandChevron } from "#/components/shared/expand-chevron";
import { AnimatedCollapse } from "#/components/shared/animated-collapse";
import { MarkdownRenderer } from "../../../features/markdown/markdown-renderer";

interface CollapsibleThinkingProps {
  /** The thinking / reasoning content to display when expanded. */
  content: string;
}

/**
 * Renders agent thinking or extended reasoning content inside a collapsible
 * section.  Collapsed by default so the chat stays compact — especially
 * useful when the thinking language differs from the conversation language.
 */
export function CollapsibleThinking({ content }: CollapsibleThinkingProps) {
  const { t } = useTranslation("openhands");
  const [expanded, setExpanded] = React.useState(false);

  if (!content.trim()) {
    return null;
  }

  return (
    <div
      className="my-1 w-full py-1 text-sm"
      data-testid="collapsible-thinking"
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        aria-expanded={expanded}
        aria-label={
          expanded ? t(I18nKey.THINKING$COLLAPSE) : t(I18nKey.THINKING$EXPAND)
        }
        data-testid="collapsible-thinking-toggle"
        className="group w-fit flex items-center gap-2 rounded-xl py-0.5 pl-2.5 pr-3 -my-0.5 -ml-1 text-left cursor-pointer transition-colors hover:bg-interactive-hover"
      >
        <LightbulbIcon className="h-4 w-4 fill-muted flex-shrink-0" />
        <span className="font-normal text-muted transition-colors group-hover:text-foreground">
          {t(I18nKey.THINKING$TITLE)}
        </span>
        <ExpandChevron expanded={expanded} className="h-3 w-3 fill-muted" />
      </button>

      <AnimatedCollapse open={expanded}>
        <div className="mt-1.5 pl-6" data-testid="collapsible-thinking-content">
          <MarkdownRenderer>{content}</MarkdownRenderer>
        </div>
      </AnimatedCollapse>
    </div>
  );
}
