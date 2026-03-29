export type AdminSection = "profile" | "integrations" | "apiKeys";

const ADMIN_SECTION_PATHS: Record<AdminSection, string> = {
  profile: "/profile",
  integrations: "/integrations",
  apiKeys: "/agent-connection",
};

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
    case "/home":
    case "/integrations":
    default:
      return "integrations";
  }
};

export const buildAdminSectionHref = (
  section: AdminSection,
  params?: URLSearchParams | Record<string, string | undefined>,
) => {
  const pathname = getAdminSectionPath(section);
  const searchParams = new URLSearchParams();

  if (params instanceof URLSearchParams) {
    for (const [key, value] of params.entries()) {
      if (value) {
        searchParams.append(key, value);
      }
    }
  } else if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) {
        searchParams.set(key, value);
      }
    }
  }

  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
};
