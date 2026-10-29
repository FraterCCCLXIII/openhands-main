import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FeedCard } from "#/components/features/feed/feed-card";
import AgentServerConversationService from "#/api/conversation-service/agent-server-conversation-service.api";
import EventService from "#/api/event-service/event-service.api";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { ExecutionStatus } from "#/types/agent-server/core";
import { renderWithProviders } from "../../../../test-utils";

const message = (
  id: string,
  role: "user" | "assistant",
  text: string,
  timestamp: string,
) => ({
  id,
  timestamp,
  source: role === "user" ? "user" : "agent",
  llm_message: { role, content: [{ type: "text", text }] },
  activated_skills: [],
  extended_content: [],
});

const conversation = {
  id: "c1",
  title: "Fix the build",
  selected_repository: "acme/app",
  updated_at: new Date().toISOString(),
  execution_status: ExecutionStatus.RUNNING,
  conversation_url: null,
  session_api_key: null,
} as unknown as AppConversation;

describe("FeedCard", () => {
  beforeEach(() => {
    vi.spyOn(EventService, "searchEvents").mockResolvedValue({
      items: [
        message(
          "e3",
          "assistant",
          "Build is green now",
          "2026-01-01T00:03:00Z",
        ),
        message("e2", "user", "Please retry", "2026-01-01T00:02:00Z"),
        message("e1", "assistant", "Build failed", "2026-01-01T00:01:00Z"),
      ],
      next_page_id: null,
    } as never);
  });

  it("shows the newest update compressed and reveals earlier ones on expand", async () => {
    const user = userEvent.setup();
    renderWithProviders(<FeedCard conversation={conversation} />);

    await screen.findByText("Build is green now");
    expect(screen.getByText("Fix the build")).toBeInTheDocument();
    expect(screen.getByTestId("feed-card-agent-name")).toHaveTextContent(
      "OpenHands",
    );
    expect(screen.getByTestId("feed-card-live")).toBeInTheDocument();
    expect(screen.queryByText("Please retry")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("feed-card-toggle"));

    await waitFor(() =>
      expect(screen.getAllByTestId("feed-update")).toHaveLength(3),
    );
    expect(screen.getByText("Please retry")).toBeInTheDocument();
  });
});

describe("FeedCard details", () => {
  it("reveals an agent message's reasoning behind a Details button", async () => {
    const user = userEvent.setup();
    vi.spyOn(EventService, "searchEvents").mockResolvedValue({
      items: [
        {
          ...message(
            "e1",
            "assistant",
            "Build is green",
            "2026-01-01T00:01:00Z",
          ),
          llm_message: {
            role: "assistant",
            content: [{ type: "text", text: "Build is green" }],
            reasoning_content: "The cache was stale.",
          },
        },
        message("e2", "user", "Thanks", "2026-01-01T00:02:00Z"),
      ],
      next_page_id: null,
    } as never);
    renderWithProviders(<FeedCard conversation={conversation} />);

    await user.click(await screen.findByTestId("feed-card-toggle"));
    await waitFor(() =>
      expect(screen.getAllByTestId("feed-update")).toHaveLength(2),
    );

    // Only the message that has reasoning gets a button.
    const toggle = screen.getByTestId("feed-update-details-toggle");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("The cache was stale.")).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("The cache was stale.")).toBeInTheDocument();
  });
});

describe("FeedCard reply", () => {
  it("sends the typed message to the conversation's agent", async () => {
    vi.spyOn(EventService, "searchEvents").mockResolvedValue({
      items: [],
      next_page_id: null,
    } as never);
    const sendMessage = vi
      .spyOn(AgentServerConversationService, "sendMessage")
      .mockResolvedValue({} as never);
    vi.spyOn(
      await import("#/api/conversation-file-upload.api"),
      "resolveConversationRuntime",
    ).mockResolvedValue(null as never);
    const user = userEvent.setup();
    renderWithProviders(<FeedCard conversation={conversation} />);

    await user.type(screen.getByTestId("feed-card-reply-input"), "Try again");
    await user.click(screen.getByTestId("feed-card-reply-send"));

    await waitFor(() =>
      expect(sendMessage).toHaveBeenCalledWith(
        "c1",
        { role: "user", content: [{ type: "text", text: "Try again" }] },
        null,
      ),
    );
    expect(screen.getByTestId("feed-card-reply-input")).toHaveValue("");
  });
});

describe("FeedCard menu", () => {
  it("sends the commit prompt and pins the conversation", async () => {
    vi.spyOn(EventService, "searchEvents").mockResolvedValue({
      items: [],
      next_page_id: null,
    } as never);
    const sendMessage = vi
      .spyOn(AgentServerConversationService, "sendMessage")
      .mockResolvedValue({} as never);
    vi.spyOn(
      await import("#/api/conversation-file-upload.api"),
      "resolveConversationRuntime",
    ).mockResolvedValue(null as never);
    const user = userEvent.setup();
    renderWithProviders(<FeedCard conversation={conversation} />);

    await user.click(screen.getByTestId("feed-card-menu-trigger"));
    await user.click(screen.getByTestId("feed-card-menu-commit"));

    await waitFor(() =>
      expect(sendMessage.mock.calls[0][1].content[0]).toMatchObject({
        text: expect.stringContaining("commit"),
      }),
    );

    await user.click(screen.getByTestId("feed-card-menu-trigger"));
    await user.click(screen.getByTestId("feed-card-menu-pin"));
    expect(await screen.findByTestId("feed-card-pinned")).toBeInTheDocument();
  });
});
