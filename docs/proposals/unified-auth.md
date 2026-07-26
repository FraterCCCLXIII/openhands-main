# Proposal: Unified OpenHands Cloud Authentication

## Status

Draft — 2026-06-29 (revised after auditing `OpenHands/OpenHands` + `OpenHands/agent-canvas`)

## TL;DR

There is already a **single** identity layer in integrations-hub: an OpenHands
Cloud credential obtained via the OAuth 2.0 Device Authorization Grant and
stored in `localStorage`. The "two login mechanisms" the user perceived are
really **one mechanism with a broken lifecycle**: the credential expires
mid-session and nothing refreshes it, so a page that rendered as "logged in"
(because `/api/auth/session` passed at load time) later 401s on a protected
call such as `/api/oauth/{provider}/start` with `"Sign in with OpenHands Cloud
before using this endpoint."`

**Can we port the refresh logic from `OpenHands/OpenHands`?** Partially, and
not the way it might first appear. After auditing all three repos:

- **`OpenHands/OpenHands` enterprise refresh logic is built on Keycloak OIDC,
  not the device flow.** `SaasUserAuth.refresh()` → `TokenManager.refresh()` →
  `KeycloakOpenID.a_refresh_token(refresh_token)` exchanges a Keycloak
  **refresh_token** for a new access_token. That refresh_token only exists for
  the **web (authorization-code) login** (`/api/keycloak/callback`), which
  stores it in an `HttpOnly` `keycloak_auth` cookie and in an
  `offline_token_store`. The device flow (`enterprise/server/routes/oauth_device.py`)
  **does not issue a refresh_token at all** — its `DeviceTokenResponse` returns
  only `access_token` (a 7-day API key, `KEY_EXPIRATION_TIME = timedelta(days=7)`),
  with `expires_in: Optional[int] = None` ("API keys may not have expiration").
  So there is **no device-flow refresh to port**; the device flow's "refresh"
  is just "the API key is long-lived (7 days) and Cloud `/api/v1/users/me`
  validates it per call."
- **`OpenHands/agent-canvas` confirms this.** Its `device-flow-client.ts`
  returns `{ access_token, token_type, expires_in? }` — no `refresh_token`
  field even in the type. `use-device-flow.ts` hands the `access_token` to the
  backend as an API key (`X-Session-API-Key`). No refresh logic exists there
  either.

**Implication for integrations-hub:** the credential integrations-hub stores
in `localStorage` is a **7-day Cloud API key**, not a short-lived OAuth access
token. It should *not* expire mid-session within a normal browsing window —
which means the user's 401 is more likely one of: (a) the key was near its
7-day limit and crossed it, (b) the key was revoked/rotated server-side, or
(c) the per-request Cloud `/users/me` call hit a transient path that the
20-second auth cache masked as invalid. Regardless of which, the fix is the
same shape: **stop depending on a JS-readable long-lived key; adopt the
cookie-session + refresh pattern that `OpenHands/OpenHands` already uses for
its web login**, and make the device flow feed into that same session rather
than bypassing it.

This proposal unifies auth around **one Cloud identity**, moves the credential
out of JavaScript-reachable `localStorage` into a **backend-mediated,
`HttpOnly`+`SameSite=Strict` session cookie modeled on `OpenHands/OpenHands`
enterprise auth**, ports the **refresh-token rotation** pattern from
`SaasUserAuth.refresh()` / `AuthTokenStore` (for the web/OIDC path), and
collapses the fragmented 401 handling into a **single re-login path** — so a
user signs in once and stays signed in, without weakening the security posture
(in fact strengthening it).

---

## 1. Root-cause analysis (what the user actually hit)

### 1.1 The current architecture is already single-mechanism

| Layer | File | Behavior |
| --- | --- | --- |
| Sign-in UI | `app/signin/page.tsx` → `CloudDeviceFlowButton` | Runs device flow against OpenHands Cloud `/oauth/device/authorize` → `/oauth/device/token` |
| Token storage | `src/lib/cloud-auth-storage.ts` | Stores the returned `access_token` in `localStorage["integrations-hub-openhands-token"]` |
| Session check | `src/lib/client-auth.ts` → `/api/auth/session` | Sends `Authorization: Bearer <token>`; on 200 sets `isAuthenticated`; on 401/403 clears the token; on 503 keeps it |
| API calls | `src/lib/fetch-json.ts` `apiFetch` | Reads the same `localStorage` token and sets `Authorization: Bearer` on every `/api/*` request |
| Backend gate | `backend/app/main.py` `authorize_dashboard_user` | Calls `authenticate_token` → OpenHands Cloud `/api/v1/users/me`; 401/403 → `None`; 5xx/network → `AuthUnavailable` (503) |
| Route gating | `requires_dashboard_session` | `/api/oauth/{provider}/start` (the Slack "connect" call) **requires** a dashboard session |

