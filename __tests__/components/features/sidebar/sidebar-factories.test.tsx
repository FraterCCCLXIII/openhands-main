import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "test-utils";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SidebarFactories } from "#/components/features/sidebar/sidebar-factories";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useSidebarFactoryStore } from "#/stores/sidebar-factory-store";
import { FEED_FACTORIES } from "#/utils/feed-team-demo";

const conversations = vi.hoisted(() => ({ items: [] as unknown[] }));
vi.mock("#/hooks/query/use-paginated-conversations", () => ({
  usePaginatedConversations: () => ({
    data: { pages: [{ items: conversations.items }] },
  }),
}));

const [first, second] = FEED_FACTORIES;

beforeEach(() => {
  localStorage.clear();
  useSidebarFactoryStore.setState(
    useSidebarFactoryStore.getInitialState(),
    true,
  );
  useFeedFactoriesStore.setState({
    ...useFeedFactoriesStore.getState(),
    assignments: {
      a: { factoryId: first.id, agentName: "Atlas" },
      b: { factoryId: first.id, agentName: "Atlas" },
      c: { factoryId: second.id, agentName: "Nova" },
    },
  });
  conversations.items = [
    { id: "a", execution_status: "running" },
    { id: "b", execution_status: "finished" },
    { id: "c", execution_status: "finished" },
  ];
});

describe("SidebarFactories", () => {
  it("lists factories with how many conversations each has, and flags the ones running now", () => {
    renderWithProviders(<SidebarFactories />);
    const rows = screen.getAllByTestId("sidebar-factory");
    expect(rows[0]).toHaveTextContent(first.name);
    expect(rows[0]).toHaveTextContent("2");
    expect(rows[1]).toHaveTextContent("1");
    expect(screen.getByTestId("sidebar-factory-all")).toHaveTextContent("3");
    expect(
      rows[0].querySelector('[data-testid="sidebar-factory-live"]'),
    ).not.toBeNull();
    expect(
      rows[1].querySelector('[data-testid="sidebar-factory-live"]'),
    ).toBeNull();
  });

  it("chooses a factory for the conversation list below, and clears it again", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SidebarFactories />);
    await user.click(screen.getAllByTestId("sidebar-factory")[1]);
    expect(useSidebarFactoryStore.getState().factoryId).toBe(second.id);
    expect(screen.getAllByTestId("sidebar-factory")[1]).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getAllByTestId("sidebar-factory")[1]);
    expect(useSidebarFactoryStore.getState().factoryId).toBeNull();
    await user.click(screen.getAllByTestId("sidebar-factory")[0]);
    await user.click(screen.getByTestId("sidebar-factory-all"));
    expect(useSidebarFactoryStore.getState().factoryId).toBeNull();
  });

  it("shows the first few factories and expands to all of them", async () => {
    const user = userEvent.setup();
    renderWithProviders(<SidebarFactories />);
    const collapsed = screen.getAllByTestId("sidebar-factory").length;
    expect(collapsed).toBeLessThanOrEqual(4);
    if (FEED_FACTORIES.length > 4) {
      await user.click(screen.getByTestId("sidebar-factories-toggle"));
      expect(screen.getAllByTestId("sidebar-factory")).toHaveLength(
        FEED_FACTORIES.length,
      );
      expect(useSidebarFactoryStore.getState().visibleRows).toBeGreaterThan(4);
    }
  });
});
