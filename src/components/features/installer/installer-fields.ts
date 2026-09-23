import { I18nKey } from "#/i18n/declaration";

export type InstallerFieldType =
  | "text"
  | "password"
  | "number"
  | "select"
  | "switch";

export interface InstallerSelectOption {
  key: string;
  labelKey: I18nKey;
}

export interface InstallerField {
  id: string;
  type: InstallerFieldType;
  labelKey: I18nKey;
  required?: boolean;
  placeholderKey?: I18nKey;
  options?: InstallerSelectOption[];
  defaultValue?: string;
  defaultOn?: boolean;
}

export interface InstallerSection {
  id: string;
  titleKey: I18nKey;
  fields: InstallerField[];
}

export const INSTALLER_SECTIONS: InstallerSection[] = [
  {
    id: "cluster",
    titleKey: I18nKey.INSTALLER$SECTION_CLUSTER,
    fields: [
      {
        id: "platform",
        type: "select",
        labelKey: I18nKey.INSTALLER$FIELD_PLATFORM,
        required: true,
        options: [
          { key: "eks", labelKey: I18nKey.INSTALLER$OPT_EKS },
          { key: "gke", labelKey: I18nKey.INSTALLER$OPT_GKE },
          { key: "aks", labelKey: I18nKey.INSTALLER$OPT_AKS },
          { key: "onprem", labelKey: I18nKey.INSTALLER$OPT_ONPREM },
          { key: "other", labelKey: I18nKey.INSTALLER$OPT_OTHER },
        ],
      },
      {
        id: "kubeContext",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_KUBE_CONTEXT,
        required: true,
      },
      {
        id: "namespace",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_NAMESPACE,
        required: true,
        placeholderKey: I18nKey.INSTALLER$PLACEHOLDER_NAMESPACE,
        defaultValue: "openhands",
      },
    ],
  },
  {
    id: "network",
    titleKey: I18nKey.INSTALLER$SECTION_NETWORK,
    fields: [
      {
        id: "webHost",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_WEB_HOST,
        required: true,
        placeholderKey: I18nKey.INSTALLER$PLACEHOLDER_HOST,
      },
      {
        id: "authHost",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_AUTH_HOST,
        placeholderKey: I18nKey.INSTALLER$PLACEHOLDER_HOST,
      },
      {
        id: "ingressClass",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_INGRESS_CLASS,
      },
      {
        id: "tlsEnabled",
        type: "switch",
        labelKey: I18nKey.INSTALLER$FIELD_TLS,
        defaultOn: true,
      },
    ],
  },
  {
    id: "data",
    titleKey: I18nKey.INSTALLER$SECTION_DATA,
    fields: [
      {
        id: "dbHost",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_DB_HOST,
        required: true,
      },
      {
        id: "dbPort",
        type: "number",
        labelKey: I18nKey.INSTALLER$FIELD_DB_PORT,
        defaultValue: "5432",
      },
      {
        id: "dbName",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_DB_NAME,
        required: true,
        defaultValue: "openhands",
      },
      {
        id: "dbUser",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_DB_USER,
        required: true,
      },
      {
        id: "dbPassword",
        type: "password",
        labelKey: I18nKey.INSTALLER$FIELD_DB_PASSWORD,
        required: true,
      },
      {
        id: "redisHost",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_REDIS_HOST,
        required: true,
      },
      {
        id: "redisPort",
        type: "number",
        labelKey: I18nKey.INSTALLER$FIELD_REDIS_PORT,
        defaultValue: "6379",
      },
      {
        id: "redisPassword",
        type: "password",
        labelKey: I18nKey.INSTALLER$FIELD_REDIS_PASSWORD,
      },
      {
        id: "storageProvider",
        type: "select",
        labelKey: I18nKey.INSTALLER$FIELD_STORAGE_PROVIDER,
        required: true,
        options: [
          { key: "filesystem", labelKey: I18nKey.INSTALLER$OPT_FILESYSTEM },
          { key: "s3", labelKey: I18nKey.INSTALLER$OPT_S3 },
          { key: "gcs", labelKey: I18nKey.INSTALLER$OPT_GCS },
        ],
      },
      {
        id: "storagePath",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_STORAGE_PATH,
      },
    ],
  },
  {
    id: "identity",
    titleKey: I18nKey.INSTALLER$SECTION_IDENTITY,
    fields: [
      {
        id: "keycloakUrl",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_KEYCLOAK_URL,
        required: true,
      },
      {
        id: "keycloakExtUrl",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_KEYCLOAK_EXT,
        required: true,
      },
      {
        id: "realm",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_REALM,
        required: true,
        defaultValue: "openhands",
      },
      {
        id: "clientId",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_CLIENT_ID,
        required: true,
      },
      {
        id: "clientSecret",
        type: "password",
        labelKey: I18nKey.INSTALLER$FIELD_CLIENT_SECRET,
        required: true,
      },
      {
        id: "idp",
        type: "select",
        labelKey: I18nKey.INSTALLER$FIELD_IDP,
        required: true,
        options: [
          { key: "entra", labelKey: I18nKey.INSTALLER$OPT_ENTRA },
          { key: "okta", labelKey: I18nKey.INSTALLER$OPT_OKTA },
          { key: "google", labelKey: I18nKey.INSTALLER$OPT_GOOGLE },
          { key: "github", labelKey: I18nKey.INSTALLER$OPT_GITHUB_IDP },
          { key: "saml", labelKey: I18nKey.INSTALLER$OPT_SAML },
        ],
      },
      {
        id: "adminEmail",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_ADMIN_EMAIL,
        required: true,
      },
    ],
  },
  {
    id: "sandboxes",
    titleKey: I18nKey.INSTALLER$SECTION_SANDBOXES,
    fields: [
      {
        id: "runtimeMode",
        type: "select",
        labelKey: I18nKey.INSTALLER$FIELD_RUNTIME_MODE,
        required: true,
        options: [
          { key: "remote", labelKey: I18nKey.INSTALLER$OPT_REMOTE },
          { key: "docker", labelKey: I18nKey.INSTALLER$OPT_DOCKER },
        ],
      },
      {
        id: "runtimeUrl",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_RUNTIME_URL,
      },
      {
        id: "runtimeKey",
        type: "password",
        labelKey: I18nKey.INSTALLER$FIELD_RUNTIME_KEY,
      },
      {
        id: "sandboxImage",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_SANDBOX_IMAGE,
      },
      {
        id: "sandboxTag",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_SANDBOX_TAG,
      },
      {
        id: "maxSandboxes",
        type: "number",
        labelKey: I18nKey.INSTALLER$FIELD_MAX_SANDBOXES,
        defaultValue: "20",
      },
    ],
  },
  {
    id: "llm",
    titleKey: I18nKey.INSTALLER$SECTION_LLM,
    fields: [
      {
        id: "llmRoute",
        type: "select",
        labelKey: I18nKey.INSTALLER$FIELD_LLM_ROUTE,
        required: true,
        options: [
          { key: "litellm", labelKey: I18nKey.INSTALLER$OPT_LITELLM },
          { key: "direct", labelKey: I18nKey.INSTALLER$OPT_DIRECT },
        ],
      },
      {
        id: "llmModel",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_LLM_MODEL,
        required: true,
      },
      {
        id: "llmBaseUrl",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_LLM_BASE_URL,
      },
      {
        id: "llmApiKey",
        type: "password",
        labelKey: I18nKey.INSTALLER$FIELD_LLM_API_KEY,
        required: true,
      },
      {
        id: "hideLlmSettings",
        type: "switch",
        labelKey: I18nKey.INSTALLER$FIELD_HIDE_LLM,
      },
    ],
  },
  {
    id: "email",
    titleKey: I18nKey.INSTALLER$SECTION_EMAIL,
    fields: [
      {
        id: "smtpHost",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_SMTP_HOST,
      },
      {
        id: "smtpPort",
        type: "number",
        labelKey: I18nKey.INSTALLER$FIELD_SMTP_PORT,
        defaultValue: "587",
      },
      {
        id: "smtpUser",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_SMTP_USER,
      },
      {
        id: "smtpPassword",
        type: "password",
        labelKey: I18nKey.INSTALLER$FIELD_SMTP_PASSWORD,
      },
      {
        id: "smtpFrom",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_SMTP_FROM,
      },
      {
        id: "smtpTls",
        type: "switch",
        labelKey: I18nKey.INSTALLER$FIELD_SMTP_TLS,
        defaultOn: true,
      },
    ],
  },
  {
    id: "git",
    titleKey: I18nKey.INSTALLER$SECTION_GIT,
    fields: [
      {
        id: "gitProvider",
        type: "select",
        labelKey: I18nKey.INSTALLER$FIELD_GIT_PROVIDER,
        required: true,
        options: [
          { key: "github", labelKey: I18nKey.INSTALLER$OPT_GITHUB },
          { key: "ghe", labelKey: I18nKey.INSTALLER$OPT_GHE },
          { key: "gitlab", labelKey: I18nKey.INSTALLER$OPT_GITLAB },
          { key: "gitlab_self", labelKey: I18nKey.INSTALLER$OPT_GITLAB_SELF },
          { key: "bitbucket", labelKey: I18nKey.INSTALLER$OPT_BITBUCKET },
          { key: "bitbucket_dc", labelKey: I18nKey.INSTALLER$OPT_BITBUCKET_DC },
          { key: "azure_devops", labelKey: I18nKey.INSTALLER$OPT_AZURE_DEVOPS },
          { key: "forgejo", labelKey: I18nKey.INSTALLER$OPT_FORGEJO },
        ],
      },
      {
        id: "gitHost",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_GIT_HOST,
      },
      {
        id: "gitOrgs",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_GIT_ORGS,
        placeholderKey: I18nKey.INSTALLER$PLACEHOLDER_ORGS,
      },
      {
        id: "gitRepos",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_GIT_REPOS,
        placeholderKey: I18nKey.INSTALLER$PLACEHOLDER_REPOS,
      },
    ],
  },
  {
    id: "tickets",
    titleKey: I18nKey.INSTALLER$SECTION_TICKETS,
    fields: [
      {
        id: "ticketsProvider",
        type: "select",
        labelKey: I18nKey.INSTALLER$FIELD_TICKETS_PROVIDER,
        required: true,
        options: [
          {
            key: "github_issues",
            labelKey: I18nKey.INSTALLER$OPT_GITHUB_ISSUES,
          },
          { key: "jira_cloud", labelKey: I18nKey.INSTALLER$OPT_JIRA_CLOUD },
          { key: "jira_dc", labelKey: I18nKey.INSTALLER$OPT_JIRA_DC },
          { key: "linear", labelKey: I18nKey.INSTALLER$OPT_LINEAR },
          { key: "none", labelKey: I18nKey.INSTALLER$OPT_NONE },
        ],
      },
      {
        id: "ticketsHost",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_TICKETS_HOST,
      },
      {
        id: "ticketsProjects",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_TICKETS_PROJECTS,
        placeholderKey: I18nKey.INSTALLER$PLACEHOLDER_PROJECTS,
      },
    ],
  },
  {
    id: "chat",
    titleKey: I18nKey.INSTALLER$SECTION_CHAT,
    fields: [
      {
        id: "chatProvider",
        type: "select",
        labelKey: I18nKey.INSTALLER$FIELD_CHAT_PROVIDER,
        options: [
          { key: "slack", labelKey: I18nKey.INSTALLER$OPT_SLACK },
          { key: "teams", labelKey: I18nKey.INSTALLER$OPT_TEAMS },
          { key: "none", labelKey: I18nKey.INSTALLER$OPT_NONE },
        ],
      },
      {
        id: "chatWorkspace",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_CHAT_WORKSPACE,
      },
      {
        id: "chatChannels",
        type: "text",
        labelKey: I18nKey.INSTALLER$FIELD_CHAT_CHANNELS,
        placeholderKey: I18nKey.INSTALLER$PLACEHOLDER_CHANNELS,
      },
    ],
  },
  {
    id: "ci",
    titleKey: I18nKey.INSTALLER$SECTION_CI,
    fields: [
      {
        id: "ciSystem",
        type: "select",
        labelKey: I18nKey.INSTALLER$FIELD_CI_SYSTEM,
        options: [
          { key: "github_actions", labelKey: I18nKey.INSTALLER$OPT_ACTIONS },
          { key: "gitlab_ci", labelKey: I18nKey.INSTALLER$OPT_GITLAB_CI },
          { key: "jenkins", labelKey: I18nKey.INSTALLER$OPT_JENKINS },
          { key: "circle", labelKey: I18nKey.INSTALLER$OPT_CIRCLE },
          { key: "other", labelKey: I18nKey.INSTALLER$OPT_OTHER },
        ],
      },
      {
        id: "mergePolicy",
        type: "select",
        labelKey: I18nKey.INSTALLER$FIELD_MERGE_POLICY,
        options: [
          { key: "review_ci", labelKey: I18nKey.INSTALLER$OPT_REVIEW_CI },
          { key: "review_only", labelKey: I18nKey.INSTALLER$OPT_REVIEW_ONLY },
        ],
      },
    ],
  },
  {
    id: "goals",
    titleKey: I18nKey.INSTALLER$SECTION_GOALS,
    fields: [
      {
        id: "goalReview",
        type: "switch",
        labelKey: I18nKey.INSTALLER$FIELD_GOAL_REVIEW,
        defaultOn: true,
      },
      {
        id: "goalImplement",
        type: "switch",
        labelKey: I18nKey.INSTALLER$FIELD_GOAL_IMPLEMENT,
        defaultOn: true,
      },
      {
        id: "goalTriage",
        type: "switch",
        labelKey: I18nKey.INSTALLER$FIELD_GOAL_TRIAGE,
      },
      {
        id: "goalStandup",
        type: "switch",
        labelKey: I18nKey.INSTALLER$FIELD_GOAL_STANDUP,
      },
      {
        id: "goalMerge",
        type: "switch",
        labelKey: I18nKey.INSTALLER$FIELD_GOAL_MERGE,
      },
    ],
  },
];

export const INSTALLER_REQUIRED_FIELD_IDS = INSTALLER_SECTIONS.flatMap(
  (section) =>
    section.fields.filter((field) => field.required).map((field) => field.id),
);

export function createInstallerFieldValues(): Record<string, string> {
  return Object.fromEntries(
    INSTALLER_SECTIONS.flatMap((section) =>
      section.fields
        .filter((field) => field.type !== "switch")
        .map((field) => [field.id, field.defaultValue ?? ""]),
    ),
  );
}

export function createInstallerSwitchValues(): Record<string, boolean> {
  return Object.fromEntries(
    INSTALLER_SECTIONS.flatMap((section) =>
      section.fields
        .filter((field) => field.type === "switch")
        .map((field) => [field.id, field.defaultOn ?? false]),
    ),
  );
}
