import type { JWT } from "next-auth/jwt";

import { isAppAdminEmail } from "@/src/lib/app-admins";
import { fetchPrimaryVerifiedGitHubEmail } from "@/src/lib/github-emails";

type FetchVerifiedEmail = typeof fetchPrimaryVerifiedGitHubEmail;

export const refreshGitHubAdminClaims = async (
  token: JWT,
  accessToken?: string,
  fetchVerifiedEmail: FetchVerifiedEmail = fetchPrimaryVerifiedGitHubEmail,
) => {
  if (accessToken) {
    const verifiedEmail = await fetchVerifiedEmail(accessToken);
    token.adminEmailVerified = Boolean(verifiedEmail);
    if (verifiedEmail) {
      token.email = verifiedEmail;
    }
  }

  token.isAdmin =
    token.adminEmailVerified === true &&
    typeof token.email === "string" &&
    isAppAdminEmail(token.email);

  return token;
};
