// @vitest-environment jsdom

import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
    registrationDefaults: {
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

const setInputValue = (element: Element | null, value: string) => {
  if (!(element instanceof HTMLInputElement)) {
    throw new Error("Expected HTMLInputElement");
  }

  const valueSetter = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value",
  )?.set;
  valueSetter?.call(element, value);
  element.dispatchEvent(new Event("input", { bubbles: true }));
};

describe("CuratedProviderList", () => {
  let container: HTMLDivElement;
  let root: Root;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.appendChild(container);
    root = createRoot(container);
    fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ slug: "google-calendar" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(async () => {
    await act(async () => {
      root.unmount();
    });
    container.remove();
    vi.unstubAllGlobals();
  });

  it("renders a compact searchable list and lets app admins register a provider in-app", async () => {
    await act(async () => {
      root.render(
        <CuratedProviderList
          providerCatalog={providerCatalog}
          readyBuiltInConnectors={readyBuiltInConnectors}
          canRegisterManagedConnectors
        />,
      );
    });

    expect(container.textContent).toContain("Search curated adaptors");
    expect(container.textContent).toContain("GitHub(github)");
    expect(container.textContent).toContain("Show details");
    expect(container.textContent).not.toContain("Example API call");

    const searchInput = container.querySelector('input[type="search"]');
    await act(async () => {
      setInputValue(searchInput, "calendar");
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(container.textContent).toContain("Google Calendar");
    expect(container.textContent).not.toContain("GitHub repositories and pull requests");

    const calendarButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Google Calendar"),
    );
    expect(calendarButton).toBeTruthy();

    await act(async () => {
      calendarButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain("Register this provider");
    expect(container.textContent).toContain("Register connector");

    const urlInputs = Array.from(container.querySelectorAll('input[type="url"]'));
    expect((urlInputs[0] as HTMLInputElement | undefined)?.value).toBe(
      "https://www.googleapis.com/calendar/v3",
    );
    expect((urlInputs[1] as HTMLInputElement | undefined)?.value).toBe(
      "https://accounts.google.com/o/oauth2/v2/auth",
    );
    expect((urlInputs[2] as HTMLInputElement | undefined)?.value).toBe(
      "https://oauth2.googleapis.com/token",
    );
    expect(
      (
        Array.from(container.querySelectorAll('input[type="text"]')).find(
          (input) => (input as HTMLInputElement).placeholder === "repo, read:user",
        ) as HTMLInputElement | undefined
      )?.value,
    ).toBe("https://www.googleapis.com/auth/calendar.readonly");
    expect(
      (
        Array.from(container.querySelectorAll('input[type="text"]')).find(
          (input) => (input as HTMLInputElement).value === "list_events",
        ) as HTMLInputElement | undefined
      )?.value,
    ).toBe("list_events");
    expect(
      (
        Array.from(container.querySelectorAll('input[type="text"]')).find(
          (input) =>
            (input as HTMLInputElement).value ===
            "List events from the user's primary Google Calendar.",
        ) as HTMLInputElement | undefined
      )?.value,
    ).toBe("List events from the user's primary Google Calendar.");
    expect(
      (
        Array.from(container.querySelectorAll('input[type="text"]')).find(
          (input) => (input as HTMLInputElement).value === "/calendars/primary/events",
        ) as HTMLInputElement | undefined
      )?.value,
    ).toBe("/calendars/primary/events");

    await act(async () => {
      setInputValue(urlInputs[0] ?? null, "https://api.calendar.test");
      setInputValue(
        Array.from(container.querySelectorAll('input[type="text"]')).find(
          (input) => (input as HTMLInputElement).placeholder === "repo, read:user",
        ) ?? null,
        "calendar.readonly",
      );
      setInputValue(
        Array.from(container.querySelectorAll('input[type="text"]')).find(
          (input) => (input as HTMLInputElement).value === "list_events",
        ) ?? null,
        "list_events",
      );
      setInputValue(
        Array.from(container.querySelectorAll('input[type="text"]')).find(
          (input) =>
            (input as HTMLInputElement).value ===
            "List events from the user's primary Google Calendar.",
        ) ?? null,
        "List calendar events",
      );
      setInputValue(
        Array.from(container.querySelectorAll('input[type="text"]')).find(
          (input) => (input as HTMLInputElement).value === "GET",
        ) ?? null,
        "GET",
      );
      setInputValue(
        Array.from(container.querySelectorAll('input[type="text"]')).find(
          (input) => (input as HTMLInputElement).value === "/calendars/primary/events",
        ) ?? null,
        "/calendars/primary/events",
      );
      setInputValue(
        Array.from(container.querySelectorAll('input[type="text"]')).find(
          (input) =>
            (input as HTMLInputElement).value === "" &&
            (input as HTMLInputElement).placeholder !== "repo, read:user",
        ) ?? null,
        "calendar-client-id",
      );
      setInputValue(container.querySelector('input[type="password"]'), "calendar-client-secret");
    });

    const form = container.querySelector("form");
    expect(form).toBeTruthy();

    await act(async () => {
      form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/managed-connectors",
      expect.objectContaining({ method: "POST" }),
    );

    const [, requestInit] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(requestInit.body)) as {
      slug: string;
      oauthConfig: { scopes: string[] };
      oauthClientId: string;
      oauthClientSecret: string;
      functions: Array<{ name: string; request: { path: string } }>;
    };
    expect(body.slug).toBe("google-calendar");
    expect(body.oauthConfig.scopes).toEqual(["calendar.readonly"]);
    expect(body.oauthClientId).toBe("calendar-client-id");
    expect(body.oauthClientSecret).toBe("calendar-client-secret");
    expect(body.functions[0]).toMatchObject({
      name: "list_events",
      request: { path: "/calendars/primary/events" },
    });
    expect(container.textContent).toContain(
      "Connector registered. Refresh the integration wizard to confirm it appears.",
    );
  });

  it("shows an access notice instead of the registration form for non-admin users", async () => {
    await act(async () => {
      root.render(
        <CuratedProviderList
          providerCatalog={providerCatalog}
          readyBuiltInConnectors={readyBuiltInConnectors}
        />,
      );
    });

    const calendarButton = Array.from(container.querySelectorAll("button")).find(
      (button) => button.textContent?.includes("Google Calendar"),
    );

    await act(async () => {
      calendarButton?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    });

    expect(container.textContent).toContain(
      "Only app administrators listed in APP_ADMIN_EMAILS can register providers from this page.",
    );
    expect(container.textContent).not.toContain("Register this provider");
  });
});
