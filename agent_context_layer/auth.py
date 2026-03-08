from __future__ import annotations

import os
from dataclasses import dataclass
from secrets import token_urlsafe
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, Request


@dataclass(slots=True)
class GoogleOAuthConfig:
    client_id: str | None = None
    client_secret: str | None = None
    authorize_url: str = "https://accounts.google.com/o/oauth2/v2/auth"
    token_url: str = "https://oauth2.googleapis.com/token"
    userinfo_url: str = "https://openidconnect.googleapis.com/v1/userinfo"
    scopes: str = "openid email profile"

    @classmethod
    def from_env(cls) -> "GoogleOAuthConfig":
        return cls(
            client_id=os.getenv("GOOGLE_CLIENT_ID"),
            client_secret=os.getenv("GOOGLE_CLIENT_SECRET"),
        )

    @property
    def enabled(self) -> bool:
        return bool(self.client_id and self.client_secret)


class GoogleOAuthClient:
    def __init__(self, config: GoogleOAuthConfig | None = None) -> None:
        self.config = config or GoogleOAuthConfig.from_env()

    def build_authorize_url(self, request: Request) -> str:
        if not self.config.enabled:
            raise HTTPException(status_code=404, detail="Google OAuth is not configured")
        state = token_urlsafe(24)
        request.session["oauth_state"] = state
        redirect_uri = str(request.url_for("google_callback"))
        params = {
            "client_id": self.config.client_id,
            "redirect_uri": redirect_uri,
            "response_type": "code",
            "scope": self.config.scopes,
            "state": state,
            "access_type": "offline",
            "prompt": "consent",
        }
        return f"{self.config.authorize_url}?{urlencode(params)}"

    async def authenticate(self, request: Request, code: str, state: str) -> dict[str, str]:
        if not self.config.enabled:
            raise HTTPException(status_code=404, detail="Google OAuth is not configured")
        if state != request.session.get("oauth_state"):
            raise HTTPException(status_code=400, detail="Invalid OAuth state")
        redirect_uri = str(request.url_for("google_callback"))
        async with httpx.AsyncClient(timeout=10) as client:
            token_response = await client.post(
                self.config.token_url,
                data={
                    "code": code,
                    "client_id": self.config.client_id,
                    "client_secret": self.config.client_secret,
                    "redirect_uri": redirect_uri,
                    "grant_type": "authorization_code",
                },
            )
            token_response.raise_for_status()
            access_token = token_response.json()["access_token"]
            user_response = await client.get(
                self.config.userinfo_url,
                headers={"Authorization": f"Bearer {access_token}"},
            )
            user_response.raise_for_status()
        user = user_response.json()
        return {
            "provider": "google",
            "email": user.get("email", "unknown@example.com"),
            "name": user.get("name", user.get("email", "Google User")),
        }
