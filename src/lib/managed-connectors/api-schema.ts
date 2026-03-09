import { z } from "zod";

export const managedConnectorAuthModeSchema = z.enum([
  "none",
  "api_key",
  "bearer",
  "basic",
  "oauth2",
  "mcp_session",
]);

export const managedConnectorAuthStrategySchema = z.enum([
  "none",
  "api_key",
  "bearer",
  "basic",
  "oauth2",
]);

export const genericOAuthConfigSchema = z.object({
  authorizationUrl: z.string().url(),
  tokenUrl: z.string().url(),
  scopes: z.array(z.string()).default([]),
  scopeSeparator: z.enum(["space", "comma"]).optional(),
  pkce: z.boolean().optional(),
  clientAuthentication: z.enum(["basic", "body"]).optional(),
  additionalAuthorizationParams: z.record(z.string(), z.string()).optional(),
  additionalTokenParams: z.record(z.string(), z.string()).optional(),
});

export const requestTemplateSchema = z.object({
  method: z.string().min(1),
  path: z.string().min(1),
  query: z.record(z.string(), z.unknown()).optional(),
  headers: z.record(z.string(), z.unknown()).optional(),
  body: z.unknown().optional(),
  contentType: z.enum(["json", "form_urlencoded", "text"]).optional(),
});

export const managedConnectorFunctionSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  defaultScopes: z.array(z.string()).default([]),
  request: requestTemplateSchema,
});

export const managedConnectorUpsertSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  logoUrl: z.string().url().optional(),
  appUrl: z.string().url().optional(),
  docsUrl: z.string().url().optional(),
  categories: z.array(z.string()).default([]),
  authModes: z.array(managedConnectorAuthModeSchema).optional(),
  authStrategy: managedConnectorAuthStrategySchema,
  credentialLabel: z.string().min(1),
  credentialPlaceholder: z.string().min(1),
  credentialHelp: z.string().min(1),
  apiBaseUrl: z.string().url(),
  oauthConfig: genericOAuthConfigSchema.optional(),
  oauthClientId: z.string().optional(),
  oauthClientSecret: z.string().optional(),
  functions: z.array(managedConnectorFunctionSchema),
  enabled: z.boolean().default(true),
});

export const managedConnectorResponseSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  logoUrl: z.string().url().optional(),
  appUrl: z.string().url().optional(),
  docsUrl: z.string().url().optional(),
  categories: z.array(z.string()),
  authModes: z.array(managedConnectorAuthModeSchema),
  authStrategy: managedConnectorAuthStrategySchema,
  oauthConfigured: z.boolean(),
  credentialLabel: z.string().min(1),
  credentialPlaceholder: z.string().min(1),
  credentialHelp: z.string().min(1),
  apiBaseUrl: z.string().url(),
  oauthConfig: genericOAuthConfigSchema.optional(),
  functions: z.array(managedConnectorFunctionSchema),
  enabled: z.boolean(),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export const managedConnectorListSchema = z.array(managedConnectorResponseSchema);

export const errorResponseSchema = z.object({
  detail: z.string(),
});
