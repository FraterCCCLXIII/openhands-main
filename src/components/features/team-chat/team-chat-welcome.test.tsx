import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TeamChatWelcome } from "./team-chat-welcome";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe("TeamChatWelcome character style", () => {
  beforeEach(() => localStorage.clear());

  it("starts on pixel characters and switches to blobby with the dot toggle, remembering the choice", () => {
    const { unmount } = render(
      <TeamChatWelcome onStart={vi.fn()} onExplore={vi.fn()} />,
    );
    expect(screen.getByTestId("team-welcome-style-pixel")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    fireEvent.click(screen.getByTestId("team-welcome-style-blobby"));
    expect(screen.getByTestId("team-welcome-style-blobby")).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    unmount();
    render(<TeamChatWelcome onStart={vi.fn()} onExplore={vi.fn()} />);
    expect(screen.getByTestId("team-welcome-style-blobby")).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
