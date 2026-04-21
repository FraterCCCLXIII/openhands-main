export const normalizeSafeRedirectTarget = (
  requestUrl: string,
  redirectTo: string | null | undefined,
  fallbackPath: string,
) => {
  const candidate = redirectTo?.trim();

  if (!candidate) {
    return fallbackPath;
  }

  try {
    const request = new URL(requestUrl);
    const destination = new URL(candidate, request);

    if (destination.origin !== request.origin) {
      return fallbackPath;
    }

    return `${destination.pathname}${destination.search}${destination.hash}` || fallbackPath;
  } catch {
    return fallbackPath;
  }
};
