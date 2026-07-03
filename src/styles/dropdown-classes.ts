import { cn } from "@/src/lib/utils";

export const dropdownInstantColorClassName = "transition-none";

export const dropdownMenuListGapClassName = "gap-0.5";

export const dropdownMenuRowGapClassName = "gap-2";

export const dropdownMenuListClassName = cn(
  "flex flex-col",
  dropdownMenuListGapClassName,
);

export const dropdownMenuRowClassName = cn(
  "group flex w-full cursor-pointer items-center rounded px-2 py-2 text-left text-sm font-normal text-white",
  dropdownMenuRowGapClassName,
  "hover:bg-[var(--oh-interactive-hover)] disabled:cursor-not-allowed disabled:opacity-60",
  dropdownInstantColorClassName,
);

export const dropdownMenuRowForegroundClassName = cn(
  "group flex w-full cursor-pointer items-center rounded px-2 py-2 text-start text-sm font-normal",
  dropdownMenuRowGapClassName,
  "text-[var(--oh-foreground)] hover:bg-[var(--oh-interactive-hover)]",
  "disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent",
  dropdownInstantColorClassName,
);

export const dropdownMenuRowIconClassName = cn(
  "shrink-0 text-[var(--oh-muted)] group-hover:text-white group-focus-visible:text-white",
  dropdownInstantColorClassName,
);

export const dropdownMenuRowIconWrapperClassName = cn(
  "flex size-4 shrink-0 items-center justify-center [&_svg]:text-current",
  dropdownMenuRowIconClassName,
);

export const dropdownMenuSurfaceClassName =
  "z-50 flex flex-col rounded-md border border-[var(--oh-border-subtle)] bg-tertiary px-1 py-1 text-white context-menu-box-shadow";
