import type {
  AdminDuplicateExternalAccountSummary,
  AdminIntegrationConnectionSummary,
  AdminOperationalOverview,
  AdminOperationalOverviewUserSummary,
} from "@/src/types/integrations-hub";

const DEMO_TIMESTAMP = "2026-06-15T12:00:00.000Z";

function connection(
  overrides: Partial<AdminIntegrationConnectionSummary> &
    Pick<
      AdminIntegrationConnectionSummary,
      "ownerId" | "integrationKey" | "provider" | "authStrategy"
    >,
): AdminIntegrationConnectionSummary {
  return {
    scopes: overrides.scopes ?? ["read"],
    createdAt: overrides.createdAt ?? DEMO_TIMESTAMP,
    updatedAt: overrides.updatedAt ?? DEMO_TIMESTAMP,
    ...overrides,
  };
}

function duplicateGroup(
  provider: string,
  externalAccountId: string,
  ownerIds: string[],
  displayNames: string[] = [],
): AdminDuplicateExternalAccountSummary {
  return {
    provider,
    externalAccountId,
    ownerIds,
    ownerCount: ownerIds.length,
    displayNames,
  };
}

function userSummary(
  overrides: Partial<AdminOperationalOverviewUserSummary> &
    Pick<AdminOperationalOverviewUserSummary, "ownerId">,
): AdminOperationalOverviewUserSummary {
  const connections = overrides.connections ?? [];
  return {
    integrations: overrides.integrations ?? [
      ...new Set(connections.map((record) => record.integrationKey)),
    ].sort(),
    providers: overrides.providers ?? [
      ...new Set(connections.map((record) => record.provider)),
    ].sort(),
    totalAccessRequests: overrides.totalAccessRequests ?? 0,
    pendingAccessRequests: overrides.pendingAccessRequests ?? 0,
    notifications: overrides.notifications ?? 0,
    duplicateExternalAccounts: overrides.duplicateExternalAccounts ?? [],
    connections,
    ...overrides,
    totalConnections: overrides.totalConnections ?? connections.length,
  };
}

/** Synthetic users with varied connection, approval, and duplicate-account states for local UI review. */
export function createAdminOverviewVariationUsers(): {
  users: AdminOperationalOverviewUserSummary[];
  duplicateExternalAccounts: AdminDuplicateExternalAccountSummary[];
} {
  const duplicateGithub = duplicateGroup(
    "github",
    "openhands-dev",
    ["alice@company.com", "contractor@vendor.io"],
    ["OpenHands Dev", "Vendor Bot"],
  );
  const duplicateSlack = duplicateGroup(
    "slack",
    "workspace-t-12345",
    ["alice@company.com", "bob@company.com"],
    ["Engineering", "Eng Alerts"],
  );

  const aliceConnections = [
    connection({
      ownerId: "alice@company.com",
      integrationKey: "github",
      provider: "github",
      authStrategy: "oauth2",
      externalAccountId: "openhands-dev",
      displayName: "OpenHands Dev",
      scopes: ["repo", "read:org"],
      updatedAt: "2026-06-28T09:15:00.000Z",
    }),
    connection({
      ownerId: "alice@company.com",
      integrationKey: "slack",
      provider: "slack",
      authStrategy: "oauth2",
      externalAccountId: "workspace-t-12345",
      displayName: "Engineering",
      scopes: ["channels:read"],
      updatedAt: "2026-06-27T18:40:00.000Z",
    }),
    connection({
      ownerId: "alice@company.com",
      integrationKey: "linear",
      provider: "linear",
      authStrategy: "api_key",
      externalAccountId: "linear-org-42",
      displayName: "Product",
      scopes: ["read", "write"],
      updatedAt: "2026-06-26T11:20:00.000Z",
    }),
    connection({
      ownerId: "alice@company.com",
      integrationKey: "notion",
      provider: "notion",
      authStrategy: "oauth2",
      externalAccountId: "notion-ws-9",
      displayName: "Docs workspace",
      scopes: ["read_content"],
      updatedAt: "2026-06-20T08:00:00.000Z",
    }),
  ];

  const contractorConnections = [
    connection({
      ownerId: "contractor@vendor.io",
      integrationKey: "github",
      provider: "github",
      authStrategy: "oauth2",
      externalAccountId: "openhands-dev",
      displayName: "Vendor Bot",
      scopes: ["repo"],
      updatedAt: "2026-06-25T14:30:00.000Z",
    }),
    connection({
      ownerId: "contractor@vendor.io",
      integrationKey: "jira",
      provider: "jira",
      authStrategy: "oauth2",
      externalAccountId: "jira-cloud-88",
      displayName: "Vendor Jira",
      scopes: ["read:jira-work"],
      updatedAt: "2026-06-24T10:00:00.000Z",
    }),
    connection({
      ownerId: "contractor@vendor.io",
      integrationKey: "sentry",
      provider: "sentry",
      authStrategy: "api_key",
      externalAccountId: "sentry-org-7",
      displayName: "Vendor Sentry",
      scopes: ["project:read"],
      updatedAt: "2026-06-22T16:45:00.000Z",
    }),
    connection({
      ownerId: "contractor@vendor.io",
      integrationKey: "datadog",
      provider: "datadog",
      authStrategy: "api_key",
      scopes: ["monitors_read"],
      updatedAt: "2026-06-21T12:10:00.000Z",
    }),
    connection({
      ownerId: "contractor@vendor.io",
      integrationKey: "pagerduty",
      provider: "pagerduty",
      authStrategy: "api_key",
      scopes: ["read"],
      updatedAt: "2026-06-19T09:30:00.000Z",
    }),
    connection({
      ownerId: "contractor@vendor.io",
      integrationKey: "zendesk",
      provider: "zendesk",
      authStrategy: "oauth2",
      externalAccountId: "zendesk-22",
      displayName: "Support",
      scopes: ["tickets:read"],
      updatedAt: "2026-06-18T07:55:00.000Z",
    }),
  ];

  const users: AdminOperationalOverviewUserSummary[] = [
    userSummary({
      ownerId: "alice@company.com",
      connections: aliceConnections,
      totalAccessRequests: 8,
      pendingAccessRequests: 3,
      notifications: 12,
      duplicateExternalAccounts: [duplicateGithub, duplicateSlack],
    }),
    userSummary({
      ownerId: "bob@company.com",
      connections: [
        connection({
          ownerId: "bob@company.com",
          integrationKey: "slack",
          provider: "slack",
          authStrategy: "oauth2",
          externalAccountId: "workspace-t-12345",
          displayName: "Eng Alerts",
          scopes: ["channels:read"],
          updatedAt: "2026-06-10T15:00:00.000Z",
        }),
      ],
      totalAccessRequests: 0,
      pendingAccessRequests: 0,
      notifications: 0,
      duplicateExternalAccounts: [duplicateSlack],
    }),
    userSummary({
      ownerId: "carol@company.com",
      connections: [],
      totalConnections: 0,
      integrations: [],
      providers: [],
      totalAccessRequests: 5,
      pendingAccessRequests: 5,
      notifications: 8,
      duplicateExternalAccounts: [],
    }),
    userSummary({
      ownerId: "contractor@vendor.io",
      connections: contractorConnections,
      totalAccessRequests: 2,
      pendingAccessRequests: 1,
      notifications: 4,
      duplicateExternalAccounts: [duplicateGithub],
    }),
    userSummary({
      ownerId: "quiet-user@company.com",
      connections: [
        connection({
          ownerId: "quiet-user@company.com",
          integrationKey: "github",
          provider: "github",
          authStrategy: "oauth2",
          externalAccountId: "quiet-dev",
          displayName: "Personal",
          scopes: ["repo"],
          updatedAt: "2026-05-01T10:00:00.000Z",
        }),
      ],
      totalAccessRequests: 0,
      pendingAccessRequests: 0,
      notifications: 0,
      duplicateExternalAccounts: [],
    }),
    userSummary({
      ownerId: "legacy-mcp@company.com",
      connections: [
        connection({
          ownerId: "legacy-mcp@company.com",
          integrationKey: "custom-mcp",
          provider: "mcp",
          authStrategy: "mcp_session",
          scopes: [],
          updatedAt: "2026-06-01T08:00:00.000Z",
        }),
        connection({
          ownerId: "legacy-mcp@company.com",
          integrationKey: "http-connector",
          provider: "http",
          authStrategy: "bearer",
          scopes: ["invoke"],
          updatedAt: "2026-06-02T08:00:00.000Z",
        }),
      ],
      totalAccessRequests: 1,
      pendingAccessRequests: 0,
      notifications: 2,
      duplicateExternalAccounts: [],
    }),
  ];

  return {
    users,
    duplicateExternalAccounts: [duplicateGithub, duplicateSlack],
  };
}

