// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { CuratedProviderList } from "@/src/components/admin/curated-provider-list";
import type {
  BuiltInConnectorOption,
  OAuthProviderCatalogOption,
} from "@/src/types/context-layer";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const readyBuiltInConnectors: BuiltInConnectorOption[] = [
  {
    slug: "github",
    name: "GitHub",
    description: "GitHub connector",
    toolCount: 4,
    categories: ["Engineering"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    oauthConfigured: true,
    credentialLabel: "Connect GitHub",
    credentialPlaceholder: "Connect GitHub",
    credentialHelp: "Connect GitHub with OAuth.",
  },
];

const providerCatalog: OAuthProviderCatalogOption[] = [
  {
    slug: "github",
    name: "GitHub",
    description: "GitHub repositories and pull requests",
    categories: ["Engineering"],
    authStrategy: "oauth2",
    availability: "oauth_ready",
    builtInSlug: "github",
    appUrl: "https://github.com",
    docsUrl: "https://docs.github.com/apps/oauth-apps",
    notes: "Available now as a built-in connector.",
    popularityRank: 1,
  },
  {
    slug: "google-calendar",
    name: "Google Calendar",
    description: "Calendar events and schedules",
    categories: ["Productivity"],
    authStrategy: "oauth2",
    availability: "planned",
    docsUrl: "https://developers.google.com/identity/protocols/oauth2",
    notes: "Useful for scheduling workflows.",
    popularityRank: 2,
  },
];

describe("CuratedProviderList", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
  });

  it("renders a compact searchable list and reveals an example API call when expanded", async () => {
    await act(async () => {
      root.render(
        <CuratedProviderList
          providerCatalog={providerCatalog}
          readyBuiltInConnectors={readyBuiltInConnectors}
        />,
      );
    });

    expect(container.textContent).toContain("Search curated adaptors");
    expect(container.textContent).toContain("GitHub repositories and pull requests");
    expect(container.textContent).not.toContain("Example API call");

    const githubButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("GitHub"),
    );
    expect(githubButton).toBeTruthy();

    await act(async () => {
      githubButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Example API call");
    expect(container.textContent).toContain("curl -X POST");
    expect(container.textContent).toContain("$BASE_URL/api/managed-connectors");
    expect(container.textContent).toContain('"slug": "github"');

    const searchInput = container.querySelector('input[type="search"]');
    expect(searchInput).toBeTruthy();

    await act(async () => {
      if (searchInput instanceof HTMLInputElement) {
        const valueSetter = Object.getOwnPropertyDescriptor(
          HTMLInputElement.prototype,
          "value",
        )?.set;
        valueSetter?.call(searchInput, "calendar");
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 0));
      }
    });

    expect(container.textContent).toContain("Google Calendar");
    expect(container.textContent).not.toContain("GitHub repositories and pull requests");
  });
});
