import React from "react";
import { useTranslation } from "react-i18next";
import { X } from "lucide-react";
import { I18nKey } from "#/i18n/declaration";
import { cn } from "#/utils/utils";
import { hoverRevealActionClassName } from "#/utils/hover-reveal-classes";
import {
  isHomeDashboardComponentHidden,
  useHomeDashboardVisibilityStore,
  type HomeDashboardComponentId,
} from "#/stores/home-dashboard-visibility-store";

interface HomeDashboardSectionProps {
  id: HomeDashboardComponentId;
  /** Set when the widget already renders its own dismiss control. */
  ownsDismiss?: boolean;
  children: React.ReactNode;
}

/**
 * Wraps one home dashboard component. The simple X (same as the recommended-automations rail) appears on hover (or keyboard
 * focus) and hides the section; the components dropdown brings it back.
 * Widgets with their own dismiss control skip this X so there is only one.
 */
export function HomeDashboardSection({
  id,
  ownsDismiss = false,
  children,
}: HomeDashboardSectionProps) {
  const { t } = useTranslation("openhands");
  const isHidden = useHomeDashboardVisibilityStore((state) =>
    isHomeDashboardComponentHidden(state, id),
  );
  const setHidden = useHomeDashboardVisibilityStore((state) => state.setHidden);

  if (isHidden) return null;

  return (
    <div
      data-testid={`home-dashboard-section-${id}`}
      className="group relative"
    >
      {children}
      {ownsDismiss ? null : (
        <button
          type="button"
          data-testid={`home-dashboard-hide-${id}`}
          aria-label={t(I18nKey.HOME$HIDE_COMPONENT)}
          onClick={() => setHidden(id, true)}
          className={cn(
            "absolute -top-8 right-0 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted",
            "transition-opacity motion-reduce:transition-none hover:text-content",
            hoverRevealActionClassName(),
          )}
        >
          <X aria-hidden className="size-4" />
        </button>
      )}
    </div>
  );
}
