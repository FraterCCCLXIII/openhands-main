export const extractContextApiKey = (requestHeaders: Headers) => {
  const authHeader = requestHeaders.get("authorization")?.trim();

  if (authHeader) {
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return requestHeaders.get("x-api-key")?.trim() ?? "";
};
