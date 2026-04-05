import { describe, expect, it } from "vitest";

import { buildAdminOpenApiDocument } from "@/src/lib/admin-openapi";
import { buildContextOpenApiDocument } from "@/src/lib/context-openapi";
import { errorResponseSchema, toOpenApiSchema } from "@/src/lib/openapi/shared";
import { buildUserOpenApiDocument } from "@/src/lib/user-openapi";
import type { IntegrationSpec } from "@/src/types/context-layer";

const integrations: IntegrationSpec[] = [
  {
    key: "salesforce",
    name: "Salesforce",
    kind: "api",
    provider: "composio",
    authStrategy: "bearer",
    enabled: true,
    fineGrainedPermissions: true,
    config: {},
    credentials: {},
    tools: {
      accounts: {
        name: "accounts",
        description: "List accounts",
        enabled: true,
        fineGrainedPermissions: true,
        defaultScopes: ["accounts.read"],
        executionMode: "provider",
        config: {},
      },
    },
  },
];

describe("OpenAPI document builders", () => {
  it("reuses the shared error schema and bearer security schemes", () => {
    const adminDocument = buildAdminOpenApiDocument({
      baseUrl: "https://context.example.com",
      integrations,
    });
    const userDocument = buildUserOpenApiDocument({
      baseUrl: "https://context.example.com",
      integrations,
      isAdmin: true,
    });
    const contextDocument = buildContextOpenApiDocument({
      baseUrl: "https://context.example.com",
      integrations,
    });

    const sharedErrorSchema = toOpenApiSchema(errorResponseSchema);

    expect(adminDocument.openapi).toBe("3.0.3");
    expect(userDocument.openapi).toBe("3.0.3");
    expect(contextDocument.openapi).toBe("3.0.3");

    expect(adminDocument.components.schemas.ErrorResponse).toEqual(sharedErrorSchema);
    expect(userDocument.components.schemas.ErrorResponse).toEqual(sharedErrorSchema);
    expect(contextDocument.components.schemas.ErrorResponse).toEqual(sharedErrorSchema);

    expect(adminDocument.components.securitySchemes.AdminApiKey).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
    expect(userDocument.components.securitySchemes.UserApiKey).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
    expect(contextDocument.components.securitySchemes.ContextApiKey).toMatchObject({
      type: "http",
      scheme: "bearer",
    });
  });

  it("only exposes admin approval paths in the user document for admins", () => {
    const adminDocument = buildUserOpenApiDocument({
      baseUrl: "https://context.example.com",
      integrations,
      isAdmin: true,
    });
    const nonAdminDocument = buildUserOpenApiDocument({
      baseUrl: "https://context.example.com",
      integrations,
      isAdmin: false,
    });

    expect(adminDocument.paths["/api/user/access-requests"]).toBeDefined();
    expect(
      nonAdminDocument.paths["/api/user/access-requests"],
    ).toBeUndefined();
  });

  it("builds context tool operations from enabled integrations", () => {
    const document = buildContextOpenApiDocument({
      baseUrl: "https://context.example.com",
      integrations,
    });

    expect(document.paths["/api/context/salesforce/accounts"]).toMatchObject({
      post: {
        operationId: "invoke_salesforce_accounts",
      },
    });
  });

  it("uses tool terminology in OpenAPI paths and schemas", () => {
    const adminDocument = buildAdminOpenApiDocument({
      baseUrl: "https://context.example.com",
      integrations,
    });
    const userDocument = buildUserOpenApiDocument({
      baseUrl: "https://context.example.com",
      integrations,
      isAdmin: true,
    });
    const contextDocument = buildContextOpenApiDocument({
      baseUrl: "https://context.example.com",
      integrations,
    });

    expect(adminDocument.paths["/api/admin/integrations/{integrationKey}/tools/{toolName}"]).toBeDefined();
    expect(userDocument.paths["/api/user/integrations/{integrationKey}/tools/{toolName}"]).toBeDefined();
    expect(adminDocument.paths["/api/admin/integrations/{integrationKey}/functions/{functionName}"]).toBeUndefined();
    expect(userDocument.paths["/api/user/integrations/{integrationKey}/functions/{functionName}"]).toBeUndefined();

    expect(contextDocument.components.schemas.ContextInvocationResult).toMatchObject({
      properties: {
        tool: { type: "string" },
      },
    });
    expect(contextDocument.components.schemas.ContextInvocationResult).not.toMatchObject({
      properties: {
        function: expect.anything(),
      },
    });
  });
});
