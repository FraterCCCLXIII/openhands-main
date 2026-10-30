import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "test-utils";
import { beforeEach, describe, expect, it } from "vitest";
import TeamChatScreen from "#/routes/team-chat";
import { useTeamChatStore } from "#/stores/team-chat-store";

beforeEach(() => {
  localStorage.clear();
  useTeamChatStore.setState(useTeamChatStore.getInitialState(), true);
});

const renderScreen = () => renderWithProviders(<TeamChatScreen />);

describe("Team chat before you are in a team", () => {
  it("shows the sign-in dialog over a sample team, and the dialog can be dismissed", async () => {
    const user = userEvent.setup();
    renderScreen();

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("team-chat-gate")).toBeInTheDocument();
    // The real workspace is behind it, filled with the sample team.
    expect(screen.getByTestId("team-chat-workspace")).toBeInTheDocument();
    expect(screen.getAllByTestId("team-member").length).toBeGreaterThanOrEqual(
      6,
    );

    await user.click(screen.getByTestId("team-chat-dismiss"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByTestId("team-chat-sample-banner")).toBeInTheDocument();
    // An agent request is waiting on you, with its own approve button.
    expect(await screen.findByTestId("agent-request")).toBeInTheDocument();

    await user.click(screen.getByTestId("team-chat-sample-open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("closes the dialog with Escape and never touches the saved session", async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(useTeamChatStore.getState().account).toBeNull();
    expect(Object.keys(useTeamChatStore.getState().requests)).toEqual([]);
  });
});