There is no separate "main interface login" vs "Cloud login." The dashboard
view and the Slack endpoint use the **same** token and the **same**
`authenticate_token` function. So the question is not "two mechanisms" but
**"why did the same token work at load and fail seconds/minutes later?"**

### 1.2 Why the dashboard rendered but the Slack call 401'd

The credential from the device flow is a **7-day Cloud API key**
(`KEY_EXPIRATION_TIME = timedelta(days=7)` in `oauth_device.py`), validated
per-call by `authenticate_token` → Cloud `/api/v1/users/me` (cached 20s). It
is *not* a short-lived OAuth access token, so "it expired between page load and
the Slack click" is only plausible if the key was near its 7-day boundary. The
more likely failure modes, given the code:

1. **The 7-day key elapsed / was rotated server-side.** `useClientAuth`
   computes `isAuthenticated` **once** from the load-time `/api/auth/session`
   call and never re-validates per request. If the key died after that check
   (day-7 boundary, or an admin/device rotation on the Cloud side), the
   dashboard still shows "logged in" while the next protected call 401s.
2. **A transient Cloud `/users/me` failure surfaced as 401.**
   `authenticate_token` correctly maps 5xx/network → `AuthUnavailable` (503)
   and 401/403 → `None`. But the **20-second negative cache** (`_AUTH_CACHE`)
   means a single bad 401 from Cloud (e.g. a brief gateway glitch returning
   401) poisons subsequent calls for 20s — long enough for the user to click
   "Connect to Slack" and see the error, while the page-load session check
   (slightly earlier or outside the cache window) had succeeded.
3. **The key was never stored / was cleared.** A prior 401 on *any* call clears
   `localStorage` via `clearStoredOpenHandsToken`; the session check then
   re-runs and may briefly show authenticated from stale React state before
   redirecting. The dashboard's `isAuthenticated` is derived from the last
   successful session response, not from the presence of the key.

In all three cases the dashboard and the Slack endpoint use the **same** key
and the **same** `authenticate_token`; the divergence is a **lifecycle/state
problem**, not a second mechanism. `fetchJson` throws an `ApiRequestError` on
401 but, unlike the session-check path, it **does not clear the token or
trigger re-login** — so the user is stuck on a "logged in" dashboard that can
no longer make authenticated calls and is told to sign in again. That is the
dual-login feeling: *I'm logged in, but I'm told to log in.*

### 1.3 Secondary security smell (independent of the bug)

The long-lived Cloud access token lives in `localStorage`. Any XSS in the SPA
(including via a compromised dependency) can exfiltrate it. That token grants
the full dashboard surface for its entire lifetime. This is the standard
reason SPAs move to **`HttpOnly` cookie sessions with server-side refresh
tokens** — and doing so also fixes the lifecycle bug above.

---

## 2. Goals & non-goals

### Goals

1. **One identity, one login.** A user signs in with OpenHands Cloud once and
   the session persists across the dashboard, the Slack/OAuth flows, and page
   reloads — no repeated manual logins.
2. **No silent lockout.** Token expiry is handled transparently via refresh;
   the user is only asked to re-authenticate when the refresh token itself is
   invalid/expired.
3. **Stronger, not weaker, security.** Remove the long-lived bearer token from
   JavaScript-reachable storage; adopt `HttpOnly`+`SameSite=Strict` cookies
   with server-side refresh-token custody and short-lived access tokens.
4. **Unified 401 handling.** Every protected call funnels through the same
   recovery path (refresh → retry → if refresh fails, one redirect to
   `/signin`).
5. **Minimal disruption to programmatic auth.** The `cla_...` / `clu_...` /
   `clad_...` automation keys (agent / user / admin APIs) are **out of scope**
   and must continue to work unchanged.

### Non-goals

- Changing the OpenHands Cloud OAuth server itself (we consume its endpoints).
- Replacing the device flow for headless/CLI contexts (it stays available).
- Altering the authorization model (`owner_id`, admin allowlist, permission
  profiles).
- SSO/SAML or multi-IdP federation.

### 2.5 What is portable from `OpenHands/OpenHands` (the audit)

This is the direct answer to "could we port the refresh logic here?"

