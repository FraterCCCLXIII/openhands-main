import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, useLocation } from "react-router";
import { describe, expect, it, vi } from "vitest";
import FactoryScreen from "#/routes/factory";

vi.mock("#/hooks/query/use-paginated-conversations", () => ({
  usePaginatedConversations: () => ({ data: { pages: [{ items: [] }] } }),
}));

function LocationProbe() {
  const { search } = useLocation();
  return <span data-testid="search">{search}</span>;
}

function renderFactory(entry: string) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[entry]}>
        <FactoryScreen />
        <LocationProbe />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("FactoryScreen new-factory link", () => {
  it("opens the Add Factory modal for ?new=1 and clears the param", async () => {
    renderFactory("/factory?new=1&keep=1");

    expect(await screen.findByTestId("add-factory-name")).toBeInTheDocument();
    expect(screen.getByTestId("search")).toHaveTextContent("?keep=1");
  });

  it("keeps the modal closed on a plain visit", () => {
    renderFactory("/factory");

    expect(screen.queryByTestId("add-factory-name")).not.toBeInTheDocument();
  });
});
