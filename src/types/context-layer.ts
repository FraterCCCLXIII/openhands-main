export type IntegrationKind = "api" | "mcp";

export type IntegrationProvider = "composio" | "mcp" | "mock";

export type AuthStrategy =
  | "none"
  | "api_key"
  | "bearer"
  | "basic"
  | "oauth2"
  | "mcp_session";

export type NotificationChannel = "email" | "in_app" | "sms";
export type AccessRequestStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired";
export type FunctionAccessMode = "enabled" | "disabled" | "approval_required";

export interface FunctionSpec {
  name: string;
  description?: string;
  enabled: boolean;
  accessMode?: FunctionAccessMode;
  fineGrainedPermissions: boolean;
  defaultScopes: string[];
  executionMode: "provider" | "mock";
  config: Record<string, unknown>;
  mockResponse?: Record<string, unknown>;
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
  functions: Record<string, FunctionSpec>;
}

export interface BuiltInConnectorOption {
  slug: string;
  name: string;
  description: string;
  logoUrl?: string;
  appUrl?: string;
  toolCount: number;
  categories: string[];
  authModes: AuthStrategy[];
  authStrategy: AuthStrategy;
  oauthConfigured?: boolean;
  credentialLabel: string;
  credentialPlaceholder: string;
  credentialHelp: string;
}

export type OAuthProviderAvailability =
  | "oauth_ready"
  | "manual_token"
  | "planned";

export interface OAuthProviderCatalogOption {
  slug: string;
  name: string;
  description: string;
  categories: string[];
  authStrategy: "oauth2";
  availability: OAuthProviderAvailability;
  builtInSlug?: string;
  appUrl?: string;
  docsUrl?: string;
  notes: string;
  popularityRank: number;
}


export interface PolicyRule {
  integrationKey: string;
  functionNames: string[];
  scopes: string[];
  enabled: boolean;
}

export interface AgentClassPolicy {
  agentClass: string;
  rules: PolicyRule[];
}

export interface AccessRequest {
  id: string;
  agentId: string;
  agentClass: string;
  integrationKey: string;
  functionName: string;
  scopes: string[];
  requestedMinutes: number;
  channels: NotificationChannel[];
  notificationTargets: Record<string, string>;
  justification?: string;
  createdAt: string;
  status: AccessRequestStatus;
  decidedAt?: string;
  decidedBy?: string;
}

export interface TemporaryGrant {
  id: string;
  agentId: string;
  agentClass: string;
  integrationKey: string;
  functionName: string;
  scopes: string[];
  grantedBy: string;
  createdAt: string;
  expiresAt: string;
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

export interface AgentApiKeyRecord {
  ownerId: string;
  apiKey: string;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConnectionRecord {
  ownerId: string;
  integrationKey: string;
  provider: string;
  authStrategy: AuthStrategy;
  encryptedCredentials: string;
  tokenType?: string;
  scopes: string[];
  expiresAt?: string;
  externalAccountId?: string;
  externalWorkspaceId?: string;
  displayName?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationConnectionStatus {
  integrationKey: string;
  provider: string;
  authStrategy: AuthStrategy;
  tokenType?: string;
  scopes: string[];
  expiresAt?: string;
  externalAccountId?: string;
  externalWorkspaceId?: string;
  displayName?: string;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface OAuthStateRecord {
  state: string;
  ownerId: string;
  integrationKey: string;
  provider: string;
  codeVerifier?: string;
  redirectTo: string;
  createdAt: string;
  expiresAt: string;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  effectiveScopes: string[];
}

export interface ContextInvocationResult {
  integration: string;
  function: string;
  provider: IntegrationProvider;
  kind: IntegrationKind;
  authStrategy: AuthStrategy;
  decision: AccessDecision;
  data: unknown;
}