| `OpenHands/OpenHands` artifact | What it does | Portable to integrations-hub? |
| --- | --- | --- |
| `SaasUserAuth.refresh()` (`server/auth/saas_user_auth.py`) | Exchanges a Keycloak refresh_token for a fresh access_token; updates `access_token`/`refresh_token` in place; raises `ExpiredError` when the refresh_token itself is dead. | **Pattern yes, code no.** The pattern (lazy refresh on `get_access_token()`, raise-on-dead-refresh) is exactly what we want behind the session cookie. The code is Keycloak-coupled (`KeycloakOpenID.a_refresh_token`). |
| `AuthTokenStore` (`storage/auth_token_store.py`) | DB-backed token store with **double-checked locking** refresh: fast-path read without lock; slow-path `SELECT ... FOR UPDATE` with `SET LOCAL lock_timeout = 5s`; double-check after lock to avoid duplicate refresh (IDPs invalidate the old refresh_token on rotation). | **Yes — the most valuable thing to port.** This is the safe concurrent-refresh primitive. integrations-hub should reuse this shape for its `sessions` table refresh path. |
| `AuthTokenStore._is_token_expired` | 15-min leeway (`ACCESS_TOKEN_EXPIRY_BUFFER = 900`) before access-token expiry to refresh proactively. | **Yes.** Reuse the leeway idea. |
| `set_response_cookie` (`server/routes/auth.py`) | Signs a JWT containing `{access_token, refresh_token, accepted_tos}`, sets it as `HttpOnly` chunked cookie (`keycloak_auth`), `SameSite` from `get_cookie_samesite()` (strict in prod, lax in dev/staging). | **Yes — pattern directly applicable.** integrations-hub already has `INTHUB_CREDENTIAL_ENCRYPTION_KEY` (Fernet via `crypto.py`) to sign the cookie JWT. |
| `SetAuthCookieMiddleware` (`server/middleware.py`) | On every response, if the cookie session was refreshed during the request, **re-sets the cookie** with the rotated tokens. This is what keeps the browser session alive without manual re-login. | **Yes — essential.** This is the missing piece that makes "sign in once, stay signed in" work. Port the middleware pattern. |
| `_logout` (`server/middleware.py`) | Calls `token_manager.logout(refresh_token)` to revoke at the IDP, then deletes the cookie. Only for cookie auth (not bearer). | **Yes.** Port for `/api/auth/signout`. |
| `TokenManager.encrypt_text`/`decrypt_text` | Encrypts tokens at rest via `get_jwt_service()` (Fernet). | **Already have an equivalent:** `backend/app/crypto.py` + `INTHUB_CREDENTIAL_ENCRYPTION_KEY`. Reuse it. |
| `enterprise/server/routes/oauth_device.py` | The Cloud device-flow endpoint. **Returns only `access_token` (a 7-day API key); no `refresh_token`.** | **Not portable as "refresh"** — there is nothing to refresh. This is the evidence that the device flow has no refresh semantics. |
| `OpenHands/agent-canvas` `device-flow-client.ts` | Browser device-flow client; returns `{access_token, token_type, expires_in?}`; no refresh. | **Confirms** the device flow has no refresh token. integrations-hub's `cloud-device-flow.ts` is already a near-identical implementation. |

**Bottom line:**
- The **device flow has no refresh logic to port** — it yields a long-lived API
  key. integrations-hub's current "store the key in localStorage and send it as
  a bearer" is, functionally, already what agent-canvas does too.
- The **web/OIDC login in `OpenHands/OpenHands` has a complete, production-grade
  refresh + cookie-session implementation** that is directly portable in
  *pattern* (cookie JWT, `HttpOnly`+`SameSite`, double-checked-locked DB
  refresh, response middleware that re-sets the cookie on rotation, logout with
  IDP revocation). That is what we should adopt.
- Therefore the unification strategy is: **make the device flow terminate into
  the same backend session as the web flow would**, so the browser never holds
  the raw key; and add the web authorization-code flow (§3.4) so we actually
  get a refresh_token to rotate. For device-flow-only users (no refresh token),
  the session simply re-validates the stored 7-day key per request (as today)
  but the key stays server-side and the 401-recovery path is unified.

---

## 3. Proposed design

### 3.1 Backend-mediated session (the core change)

Introduce a **session resource** owned by the backend. The browser never sees
the long-lived credential.

