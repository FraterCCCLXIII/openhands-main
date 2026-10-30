import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useFactoryDispatch } from "#/components/features/automations/factory/use-factory-dispatch";
import { summarizeFactory } from "#/components/features/automations/factory/use-factory-data";
import { useFeedFactoriesStore } from "#/stores/feed-factories-store";
import { useFactoryInboxStore } from "#/stores/factory-inbox-store";
import { getConversationFactory } from "#/utils/feed-team-demo";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";

const { launchConversation, startTask } = vi.hoisted(() => ({
  launchConversation: vi.fn(),
  startTask: vi.fn(),
}));

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "en" } }),
}));
vi.mock("#/hooks/mutation/resolve-conversation-launch", () => ({
  launchConversation,
}));
vi.mock("#/hooks/query/use-agent-profiles", () => ({
  useAgentProfiles: () => ({ data: { profiles: [] } }),
}));
vi.mock(
  "#/api/conversation-service/agent-server-conversation-service.api",
  async (orig) => {
    const mod =
      await orig<
        typeof import("#/api/conversation-service/agent-server-conversation-service.api")
      >();
    return {
      ...mod,
      default: { ...mod.default, getStartTask: startTask },
    };
  },
);

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

const decision = {
  kind: "new" as const,
  conversationId: null,
  agentName: "OpenHands",
  reasons: [{ code: "no_match" as const }],
  confidence: 1,
  alternatives: [],
};

const send = async () => {
  const { result } = renderHook(() => useFactoryDispatch(), { wrapper });
  await act(async () => {
    await result.current({
      factoryId: "f1",
      factoryName: "Design Factory",
      text: "hi",
      targetLabel: "Factory inbox",
      decision,
      conversationTitle: null,
    });
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  useFeedFactoriesStore.setState(useFeedFactoriesStore.getInitialState());
  useFactoryInboxStore.setState({ items: [] });
  useFeedFactoriesStore.getState().addFactory({
    id: "f1",
    name: "Design Factory",
    description: "",
    ownerId: "you",
  });
});

describe("useFactoryDispatch", () => {
  it("places a new conversation by its real id, so the default conductor's factory counts it", async () => {
    launchConversation.mockResolvedValue({
      id: "t1",
      app_conversation_id: "conv-1",
      agent_server_url: null,
    });

    await send();

    const conversation = {
      id: "conv-1",
      title: "hi",
      selected_repository: null,
      updated_at: "2026-10-30T00:00:00.000Z",
      execution_status: "running",
      launched_agent_profile: { agent_profile_id: "p-default", revision: 1 },
    } as unknown as AppConversation;
    expect(launchConversation.mock.calls[0][1].tags).toEqual({
      openhandsfactory: "f1",
    });
    expect(getConversationFactory(conversation)?.id).toBe("f1");
    const summary = summarizeFactory([conversation], "f1");
    expect(summary.conversations).toHaveLength(1);
    expect(useFactoryInboxStore.getState().items[0].conversationId).toBe(
      "conv-1",
    );
  });

  it("moves the placement to the real conversation id once a Cloud launch is ready", async () => {
    launchConversation.mockResolvedValue({
      id: "t2",
      app_conversation_id: null,
      agent_server_url: null,
    });
    startTask.mockResolvedValue({
      id: "t2",
      status: "READY",
      app_conversation_id: "real-2",
    });

    const { useResolveTaskPlacements } =
      await import("#/hooks/use-resolve-task-placements");
    renderHook(() => useResolveTaskPlacements(), { wrapper });
    await send();

    await waitFor(() =>
      expect(useFeedFactoriesStore.getState().assignments["real-2"]).toEqual({
        factoryId: "f1",
        agentName: "OpenHands",
      }),
    );
    expect(startTask).toHaveBeenCalledWith("t2");
    expect(useFeedFactoriesStore.getState().assignments["task-t2"]).toBe(
      undefined,
    );
  });
});
