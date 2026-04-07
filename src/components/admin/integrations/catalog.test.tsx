// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { IntegrationsCatalog } from "@/src/components/admin/integrations/catalog";
import type {
  ManagedConnectorOption,
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
      toolName: "list_events",
      toolDescription: "List events from the user's primary Google Calendar.",
      requestMethod: "GET",
      requestPath: "/calendars/primary/events",
    },
  },
];

const readyManagedConnectors: ManagedConnectorOption[] = [
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
    tools: [
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

const googleManagedConnector = managedConnectors[0];
if (!googleManagedConnector) {
  throw new Error("Missing integrations catalog test fixture");
}


const manualTokenProvider: OAuthProviderCatalogOption = {
  slug: "elevenlabs",
  name: "ElevenLabs",
  description: "Text to speech and audio generation",
  categories: ["Audio"],
  authStrategy: "api_key",
  availability: "manual_token",
  managedConnectorSlug: "elevenlabs",
  docsUrl: "https://elevenlabs.io/docs/api-reference/introduction",
  notes: "Published API schema with manual user API keys.",
  popularityRank: 2,
  registrationDefaults: {
    provider: "http",
    authModes: ["api_key"],
    authStrategy: "api_key",
    credentialLabel: "ElevenLabs API key",
    credentialPlaceholder: "Paste your ElevenLabs API key",
    credentialHelp: "Workspace API key",
    apiBaseUrl: "https://api.elevenlabs.io",
    openApiUrl: "https://api.elevenlabs.io/openapi.json",
    apiKeyHeaderName: "xi-api-key",
  },
};

const manualTokenConnector: ManagedConnectorDefinition = {
  slug: "elevenlabs",
  name: "ElevenLabs",
  description: "Internal ElevenLabs proxy connector",
  categories: ["Audio"],
  authModes: ["api_key"],
  authStrategy: "api_key",
  provider: "http",
  oauthConfigured: false,
  credentialLabel: "ElevenLabs API key",
  credentialPlaceholder: "Paste your ElevenLabs API key",
  credentialHelp: "Workspace API key",
  apiBaseUrl: "https://internal.example.com/elevenlabs",
  openApiUrl: "https://internal.example.com/elevenlabs/openapi.json",
  tools: [],
  enabled: true,
  createdAt: "2026-03-10T00:00:00.000Z",
  updatedAt: "2026-03-10T00:00:00.000Z",
};

describe("IntegrationsCatalog", () => {
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
        <IntegrationsCatalog
          providerCatalog={providerCatalog}
          initialReadyManagedConnectors={readyManagedConnectors}
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

  it("hides the registered managed connector panel for non-admin viewers", async () => {
    await act(async () => {
      root.render(
        <IntegrationsCatalog
          providerCatalog={providerCatalog}
          initialReadyManagedConnectors={readyManagedConnectors}
          managedConnectors={managedConnectors}
          canRegisterManagedConnectors={false}
          oauthCallbackBaseUrl="https://openhands-context-layer.vercel.app/api/oauth"
        />,
      );
    });

    expect(container.textContent).not.toContain("Registered managed connectors");
    expect(container.textContent).toContain("Popular official provider options");
  });

  it("marks oauth providers ready after updating a managed connector", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          ...googleManagedConnector,
          oauthConfigured: true,
          updatedAt: "2026-03-11T00:00:00.000Z",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    await act(async () => {
      root.render(
        <IntegrationsCatalog
          providerCatalog={providerCatalog}
          initialReadyManagedConnectors={[]}
          managedConnectors={[{ ...googleManagedConnector, oauthConfigured: false }]}
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

    expect(container.textContent).toContain("Register this provider");
    expect(container.textContent).not.toContain("Use Google Calendar");

    const expandManagedConnectorButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Show details"),
    );
    expect(expandManagedConnectorButton).toBeTruthy();

    await act(async () => {
      expandManagedConnectorButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    const form = container.querySelector("form");
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const providerButton = googleButtons().at(-1);
    if (providerButton?.textContent?.includes("Show details")) {
      await act(async () => {
        providerButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    }

    expect(container.textContent).toContain("Use Google Calendar");
    expect(container.textContent).toContain(
      "This provider is already available in the integration wizard, so no additional registration is needed.",
    );
  });

  it("restores default ready manual-token providers after updating stored connectors", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify(manualTokenConnector), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await act(async () => {
      root.render(
        <IntegrationsCatalog
          providerCatalog={[manualTokenProvider]}
          initialReadyManagedConnectors={[]}
          managedConnectors={[manualTokenConnector]}
          canRegisterManagedConnectors
          oauthCallbackBaseUrl="https://openhands-context-layer.vercel.app/api/oauth"
        />,
      );
    });

    const elevenLabsButtons = () =>
      Array.from(container.querySelectorAll("button")).filter((button) =>
        button.textContent?.includes("ElevenLabs"),
      );

    await act(async () => {
      elevenLabsButtons().at(-1)?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Register this provider");
    expect(container.textContent).not.toContain("Use ElevenLabs");

    const expandManagedConnectorButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Show details"),
    );
    expect(expandManagedConnectorButton).toBeTruthy();

    await act(async () => {
      expandManagedConnectorButton?.dispatchEvent(
        new MouseEvent("click", { bubbles: true }),
      );
    });

    const form = container.querySelector("form");
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const providerButton = elevenLabsButtons().at(-1);
    if (providerButton?.textContent?.includes("Show details")) {
      await act(async () => {
        providerButton.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    }

    expect(container.textContent).toContain("Use ElevenLabs");
    expect(container.textContent).toContain(
      "This provider is already available in the integration wizard, so no additional registration is needed.",
    );
  });
});
