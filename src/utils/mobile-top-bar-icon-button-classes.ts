import { cn } from "@/src/lib/utils";
import {
  formControlMutedHoverClassName,
  formControlTransitionClassName,
} from "@/src/styles/form-control-classes";

export const mobileTopBarIconButtonClassName = cn(
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-md p-1",
  "text-[var(--oh-muted)]",
  formControlTransitionClassName,
  formControlMutedHoverClassName,
);

export const mobileTopBarIconClassName = "size-5 shrink-0";
