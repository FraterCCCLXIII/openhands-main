import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { FeedCard } from "#/components/features/feed/feed-card";
import AgentServerConversationService from "#/api/conversation-service/agent-server-conversation-service.api";
import EventService from "#/api/event-service/event-service.api";
import type { AppConversation } from "#/api/conversation-service/agent-server-conversation-service.types";
import { ExecutionStatus } from "#/types/agent-server/core";
import { LIVE_POLL_MS } from "#/hooks/query/use-feed-updates";
import {
  FEED_LIVE_MAX_SOCKETS,
  liveSocketCount,
} from "#/hooks/use-feed-live-stream";
import { renderWithProviders } from "../../../../test-utils";

class FakeSocket {
  static instances: FakeSocket[] = [];

  static OPEN = 1;

  static CONNECTING = 0;

  static CLOSING = 2;

  static CLOSED = 3;

  readyState = 0;

  onopen: ((e: Event) => void) | null = null;

  onmessage: ((e: MessageEvent) => void) | null = null;

  onclose: ((e: CloseEvent) => void) | null = null;

  onerror: ((e: Event) => void) | null = null;

  closed = false;

  constructor(public url: string) {
    FakeSocket.instances.push(this);
    queueMicrotask(() => {
      this.readyState = 1;
      this.onopen?.(new Event("open"));
    });
  }

  send() {}

  close() {
    this.closed = true;
    this.readyState = 3;
  }

  emit(frame: unknown) {
    this.onmessage?.({ data: JSON.stringify(frame) } as MessageEvent);
  }
}

const conversation = (id: string, status = ExecutionStatus.RUNNING) =>
  ({
    id,
    title: `Title ${id}`,
    selected_repository: null,
    updated_at: new Date().toISOString(),
    execution_status: status,
    sandbox_status: "RUNNING",
    conversation_url: `http://localhost:3000/api/conversations/${id}`,
    session_api_key: null,
  }) as unknown as AppConversation;

let intersecting = true;
const observers: Array<(visible: boolean) => void> = [];

