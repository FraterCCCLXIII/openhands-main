import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { listOAuthProviderCatalog } from "@openhands/extensions/integrations";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const outputPath = path.join(
  repoRoot,
  "backend",
  "app",
  "integration_catalog_snapshot.json",
);

const isDefaultManagedConnectorProvider = (provider) => {
  const defaults = provider.registrationDefaults;
  if (!defaults?.authStrategy || defaults.authStrategy === "oauth2") {
    return false;
  }

  if (
    defaults.provider === "http" &&
    defaults.apiBaseUrl &&
    defaults.openApiUrl
  ) {
    return true;
  }

  if (defaults.provider === "mcp" && defaults.serverUrl) {
    return true;
  }

  return false;
};

const defaultManagedConnector = (provider) => {
  const defaults = provider.registrationDefaults;

  return {
    slug: provider.managedConnectorSlug ?? provider.slug,
    name: provider.name,
    description: provider.description,
    appUrl: provider.appUrl,
    docsUrl: provider.docsUrl,
    categories: provider.categories,
    authModes:
      defaults.authModes?.length && defaults.authModes.every(Boolean)
        ? defaults.authModes
        : [defaults.authStrategy],
    authStrategy: defaults.authStrategy,
    provider: defaults.provider,
    credentialLabel:
      defaults.credentialLabel ?? `${provider.name} credential`,
    credentialPlaceholder:
      defaults.credentialPlaceholder ?? `Paste your ${provider.name} credential`,
    credentialHelp:
      defaults.credentialHelp ?? `Credential required by ${provider.name}.`,
    apiKeyHeaderName: defaults.apiKeyHeaderName?.trim() || undefined,
    apiBaseUrl: defaults.apiBaseUrl,
    openApiUrl: defaults.openApiUrl,
    serverUrl: defaults.serverUrl,
    oauthConfigured: true,
  };
};

const providers = listOAuthProviderCatalog();
const snapshot = {
  providers,
  defaultManagedConnectors: providers
    .filter(isDefaultManagedConnectorProvider)
    .map(defaultManagedConnector),
};

fs.writeFileSync(outputPath, `${JSON.stringify(snapshot, null, 2)}\n`);
