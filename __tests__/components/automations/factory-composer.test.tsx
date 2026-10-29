import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FactoryComposer } from "#/components/features/automations/factory/factory-composer";
import type { FactoryData } from "#/components/features/automations/factory/use-factory-data";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { useFactoryInboxStore } from "#/stores/factory-inbox-store";
import { FEED_FACTORIES } from "#/utils/feed-team-demo";
import { pickFeedDemoAgent } from "#/utils/feed-demo-agents";
import { renderWithProviders } from "../../../test-utils";

// The global mock drops interpolation; keep the values so the preview is visible.
vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${Object.values(options).join(",")}` : key,
    i18n: { language: "en", exists: () => false },
  }),
}));

const dispatch = vi.fn();
vi.mock(
  "#/components/features/automations/factory/use-factory-dispatch",
  () => ({ useFactoryDispatch: () => dispatch }),
);

const conversation = {
  id: "c1",
  title: "Refactor render scale governor to Rust",
  selected_repository: null,
  pr_number: [412],
  tags: null,
  updated_at: "2026-08-01T12:00:00.000Z",
} as unknown as AppConversation;

const data: FactoryData = {
  conversations: [conversation],
  live: 0,
  agents: [{ agent: pickFeedDemoAgent("c1"), conversations: 1, live: 0 }],
  projects: [],
  lastActivity: conversation.updated_at,
  isLoading: false,
};

const render = (target = { kind: "inbox" } as const, onTarget = vi.fn()) =>
  renderWithProviders(
    <FactoryComposer
      factory={FEED_FACTORIES[0]}
      data={data}
      target={target}
      onTarget={onTarget}
    />,
  );

describe("FactoryComposer", () => {
  beforeEach(() => {
    dispatch.mockReset();
    useFactoryInboxStore.setState({ items: [] });
  });

  it("previews where a request will go before it is sent", async () => {
    const user = userEvent.setup();
    render();

    await user.type(
      screen.getByTestId("factory-composer-input"),
      "rebase #412 please",
    );

    expect(screen.getByTestId("factory-route-preview")).toHaveTextContent(
      conversation.title as string,
    );
  });

  it("sends the routed request and clears the input", async () => {
    const user = userEvent.setup();
    render();

    await user.type(
      screen.getByTestId("factory-composer-input"),
      "rebase #412 please",
    );
    await user.click(screen.getByTestId("factory-composer-send"));

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch.mock.calls[0][0]).toMatchObject({
      factoryId: FEED_FACTORIES[0].id,
      text: "rebase #412 please",
      decision: { kind: "existing", conversationId: "c1" },
    });
    expect(screen.getByTestId("factory-composer-input")).toHaveValue("");
  });

  it("lets the target be an agent, a conversation or a pull request", async () => {
    const user = userEvent.setup();
    const onTarget = vi.fn();
    render({ kind: "inbox" }, onTarget);

    await user.click(screen.getByTestId("factory-target-trigger"));
    await user.click(screen.getByTestId("factory-target-conversation"));
    expect(onTarget).toHaveBeenLastCalledWith({
      kind: "conversation",
      conversationId: "c1",
    });

    await user.click(screen.getByTestId("factory-target-trigger"));
    await user.click(screen.getByTestId("factory-target-pr"));
    expect(onTarget).toHaveBeenLastCalledWith({ kind: "pr", prNumber: "412" });
  });

  it("does not send an empty request", () => {
    render();
    expect(screen.getByTestId("factory-composer-send")).toBeDisabled();
  });
});
