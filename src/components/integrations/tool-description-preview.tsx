"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";
import { cn } from "@/src/lib/utils";

interface ToolDescriptionPreviewProps {
  description: string;
  defaultScopes?: string[];
  testId?: string;
}

const viewToggleClassName =
  "shrink-0 cursor-pointer text-xs leading-5 text-white hover:opacity-80";

export function ToolDescriptionPreview({
  description,
  defaultScopes,
  testId,
}: ToolDescriptionPreviewProps) {
  const textRef = useRef<HTMLSpanElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  useLayoutEffect(() => {
    if (isExpanded) {
      return undefined;
    }

    const element = textRef.current;
    if (!element) {
      return undefined;
    }

    const updateTruncation = () => {
      setIsTruncated(element.scrollWidth > element.clientWidth);
    };

    updateTruncation();

    if (typeof ResizeObserver === "undefined") {
      return undefined;
    }

    const observer = new ResizeObserver(updateTruncation);
    observer.observe(element);

    return () => observer.disconnect();
  }, [description, isExpanded]);

  const showToggle = isTruncated;

  return (
    <div className="mt-1 min-w-0" data-testid={testId}>
      {!isExpanded ? (
        <div className="flex min-w-0 items-baseline gap-1 text-xs leading-5 text-muted">
          <span ref={textRef} className="min-w-0 truncate">
            {description}
          </span>
          {showToggle ? (
            <button
              type="button"
              className={viewToggleClassName}
              data-testid={testId ? `${testId}-view-more` : undefined}
              onClick={() => setIsExpanded(true)}
            >
              {INTEGRATIONS_PAGE_COPY.viewMoreLabel}
            </button>
          ) : null}
        </div>
      ) : (
        <>
          <p className="text-xs leading-5 text-muted">{description}</p>
          {defaultScopes !== undefined ? (
            <p className="mt-2 text-xs leading-5 text-muted">
              {INTEGRATIONS_PAGE_COPY.installedDefaultScopesLabel}{" "}
              {defaultScopes.length > 0
                ? defaultScopes.join(", ")
                : INTEGRATIONS_PAGE_COPY.installedNoneLabel}
            </p>
          ) : null}
          {showToggle ? (
            <button
              type="button"
              className={cn(viewToggleClassName, "mt-1")}
              data-testid={testId ? `${testId}-view-less` : undefined}
              onClick={() => setIsExpanded(false)}
            >
              {INTEGRATIONS_PAGE_COPY.viewLessLabel}
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
