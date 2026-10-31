import React from "react";
import { cn } from "#/utils/utils";
import {
  BRAND_NOTICE_DATE,
  brandNoticeCopyright,
  brandNoticeDated,
  brandNoticeMarks,
} from "#/constants/brand-notice";

interface BrandNoticeProps {
  className?: string;
}

/** The trademark and copyright statement, small and quiet, for the foot of a page. */
export function BrandNotice({ className }: BrandNoticeProps) {
  return (
    <footer
      data-testid="brand-notice"
      className={cn(
        "flex flex-col gap-1 text-xs leading-5 text-tertiary-light",
        className,
      )}
    >
      <p>{brandNoticeMarks()}</p>
      <p>
        {brandNoticeCopyright()}{" "}
        <time dateTime={BRAND_NOTICE_DATE}>{brandNoticeDated()}</time>
      </p>
    </footer>
  );
}