```
Browser ──(device flow)──▶ OpenHands Cloud ──access_token + refresh_token──▶
        │
        └─POST /api/auth/session {code|device_token}──▶ integrations-hub backend
                                                            │ stores refresh_token server-side
                                                            │ sets Set-Cookie: inthub_sess=… (HttpOnly, SameSite=Strict, Secure)
                                                            ▼
        ◀──200 { user } + cookie──
```

Subsequent dashboard calls carry the cookie automatically (`credentials:
"same-origin"` is already used). The backend resolves the cookie to a session,
uses the server-held refresh token to mint short-lived access tokens, and calls
Cloud `/users/me` — exactly as `authenticate_token` does today.

#### New backend pieces (modeled on `OpenHands/OpenHands` enterprise auth)

1. **`backend/app/session_store.py`** — opaque session IDs (`inthub_sess`),
   mapped server-side to `{user_id, org_id, provider_credential,
   refresh_token?, access_token?, access_token_expires_at?, credential_kind}`.
   `credential_kind` is `"device_key"` (7-day Cloud API key, no refresh) or
   `"oidc"` (access+refresh pair from the web flow). Stored in the existing
   Postgres (`sessions` table). **Port the `AuthTokenStore` double-checked
   locking refresh shape** (`SELECT ... FOR UPDATE` + `SET LOCAL lock_timeout`
   + double-check) for the `oidc` refresh path, so concurrent requests don't
   double-spend a rotating refresh_token.
2. **`/api/auth/session` (POST)** — accepts the device-flow `access_token` (or
   an authorization-code `code` for the web redirect flow in §3.4), creates a
   session, **stores the credential server-side encrypted via
   `backend/app/crypto.py`** (the local equivalent of `TokenManager.encrypt_text`),
   sets the `HttpOnly` cookie, returns `{ user }`. This replaces the current
   "store token in localStorage" step. For the device flow the "credential" is
   the 7-day key; for the web flow it's access+refresh.
3. **`/api/auth/session` (GET)** — reads the cookie, resolves the user:
   - `device_key` session → validate the stored 7-day key against Cloud
     `/users/me` (as `authenticate_token` does today);
   - `oidc` session → if access token is within the 15-min leeway (port
     `ACCESS_TOKEN_EXPIRY_BUFFER`), refresh via the stored refresh_token
     (Cloud `/oauth/token` `grant_type=refresh_token`), update the session row.
   Returns `{ user }` or `401` if the session/credential is dead.
4. **`/api/auth/signout` (POST)** — deletes the session row, clears the cookie.
   For `oidc` sessions, best-effort revoke the refresh_token at Cloud (port the
   `_logout` pattern). For `device_key` sessions, revoke the Cloud API key if
   Cloud exposes a revocation endpoint (TBD — see open questions).
5. **`SetAuthCookieMiddleware` (port)** — on every response, if the session's
   credential was refreshed during the request, **re-set the cookie** with the
   rotated token(s). This is the piece that makes the session persist without
   manual re-login; it is directly modeled on
   `OpenHands/OpenHands` `SetAuthCookieMiddleware`.

#### Cookie attributes (security-sensitive)

- `HttpOnly` — not readable by JS (kills the XSS-token-theft class).
- `Secure` — HTTPS only (already required for `*.all-hands.dev`).
- `SameSite=Strict` — blocks CSRF on top-level navigations from other origins.
  Because all dashboard calls are same-origin `fetch` with
  `credentials: "same-origin"`, `Strict` is safe and strictest. (If cross-site
  embed of the dashboard is ever needed, downgrade to `Lax` then; do not start
  there.)
- `Path=/`, short-ish max-age (e.g. 7 days) with sliding renewal on refresh.
- Session ID: 32-byte cryptographically random, base64url.

### 3.2 Unified backend auth path

Collapse the two near-duplicate user-resolution functions into one that reads
**either** a session cookie **or** a bearer/X-API-Key (for programmatic keys),
so dashboard and API callers share one code path:

```
resolve_request_identity(request) -> Identity
  1. if session cookie present and valid -> return DashboardUser(owner_id, is_admin, ...)
  2. if Authorization: Bearer / X-API-Key present:
       a. try scoped user/admin key table  -> return that owner
       b. try agent key table              -> return agent record
       c. else treat as Cloud bearer token -> authenticate_token (legacy/compat)
  3. else -> None (caller raises 401/403 per its policy)
```

`authorize_dashboard_user` becomes "require a valid session cookie
(accepting a Cloud bearer token only for backward compatibility during
rollout)." `requires_dashboard_session` semantics are unchanged — the Slack
`start` endpoint still requires a dashboard session, now satisfied by the
cookie instead of the localStorage token.

