import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { TeamChatWelcome } from "#/components/features/team-chat/team-chat-welcome";

describe("TeamChatWelcome", () => {
  it("offers the sign-in dialog and the sample team, over the sprite scene", async () => {
    const user = userEvent.setup();
    const onStart = vi.fn();
    const onExplore = vi.fn();
    const { container } = render(
      <TeamChatWelcome onStart={onStart} onExplore={onExplore} />,
    );

    expect(container.querySelector("canvas")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    await user.click(screen.getByTestId("team-welcome-start"));
    await user.click(screen.getByTestId("team-welcome-explore"));
    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onExplore).toHaveBeenCalledTimes(1);
  });
});
