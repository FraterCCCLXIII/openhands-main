export type IntegrationKind = "api" | "mcp";

export type IntegrationProvider = "composio" | "mcp" | "mock" | "http";

export type AuthStrategy =
  | "none"
  | "api_key"
  | "bearer"
  | "basic"
  | "oauth2"
  | "mcp_session";

export type HttpRequestContentType = "json" | "form_urlencoded" | "text";
export type OAuthClientAuthentication = "basic" | "body";

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

export interface OAuthProviderRegistrationDefaults {
  provider?: "mcp" | "http";
  apiBaseUrl?: string;
  serverUrl?: string;
  openApiUrl?: string;
  authorizationUrl?: string;
  tokenUrl?: string;
  scopes?: string[];
  scopeSeparator?: "space" | "comma";
  clientAuthentication?: OAuthClientAuthentication;
  additionalAuthorizationParams?: Record<string, string>;
  pkce?: boolean;
  functionName?: string;
  functionDescription?: string;
  requestMethod?: string;
  requestPath?: string;
}

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
  registrationDefaults?: OAuthProviderRegistrationDefaults;
}

export interface GenericOAuthConfig {
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  scopeSeparator?: "space" | "comma";
  pkce?: boolean;
  clientAuthentication?: OAuthClientAuthentication;
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

export interface ManagedConnectorFunctionDefinition {
  name: string;
  description: string;
  defaultScopes: string[];
  request: GenericHttpRequestTemplate;
}

export interface ManagedConnectorDefinition {
  slug: string;
  name: string;
  description: string;
  logoUrl?: string;
  appUrl?: string;
  docsUrl?: string;
  categories: string[];
  authModes: AuthStrategy[];
  authStrategy: AuthStrategy;
  provider?: "mcp" | "http";
  oauthConfigured?: boolean;
  credentialLabel: string;
  credentialPlaceholder: string;
  credentialHelp: string;
  apiBaseUrl?: string;
  serverUrl?: string;
  openApiUrl?: string;
  oauthConfig?: GenericOAuthConfig;
  functions: ManagedConnectorFunctionDefinition[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ManagedConnectorRecord extends ManagedConnectorDefinition {
  encryptedOAuthClient?: string;
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
  redirectUri?: string;
  callbackUrl?: string;
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
