import { useBackgroundTintStore } from "#/stores/background-tint-store";

/**
 * The accent color added over the whole UI (plus-lighter blending is additive),
 * scaled by the appearance menu's Background tint slider. Lives inside the
 * themed root so it picks up the active theme's --oh-accent.
 */
export function BackgroundTintOverlay() {
  const percent = useBackgroundTintStore((state) => state.percent);
  if (percent <= 0) return null;
  return (
    <div
      aria-hidden
      data-testid="background-tint-overlay"
      className="pointer-events-none fixed inset-0 z-[2147483000] mix-blend-plus-lighter"
      style={{
        background: "var(--oh-accent, var(--oh-color-primary))",
        opacity: "var(--oh-bg-tint, 0)",
      }}
    />
  );
}
