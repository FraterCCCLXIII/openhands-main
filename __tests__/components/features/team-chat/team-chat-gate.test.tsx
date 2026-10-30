import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { TeamChatGate } from "#/components/features/team-chat/team-chat-gate";
import { useTeamChatStore } from "#/stores/team-chat-store";

beforeEach(() => {
  localStorage.clear();
  useTeamChatStore.setState(useTeamChatStore.getInitialState(), true);
});

describe("TeamChatGate", () => {
  it("shows the new key and only continues once it is confirmed saved", async () => {
    const user = userEvent.setup();
    render(<TeamChatGate />);

    await user.type(screen.getByRole("textbox"), "Maya");
    await user.click(screen.getByRole("button", { name: /TAB_CREATE/ }));

    const secret = screen.getByLabelText(/SECRET_KEY$/) as HTMLInputElement;
    expect(secret.value).toMatch(/^nsec1/);
    const next = screen.getByRole("button", { name: /CONTINUE/ });
    expect(next).toBeDisabled();

    await user.click(screen.getByRole("checkbox"));
    expect(next).toBeEnabled();
    await user.click(next);

    expect(useTeamChatStore.getState().account?.name).toBe("Maya");
  });
});
