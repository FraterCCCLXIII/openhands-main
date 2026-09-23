import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router";
import { InstallerPage } from "#/components/features/installer/installer-page";
import { renderWithProviders } from "../../../../test-utils";

describe("InstallerPage", () => {
  it("renders a conversation pane and a structured fields column", () => {
    renderWithProviders(
      <MemoryRouter>
        <InstallerPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("installer-page")).toBeInTheDocument();
    expect(screen.getByTestId("installer-chat-interface")).toBeInTheDocument();
    expect(screen.getByTestId("installer-fields-pane")).toBeInTheDocument();
    expect(screen.getByTestId("installer-field-webHost")).toBeInTheDocument();
    expect(
      screen.getByTestId("installer-field-gitProvider"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("installer-field-ticketsProvider"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("installer-section-divider-network"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("installer-section-divider-goals"),
    ).toBeInTheDocument();
  });
});
