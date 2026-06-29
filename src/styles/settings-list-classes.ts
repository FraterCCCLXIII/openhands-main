import { cn } from "@/src/lib/utils";
import {
  formControlBorderClassName,
  formControlRadiusClassName,
  formControlSurfaceClassName,
  formControlTransitionClassName,
} from "@/src/styles/form-control-classes";

export const settingsListRowHeightClassName = "h-12 min-h-12";

export const settingsListContainerClassName = cn(
  formControlBorderClassName,
  formControlRadiusClassName,
  formControlSurfaceClassName,
  "overflow-hidden",
);

export const settingsListDividerClassName =
  "divide-y divide-[var(--oh-border)]";

export const settingsListRowHoverClassName =
  "hover:bg-[var(--oh-surface-raised)]";

export const settingsListRowClassName = cn(
  settingsListRowHeightClassName,
  "flex items-center px-3",
  formControlTransitionClassName,
  settingsListRowHoverClassName,
);

export const settingsListIconActionButtonClassName = cn(
  "inline-flex cursor-pointer items-center justify-center rounded-md p-1 text-muted",
  formControlTransitionClassName,
  "hover:bg-[var(--oh-surface-raised)] hover:text-white",
);
