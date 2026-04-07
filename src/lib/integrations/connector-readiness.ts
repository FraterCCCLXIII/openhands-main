import type { ManagedConnectorOption } from "@/src/types/context-layer";

export const isManagedConnectorReady = (
  connector: ManagedConnectorOption,
) => connector.oauthConfigured !== false;

export const filterReadyManagedConnectors = (
  connectors: ManagedConnectorOption[],
) => connectors.filter(isManagedConnectorReady);
