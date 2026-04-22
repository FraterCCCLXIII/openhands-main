const SECURITY_HEADERS = {
  "x-frame-options": "DENY",
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "permissions-policy": "camera=(), geolocation=(), microphone=()",
} as const;

const STRICT_TRANSPORT_SECURITY = "max-age=31536000; includeSubDomains";

export const applySecurityHeaders = <T extends Response>(
  response: T,
  options: { isHttps: boolean },
) => {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(name, value);
  }

  if (options.isHttps) {
    response.headers.set("strict-transport-security", STRICT_TRANSPORT_SECURITY);
  }

  return response;
};
