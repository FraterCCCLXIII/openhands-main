import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { HomeDashboardComponentsMenu } from "#/components/features/home/home-dashboard-components-menu";
import { HOME_DASHBOARD_WIDGETS } from "#/components/features/home/home-dashboard-widgets";
import {
  isHomeDashboardComponentHidden,
  useHomeDashboardVisibilityStore,
} from "#/stores/home-dashboard-visibility-store";

const state = () => useHomeDashboardVisibilityStore.getState();

async function openMenu() {
  render(<HomeDashboardComponentsMenu />);
  await userEvent.click(
    screen.getByTestId("home-dashboard-components-trigger"),
  );
}

describe("HomeDashboardComponentsMenu", () => {
  beforeEach(() => {
    localStorage.clear();
    useHomeDashboardVisibilityStore.setState({
      hiddenIds: {},
      shownIds: {},
      order: HOME_DASHBOARD_WIDGETS.map((widget) => widget.id),
    });
  });

  it("lists a row for every registered widget", async () => {
    await openMenu();

    for (const widget of HOME_DASHBOARD_WIDGETS) {
      expect(
        screen.getByTestId(`home-dashboard-row-${widget.id}`),
      ).toBeInTheDocument();
    }
  });

  it("keeps opt-in widgets off until toggled on, and default widgets on until toggled off", async () => {
    await openMenu();

    expect(isHomeDashboardComponentHidden(state(), "kanbanBoard")).toBe(true);
    expect(isHomeDashboardComponentHidden(state(), "pinnedAutomations")).toBe(
      false,
    );

    const toggle = (id: string) =>
      screen
        .getByTestId(`home-dashboard-row-${id}`)
        .querySelector<HTMLElement>("[role='switch']")!;
    await userEvent.click(toggle("kanbanBoard"));
    await userEvent.click(toggle("pinnedAutomations"));

    expect(isHomeDashboardComponentHidden(state(), "kanbanBoard")).toBe(false);
    expect(isHomeDashboardComponentHidden(state(), "pinnedAutomations")).toBe(
      true,
    );
  });
});
