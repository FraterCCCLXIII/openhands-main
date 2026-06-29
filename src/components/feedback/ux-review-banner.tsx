"use client";

import { isUxReviewMode } from "@/src/lib/ux-review-mode";

export function UxReviewBanner() {
  if (!isUxReviewMode()) {
    return null;
  }

  return (
    <div
      data-testid="ux-review-banner"
      className="pointer-events-none fixed bottom-4 right-4 z-50 max-w-xs rounded-full border border-primary/40 bg-base-secondary/95 px-3 py-1.5 text-xs text-foreground shadow-lg backdrop-blur-sm"
      aria-live="polite"
    >
      UX review mode — sample data only. Changes are not saved.
    </div>
  );
}