function duplicateKey(group: AdminDuplicateExternalAccountSummary): string {
  return `${group.provider}:${group.externalAccountId}`;
}

/** Merges synthetic variation users into a live overview response (development preview only). */
export function enrichAdminOverviewWithVariationDemo(
  overview: AdminOperationalOverview,
): AdminOperationalOverview {
  const demo = createAdminOverviewVariationUsers();
  const existingOwnerIds = new Set(overview.users.map((user) => user.ownerId));
  const mergedUsers = [
    ...overview.users,
    ...demo.users.filter((user) => !existingOwnerIds.has(user.ownerId)),
  ].sort((left, right) => left.ownerId.localeCompare(right.ownerId));

  const duplicateMap = new Map<string, AdminDuplicateExternalAccountSummary>();
  for (const group of overview.duplicateExternalAccounts) {
    duplicateMap.set(duplicateKey(group), group);
  }
  for (const group of demo.duplicateExternalAccounts) {
    duplicateMap.set(duplicateKey(group), group);
  }
  const duplicateExternalAccounts = [...duplicateMap.values()].sort(
    (left, right) =>
      left.provider.localeCompare(right.provider) ||
      left.externalAccountId.localeCompare(right.externalAccountId),
  );

  const totalAccessRequests = mergedUsers.reduce(
    (sum, user) => sum + user.totalAccessRequests,
    0,
  );
  const pendingAccessRequests = mergedUsers.reduce(
    (sum, user) => sum + user.pendingAccessRequests,
    0,
  );
  const notifications = mergedUsers.reduce(
    (sum, user) => sum + user.notifications,
    0,
  );
  const totalConnections = mergedUsers.reduce(
    (sum, user) => sum + user.totalConnections,
    0,
  );
  const connectedOwners = mergedUsers.filter(
    (user) => user.totalConnections > 0,
  ).length;

  return {
    ...overview,
    users: mergedUsers,
    duplicateExternalAccounts,
    totalConnections,
    connectedOwners,
    totalAccessRequests,
    pendingAccessRequests,
    notifications,
  };
}
