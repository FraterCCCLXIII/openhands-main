import { cn } from "#/utils/utils";

/** Primary modal heading on dark overlay surfaces. */
export const modalTitleClassName = cn(
  "font-inter text-[22px] leading-7 -tracking-[0.01em] font-normal text-modal-title",
);

/** Compact modal header bar title (folder browser, manage workspaces). */
export const modalTitleSmClassName = cn(
  "font-inter text-base font-normal text-modal-title",
);

/** Large modal title used by form-style dialogs. */
export const modalTitleLgClassName = cn(
  "font-inter text-xl font-normal text-modal-title",
);

/** Alias of {@link modalTitleLgClassName} for historical call sites. */
export const modalTitleLgMediumClassName = modalTitleLgClassName;
