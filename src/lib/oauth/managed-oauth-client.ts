import { getOAuthCallbackUrl } from "@/src/lib/auth-config";
import { ContextLayerError } from "@/src/lib/core/errors";
import { decryptCredentials, encryptCredentials } from "@/src/lib/credential-crypto";
import type { GenericOAuthConfig, ManagedConnectorRecord } from "@/src/types/context-layer";

export interface ManagedOAuthClientCredentials {
  clientId: string;
  clientSecret?: string;
}

export const usesDynamicOAuthClientRegistration = (
  oauthConfig: Pick<GenericOAuthConfig, "clientAuthentication" | "registrationUrl"> | undefined,
) => oauthConfig?.clientAuthentication === "none" && Boolean(oauthConfig.registrationUrl);

export const readManagedOAuthClient = (
  connector: Pick<ManagedConnectorRecord, "name" | "encryptedOAuthClient">,
): ManagedOAuthClientCredentials | null => {
  if (!connector.encryptedOAuthClient) {
    return null;
  }

  const credentials = decryptCredentials<{
    clientId?: string;
    clientSecret?: string;
  }>(connector.encryptedOAuthClient);

  const clientId = credentials.clientId?.trim() ?? "";
  if (!clientId) {
    throw new ContextLayerError(
      `${connector.name} is missing stored OAuth client credentials.`,
      500,
    );
  }

  const clientSecret = credentials.clientSecret?.trim() || undefined;
  return clientSecret ? { clientId, clientSecret } : { clientId };
};

export const requireManagedOAuthClient = (
  connector: Pick<ManagedConnectorRecord, "name" | "oauthConfig" | "encryptedOAuthClient">,
): ManagedOAuthClientCredentials => {
  const credentials = readManagedOAuthClient(connector);
  if (!credentials) {
    throw new ContextLayerError(
      `${connector.name} is missing stored OAuth client credentials.`,
      500,
    );
  }

  if (
    connector.oauthConfig?.clientAuthentication !== "none" &&
    !credentials.clientSecret
  ) {
    throw new ContextLayerError(
      `${connector.name} is missing stored OAuth client credentials.`,
      500,
    );
  }

  return credentials;
};

export const encryptManagedOAuthClient = (
  credentials: ManagedOAuthClientCredentials,
) =>
  encryptCredentials({
    clientId: credentials.clientId,
    ...(credentials.clientSecret ? { clientSecret: credentials.clientSecret } : {}),
  });

export const registerManagedOAuthClient = async ({
  connectorName,
  slug,
  oauthConfig,
}: {
  connectorName: string;
  slug: string;
  oauthConfig: GenericOAuthConfig;
}): Promise<ManagedOAuthClientCredentials> => {
  if (!usesDynamicOAuthClientRegistration(oauthConfig)) {
    throw new ContextLayerError(
      `${connectorName} does not support automatic OAuth client registration.`,
      500,
    );
  }

  const callbackUrl = getOAuthCallbackUrl(slug);
  const response = await fetch(oauthConfig.registrationUrl!, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_name: `OpenHands Context Layer (${connectorName})`,
      redirect_uris: [callbackUrl],
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      token_endpoint_auth_method: oauthConfig.clientAuthentication,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new ContextLayerError(
      `${connectorName} OAuth client registration failed (${response.status}): ${body || response.statusText}`,
      502,
    );
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(body) as Record<string, unknown>;
  } catch {
    throw new ContextLayerError(
      `${connectorName} OAuth client registration returned an invalid response.`,
      502,
    );
  }

  const clientId = typeof parsed.client_id === "string" ? parsed.client_id.trim() : "";
  const clientSecret =
    typeof parsed.client_secret === "string" ? parsed.client_secret.trim() || undefined : undefined;

  if (!clientId) {
    throw new ContextLayerError(
      `${connectorName} OAuth client registration did not return a client_id.`,
      502,
    );
  }

  if (oauthConfig.clientAuthentication !== "none" && !clientSecret) {
    throw new ContextLayerError(
      `${connectorName} OAuth client registration did not return a client_secret.`,
      502,
    );
  }

  return clientSecret ? { clientId, clientSecret } : { clientId };
};
