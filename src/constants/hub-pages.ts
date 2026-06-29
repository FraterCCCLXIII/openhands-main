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
