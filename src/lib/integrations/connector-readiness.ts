import type { BuiltInConnectorOption } from "@/src/types/context-layer";

export const isBuiltInConnectorReady = (
  connector: BuiltInConnectorOption,
) => connector.oauthConfigured !== false;

export const filterReadyBuiltInConnectors = (
  connectors: BuiltInConnectorOption[],
) => connectors.filter(isBuiltInConnectorReady);
