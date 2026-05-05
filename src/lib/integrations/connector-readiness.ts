import type { ManagedConnectorOption } from "@/src/types/integrations-hub";

export const isManagedConnectorReady = (
  connector: ManagedConnectorOption,
) => connector.oauthConfigured !== false;

export const filterReadyManagedConnectors = (
  connectors: ManagedConnectorOption[],
) => connectors.filter(isManagedConnectorReady);
