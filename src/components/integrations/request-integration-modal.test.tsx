// @vitest-environment jsdom

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enableReactActEnvironment, setInputValue } from "@/src/test-utils/jsdom-helpers";
import type { IntegrationCatalogOption } from "@/src/types/integrations-hub";

const { fetchJsonMock } = vi.hoisted(() => ({
  fetchJsonMock: vi.fn(),
}));

vi.mock("@/src/lib/fetch-json", () => ({
  fetchJson: fetchJsonMock,
}));

import { RequestIntegrationModal } from "@/src/components/integrations/request-integration-modal";
import { INTEGRATIONS_PAGE_COPY } from "@/src/constants/integrations-page";

enableReactActEnvironment();

const catalog: IntegrationCatalogOption[] = [
  {
    slug: "github",
    name: "GitHub",
    description: "Source control",
    categories: ["Engineering"],
    notes: "",
    popularityRank: 1,
    connectionDefaults: { authStrategy: "oauth2" },
  },
  {
    slug: "linear",
    name: "Linear",
    description: "Issue tracking",
    categories: ["Project management"],
    notes: "",
    popularityRank: 2,
    docsUrl: "https://linear.app/docs",
    connectionDefaults: { authStrategy: "oauth2" },
  },
  {
    slug: "asana",
    name: "Asana",
    description: "Work management",
    categories: ["Project management"],
    notes: "",
    popularityRank: 3,
    docsUrl: "https://asana.com/guide",
    connectionDefaults: { authStrategy: "oauth2" },
  },
];

