import type {
  IntegrationConnectionStatus,
  IntegrationSpec,
} from "@/src/types/context-layer";

export const filterIntegrationsVisibleToOwner = (
  integrations: IntegrationSpec[],
  connections: Array<Pick<IntegrationConnectionStatus, "integrationKey">>,
) => {
  const connectedIntegrationKeys = new Set(
    connections.map((connection) => connection.integrationKey),
  );

  return integrations.filter((integration) => {
    if (!integration.enabled) {
      return false;
    }

    if (integration.authStrategy !== "oauth2") {
      return true;
    }

    if (Object.keys(integration.credentials).length > 0) {
      return true;
    }

    return connectedIntegrationKeys.has(integration.key);
  });
};