This is the **unification**: one identity resolution, one 401 semantics, one
recovery path — for the page load *and* the Slack connect click.

### 3.3 Silent refresh + unified 401 recovery (fixes the lockout)

Two session kinds, two recovery behaviors, **one frontend path**:

**`oidc` session (web flow):** when the access token is within the 15-min
leeway or has expired but the refresh token is valid, the backend
**automatically refreshes** (port `SaasUserAuth.refresh` +
`AuthTokenStore.load_tokens` double-checked locking), updates the session row,
and proceeds; the `SetAuthCookieMiddleware` re-sets the cookie. Only if the
refresh token itself is dead does it return `None` → 401.

**`device_key` session (device flow):** there is no refresh token. The backend
re-validates the stored 7-day key against Cloud `/users/me` (cached, as today).
If Cloud returns 401/403, the key is dead → 401. **To keep device-flow users
from being silently locked out at day 7**, the frontend 401-recovery path
offers a one-click re-authorization (the device flow again, or the web flow if
available) rather than just dumping them on `/signin` with a stale error.

**Frontend (unified for both):** introduce a single `apiFetch` interceptor:

```
apiFetch(input, init):
  resp = fetch(input, { ...init, credentials: "same-origin" })   // cookie sent automatically
  if resp.status === 401 and isDashboardCall(input):
     // one recovery attempt: GET /api/auth/session refreshes (oidc) or re-validates (device_key) via cookie;
     // if it returns 200, retry the original call once.
     if await refreshSessionOnce(): return fetch(input, { ...init, credentials: "same-origin" })
     // refresh failed -> clear local auth state, route to /signin (one re-login)
     clearAuthStateAndRedirect()
  return resp
```

Because the cookie is `HttpOnly`, the frontend no longer touches any token; it
only tracks a boolean `isAuthenticated` derived from `GET /api/auth/session`.
On a definitive 401 that recovery can't fix, the user is sent to `/signin`
**once**. No more "logged in but asked to log in." `useClientAuth` is
simplified and its `sessionError` retry behavior (503 → keep, retry) is
preserved.

### 3.4 Add the web (authorization-code) flow alongside device flow (this is where refresh tokens come from)

The device flow is great for headless agents but clunky for a browser (popup,
user code), and — critically, per the audit — **it does not issue a refresh
token**, so it cannot power silent refresh. The web authorization-code flow
against OpenHands Cloud / Keycloak **does** issue `access_token` +
`refresh_token` (exactly as `OpenHands/OpenHands`
`/api/keycloak/callback` → `get_keycloak_tokens` does). Add it as the
**preferred browser login** so we get refresh semantics:

- `GET /api/auth/login?redirect_to=...` → 302 to Cloud
  `/oauth/authorize?...&code_challenge=...`
- Cloud redirects back to `/api/auth/callback?code=...&state=...`
- Backend exchanges `code` for tokens (PKCE verifier), creates the session,
  sets the cookie, 302s to `redirect_to` (same open-redirect guard already in
  `oauth_flow.build_oauth_callback_redirect`).

This makes "Login with OpenHands Cloud" a single click with no popup/code
copying — the most user-friendly option — while the device flow remains for
non-browser contexts. Both flows terminate in the **same** session cookie
(`credential_kind` distinguishes them), so the rest of the system is
flow-agnostic. **This flow is now mandatory rather than optional** if we want
true silent refresh for browser users, because the device flow provides no
refresh token to rotate. (The cookie-session + server-side-key work in
§3.1–3.3 still ships first and fixes the reported bug for device-flow users;
the web flow then upgrades them to refreshable sessions.)

### 3.5 Keep `localStorage` token only as a deprecated compatibility shim

During rollout, `apiFetch` may still send a `Bearer` header if a legacy
`localStorage` token is present, and the backend's `resolve_request_identity`
still accepts Cloud bearer tokens for dashboard routes. This lets us ship the
cookie session without breaking existing signed-in users. After one token
lifetime, drop the shim and remove `cloud-auth-storage.ts`.

---

## 4. Security analysis

