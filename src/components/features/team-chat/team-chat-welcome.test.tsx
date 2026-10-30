import { fireEvent, render, screen, within } from "@testing-library/react";
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

describe("TeamChatWelcome built-with row", () => {
  it("credits Kamiji and Kosmos with logo links to their sites", () => {
    render(<TeamChatWelcome onStart={vi.fn()} onExplore={vi.fn()} />);

    const row = screen.getByRole("group", { name: "TEAM_CHAT$BUILT_WITH" });
    const kamiji = within(row).getByRole("link", { name: /^Kamiji/ });
    const kosmos = within(row).getByRole("link", { name: /^Kosmos/ });

    expect(within(kamiji).getByRole("img", { name: /^Kamiji/ })).toBeVisible();
    expect(new URL(kamiji.getAttribute("href")!).hostname).toBe("github.com");
    expect(within(kosmos).getByRole("img", { name: /^Kosmos/ })).toBeVisible();
    expect(new URL(kosmos.getAttribute("href")!).hostname).toBe(
      "kosmos.computer",
    );
  });
});
