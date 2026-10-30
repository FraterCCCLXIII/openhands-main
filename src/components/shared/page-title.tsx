import React from "react";
import { cn } from "#/utils/utils";

// Single typographic definition for the top-of-page title and subtitle.
export const PAGE_TITLE_CLASS_NAME =
  "text-2xl font-medium leading-tight tracking-tight text-foreground md:text-3xl lg:text-4xl";
export const PAGE_SUBTITLE_CLASS_NAME =
  "max-w-2xl text-base leading-6 text-tertiary-light";

interface PageTitleProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** Buttons rendered to the right of the title block. */
  actions?: React.ReactNode;
  titleTestId?: string;
  subtitleTestId?: string;
  className?: string;
}

export function PageTitle({
  title,
  subtitle,
  actions,
  titleTestId,
  subtitleTestId,
  className,
}: PageTitleProps) {
  return (
    <header
      className={cn(
        "flex min-w-0 flex-wrap items-center justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0 flex-1 basis-64 space-y-1">
        <h1 data-testid={titleTestId} className={PAGE_TITLE_CLASS_NAME}>
          {title}
        </h1>
        {subtitle ? (
          <div
            data-testid={subtitleTestId}
            className={PAGE_SUBTITLE_CLASS_NAME}
          >
            {subtitle}
          </div>
        ) : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      ) : null}
    </header>
  );
}
