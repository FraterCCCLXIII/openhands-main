import type {
  IntegrationConnectionModel,
  IntegrationIdentityMapping,
  IntegrationIdentitySource,
  IntegrationResourceDiscovery,
} from "@openhands/extensions/integrations";

export type {
  IntegrationConnectionModel,
  IntegrationIdentityMapping,
  IntegrationIdentitySource,
  IntegrationResourceDiscovery,
};

export type IntegrationKind = "api" | "mcp";

export type IntegrationProvider = "mcp" | "mock" | "http";

export type AuthStrategy =
  | "none"
  | "api_key"
  | "bearer"
  | "basic"
  | "oauth2"
  | "mcp_session";

export type HttpRequestContentType =
  | "json"
  | "form_urlencoded"
  | "multipart_form_data"
  | "text";
export type OAuthClientAuthentication = "basic" | "body" | "none";

export type NotificationChannel = "email" | "in_app" | "sms";
export type AccessRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired";
export type ToolAccessMode = "enabled" | "disabled" | "approval_required";
export type FunctionAccessMode = ToolAccessMode;
export type ToolInvocationOutcome = "success" | "denied" | "error";
export type UnusedToolWindowUnit = "days" | "weeks" | "months";

export interface ToolSpec {
  name: string;
  description?: string;
  enabled: boolean;
  accessMode?: ToolAccessMode;
  maxAccessMode?: ToolAccessMode;
  fineGrainedPermissions: boolean;
  defaultScopes: string[];
  executionMode: "provider" | "mock";
  config: Record<string, unknown>;
  mockResponse?: Record<string, unknown>;
  lastInvokedAt?: string;
  lastInvocationOutcome?: ToolInvocationOutcome;
  invocationCount?: number;
}

export interface IntegrationSpec {
  key: string;
  name: string;
  kind: IntegrationKind;
  provider: IntegrationProvider;
  authStrategy: AuthStrategy;
  enabled: boolean;
  fineGrainedPermissions: boolean;
  config: Record<string, unknown>;
  credentials: Record<string, unknown>;
  tools: Record<string, ToolSpec>;
}

export interface PermissionProfileIntegrationSnapshot {
  enabled: boolean;
  tools: Record<string, ToolAccessMode>;
}

export interface PermissionProfileSnapshot {
  integrations: Record<string, PermissionProfileIntegrationSnapshot>;
}

