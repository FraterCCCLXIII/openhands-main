import { useCallback, useEffect, useRef, type MouseEvent } from "react";
import { useTranslation } from "react-i18next";
import { startSetupGuideTour } from "#/components/features/setup-guide/tour/setup-guide-tour";
import {
  startGuidedTour,
  type GuidedTourNavigation,
} from "#/components/features/setup-guide/tour/tour-engine";
import type { SuperAdminSetupStepId } from "#/components/features/setup-guide/super-admin-setup-guide.constants";
import { useNavigation } from "#/context/navigation-context";
import { I18nKey } from "#/i18n/declaration";
import type {
  SidebarOnboardingChecklistInternalItemId,
  SidebarOnboardingChecklistItemId,
} from "./sidebar-onboarding-checklist.constants";

type TourTranslate = (key: I18nKey) => string;

interface OwnTourStop {
  route: string;
  anchor: string;
  alsoHighlight: string;
  title: I18nKey;
  body: I18nKey;
}

/**
 * Checklist items that open a setup-guide tour. The guide's stops already wait
 * for the modal each step opens, so the checklist reuses them as they are.
 */
const SETUP_STEP_TOURS: Partial<
  Record<SidebarOnboardingChecklistInternalItemId, SuperAdminSetupStepId>
> = {
  "connect-mcp": "add-integration",
  "schedule-task": "first-automation",
};

/** Checklist items whose page has no setup-guide tour, with one spotlight. */
const OWN_TOUR_STOPS: Partial<
  Record<SidebarOnboardingChecklistInternalItemId, OwnTourStop>
> = {
  "configure-llm": {
    route: "/settings/llm",
    anchor: '[data-testid="llm-settings-form-basic"]',
    alsoHighlight: '[data-testid="sidebar-settings-/settings/llm"]',
    title: I18nKey.SIDEBAR$ONBOARDING_TOUR_LLM_TITLE,
    body: I18nKey.SIDEBAR$ONBOARDING_TOUR_LLM_BODY,
  },
  "customize-agent": {
    route: "/settings/agents",
    anchor: '[data-testid="agent-settings-screen"]',
    alsoHighlight: '[data-testid="sidebar-settings-/settings/agents"]',
    title: I18nKey.SIDEBAR$ONBOARDING_TOUR_AGENT_TITLE,
    body: I18nKey.SIDEBAR$ONBOARDING_TOUR_AGENT_BODY,
  },
};

export function hasSidebarOnboardingTour(
  id: SidebarOnboardingChecklistItemId,
): id is SidebarOnboardingChecklistInternalItemId {
  return id in SETUP_STEP_TOURS || id in OWN_TOUR_STOPS;
}

/** Opens a checklist item's page and walks the admin through it. */
export async function startSidebarOnboardingTour(
  id: SidebarOnboardingChecklistInternalItemId,
  nav: GuidedTourNavigation,
  t: TourTranslate,
): Promise<void> {
  const setupStepId = SETUP_STEP_TOURS[id];
  if (setupStepId) {
    await startSetupGuideTour(setupStepId, nav, t);
    return;
  }

  const own = OWN_TOUR_STOPS[id];
  if (!own) {
    return;
  }
  await startGuidedTour(
    {
      id,
      stops: [
        {
          id,
          route: own.route,
          anchor: own.anchor,
          alsoHighlight: own.alsoHighlight,
          title: t(own.title),
          body: t(own.body),
        },
      ],
    },
    nav,
    {
      next: t(I18nKey.ONBOARDING$NEXT),
      previous: t(I18nKey.ONBOARDING$BACK),
      done: t(I18nKey.ONBOARDING$SETUP_GUIDE_TOUR_DONE),
    },
  );
}

/**
 * Returns a click handler that starts a checklist item's tour. A plain click
 * is claimed (the tour opens the page itself); a modified click or an item
 * without a tour leaves the link to navigate as usual.
 */
export function useSidebarOnboardingTour() {
  const { t } = useTranslation("openhands");
  const { currentPath, navigate } = useNavigation();
  // The tour checks the current route after it navigates, between renders.
  const pathRef = useRef(currentPath);
  useEffect(() => {
    pathRef.current = currentPath;
  }, [currentPath]);

  return useCallback(
    (
      id: SidebarOnboardingChecklistItemId,
      event: MouseEvent<HTMLAnchorElement>,
    ) => {
      const plainClick =
        event.button === 0 &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.shiftKey &&
        !event.altKey;
      if (!plainClick || !hasSidebarOnboardingTour(id)) {
        return;
      }
      event.preventDefault();
      startSidebarOnboardingTour(
        id,
        { navigate, getPath: () => pathRef.current },
        t,
      );
    },
    [navigate, t],
  );
}
