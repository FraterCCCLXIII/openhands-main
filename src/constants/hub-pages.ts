export const HUB_PAGE_COPY = {
  integrations: {
    title: "Integrations",
    subtitle:
      "Connect managed services so agents can use approved tools with scoped permissions.",
  },
  approvals: {
    title: "Case-by-case Approvals",
    subtitle:
      "Pending requests are auto-created when an agent attempts to call a case-by-case tool without an active temporary grant.",
  },
  agentConnection: {
    title: "Agent Connection",
    subtitle:
      "Configure how agents authenticate and connect to your integration scopes.",
  },
  permissionProfiles: {
    title: "Permission Profiles",
    subtitle:
      "Save, reuse, and distribute permission sets across integrations and tools.",
  },
  profile: {
    title: "User Profile",
    subtitle:
      "Review your account details, session context, and agent connection settings.",
    connectionContextTitle: "Connection context",
    connectionContextSubtitle:
      "Agent key and integration visibility for your authenticated session.",
    agentKeyNotePrefix: "The agent key belongs to",
    agentKeyNoteSuffix:
      "Provider credentials stay server-side in integration settings or per-user OAuth records and are never handed directly to the agent.",
    fields: {
      name: "Name",
      email: "Email",
      sessionType: "Session type",
      contextApiBaseUrl: "Context API base URL",
      agentKeyStatus: "Agent key status",
      visibleIntegrations: "Visible integrations",
      pendingApprovals: "Pending approvals",
      endpointPattern: "Endpoint pattern",
    },
    agentKeyStatus: {
      provisioned: "Provisioned",
      notAvailable: "Not available yet",
    },
  },
  adminOverview: {
    title: "Operational overview",
    subtitle:
      "Deployment-wide snapshot of /api/admin/overview, presented as a concise expandable user browser.",
    browseUsersTitle: "Browse users",
    deploymentUserSummariesTitle: "Deployment-wide user summaries",
    deploymentUserSummariesDescription:
      "Expand a row to inspect saved identities, approval pressure, notification volume, and duplicate external-account groups for a specific user.",
    noUsersYet:
      "No deployment users have any saved connections, approval requests, or notification history yet.",
    adminAccessRequiredTitle: "Admin access required",
    adminAccessRequiredDescription:
      "This deployment-wide overview is only available to app administrators.",
    adminAccessGateBodyPrefix:
      "Only app administrators listed in the",
    adminAccessGateBodySuffix:
      "environment variable can view connected identities, approval queues, notifications, and duplicate external accounts across all owners.",
    adminAccessGateFollowUpPrefix:
      "If you need a new connector or access workflow, use",
    adminAccessGateFollowUpSuffix:
      "to request the necessary setup from an administrator.",
    adminOpenApiSchemaLink: "Admin OpenAPI schema",
    adminAccessGateAdminIntegrationsLink: "Admin integrations",
    connectedIdentitiesPill: (count: number) => `${count} connected identities`,
    pendingApprovalsPill: (count: number) => `${count} pending approvals`,
    duplicateGroupsPill: (count: number, label: string) =>
      `${count} duplicate ${label}`,
    duplicateGroupLabel: "group",
    duplicateGroupsLabel: "groups",
    adminAccessRequiredPill: "Admin access required",
    usersShownPill: (count: number) => `${count} shown`,
    connectedOwnersPill: (count: number) => `${count} connected owners`,
    managedConnectorsPill: (count: number) => `${count} managed connectors`,
    notificationsPill: (count: number) => `${count} notifications`,
    accessRequestsPill: (count: number) => `${count} access requests`,
    connectionCount: (count: number, label: string) => `${count} ${label}`,
    connectionLabel: "connection",
    connectionsLabel: "connections",
    pendingLabel: "pending",
    notificationsInline: (count: number) => `${count} notifications`,
    devVariationBanner:
      "Development preview: synthetic users with varied connection, approval, and duplicate-account states are merged into this overview.",
    duplicateAccountsDeploymentTitle: "Duplicate external accounts",
    duplicateAccountsDeploymentDescription:
      "Normalized provider + external account ids shared across multiple owners in this deployment.",
    totalAccessRequestsLabel: "Total access requests",
    pendingAccessRequestsLabel: "Pending approvals",
    notificationsLabel: "Notifications",
    integrationsLabel: "Integrations",
    providersLabel: "Providers",
    noIntegrations: "No integrations connected.",
    noProviders: "No providers connected.",
    savedIdentitiesTitle: (count: number) => `Saved identities (${count})`,
    noConnectionsForUser: "No saved identities for this user.",
    duplicateAccountsTitle: "Duplicate external accounts",
    duplicateAccountsEmpty: "No duplicate external-account groups for this user.",
    connectionIdentityFallback: "Unnamed identity",
    noExternalAccountId: "No external account id",
    duplicateOwnerCount: (count: number) => `${count} owners`,
    duplicateOwnersLabel: "Owners",
  },
  adminIntegrations: {
    title: "Admin integrations",
    subtitle:
      "Manage the managed connector catalog, provider guidance, and deployment-wide integration settings.",
    userGuidanceTitle: "For users",
    userGuidanceSubtitle: "What to do when the connector you want is not listed.",
    userGuidanceInfoAriaLabel: "For users information",
    userGuidanceBody:
      "The integration wizard only shows connectors that are ready to use in this deployment. If you do not see the provider you need, please contact your deployment administrator to request additional connector registrations.",
    adminGuidanceTitle: "For admins",
    adminGuidanceSubtitle: "How to add a provider that is not currently showing up.",
    adminGuidanceInfoAriaLabel: "For admins information",
    adminGuidanceLead:
      "Managing OAuth apps is a service-level admin action. Use this page to register a managed connector so every user can see it in the integrations wizard.",
    adminGuidanceAccessNotePrefix:
      "The in-app registration form is only available to signed-in app administrators whose email appears in the",
    adminGuidanceAccessNoteEnvVar: "APP_ADMIN_EMAILS",
    adminGuidanceAccessNoteSuffix: "environment variable.",
  },
} as const;
