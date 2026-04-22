import { ContextLayerError } from "@/src/lib/core/errors";
import type { IntegrationDiscoveryInput } from "@/src/lib/integrations/discovery";
import { getOptionalTrimmedString } from "@/src/lib/type-utils";
import type { IntegrationSpec, ToolSpec } from "@/src/types/context-layer";

export const RAW_CONNECTOR_INSTALL_FORBIDDEN_DETAIL =
  "Only app administrators can install integrations from arbitrary connector URLs. Use a managed connector instead.";
export const RAW_CONNECTOR_DISCOVERY_FORBIDDEN_DETAIL =
  "Only app administrators can discover tools from arbitrary MCP server URLs. Ask an administrator to register a managed connector instead.";

export const assertUserCanSaveIntegration = (
  isAdmin: boolean,
  spec: Omit<IntegrationSpec, "tools"> & {
    tools?: Record<string, ToolSpec>;
    functions?: Record<string, ToolSpec>;
  },
) => {
  if (isAdmin) {
    return;
  }

  const managedConnectorSlug = getOptionalTrimmedString(spec.config, "managedConnectorSlug");
  const apiBaseUrl = getOptionalTrimmedString(spec.config, "apiBaseUrl");
  const serverUrl = getOptionalTrimmedString(spec.config, "serverUrl");

  // Non-admins may only install managed connectors, and they cannot override
  // the managed connector's stored URLs with raw endpoint values.
  if (!managedConnectorSlug || apiBaseUrl || serverUrl) {
    throw new ContextLayerError(RAW_CONNECTOR_INSTALL_FORBIDDEN_DETAIL, 403);
  }
};

export const assertUserCanDiscoverIntegration = (
  isAdmin: boolean,
  input: IntegrationDiscoveryInput,
) => {
  if (isAdmin || input.kind === "managed") {
    return;
  }

  throw new ContextLayerError(RAW_CONNECTOR_DISCOVERY_FORBIDDEN_DETAIL, 403);
};
