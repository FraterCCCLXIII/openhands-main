import { addMinutes, nowIso } from "@/src/lib/core/date";

export interface OAuthStartContext {
  state: string;
  redirectUri: string;
}

export interface OAuthStartResult {
  authorizationUrl: string;
  codeVerifier?: string;
}

export interface OAuthTokenExchangeResult {
  accessToken: string;
  refreshToken?: string;
  tokenType?: string;
  scopes: string[];
  expiresAt?: string;
  externalAccountId?: string;
  externalWorkspaceId?: string;
  displayName?: string;
  metadata: Record<string, unknown>;
}

export interface OAuthProviderDefinition {
  slug: string;
  name: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  startAuth(context: OAuthStartContext): OAuthStartResult;
  exchangeCode(args: {
    code: string;
    redirectUri: string;
    codeVerifier?: string;
  }): Promise<OAuthTokenExchangeResult>;
  refreshToken(args: {
    refreshToken: string;
  }): Promise<OAuthTokenExchangeResult>;
}

export const createOAuthStateExpiry = () => addMinutes(nowIso(), 10);
