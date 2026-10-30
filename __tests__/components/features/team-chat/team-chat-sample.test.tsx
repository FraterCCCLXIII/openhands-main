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
  it("opens on a welcome screen, then shows the sign-in dialog over a sample team", async () => {
    const user = userEvent.setup();
    renderScreen();

    expect(screen.getByTestId("team-chat-welcome")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("team-welcome-start"));

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByTestId("team-chat-gate")).toBeInTheDocument();
    // The real workspace is behind it, filled with the sample team.
    expect(screen.getByTestId("team-chat-workspace")).toBeInTheDocument();
    expect(screen.getAllByTestId("team-member").length).toBeGreaterThanOrEqual(
      6,
    );
  });

  it("lets you look around the sample from the welcome, with the sample note in the left bar", async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.click(screen.getByTestId("team-welcome-explore"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    const notice = screen.getByTestId("team-chat-sample-notice");
    expect(screen.getByTestId("team-chat-workspace")).toContainElement(notice);
    expect(
      screen.queryByTestId("team-chat-sample-banner"),
    ).not.toBeInTheDocument();
    // An agent request is waiting on you, with its own approve button.
    expect(await screen.findByTestId("agent-request")).toBeInTheDocument();

    await user.click(screen.getByTestId("team-chat-sample-open"));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByTestId("team-chat-sample-welcome"));
    expect(screen.getByTestId("team-chat-welcome")).toBeInTheDocument();
  });

  it("never touches the saved session while you look around", async () => {
    const user = userEvent.setup();
    renderScreen();
    await user.click(screen.getByTestId("team-welcome-explore"));
    await user.click(await screen.findByRole("button", { name: /APPROVE/ }));
    expect(useTeamChatStore.getState().account).toBeNull();
    expect(Object.keys(useTeamChatStore.getState().requests)).toEqual([]);
  });
});
