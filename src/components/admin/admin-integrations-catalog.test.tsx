// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdminIntegrationsCatalog } from "@/src/components/admin/admin-integrations-catalog";
import type {
  BuiltInConnectorOption,
  ManagedConnectorDefinition,
  OAuthProviderCatalogOption,
} from "@/src/types/context-layer";

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const providerCatalog: OAuthProviderCatalogOption[] = [
  {
    slug: "google-calendar",
    name: "Google Calendar",
    description: "Calendar events and schedules",
    categories: ["Productivity"],
    authStrategy: "oauth2",
    availability: "oauth_ready",
    docsUrl: "https://developers.google.com/identity/protocols/oauth2",
    notes: "Useful for scheduling workflows.",
    popularityRank: 1,
    registrationDefaults: {
      provider: "http",
      apiBaseUrl: "https://www.googleapis.com/calendar/v3",
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
      functionName: "list_events",
      functionDescription: "List events from the user's primary Google Calendar.",
      requestMethod: "GET",
      requestPath: "/calendars/primary/events",
    },
  },
];

const readyBuiltInConnectors: BuiltInConnectorOption[] = [
  {
    slug: "google-calendar",
    name: "Google Calendar",
    description: "Calendar events and schedules",
    toolCount: 1,
    categories: ["Productivity"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    oauthConfigured: true,
    credentialLabel: "Connect Google Calendar",
    credentialPlaceholder: "Connect Google Calendar",
    credentialHelp: "Connect Google Calendar with OAuth.",
  },
];

const managedConnectors: ManagedConnectorDefinition[] = [
  {
    slug: "google-calendar",
    name: "Google Calendar",
    description: "Calendar events and schedules",
    categories: ["Productivity"],
    authModes: ["oauth2"],
    authStrategy: "oauth2",
    provider: "http",
    oauthConfigured: true,
    credentialLabel: "Connect Google Calendar",
    credentialPlaceholder: "Connect Google Calendar",
    credentialHelp: "Connect Google Calendar with OAuth.",
    apiBaseUrl: "https://www.googleapis.com/calendar/v3",
    openApiUrl: "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
    oauthConfig: {
      authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenUrl: "https://oauth2.googleapis.com/token",
      scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
    },
    functions: [
      {
        name: "list_events",
        description: "List events from the user's primary Google Calendar.",
        defaultScopes: ["https://www.googleapis.com/auth/calendar.readonly"],
        request: {
          method: "GET",
          path: "/calendars/primary/events",
        },
      },
    ],
    enabled: true,
    createdAt: "2026-03-09T00:00:00.000Z",
    updatedAt: "2026-03-09T00:00:00.000Z",
  },
];

describe("AdminIntegrationsCatalog", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ deleted: true, slug: "google-calendar" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("confirm", vi.fn(() => true));
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("updates the curated provider list immediately after deleting a managed connector", async () => {
    await act(async () => {
      root.render(
        <AdminIntegrationsCatalog
          providerCatalog={providerCatalog}
          initialReadyBuiltInConnectors={readyBuiltInConnectors}
          managedConnectors={managedConnectors}
          canRegisterManagedConnectors
          oauthCallbackBaseUrl="https://openhands-context-layer.vercel.app/api/oauth"
        />,
      );
    });

    const googleButtons = () =>
      Array.from(container.querySelectorAll("button")).filter((button) =>
        button.textContent?.includes("Google Calendar"),
      );

    await act(async () => {
      googleButtons().at(-1)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain(
      "This provider is already available in the integration wizard, so no additional registration is needed.",
    );
    expect(container.textContent).toContain("Use Google Calendar");

    await act(async () => {
      googleButtons()[0]?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    const deleteButton = container.querySelector(
      'button[aria-label="Delete Google Calendar connector"]',
    );
    expect(deleteButton).toBeTruthy();

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/managed-connectors/google-calendar", {
      method: "DELETE",
    });
    expect(container.textContent).not.toContain("Use Google Calendar");

    await act(async () => {
      googleButtons().at(-1)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Register this provider");
    expect(container.textContent).not.toContain(
      "This provider is already available in the integration wizard, so no additional registration is needed.",
    );
  });
});
