import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "test-utils";
import { ProviderNav } from "./provider-nav";

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string) =>
      ({
        SETTINGS$PROVIDER_CONNECTED: "Connected",
        SETTINGS$PROVIDER_CONNECT: "Connect",
      })[key] ?? key,
  }),
}));

const items = [
  { id: "anthropic", connectionCount: 2 },
  { id: "openai", connectionCount: 0 },
];

describe("ProviderNav", () => {
  it("lists each provider with its connection status", () => {
    renderWithProviders(<ProviderNav items={items} onSelect={vi.fn()} />);

    const rows = screen.getAllByTestId("provider-nav-item");
    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent("Anthropic");
    expect(rows[0]).toHaveTextContent("Connected");
    expect(rows[1]).toHaveTextContent("OpenAI");
    expect(rows[1]).toHaveTextContent("Connect");
  });

  it("reports the provider id of the row that was clicked", async () => {
    const onSelect = vi.fn();
    renderWithProviders(<ProviderNav items={items} onSelect={onSelect} />);

    await userEvent.click(screen.getByRole("button", { name: /OpenAI/ }));

    expect(onSelect).toHaveBeenCalledWith("openai");
  });
});
