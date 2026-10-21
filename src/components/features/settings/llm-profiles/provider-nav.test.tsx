import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "test-utils";
import { ProviderNav } from "./provider-nav";
import { ALL_PROVIDERS_KEY } from "#/utils/llm-profile-provider";

const items = [
  { id: ALL_PROVIDERS_KEY, count: 3 },
  { id: "anthropic", count: 2 },
  { id: "openai", count: 1 },
];

describe("ProviderNav", () => {
  it("lists each provider with its profile count and marks the selected one", () => {
    renderWithProviders(
      <ProviderNav items={items} selectedId="anthropic" onSelect={vi.fn()} />,
    );

    const rows = screen.getAllByTestId("provider-nav-item");
    expect(rows).toHaveLength(3);
    expect(rows[1]).toHaveTextContent("Anthropic");
    expect(rows[1]).toHaveTextContent("2");
    expect(rows[1]).toHaveAttribute("aria-current", "true");
    expect(rows[0]).not.toHaveAttribute("aria-current");
  });

  it("reports the provider id of the row that was clicked", async () => {
    const onSelect = vi.fn();
    renderWithProviders(
      <ProviderNav
        items={items}
        selectedId={ALL_PROVIDERS_KEY}
        onSelect={onSelect}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: /OpenAI/ }));

    expect(onSelect).toHaveBeenCalledWith("openai");
  });
});
