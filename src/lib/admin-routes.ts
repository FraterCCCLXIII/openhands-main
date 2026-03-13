export type AdminSection = "home" | "profile" | "integrations" | "apiKeys";

const ADMIN_SECTION_PATHS: Record<AdminSection, string> = {
  home: "/admin",
  profile: "/profile",
  integrations: "/integrations",
  apiKeys: "/agent-connection",
};

export const isAdminSection = (
  value: string | null | undefined,
): value is AdminSection =>
  value === "home" ||
  value === "profile" ||
  value === "integrations" ||
  value === "apiKeys";

export const getAdminSectionPath = (section: AdminSection) =>
  ADMIN_SECTION_PATHS[section];

export const getAdminSectionFromPath = (
  pathname: string | null | undefined,
): AdminSection => {
  switch (pathname) {
    case "/profile":
      return "profile";
    case "/integrations":
      return "integrations";
    case "/agent-connection":
      return "apiKeys";
    default:
      return "home";
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