describe("RequestIntegrationModal", () => {
  let container: HTMLDivElement;
  let root: Root;
  let queryClient: QueryClient;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    root = createRoot(container);
    fetchJsonMock.mockReset();
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    queryClient.clear();
  });

  const renderModal = async (
    props: Partial<{
      catalog: IntegrationCatalogOption[];
      availableSlugs: Iterable<string>;
      onClose: () => void;
      onSubmitted: () => void;
    }> = {},
  ) => {
    const onClose = props.onClose ?? vi.fn();
    const onSubmitted = props.onSubmitted ?? vi.fn();
    await act(async () => {
      root.render(
        <QueryClientProvider client={queryClient}>
          <RequestIntegrationModal
            catalog={catalog}
            availableSlugs={["github"]}
            onClose={onClose}
            onSubmitted={onSubmitted}
            {...props}
          />
        </QueryClientProvider>,
      );
    });
    return { onClose, onSubmitted };
  };

  it("lists only integrations that are not already available", async () => {
    await renderModal();

    const modal = document.querySelector('[data-testid="request-integration-modal"]');
    expect(modal).toBeTruthy();
    expect(modal?.textContent).toContain("Linear");
    expect(modal?.textContent).not.toContain("GitHub");
  });

  it("submits the selected catalog integration with notes", async () => {
    fetchJsonMock.mockResolvedValue({
      id: "req-1",
      source: "catalog",
      slug: "linear",
      name: "Linear",
    });
    const { onSubmitted } = await renderModal();

    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="request-integration-option-linear"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const notes = document.querySelector<HTMLTextAreaElement>(
      '[data-testid="request-integration-notes"]',
    );
    expect(notes).toBeTruthy();
    await act(async () => {
      setInputValue(notes!, "Need this for planning.");
    });

    await act(async () => {
      document
        .querySelector<HTMLFormElement>('[data-testid="request-integration-modal"] form')
        ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(fetchJsonMock).toHaveBeenCalledWith("/api/integrations/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "catalog",
        slug: "linear",
        name: "Linear",
        description: "Issue tracking",
        docsUrl: "https://linear.app/docs",
        notes: "Need this for planning.",
      }),
    });
    expect(onSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "linear", source: "catalog" }),
    );
  });

  it("lets the user select multiple catalog integrations", async () => {
    fetchJsonMock
      .mockResolvedValueOnce({
        id: "req-1",
        source: "catalog",
        slug: "linear",
        name: "Linear",
      })
      .mockResolvedValueOnce({
        id: "req-2",
        source: "catalog",
        slug: "asana",
        name: "Asana",
      });
    const { onSubmitted } = await renderModal();

    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="request-integration-option-linear"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      document
        .querySelector<HTMLButtonElement>('[data-testid="request-integration-option-asana"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(
      document.querySelector('[data-testid="request-integration-selected-count"]')?.textContent,
    ).toBe("2 selected");
    expect(
      document.querySelector<HTMLButtonElement>(
        '[data-testid="request-integration-modal"] button[type="submit"]',
      )?.textContent,
    ).toBe("Send 2 requests");

    await act(async () => {
      document
        .querySelector<HTMLFormElement>('[data-testid="request-integration-modal"] form')
        ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(fetchJsonMock).toHaveBeenCalledTimes(2);
    expect(fetchJsonMock).toHaveBeenNthCalledWith(1, "/api/integrations/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "catalog",
        slug: "linear",
        name: "Linear",
        description: "Issue tracking",
        docsUrl: "https://linear.app/docs",
      }),
    });
    expect(fetchJsonMock).toHaveBeenNthCalledWith(2, "/api/integrations/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "catalog",
        slug: "asana",
        name: "Asana",
        description: "Work management",
        docsUrl: "https://asana.com/guide",
      }),
    });
    expect(onSubmitted).toHaveBeenCalledTimes(1);
    expect(onSubmitted).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "asana", source: "catalog" }),
    );
  });

  it("toggles a catalog selection off when clicked again", async () => {
    await renderModal();

    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="request-integration-option-linear"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });
    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="request-integration-option-linear"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(document.querySelector('[data-testid="request-integration-selected-count"]')).toBeNull();

    await act(async () => {
      document
        .querySelector<HTMLFormElement>('[data-testid="request-integration-modal"] form')
        ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(document.querySelector('[data-testid="request-integration-error"]')?.textContent).toBe(
      INTEGRATIONS_PAGE_COPY.requestIntegrationSelectRequired,
    );
    expect(fetchJsonMock).not.toHaveBeenCalled();
  });

  it("requires a catalog selection before submit", async () => {
    await renderModal();

    await act(async () => {
      document
        .querySelector<HTMLFormElement>('[data-testid="request-integration-modal"] form')
        ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(document.querySelector('[data-testid="request-integration-error"]')?.textContent).toBe(
      INTEGRATIONS_PAGE_COPY.requestIntegrationSelectRequired,
    );
    expect(fetchJsonMock).not.toHaveBeenCalled();
  });

  it("submits a custom integration with admin metadata", async () => {
    fetchJsonMock.mockResolvedValue({
      id: "req-2",
      source: "custom",
      slug: "internal-wiki",
      name: "Internal Wiki",
    });
    const { onSubmitted } = await renderModal();

    await act(async () => {
      document
        .querySelector<HTMLButtonElement>('[data-testid="request-integration-custom-tab"]')
        ?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    await act(async () => {
      setInputValue(
        document.querySelector('[data-testid="request-integration-custom-name"]') as HTMLInputElement,
        "Internal Wiki",
      );
      setInputValue(
        document.querySelector(
          '[data-testid="request-integration-custom-description"]',
        ) as HTMLTextAreaElement,
        "Company knowledge base",
      );
      setInputValue(
        document.querySelector(
          '[data-testid="request-integration-custom-docs-url"]',
        ) as HTMLInputElement,
        "https://wiki.example.com",
      );
      setInputValue(
        document.querySelector('[data-testid="request-integration-notes"]') as HTMLTextAreaElement,
        "Read-only access",
      );
    });

    await act(async () => {
      document
        .querySelector<HTMLFormElement>('[data-testid="request-integration-modal"] form')
        ?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
    });

    expect(fetchJsonMock).toHaveBeenCalledWith("/api/integrations/requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        source: "custom",
        slug: "internal-wiki",
        name: "Internal Wiki",
        description: "Company knowledge base",
        docsUrl: "https://wiki.example.com",
        notes: "Read-only access",
      }),
    });
    expect(onSubmitted).toHaveBeenCalled();
  });
});
