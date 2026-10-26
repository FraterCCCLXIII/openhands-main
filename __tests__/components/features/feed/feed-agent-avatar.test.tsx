import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FeedAgentAvatar } from "#/components/features/feed/feed-agent-avatar";
import { getFeedAgentLook } from "#/components/features/feed/feed-agent-look";
import { ExecutionStatus } from "#/types/agent-server/core";
import { renderWithProviders } from "../../../../test-utils";

describe("getFeedAgentLook", () => {
  it.each([
    [ExecutionStatus.RUNNING, "neutral", "Typing"],
    [ExecutionStatus.FINISHED, "excited", "Celebrate"],
    [ExecutionStatus.ERROR, "surprised", "Bounce"],
    [ExecutionStatus.STUCK, "sad", "Idle"],
    [ExecutionStatus.WAITING_FOR_CONFIRMATION, "thinking", "Think"],
    [ExecutionStatus.PAUSED, "sleepy", "Idle"],
    [ExecutionStatus.IDLE, "neutral", "Idle"],
    [undefined, "neutral", "Idle"],
    [null, "neutral", "Idle"],
  ])("maps %s to the %s mood", (status, expression, animation) => {
    expect(getFeedAgentLook(status)).toEqual({ expression, animation });
  });
});

describe("FeedAgentAvatar", () => {
  it("shows the Kamiji unclipped at the requested size", () => {
    renderWithProviders(
      <FeedAgentAvatar
        data-testid="avatar"
        agent={{ name: "OpenHands", icon: "openhands" }}
        size={40}
        status={ExecutionStatus.FINISHED}
      />,
    );

    const avatar = screen.getByTestId("avatar");
    expect(avatar).not.toHaveClass("overflow-hidden", "rounded-full");
    expect(avatar.style.width).toBe("40px");
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});
