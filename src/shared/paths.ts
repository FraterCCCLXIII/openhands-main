const normalizeBasePath = (value: string | undefined): string => {
  const trimmed = (value ?? "").trim();
  if (!trimmed || trimmed === "/") return "";
  const withLeadingSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withLeadingSlash.replace(/\/+$/, "");
};

export const INTEGRATIONS_HUB_UI_BASE_PATH = normalizeBasePath(
  process.env.NEXT_PUBLIC_INTHUB_UI_BASE_PATH,
);

export const INTEGRATIONS_HUB_API_BASE_PATH = normalizeBasePath(
  process.env.NEXT_PUBLIC_INTHUB_API_BASE_PATH,
);

export const apiPath = (path: string): string => {
  if (!path.startsWith("/api")) return path;
  if (!INTEGRATIONS_HUB_API_BASE_PATH) return path;
  if (path === "/api") return INTEGRATIONS_HUB_API_BASE_PATH;
  if (!path.startsWith("/api/")) return path;
  return `${INTEGRATIONS_HUB_API_BASE_PATH}${path.slice(4)}`;
};

export const uiPath = (path: string): string => {
  if (!path.startsWith("/") || path.startsWith("//")) return path;
  if (!INTEGRATIONS_HUB_UI_BASE_PATH) return path;
  if (
    path === INTEGRATIONS_HUB_UI_BASE_PATH ||
    path.startsWith(`${INTEGRATIONS_HUB_UI_BASE_PATH}/`)
  ) {
    return path;
  }
  return path === "/"
    ? `${INTEGRATIONS_HUB_UI_BASE_PATH}/`
    : `${INTEGRATIONS_HUB_UI_BASE_PATH}${path}`;
};

export const apiUrl = (origin: string, path: string): string =>
  `${origin.replace(/\/$/, "")}${apiPath(path)}`;
