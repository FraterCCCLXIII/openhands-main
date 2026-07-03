import type { ManagedConnectorDefinition } from "@/src/types/integrations-hub";
import { formControlFieldClassName } from "@/src/styles/form-control-classes";

export interface ManagedConnectorFormState {
  provider: "mcp" | "http";
  apiBaseUrl: string;
  serverUrl: string;
  openApiUrl: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string;
  optionalScopes: string;
  oauthClientId: string;
  oauthClientSecret: string;
  submitting: boolean;
  deleting: boolean;
  indexing: boolean;
  status: "idle" | "success" | "error";
  message: string;
}

export const inputClassName = formControlFieldClassName;

export const inferProvider = (connector: ManagedConnectorDefinition) =>
  connector.provider ?? (connector.openApiUrl ? "http" : "mcp");

export const getCredentialStatusLabel = (connector: ManagedConnectorDefinition) => {
  if (connector.authStrategy === "oauth2") {
    switch (connector.oauthClientStatus) {
      case "decryptable":
        return "OAuth ready";
      case "unreadable":
        return "OAuth credentials unreadable";
      case "missing":
        return "OAuth credentials missing";
      default:
        return connector.oauthConfigured ? "OAuth ready" : "OAuth credentials missing";
    }
  }

  return connector.oauthConfigured ? "Credentials configured" : "Credentials missing";
};

export const getCredentialStatusTone = (connector: ManagedConnectorDefinition) => {
  if (connector.authStrategy === "oauth2") {
    switch (connector.oauthClientStatus) {
      case "decryptable":
        return "success" as const;
      case "unreadable":
        return "danger" as const;
      default:
        return "warning" as const;
    }
  }

  return connector.oauthConfigured ? ("success" as const) : ("warning" as const);
};

export const getConnectorInitials = (name: string) => {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "?";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "?";
};

export const formatUpdatedAt = (value: string) =>
  value ? new Date(value).toLocaleString() : "Unknown";

export const createFormState = (
  connector: ManagedConnectorDefinition,
): ManagedConnectorFormState => ({
  provider: inferProvider(connector),
  apiBaseUrl: connector.apiBaseUrl ?? "",
  serverUrl: connector.serverUrl ?? "",
  openApiUrl: connector.openApiUrl ?? "",
  authorizationUrl: connector.oauthConfig?.authorizationUrl ?? "",
  tokenUrl: connector.oauthConfig?.tokenUrl ?? "",
  scopes: connector.oauthConfig?.scopes.join(", ") ?? "",
  optionalScopes: connector.oauthConfig?.optionalScopes?.join(", ") ?? "",
  oauthClientId: "",
  oauthClientSecret: "",
  submitting: false,
  deleting: false,
  indexing: false,
  status: "idle",
  message: "",
});

export const ConnectorAvatar = ({ connector }: { connector: ManagedConnectorDefinition }) => {
  if (connector.logoUrl?.trim()) {
    return (
      <img
        src={connector.logoUrl}
        alt={`${connector.name} logo`}
        className="h-10 w-10 shrink-0 rounded-lg border border-[var(--oh-border)] bg-[var(--color-surface)] object-cover"
      />
    );
  }

  return (
    <span
      role="img"
      aria-label={`${connector.name} logo`}
      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[var(--oh-border)] bg-[var(--oh-bg-input)] text-xs font-semibold tracking-[0.14em] text-white"
    >
      {getConnectorInitials(connector.name)}
    </span>
  );
};