| Concern | Today | After |
| --- | --- | --- |
| XSS token theft | Long-lived Cloud access token in `localStorage`, fully JS-readable | `HttpOnly` cookie; JS cannot read the session credential. Refresh token never leaves the backend. |
| CSRF | N/A (bearer header, not ambient) | Cookie is ambient credential → mitigated by `SameSite=Strict` + same-origin `fetch`; state-changing routes additionally verify `Origin`/`Sec-Fetch-Site` (cheap to add) |
| Token lifetime exposure | One long-lived token, broad surface | Short-lived access tokens, refreshed server-side; refresh token stored encrypted (reuse `INTHUB_CREDENTIAL_ENCRYPTION_KEY`) |
| Open redirect in auth callback | Guard exists for OAuth `redirectTo` | Reuse the same same-origin-relative-path validator for `redirect_to` |
| Session fixation | N/A | Rotate session ID on login and on privilege-changing events |
| Revocation | User must clear `localStorage` on every device | `POST /api/auth/signout` deletes server-side session; Cloud refresh-token revocation propagates automatically |
| Transient Cloud outage (503) | Correctly preserved (don't destroy token) | Preserved: 503/network still surfaces `sessionError` + retry, no logout |
| Programmatic keys (`cla/clu/clad`) | Unchanged | Unchanged — handled by the same `resolve_request_identity` bearer branch |

**Net:** strictly stronger. We remove the highest-risk item (long-lived token
in JS-readable storage) and add CSRF + fixation defenses, without adding new
trust boundaries.

### Explicit non-weakening checklist

- No new client-side secret storage. The only browser-side state is an opaque
  session ID in an `HttpOnly` cookie.
- No weakening of `requires_dashboard_session`: Slack `start` still requires a
  dashboard identity.
- No bypass of admin allowlist: `is_admin` continues to come from Cloud
  `/users/me` (now via the refreshed access token), with the
  `INTHUB_APP_ADMIN_EMAILS` null-org fallback unchanged.
- No change to encryption-at-rest requirements; refresh tokens reuse the
  existing encryption key.

---

## 5. Migration / rollout plan

1. **Phase 1 — Backend session + refresh (no UX change yet).** Add
   `sessions` table + migration, `/api/auth/session` POST/GET/signout/refresh,
   cookie issuance. `resolve_request_identity` accepts cookie **and** legacy
   bearer. Existing device-flow → localStorage path still works.
   - Tests: extend `backend/tests/test_backend_smoke.py`,
     `test_migrations.py`; add `test_session_refresh.py`,
     `test_session_revocation.py`, `test_csrf_origin_check.py`.
2. **Phase 2 — Frontend switches to cookie session.** `useClientAuth` uses
   `GET /api/auth/session` (cookie) for state; `apiFetch` sends
   `credentials: "same-origin"` and drops the manual `Bearer` header; add the
   401-refresh-retry interceptor. Sign-in posts the device-flow result to
   `POST /api/auth/session` instead of writing `localStorage`.
   - Tests: update `src/lib/client-auth.test.tsx`; add
     `src/lib/fetch-json.test.ts` cases for 401-retry and refresh-failure
     redirect.
3. **Phase 3 — Web auth-code flow (optional, UX win).** Add
   `/api/auth/login` + `/api/auth/callback` with PKCE; sign-in page prefers it
   and falls back to device flow.
4. **Phase 4 — Deprecation.** After one access-token lifetime, remove the
   `localStorage` bearer shim and `cloud-auth-storage.ts`.

Each phase is independently shippable and reversible. Phase 1+2 together fix
the user's reported bug (mid-session 401 / repeated login).

---

## 6. Open questions

1. Does OpenHands Cloud's `/oauth/device/token` (and the auth-code token
   endpoint) return a `refresh_token` today, and what are the refresh-token
   lifetime / rotation semantics? **Need to confirm against Cloud's OAuth
   server.** If refresh tokens are unsupported, Phase 1 must instead do silent
   re-authorization (re-run device flow in an iframe / web flow) — the web
   auth-code flow in §3.4 becomes mandatory rather than optional.
2. Deployment constraint: is Postgres reachable for the `sessions` table on
   every request, or should sessions be encrypted-into-cookie (stateless) to
   avoid a DB hop per call? Prefer Postgres for revocation; fall back to
   encrypted-cookie only if latency/blocking is unacceptable.
3. Should the session cookie be per-deployment (`integrations.dev.` vs prod)?
   Yes — scope cookies to the deployment origin (already the default) so dev
   sessions don't leak to prod and vice versa.

---

## 7. Summary

The "two logins" were one login with a broken token lifecycle plus a
JavaScript-readable long-lived credential. Unifying on a **backend-mediated,
`HttpOnly` cookie session with server-side refresh** gives the user a single
sign-in that persists, eliminates the mid-session 401 lockout, and improves
security — while leaving the programmatic key model untouched.
