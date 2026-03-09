import { z } from "zod";

import { fromError, ok } from "@/src/lib/api";
import { getContextLayerService } from "@/src/lib/core/runtime";

const genericOAuthConfigSchema = z.object({
  authorizationUrl: z.string().url(),
  tokenUrl: z.string().url(),
  scopes: z.array(z.string()).default([]),
  scopeSeparator: z.enum(["space", "comma"]).optional(),
  pkce: z.boolean().optional(),
  clientAuthentication: z.enum(["basic", "body"]).optional(),
  additionalAuthorizationParams: z.record(z.string(), z.string()).optional(),
  additionalTokenParams: z.record(z.string(), z.string()).optional(),
});

const requestTemplateSchema = z.object({
  method: z.string().min(1),
  path: z.string().min(1),
  query: z.record(z.string(), z.unknown()).optional(),
  headers: z.record(z.string(), z.unknown()).optional(),
  body: z.unknown().optional(),
  contentType: z.enum(["json", "form_urlencoded", "text"]).optional(),
});

const managedConnectorSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().min(1),
  logoUrl: z.string().url().optional(),
  appUrl: z.string().url().optional(),
  docsUrl: z.string().url().optional(),
  categories: z.array(z.string()).default([]),
  authModes: z
    .array(z.enum(["none", "api_key", "bearer", "basic", "oauth2", "mcp_session"]))
    .optional(),
  authStrategy: z.enum(["none", "api_key", "bearer", "basic", "oauth2"]),
  credentialLabel: z.string().min(1),
  credentialPlaceholder: z.string().min(1),
  credentialHelp: z.string().min(1),
  apiBaseUrl: z.string().url(),
  oauthConfig: genericOAuthConfigSchema.optional(),
  oauthClientId: z.string().optional(),
  oauthClientSecret: z.string().optional(),
  functions: z.array(
    z.object({
      name: z.string().min(1),
      description: z.string().min(1),
      defaultScopes: z.array(z.string()).default([]),
      request: requestTemplateSchema,
    }),
  ),
  enabled: z.boolean().default(true),
});

export async function GET() {
  try {
    return ok(await getContextLayerService().listManagedConnectors());
  } catch (error) {
    return fromError(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = managedConnectorSchema.parse(await request.json());
    return ok(await getContextLayerService().upsertManagedConnector(payload));
  } catch (error) {
    return fromError(error);
  }
}
