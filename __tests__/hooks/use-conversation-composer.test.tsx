import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useConversationComposer } from "#/hooks/use-conversation-composer";
import {
  HOME_COMPOSER_KEY,
  useConversationStore,
} from "#/stores/conversation-store";

const routeState = vi.hoisted(() => ({ id: null as string | null }));

vi.mock("#/hooks/use-conversation-id", () => ({
  useOptionalConversationId: () => ({ conversationId: routeState.id }),
}));

afterEach(() => {
  routeState.id = null;
  useConversationStore.setState({ byConversation: {} });
});

describe("useConversationComposer", () => {
  it("keeps one conversation's draft and attachments out of another's composer", () => {
    // Arrange
    const file = new File(["x"], "notes.txt");
    routeState.id = "conv-a";
    const { result, rerender } = renderHook(() => useConversationComposer());

    // Act
    act(() => {
      result.current.addFiles([file]);
      result.current.setMessageToSend("draft for a");
    });
    routeState.id = "conv-b";
    rerender();

    // Assert
    expect(result.current.conversationKey).toBe("conv-b");
    expect(result.current.files).toEqual([]);
    expect(result.current.messageToSend).toBeNull();

    routeState.id = "conv-a";
    rerender();
    expect(result.current.files).toEqual([file]);
    expect(result.current.messageToSend?.text).toBe("draft for a");
  });

  it("uses the Home composer when no conversation is in scope", () => {
    // Arrange
    const { result } = renderHook(() => useConversationComposer());

    // Act
    act(() => result.current.setSubmittedMessage("hello"));

    // Assert
    expect(result.current.conversationKey).toBe(HOME_COMPOSER_KEY);
    expect(
      useConversationStore.getState().byConversation[HOME_COMPOSER_KEY]
        .submittedMessage,
    ).toBe("hello");
  });
});