describe("FeedCard live updates", () => {
  beforeEach(() => {
    FakeSocket.instances = [];
    intersecting = true;
    observers.length = 0;
    vi.stubGlobal("WebSocket", FakeSocket);
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        constructor(cb: IntersectionObserverCallback) {
          observers.push((visible) =>
            cb(
              [{ isIntersecting: visible } as IntersectionObserverEntry],
              this as never,
            ),
          );
          queueMicrotask(() =>
            cb(
              [{ isIntersecting: intersecting } as IntersectionObserverEntry],
              this as never,
            ),
          );
        }

        observe() {}

        disconnect() {}

        unobserve() {}
      },
    );
    vi.spyOn(EventService, "getEventCount").mockResolvedValue(10);
    vi.spyOn(EventService, "searchEvents").mockResolvedValue({
      items: [],
      next_page_id: null,
    } as never);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("appends streamed deltas incrementally as markdown with a caret, then swaps in the final message", async () => {
    renderWithProviders(<FeedCard conversation={conversation("live-1")} />);
    await waitFor(() => expect(FakeSocket.instances).toHaveLength(1));
    const socket = FakeSocket.instances[0];
    expect(socket.url).toContain("/sockets/session/live-1");
    expect(socket.url).toContain("after_seq=9");

    act(() => {
      socket.emit({ type: "item_started", item_id: "m1" });
      socket.emit({
        type: "delta",
        item_id: "m1",
        order: 1,
        content: "Hello **wor",
      });
    });
    await waitFor(() =>
      expect(screen.getByTestId("feed-update-text")).toHaveTextContent("Hello"),
    );
    expect(screen.getByTestId("feed-stream-caret")).toBeInTheDocument();

    act(() => {
      socket.emit({ type: "delta", item_id: "m1", order: 2, content: "ld**" });
    });
    await waitFor(() =>
      expect(
        screen.getByTestId("feed-update-text").querySelector("strong"),
      ).toHaveTextContent("world"),
    );

    act(() => {
      socket.emit({
        type: "durable",
        seq: 11,
        event: {
          id: "m1",
          timestamp: new Date().toISOString(),
          source: "agent",
          llm_message: {
            role: "assistant",
            content: [{ type: "text", text: "Hello **world**" }],
          },
          activated_skills: [],
          extended_content: [],
        },
      });
    });
    await waitFor(() =>
      expect(screen.queryByTestId("feed-stream-caret")).not.toBeInTheDocument(),
    );
    expect(screen.getAllByTestId("feed-update")).toHaveLength(1);
  });

  it("opens a socket only for visible running cards and closes it when scrolled away or finished", async () => {
    const { rerender } = renderWithProviders(
      <FeedCard conversation={conversation("live-2")} />,
    );
    await waitFor(() => expect(FakeSocket.instances).toHaveLength(1));
    expect(liveSocketCount()).toBe(1);

    act(() => observers.forEach((notify) => notify(false)));
    await waitFor(() => expect(FakeSocket.instances[0].closed).toBe(true));
    expect(liveSocketCount()).toBe(0);

    act(() => observers.forEach((notify) => notify(true)));
    await waitFor(() => expect(FakeSocket.instances).toHaveLength(2));

    rerender(
      <FeedCard conversation={conversation("live-2", ExecutionStatus.IDLE)} />,
    );
    await waitFor(() => expect(FakeSocket.instances[1].closed).toBe(true));
  });

  it("never opens a socket for an idle card or one scrolled off screen", async () => {
    intersecting = false;
    renderWithProviders(<FeedCard conversation={conversation("live-3")} />);
    renderWithProviders(
      <FeedCard conversation={conversation("idle-1", ExecutionStatus.IDLE)} />,
    );
    await act(async () => {
      await Promise.resolve();
    });
    expect(FakeSocket.instances).toHaveLength(0);
  });

  it("caps concurrent sockets", async () => {
    const total = FEED_LIVE_MAX_SOCKETS + 2;
    for (let i = 0; i < total; i += 1) {
      renderWithProviders(<FeedCard conversation={conversation(`cap-${i}`)} />);
    }
    await waitFor(() =>
      expect(FakeSocket.instances.length).toBeGreaterThanOrEqual(
        FEED_LIVE_MAX_SOCKETS,
      ),
    );
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(liveSocketCount()).toBe(FEED_LIVE_MAX_SOCKETS);
    expect(FakeSocket.instances).toHaveLength(FEED_LIVE_MAX_SOCKETS);
  });

  it("falls back to short polling when there is no live socket", async () => {
    const search = vi.spyOn(EventService, "searchEvents");
    const noUrl = { ...conversation("poll-1"), conversation_url: null };
    renderWithProviders(<FeedCard conversation={noUrl as AppConversation} />);
    await waitFor(() => expect(search).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(search.mock.calls.length).toBeGreaterThan(1), {
      timeout: LIVE_POLL_MS + 2000,
    });
    expect(FakeSocket.instances).toHaveLength(0);
  }, 10_000);

  it("shows a reply in the thread immediately, before the server answers", async () => {
    let finish: () => void = () => {};
    vi.spyOn(AgentServerConversationService, "sendMessage").mockReturnValue(
      new Promise((resolve) => {
        finish = () => resolve({} as never);
      }) as never,
    );
    vi.spyOn(
      await import("#/api/conversation-file-upload.api"),
      "resolveConversationRuntime",
    ).mockResolvedValue(null as never);
    const user = userEvent.setup();
    renderWithProviders(
      <FeedCard conversation={conversation("reply-1", ExecutionStatus.IDLE)} />,
    );
    await user.type(screen.getByTestId("feed-card-reply-input"), "Ship it");
    await user.click(screen.getByTestId("feed-card-reply-send"));

    expect(await screen.findByText("Ship it")).toBeInTheDocument();
    finish();
  });
});
