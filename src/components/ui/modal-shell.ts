import { cn } from "@/src/lib/utils";

export const MODAL_MAX_WIDTH_VIEWPORT = "max-w-[90vw]";

export const MODAL_WIDTH_CLASS = {
  lg: "w-[640px]",
  xl: "w-[720px]",
} as const;

export function modalShellClassName(width: keyof typeof MODAL_WIDTH_CLASS = "lg") {
  return cn(
    "relative flex max-h-[90vh] flex-col gap-6 overflow-hidden rounded-2xl border border-white/10 bg-base-secondary shadow-2xl",
    MODAL_WIDTH_CLASS[width],
    MODAL_MAX_WIDTH_VIEWPORT,
  );
}
