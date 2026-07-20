from __future__ import annotations

from backend.app.oauth_flow import (
    build_oauth_callback_redirect,
    configured_oauth_callback_url,
)
from backend.app.public_paths import (
    internal_api_path,
    public_api_path,
    public_openapi_paths,
    public_ui_path,
)


def test_public_paths_remain_root_relative_by_default() -> None:
    assert public_api_path("/api/integrations") == "/api/integrations"
    assert internal_api_path("/api/integrations") is None
    assert public_ui_path("/integrations") == "/integrations"


def test_public_paths_use_configured_prefixes(config_env) -> None:
    config_env("INTHUB_ROOT_PATH", "/integrations-hub/")
    config_env("INTHUB_API_ROOT_PATH", "/api/integrations-hub/")

    assert public_api_path("/api/integrations") == (
        "/api/integrations-hub/integrations"
    )
    assert internal_api_path("/api/integrations-hub/integrations") == (
        "/api/integrations"
    )
    assert public_ui_path("/integrations") == "/integrations-hub/integrations"
    assert public_ui_path("/integrations-hub/profile") == ("/integrations-hub/profile")
    assert public_openapi_paths({"/api/user/key": {}}) == {
        "/api/integrations-hub/user/key": {}
    }


def test_oauth_urls_use_configured_public_prefixes(config_env, monkeypatch) -> None:
    config_env("INTHUB_ROOT_PATH", "/integrations-hub")
    config_env("INTHUB_API_ROOT_PATH", "/api/integrations-hub")
    monkeypatch.setenv(
        "INTHUB_OAUTH_REDIRECT_PROXY_URL", "https://staging.all-hands.dev"
    )

    assert configured_oauth_callback_url("linear") == (
        "https://staging.all-hands.dev/api/integrations-hub/oauth/linear/callback"
    )
    assert build_oauth_callback_redirect(
        "/integrations?showIntegrationWizard=1",
        oauth_status="connected",
        oauth_provider="linear",
    ).startswith("/integrations-hub/integrations?")