export interface PermissionProfile {
  id: string;
  ownerId: string;
  name: string | null;
  snapshot: PermissionProfileSnapshot;
  agentApiKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionProfileApplyResult {
  profile: PermissionProfile;
  appliedIntegrations: number;
  appliedTools: number;
  skippedIntegrations: string[];
  skippedTools: string[];
}

export interface ManagedConnectorOption {
  slug: string;
  name: string;
  description: string;
  logoUrl?: string;
  iconBg?: string;
  iconColor?: string;
  appUrl?: string;
  toolCount: number;
  categories: string[];
  authModes: AuthStrategy[];
  authStrategy: AuthStrategy;
  oauthConfigured?: boolean;
  credentialLabel: string;
  credentialPlaceholder: string;
  credentialHelp: string;
  apiKeyHeaderName?: string;
  connectionModel?: IntegrationConnectionModel;
  hasInstalledConnection?: boolean;
}


export type ManagedConnectorOAuthClientStatus =
  | "not_applicable"
  | "missing"
  | "decryptable"
  | "unreadable";

export interface IntegrationConnectionDefaults {
  provider?: "mcp" | "http";
  authModes?: AuthStrategy[];
  authStrategy?: Exclude<AuthStrategy, "mcp_session">;
  credentialLabel?: string;
  credentialPlaceholder?: string;
  credentialHelp?: string;
  apiKeyHeaderName?: string;
  apiKeyOptional?: boolean;
  apiBaseUrl?: string;
  serverUrl?: string;
  openApiUrl?: string;
  oauthConfig?: GenericOAuthConfig;
  connectionModel?: IntegrationConnectionModel;
  /** True when the backend considers this connector ready (e.g. dynamic OAuth
   * connectors that discover their own endpoints at runtime). */
  oauthConfigured?: boolean;
}

export interface IntegrationCatalogOption {
  slug: string;
  name: string;
  description: string;
  categories: string[];
  appUrl?: string;
  docsUrl?: string;
  logoUrl?: string;
  iconBg?: string;
  iconColor?: string;
  notes: string;
  popularityRank: number;
  connectionDefaults: IntegrationConnectionDefaults;
}

export interface GenericOAuthConfig {
  authorizationUrl?: string;
  tokenUrl?: string;
  scopes: string[];
  optionalScopes?: string[];
  scopeSeparator?: "space" | "comma";
  pkce?: boolean;
  clientAuthentication?: OAuthClientAuthentication;
  registrationUrl?: string;
  additionalAuthorizationParams?: Record<string, string>;
  additionalTokenParams?: Record<string, string>;
}

export interface GenericHttpRequestTemplate {
  method: string;
  path: string;
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  body?: unknown;
  contentType?: HttpRequestContentType;
}

export interface ManagedConnectorToolDefinition {
  name: string;
  description: string;
  defaultScopes: string[];
  accessMode?: ToolAccessMode;
  request?: GenericHttpRequestTemplate;
  config?: Record<string, unknown>;
}


export interface ManagedConnectorDefinition {
  slug: string;
  name: string;
  description: string;
  logoUrl?: string;
  iconBg?: string;
  iconColor?: string;
  appUrl?: string;
  docsUrl?: string;
  categories: string[];
  authModes: AuthStrategy[];
  authStrategy: AuthStrategy;
  provider?: "mcp" | "http";
  oauthConfigured?: boolean;
  oauthClientStatus?: ManagedConnectorOAuthClientStatus;
  credentialLabel: string;
  credentialPlaceholder: string;
  credentialHelp: string;
  apiBaseUrl?: string;
  serverUrl?: string;
  openApiUrl?: string;
  oauthConfig?: GenericOAuthConfig;
  connectionModel?: IntegrationConnectionModel;
  tools: ManagedConnectorToolDefinition[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedConnectorRecord extends ManagedConnectorDefinition {
  encryptedOAuthClient?: string;
}


export interface AccessRequestAgentData {
  conversationLink?: string;
}

export interface AccessRequest {
  id: string;
  agentId: string | null;
  agentClass: string | null;
  integrationKey: string;
  toolName: string;
  scopes: string[];
  requestedMinutes: number;
  channels: NotificationChannel[];
  notificationTargets: Record<string, string>;
  justification?: string;
  agentData?: AccessRequestAgentData;
  createdAt: string;
  status: AccessRequestStatus;
  decidedAt?: string;
  decidedBy?: string;
}

export interface NotificationRecord {
  id: string;
  channel: NotificationChannel;
  recipient: string;
  subject: string;
  body: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface UserApiKeyStatus {
  keyPrefix: string;
  keySuffix: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminApiKeyStatus {
  keyPrefix: string;
  keySuffix: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConnectionStatus {
  connectionId?: string;
  integrationKey: string;
  provider: string;
  authStrategy: AuthStrategy;
  tokenType?: string;
  scopes: string[];
  expiresAt?: string;
  externalAccountId?: string;
  externalWorkspaceId?: string;
  externalTenantId?: string;
  displayName?: string;
  resources?: IntegrationConnectionResource[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConnectionResource {
  id: string;
  connectionId: string;
  resourceType: string;
  externalResourceId: string;
  displayName?: string;
  externalUrl?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface AdminIntegrationConnectionSummary {
  connectionId?: string;
  ownerId: string;
  integrationKey: string;
  provider: string;
  authStrategy: AuthStrategy;
  tokenType?: string;
  scopes: string[];
  expiresAt?: string;
  externalAccountId?: string;
  externalWorkspaceId?: string;
  displayName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDuplicateExternalAccountSummary {
  provider: string;
  externalAccountId: string;
  ownerIds: string[];
  ownerCount: number;
  displayNames: string[];
}

export interface AdminOperationalOverviewUserSummary {
  ownerId: string;
  totalConnections: number;
  integrations: string[];
  providers: string[];
  totalAccessRequests: number;
  pendingAccessRequests: number;
  notifications: number;
  duplicateExternalAccounts: AdminDuplicateExternalAccountSummary[];
  connections: AdminIntegrationConnectionSummary[];
}

export interface AdminOperationalOverview {
  totalConnections: number;
  connectedOwners: number;
  managedConnectors: number;
  totalAccessRequests: number;
  pendingAccessRequests: number;
  notifications: number;
  duplicateExternalAccounts: AdminDuplicateExternalAccountSummary[];
  users: AdminOperationalOverviewUserSummary[];
}

export interface DisabledToolSummary {
  integrationKey: string;
  toolName: string;
  lastInvokedAt: string;
}

export interface DisableUnusedToolsResult {
  thresholdValue: number;
  thresholdUnit: UnusedToolWindowUnit;
  cutoffIso: string;
  disabledCount: number;
  disabledTools: DisabledToolSummary[];
}
