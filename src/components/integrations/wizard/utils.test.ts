import { describe, expect, it } from "vitest";

import {
  buildCreatePayload,
  buildDiscoverPayload,
  type DiscoveryResponse,
  type WizardDraft,
} from "@/src/components/integrations/wizard/utils";
import type { ManagedConnectorOption } from "@/src/types/context-layer";

const elevenLabsConnector: ManagedConnectorOption = {
  slug: "elevenlabs",
  name: "ElevenLabs",
  description: "Voice tools",
  appUrl: "https://elevenlabs.io",
  toolCount: 3,
  categories: ["Audio"],
  authModes: ["api_key"],
  authStrategy: "api_key",
  credentialLabel: "API key",
  credentialPlaceholder: "Paste key",
  credentialHelp: "Provide a key.",
  apiKeyHeaderName: "xi-api-key",
};

const managedDraft: WizardDraft = {
  kind: "managed",
  key: "elevenlabs",
  name: "ElevenLabs",
  managedConnectorSlug: "elevenlabs",
  serverUrl: "",
  accessToken: "",
  apiKey: "secret-key",
  headerName: "X-API-Key",
  username: "",
  password: "",
};

const discovery: DiscoveryResponse = {
  provider: "http",
  authStrategy: "api_key",
  config: {
    apiBaseUrl: "https://api.elevenlabs.io",
    managedConnectorSlug: "elevenlabs",
  },
  credentials: {
    headerName: "xi-api-key",
    secret: "secret-key",
  },
  tools: {
    list_models: {
      name: "list_models",
      description: "List models",
      enabled: true,
      accessMode: "enabled",
      fineGrainedPermissions: true,
      defaultScopes: [],
      executionMode: "provider",
      config: {},
    },
    delete_voice: {
      name: "delete_voice",
      description: "Delete voice",
      enabled: true,
      accessMode: "enabled",
      fineGrainedPermissions: true,
      defaultScopes: [],
      executionMode: "provider",
      config: {},
    },
  },
};

describe("integration-wizard-utils", () => {
  it("builds discovery payloads for managed connectors with connector-specific header names", () => {
    expect(buildDiscoverPayload(managedDraft, elevenLabsConnector)).toEqual({
      key: "elevenlabs",
      kind: "managed",
      config: {
        managedConnectorSlug: "elevenlabs",
      },
      credentials: {
        headerName: "xi-api-key",
        secret: "secret-key",
      },
    });
  });

  it("builds create payloads that preserve discovery metadata and updated access modes", () => {
    const payload = buildCreatePayload(
      { ...managedDraft, name: "elevenlabs" },
      discovery,
      {
        delete_voice: "disabled",
        list_models: "approval_required",
      },
      elevenLabsConnector,
    );

    expect(payload).toMatchObject({
      key: "elevenlabs",
      name: "ElevenLabs",
      kind: "api",
      provider: "http",
      authStrategy: "api_key",
      enabled: true,
      fineGrainedPermissions: true,
      config: {
        apiBaseUrl: "https://api.elevenlabs.io",
        managedConnectorSlug: "elevenlabs",
      },
    });
    expect(payload.tools.list_models).toMatchObject({
      accessMode: "approval_required",
      enabled: true,
    });
    expect(payload.tools.delete_voice).toMatchObject({
      accessMode: "disabled",
      enabled: false,
    });
  });
});
