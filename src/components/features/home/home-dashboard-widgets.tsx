import React from "react";
import { I18nKey } from "#/i18n/declaration";
import { RecommendedAutomationsLauncher } from "#/components/features/automations/recommended-automations-launcher";
import { useHomeRecommendedAutomationsDismissed } from "./use-home-recommended-automations-dismissed";
import { writeHomeRecommendedAutomationsDismissed } from "./home-recommended-automations-storage";
import { PinnedAutomationsDashboard } from "./featured-automations/pinned-automations-dashboard";
import { RunningAutomationsList } from "./featured-automations/running-automations-list";

/**
 * Widgets that reuse whole feature components from other pages load on demand,
 * so they stay out of the Home bundle until the user switches them on.
 */
const AgentCanvasVersionTile = React.lazy(() =>
  import("#/components/features/settings/agent-canvas-version-tile").then(
    (m) => ({ default: m.AgentCanvasVersionTile }),
  ),
);
const AgentCanvasUpdateCard = React.lazy(() =>
  import("#/components/features/settings/agent-canvas-update-card").then(
    (m) => ({ default: m.AgentCanvasUpdateCard }),
  ),
);
const SidebarOnboardingChecklist = React.lazy(() =>
  import("#/components/features/sidebar/sidebar-onboarding-checklist").then(
    (m) => ({ default: m.SidebarOnboardingChecklist }),
  ),
);
const ConversationPanel = React.lazy(() =>
  import("#/components/features/conversation-panel/conversation-panel").then(
    (m) => ({ default: m.ConversationPanel }),
  ),
);
const KanbanBoard = React.lazy(() =>
  import("#/components/features/kanban/kanban-board").then((m) => ({
    default: m.KanbanBoard,
  })),
);
const PlanningBoard = React.lazy(() =>
  import("#/components/features/planning/planning-board").then((m) => ({
    default: m.PlanningBoard,
  })),
);

function RecommendedAutomationsWidget() {
  const isDismissed = useHomeRecommendedAutomationsDismissed();
  if (isDismissed) return null;
  return (
    <RecommendedAutomationsLauncher
      variant="rail"
      dismissible
      onDismiss={() => writeHomeRecommendedAutomationsDismissed(true)}
    />
  );
}

/** Bounded box for page-sized components that expect a full-height parent. */
function BoundedWidget({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-96 overflow-hidden rounded-xl border border-border-subtle">
      {children}
    </div>
  );
}

export interface HomeDashboardWidget {
  id: string;
  labelKey: I18nKey;
  /**
   * "header" widgets render in the header above the composer (their position
   * only sets their place in the components menu); "body" widgets render below
   * the composer in the user's order.
   */
  placement: "header" | "body";
  /** Widgets with `false` stay off until the user turns them on. */
  defaultVisible: boolean;
  /** Widgets that render their own dismiss control skip the section X. */
  ownsDismiss?: boolean;
  render: () => React.ReactNode;
}

/**
 * The one list of home dashboard widgets. Adding an entry here makes it
 * appear in the components menu, the persisted order and the HUD.
 */
export const HOME_DASHBOARD_WIDGETS = [
  {
    id: "learnResources",
    labelKey: I18nKey.HOME$DASHBOARD_LEARN_RESOURCES,
    placement: "header",
    defaultVisible: true,
    render: () => null,
  },
  {
    id: "recommendedAutomations",
    labelKey: I18nKey.HOME$DASHBOARD_RECOMMENDED_AUTOMATIONS,
    placement: "body",
    defaultVisible: true,
    ownsDismiss: true,
    render: () => <RecommendedAutomationsWidget />,
  },
  {
    id: "pinnedAutomations",
    labelKey: I18nKey.HOME$DASHBOARD_PINNED_AUTOMATIONS,
    placement: "body",
    defaultVisible: true,
    render: () => <PinnedAutomationsDashboard />,
  },
  {
    id: "runningAutomations",
    labelKey: I18nKey.HOME$DASHBOARD_RUNNING_AUTOMATIONS,
    placement: "body",
    defaultVisible: true,
    render: () => <RunningAutomationsList />,
  },
  {
    id: "agentCanvasVersion",
    labelKey: I18nKey.HOME$DASHBOARD_AGENT_CANVAS_VERSION,
    placement: "body",
    defaultVisible: false,
    render: () => <AgentCanvasVersionTile />,
  },
  {
    id: "agentCanvasUpdate",
    labelKey: I18nKey.HOME$DASHBOARD_AGENT_CANVAS_UPDATE,
    placement: "body",
    defaultVisible: false,
    render: () => <AgentCanvasUpdateCard />,
  },
  {
    id: "onboardingChecklist",
    labelKey: I18nKey.HOME$DASHBOARD_ONBOARDING_CHECKLIST,
    placement: "body",
    defaultVisible: false,
    render: () => <SidebarOnboardingChecklist collapsed={false} />,
  },
  {
    id: "recentConversations",
    labelKey: I18nKey.HOME$DASHBOARD_RECENT_CONVERSATIONS,
    placement: "body",
    defaultVisible: false,
    render: () => (
      <BoundedWidget>
        <ConversationPanel />
      </BoundedWidget>
    ),
  },
  {
    id: "kanbanBoard",
    labelKey: I18nKey.HOME$DASHBOARD_KANBAN_BOARD,
    placement: "body",
    defaultVisible: false,
    render: () => (
      <BoundedWidget>
        <KanbanBoard />
      </BoundedWidget>
    ),
  },
  {
    id: "planningBoard",
    labelKey: I18nKey.HOME$DASHBOARD_PLANNING_BOARD,
    placement: "body",
    defaultVisible: false,
    render: () => (
      <BoundedWidget>
        <PlanningBoard />
      </BoundedWidget>
    ),
  },
] as const satisfies readonly HomeDashboardWidget[];

export type HomeDashboardWidgetId =
  (typeof HOME_DASHBOARD_WIDGETS)[number]["id"];

const WIDGETS_BY_ID: Record<string, HomeDashboardWidget> = Object.fromEntries(
  HOME_DASHBOARD_WIDGETS.map((widget) => [widget.id, widget]),
);

export function getHomeDashboardWidget(
  id: HomeDashboardWidgetId,
): HomeDashboardWidget {
  return WIDGETS_BY_ID[id];
}
