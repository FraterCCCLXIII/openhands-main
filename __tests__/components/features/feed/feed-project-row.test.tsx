import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { FeedProjectRow } from "#/components/features/feed/feed-project-row";
import { useFeedIconsStore } from "#/stores/feed-icons-store";
import { renderWithProviders } from "../../../../test-utils";

const renderRow = () =>
  renderWithProviders(
    <ul>
      <FeedProjectRow
        project="acme/app"
        count={3}
        selected={false}
        onSelect={() => {}}
      />
    </ul>,
  );

describe("FeedProjectRow", () => {
  it("opens the icon editor in a modal from the three-dot menu", async () => {
    const user = userEvent.setup();
    renderRow();

    expect(screen.queryByTestId("feed-icon-modal")).toBeNull();
    await user.click(screen.getByTestId("feed-icon-menu-trigger"));
    await user.click(screen.getByTestId("feed-icon-menu-customize"));

    expect(screen.getByTestId("feed-icon-modal")).toBeInTheDocument();
    expect(screen.queryByTestId("feed-icon-menu")).toBeNull();
  });

  it("saves a picked color for the project and closes", async () => {
    const user = userEvent.setup();
    renderRow();

    await user.click(screen.getByTestId("feed-icon-menu-trigger"));
    await user.click(screen.getByTestId("feed-icon-menu-customize"));
    await user.click(screen.getByTestId("color-swatch-violet"));

    expect(useFeedIconsStore.getState().icons["acme/app"]).toMatchObject({
      background: "violet",
    });

    await user.click(screen.getByTestId("feed-icon-modal-close"));
    expect(screen.queryByTestId("feed-icon-modal")).toBeNull();
  });
});
