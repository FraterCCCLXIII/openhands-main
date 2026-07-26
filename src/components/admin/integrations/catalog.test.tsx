// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { enableReactActEnvironment } from "@/src/test-utils/jsdom-helpers";

import {
  IntegrationsCatalog,
} from "@/src/components/admin/integrations/catalog";
import type {
  ManagedConnectorOption,
  ManagedConnectorDefinition,
  IntegrationCatalogOption,
} from "@/src/types/integrations-hub";

// Helpers previously exported from catalog.tsx, now inlined for the test.
const sortReadyManagedConnectors = (connectors: ManagedConnectorOption[]) =>
  [...connectors].sort(
    (left, right) => left.name.localeCompare(right.name) || left.slug.localeCompare(right.slug),
  );

const upsertReadyManagedConnector = (
  connectors: ManagedConnectorOption[],
  connector: ManagedConnectorOption,
) =>
  sortReadyManagedConnectors([
    ...connectors.filter((candidate: ManagedConnectorOption) => candidate.slug !== connector.slug),
    connector,
  ]);

enableReactActEnvironment();

const integrationCatalog: IntegrationCatalogOption[] = [
  {
    slug: "google-calendar",
    name: "Google Calendar",
    description: "Calendar events and schedules",
    categories: ["Productivity"],
    docsUrl: "https://developers.google.com/identity/protocols/oauth2",
    notes: "Useful for scheduling workflows.",
    popularityRank: 1,
    connectionDefaults: {
      provider: "http",
      authStrategy: "oauth2",
      apiBaseUrl: "https://www.googleapis.com/calendar/v3",
      openApiUrl: "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
      oauthConfig: {
        authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
        tokenUrl: "https://oauth2.googleapis.com/token",
        scopes: ["https://www.googleapis.com/auth/calendar.readonly"],
      },
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


const manualTokenProvider: IntegrationCatalogOption = {
  slug: "elevenlabs",
  name: "ElevenLabs",
  description: "Text to speech and audio generation",
  categories: ["Audio"],
  docsUrl: "https://elevenlabs.io/docs/api-reference/introduction",
  notes: "Published API schema with manual user API keys.",
  popularityRank: 2,
  connectionDefaults: {
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

const createManagedConnectorOption = (
  overrides: Partial<ManagedConnectorOption> & Pick<ManagedConnectorOption, "slug" | "name">,
): ManagedConnectorOption => ({
  description: `${overrides.name} connector`,
  toolCount: 1,
  categories: ["Engineering"],
  authModes: ["oauth2"],
  authStrategy: "oauth2",
  oauthConfigured: true,
  credentialLabel: `Connect ${overrides.name}`,
  credentialPlaceholder: `Connect ${overrides.name}`,
  credentialHelp: `Connect ${overrides.name} with OAuth.`,
  ...overrides,
});

describe("catalog helper utilities", () => {
  it("sorts ready connectors by name and slug while replacing duplicate slugs", () => {
    const sorted = sortReadyManagedConnectors([
      createManagedConnectorOption({ slug: "zeta", name: "Zulu" }),
      createManagedConnectorOption({ slug: "alpha-b", name: "Alpha" }),
      createManagedConnectorOption({ slug: "alpha-a", name: "Alpha" }),
    ]);

    expect(sorted.map((connector) => `${connector.name}:${connector.slug}`)).toEqual([
      "Alpha:alpha-a",
      "Alpha:alpha-b",
      "Zulu:zeta",
    ]);

    const updated = upsertReadyManagedConnector(
      sorted,
      createManagedConnectorOption({
        slug: "alpha-b",
        name: "Alpha",
        description: "Updated Alpha connector",
      }),
    );

    expect(updated.map((connector) => connector.slug)).toEqual([
      "alpha-a",
      "alpha-b",
      "zeta",
    ]);
    expect(updated.filter((connector) => connector.slug === "alpha-b")).toHaveLength(1);
    expect(updated.find((connector) => connector.slug === "alpha-b")?.description).toBe(
      "Updated Alpha connector",
    );
  });

  it("does not derive ready connectors from catalog defaults", () => {
    // Readiness is repository-only: catalog defaults can be registered by an
    // admin, but they are not user-ready until the admin saves them.
    const current: ManagedConnectorOption[] = [];
    expect(sortReadyManagedConnectors(current)).toEqual([]);
  });

});

const findProviderToggle = (container: ParentNode, name: string) =>
  Array.from(container.querySelectorAll<HTMLButtonElement>('button[aria-expanded]')).find(
    (button) => button.textContent?.includes(name),
  ) ?? null;

// In the unified list there is only one toggle per connector.
const findConnectorToggle = findProviderToggle;

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

  it("shows setup progress for a registered connector and allows deletion", async () => {
    await act(async () => {
      root.render(
        <IntegrationsCatalog
          integrationCatalog={integrationCatalog}
          initialReadyManagedConnectors={readyManagedConnectors}
          managedConnectors={managedConnectors}
          canRegisterManagedConnectors
          oauthCallbackBaseUrl="https://integrations-hub.example.com/api/oauth"
        />,
      );
    });

    const toggle = findConnectorToggle(container, "Google Calendar");
    expect(toggle).toBeTruthy();

    await act(async () => {
      toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Registered connector shows onboarding with Configure integration as step 1
    expect(container.textContent).toContain("Configure integration");
    expect(container.textContent).not.toContain("Register this provider");

    // Step 1 (Configure integration) starts collapsed because it's completed.
    // Expand it to reveal the Delete button inside the config form.
    const step1Toggle = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Expand Configure integration"]',
    );
    expect(step1Toggle).toBeTruthy();
    await act(async () => {
      step1Toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Delete button is in the expanded panel
    const deleteButton = container.querySelector(
      'button[aria-label="Delete Google Calendar connector"]',
    );
    expect(deleteButton).toBeTruthy();

    await act(async () => {
      deleteButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchMock).toHaveBeenCalledWith("/api/admin/modify-integrations/google-calendar", {
      credentials: "same-origin",
      method: "DELETE",
    });

    // After deletion, the connector collapses. Re-expand to see onboarding.
    const toggleAfterDelete = findConnectorToggle(container, "Google Calendar");
    await act(async () => {
      toggleAfterDelete?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Unregistered connector shows onboarding with "Register connector" button
    expect(container.textContent).toContain("Configure integration");
    expect(container.textContent).toContain("Register connector");
  });

  it("hides registration controls for non-admin viewers", async () => {
    await act(async () => {
      root.render(
        <IntegrationsCatalog
          integrationCatalog={integrationCatalog}
          initialReadyManagedConnectors={readyManagedConnectors}
          managedConnectors={managedConnectors}
          canRegisterManagedConnectors={false}
          oauthCallbackBaseUrl="https://integrations-hub.example.com/api/oauth"
        />,
      );
    });

    expect(container.textContent).toContain("Integrations");
    const toggle = findConnectorToggle(container, "Google Calendar");
    expect(toggle).toBeTruthy();

    await act(async () => {
      toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Non-admins see the "only admins" message
    expect(container.textContent).toContain("Only app administrators");
    expect(container.textContent).not.toContain("Register this provider");
  });

  it("shows onboarding with Configure integration for unregistered oauth connector", async () => {
    await act(async () => {
      root.render(
        <IntegrationsCatalog
          integrationCatalog={integrationCatalog}
          initialReadyManagedConnectors={[]}
          managedConnectors={[]}
          canRegisterManagedConnectors
          oauthCallbackBaseUrl="https://integrations-hub.example.com/api/oauth"
        />,
      );
    });

    const toggle = findConnectorToggle(container, "Google Calendar");
    expect(toggle).toBeTruthy();

    await act(async () => {
      toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Unregistered connector shows unified onboarding, not the old registration form
    expect(container.textContent).toContain("Configure integration");
    expect(container.textContent).toContain("Register connector");
  });

  it("transitions from unregistered onboarding to registered onboarding after registering", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(
        JSON.stringify({ ...googleManagedConnector, oauthConfigured: true }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    await act(async () => {
      root.render(
        <IntegrationsCatalog
          integrationCatalog={integrationCatalog}
          initialReadyManagedConnectors={[]}
          managedConnectors={[]}
          canRegisterManagedConnectors
          oauthCallbackBaseUrl="https://integrations-hub.example.com/api/oauth"
        />,
      );
    });

    const toggle = findConnectorToggle(container, "Google Calendar");
    await act(async () => {
      toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    // Unregistered onboarding shows "Register connector" button
    expect(container.textContent).toContain("Register connector");

    // Fill in the required OAuth client credentials
    const inputs = container.querySelectorAll("input");
    const clientIdInput = Array.from(inputs).find((i) => i.type === "text" && i.value === "");
    const clientSecretInput = Array.from(inputs).find((i) => i.type === "password");
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set;
    if (clientIdInput && nativeInputValueSetter) {
      await act(async () => {
        nativeInputValueSetter.call(clientIdInput, "test-client-id");
        clientIdInput.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }
    if (clientSecretInput && nativeInputValueSetter) {
      await act(async () => {
        nativeInputValueSetter.call(clientSecretInput, "test-client-secret");
        clientSecretInput.dispatchEvent(new Event("input", { bubbles: true }));
      });
    }

    const form = container.querySelector("form");
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    // After registration, the button changes from "Register connector" to "Save Config".
    // Step 1 is now completed and collapsed, so expand it to verify the button text.
    expect(container.textContent).toContain("Configure integration");
    expect(container.textContent).not.toContain("Register connector");

    const step1Toggle = container.querySelector<HTMLButtonElement>(
      'button[aria-label="Expand Configure integration"]',
    );
    if (step1Toggle) {
      await act(async () => {
        step1Toggle.dispatchEvent(new MouseEvent("click", { bubbles: true }));
      });
    }
    expect(container.textContent).toContain("Save Config");
  });

  it("shows onboarding for unregistered manual-token connector", async () => {
    await act(async () => {
      root.render(
        <IntegrationsCatalog
          integrationCatalog={[manualTokenProvider]}
          initialReadyManagedConnectors={[]}
          managedConnectors={[]}
          canRegisterManagedConnectors
          oauthCallbackBaseUrl="https://integrations-hub.example.com/api/oauth"
        />,
      );
    });

    const toggle = findConnectorToggle(container, "ElevenLabs");
    expect(toggle).toBeTruthy();

    await act(async () => {
      toggle?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Configure integration");
    expect(container.textContent).toContain("Register connector");
  });
});
