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

/** Settings list rows that are informational panels, not interactive list items. */
export const settingsListStaticRowClassName = cn(
  settingsListRowHeightClassName,
  "flex items-center px-3",
);

export const settingsListTableRowClassName = cn(
  settingsListRowHoverClassName,
  formControlTransitionClassName,
  "border-t border-[var(--oh-border)] first:border-t-0",
);

export const settingsListTableHeadClassName = cn(
  formControlSurfaceClassName,
  "sticky top-0 z-10 border-b border-[var(--oh-border)]",
);

export const settingsListTableHeaderCellClassName = cn(
  settingsListRowHeightClassName,
  "px-3 text-left text-sm font-medium align-middle",
);

export const settingsListTableCellClassName = cn(
  settingsListRowHeightClassName,
  "px-3 text-sm align-middle min-w-0",
);

export const settingsListIconActionButtonClassName = cn(
  "inline-flex cursor-pointer items-center justify-center rounded-md p-1 text-muted",
  formControlTransitionClassName,
  "hover:bg-[var(--oh-surface-raised)] hover:text-white",
);
