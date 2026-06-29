import { cn } from "@/src/lib/utils";

export const formControlHeightClassName = "h-9 min-h-9";
export const formControlRadiusClassName = "rounded-lg";
export const formControlBorderClassName = "border border-[var(--oh-border)]";
export const formControlSurfaceClassName = "bg-base-secondary";
export const formControlTransitionClassName =
  "transition-[background-color,border-color,opacity] duration-75 motion-reduce:transition-none";
export const formControlMutedHoverClassName =
  "hover:bg-[var(--oh-surface-raised)] hover:text-white";
export const formControlFocusClassName =
  "focus:border-white/40 focus:ring-1 focus:ring-white/20 focus:outline-none";
export const formControlDisabledClassName =
  "disabled:cursor-not-allowed disabled:opacity-60";

export const formControlFieldClassName = cn(
  formControlHeightClassName,
  formControlRadiusClassName,
  formControlBorderClassName,
  formControlSurfaceClassName,
  formControlTransitionClassName,
  formControlFocusClassName,
  formControlDisabledClassName,
  "w-full min-w-0 px-3 text-sm leading-5 text-white placeholder:text-text-dim",
);

export const formControlSettingsFieldClassName = cn(
  formControlFieldClassName,
  "placeholder:italic",
);

export const formControlButtonClassName = cn(
  formControlHeightClassName,
  "inline-flex w-fit cursor-pointer items-center justify-center gap-2 px-3",
  formControlRadiusClassName,
  formControlTransitionClassName,
  "text-sm leading-5 font-normal disabled:cursor-not-allowed disabled:opacity-30",
);

/** Full-width field-style select triggers (settings forms, modals). */
export const formControlSelectTriggerClassName = cn(
  formControlFieldClassName,
  "inline-flex cursor-pointer items-center justify-between gap-2 text-left",
);

/** Filter / enum dropdown triggers beside search toolbars. */
export const formControlFilterTriggerClassName = cn(
  formControlButtonClassName,
  formControlBorderClassName,
  formControlSurfaceClassName,
  "shrink-0 justify-between text-white",
);
