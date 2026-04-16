export type AdminSection =
  | "profile"
  | "integrations"
  | "apiKeys"
  | "caseByCaseApprovals";

/**
 * Canonical dashboard routes shared by the sidebar, redirects, and docs.
 */
const ADMIN_SECTION_PATHS: Record<AdminSection, string> = {
  profile: "/profile",
  integrations: "/integrations",
  apiKeys: "/agent-connection",
  caseByCaseApprovals: "/case-by-case-approvals",
};

/**
 * Resolves a logical dashboard section to the top-level route used in the app router.
 */
export const getAdminSectionPath = (section: AdminSection) =>
  ADMIN_SECTION_PATHS[section];

export const getAdminSectionFromPath = (
  pathname: string | null | undefined,
): AdminSection => {
  switch (pathname) {
    case "/profile":
      return "profile";
    case "/agent-connection":
      return "apiKeys";
    case "/case-by-case-approvals":
      return "caseByCaseApprovals";
    case "/home":
    case "/integrations":
    default:
      return "integrations";
  }
};

/**
 * Builds a canonical dashboard link while preserving any non-empty query parameters.
 */
export const buildAdminSectionHref = (
  section: AdminSection,
  params?: Record<string, string | undefined>,
) => {
  const pathname = getAdminSectionPath(section);
  const searchParams = new URLSearchParams();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        searchParams.set(key, value);
      }
    }
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
};
