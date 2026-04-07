import { z } from "zod";

import { collectHttpTemplateValidationIssues } from "@/src/lib/http-request-template";

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
  clientAuthentication: z.enum(["basic", "body", "none"]).optional(),
  registrationUrl: z.string().url().optional(),
  additionalAuthorizationParams: z.record(z.string(), z.string()).optional(),
  additionalTokenParams: z.record(z.string(), z.string()).optional(),
});

export const requestTemplateSchema = z
  .object({
    method: z.string().min(1),
    path: z.string().min(1),
    query: z.record(z.string(), z.unknown()).optional(),
    headers: z.record(z.string(), z.unknown()).optional(),
    body: z.unknown().optional(),
    contentType: z.enum(["json", "form_urlencoded", "multipart_form_data", "text"]).optional(),
  })
  .superRefine((value, context) => {
    for (const issue of collectHttpTemplateValidationIssues(value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: issue.path,
        message: issue.message,
      });
    }
  });

export const managedConnectorToolSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  defaultScopes: z.array(z.string()).default([]),
  accessMode: z.enum(["enabled", "disabled", "approval_required"]).optional(),
  request: requestTemplateSchema.optional(),
  config: z.record(z.string(), z.unknown()).optional(),
});

const managedConnectorBaseSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  logoUrl: z.string().url().optional(),
  appUrl: z.string().url().optional(),
  docsUrl: z.string().url().optional(),
  categories: z.array(z.string()).default([]),
  authModes: z.array(managedConnectorAuthModeSchema).optional(),
  authStrategy: managedConnectorAuthStrategySchema,
  provider: z.enum(["mcp", "http"]).optional(),
  credentialLabel: z.string().min(1),
  credentialPlaceholder: z.string().min(1),
  credentialHelp: z.string().min(1),
  apiBaseUrl: z.string().url().optional(),
  serverUrl: z.string().url().optional(),
  openApiUrl: z.string().url().optional(),
  oauthConfig: genericOAuthConfigSchema.optional(),
  oauthClientId: z.string().optional(),
  oauthClientSecret: z.string().optional(),
  tools: z.array(managedConnectorToolSchema).default([]),
  enabled: z.boolean().default(true),
});

export const managedConnectorUpsertSchema = managedConnectorBaseSchema.superRefine(
  (value, context) => {
    const provider = value.provider ?? (value.serverUrl ? "mcp" : "http");

    if (provider === "mcp") {
      const serverUrl = value.serverUrl ?? value.apiBaseUrl;
      if (!serverUrl) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["serverUrl"],
          message: "MCP managed connectors require a serverUrl.",
        });
      }
    } else {
      if (!value.apiBaseUrl) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["apiBaseUrl"],
          message: "HTTP managed connectors require an apiBaseUrl.",
        });
      }

      if (!value.openApiUrl && value.tools.length === 0) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["tools"],
          message:
            "HTTP managed connectors require at least one tool template unless an openApiUrl is provided.",
        });
      }
    }
  },
);

export const managedConnectorResponseSchema = managedConnectorBaseSchema
  .omit({
    oauthClientId: true,
    oauthClientSecret: true,
  })
  .extend({
    oauthConfigured: z.boolean(),
    createdAt: z.string().min(1),
    updatedAt: z.string().min(1),
  });

export const managedConnectorListSchema = z.array(managedConnectorResponseSchema);

export const errorResponseSchema = z.object({
  detail: z.string(),
});
