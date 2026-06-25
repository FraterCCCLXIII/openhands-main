from __future__ import annotations

import hashlib
from dataclasses import dataclass, field
from secrets import token_urlsafe
from typing import Any

import psycopg
from psycopg.rows import dict_row
from psycopg.types.json import Jsonb

from .config import get_default_config
from .crypto import (
    decrypt_api_key,
    decrypt_credentials,
    encrypt_api_key,
    encrypt_credentials,
)
from .models import (
    AccessRequest,
    IntegrationSpec,
    ManagedConnector,
    PermissionProfile,
    PermissionProfileSnapshot,
    ToolSpec,
    now_iso,
)


@dataclass
class Repository:
    """Repository for integrations-hub data access.

    Schema is managed by Alembic migrations (see backend/alembic/).
    Run `npm run db:migrate` or `./scripts/run-migrations.sh` before starting the app.
    """

    @property
    def database_url(self) -> str | None:
        return get_default_config().postgres_url

    def db_rows(self, query: str, params: tuple[Any, ...] = ()) -> list[dict[str, Any]]:
        if not self.database_url:
            return []
        with psycopg.connect(self.database_url, row_factory=dict_row) as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)
                if cur.description is None:
                    return []
                return list(cur.fetchall())

    def execute_db(self, query: str, params: tuple[Any, ...] = ()) -> None:
        if not self.database_url:
            return
        with psycopg.connect(self.database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(query, params)
            conn.commit()

    @staticmethod
    def iso(value: Any) -> str | None:
        if value is None:
            return None
        if hasattr(value, "isoformat"):
            return value.isoformat().replace("+00:00", "Z")
        return str(value)

    @staticmethod
    def key_status(
        value: str | None, created_at: Any = None, updated_at: Any = None
    ) -> dict[str, Any] | None:
        if not value:
            return None
        return {
            "keyPrefix": value[:12],
            "keySuffix": value[-4:],
            "recoverable": True,
            "createdAt": Repository.iso(created_at) or now_iso(),
            "updatedAt": Repository.iso(updated_at) or now_iso(),
        }

    @staticmethod
    def stored_key_status(
        key_prefix: Any, key_suffix: Any, created_at: Any = None, updated_at: Any = None
    ) -> dict[str, Any] | None:
        prefix = str(key_prefix or "")
        suffix = str(key_suffix or "")
        if not prefix and not suffix:
            return None
        return {
            "keyPrefix": prefix,
            "keySuffix": suffix,
            "recoverable": True,
            "createdAt": Repository.iso(created_at) or now_iso(),
            "updatedAt": Repository.iso(updated_at) or now_iso(),
        }

    @staticmethod
    def decrypt_api_key_value(payload: str | None) -> str | None:
        try:
            return decrypt_api_key(payload)
        except Exception:
            return None

    @staticmethod
    def hash_key(value: str) -> str:
        return hashlib.sha256(value.encode("utf-8")).hexdigest()

    integrations: dict[str, dict[str, IntegrationSpec]] = field(default_factory=dict)

    @staticmethod
    def normalize_owner_id(value: Any) -> str:
        return str(value or "").strip().lower()

    @staticmethod
    def same_scopes(left: list[str], right: list[str]) -> bool:
        return sorted(left) == sorted(right)

    @classmethod
    def access_request_owner_id(cls, request: AccessRequest) -> str | None:
        notification_owner = cls.normalize_owner_id(
            request.notificationTargets.get("in_app")
        )
        return notification_owner or None

    @classmethod
    def access_request_matches_owner(
        cls, request: AccessRequest, owner_id: str
    ) -> bool:
        return cls.access_request_owner_id(request) == cls.normalize_owner_id(owner_id)

    @classmethod
    def owner_scoped_access_request(
        cls, owner_id: str, request: AccessRequest
    ) -> AccessRequest:
        notification_targets = dict(request.notificationTargets)
        notification_targets.setdefault("in_app", cls.normalize_owner_id(owner_id))
        channels = list(request.channels)
        if "in_app" not in channels:
            channels.append("in_app")
        return request.model_copy(
            update={"channels": channels, "notificationTargets": notification_targets}
        )

    access_requests: dict[str, dict[str, AccessRequest]] = field(default_factory=dict)
    managed_connectors: dict[str, ManagedConnector] = field(default_factory=dict)
    agent_keys: dict[str, str] = field(default_factory=dict)
    user_keys: dict[str, str] = field(default_factory=dict)
    admin_keys: dict[str, str] = field(default_factory=dict)
    oauth_states: dict[str, dict[str, Any]] = field(default_factory=dict)
    connections: dict[tuple[str, str], dict[str, Any]] = field(default_factory=dict)
    temporary_grants: dict[str, dict[str, Any]] = field(default_factory=dict)
    tool_invocations: list[dict[str, Any]] = field(default_factory=list)
    permission_profiles: dict[str, dict[str, PermissionProfile]] = field(
        default_factory=dict
    )
    profile_agent_keys: dict[str, str] = field(default_factory=dict)

    def row_to_integration(self, row: dict[str, Any]) -> IntegrationSpec:
        return IntegrationSpec(
            key=str(row["key"]),
            name=str(row["name"]),
            kind=row["kind"],
            provider=row["provider"],
            authStrategy=row["auth_strategy"],
            enabled=bool(row["enabled"]),
            fineGrainedPermissions=bool(row["fine_grained_permissions"]),
            config=row.get("config") or {},
            credentials=row.get("credentials") or {},
            tools=row.get("functions") or {},
        )

    def list_integrations(self, owner_id: str) -> list[IntegrationSpec]:
        if self.database_url:
            rows = self.db_rows(
                """
                SELECT * FROM owner_integrations
                WHERE LOWER(owner_id) = LOWER(%s)
                ORDER BY key ASC
                """,
                (owner_id,),
            )
            return [self.row_to_integration(row).redacted() for row in rows]
        return [
            integration.redacted()
            for integration in self.integrations.get(owner_id, {}).values()
        ]

    def save_integration(
        self, owner_id: str, integration: IntegrationSpec
    ) -> IntegrationSpec:
        if self.database_url:
            self.execute_db(
                """
                INSERT INTO owner_integrations (
                    owner_id, key, name, kind, provider, auth_strategy, enabled,
                    fine_grained_permissions, config, credentials, functions, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (owner_id, key) DO UPDATE SET
                    name = EXCLUDED.name,
                    kind = EXCLUDED.kind,
                    provider = EXCLUDED.provider,
                    auth_strategy = EXCLUDED.auth_strategy,
                    enabled = EXCLUDED.enabled,
                    fine_grained_permissions = EXCLUDED.fine_grained_permissions,
                    config = EXCLUDED.config,
                    credentials = EXCLUDED.credentials,
                    functions = EXCLUDED.functions,
                    updated_at = NOW()
                """,
                (
                    owner_id,
                    integration.key,
                    integration.name,
                    integration.kind,
                    integration.provider,
                    integration.authStrategy,
                    integration.enabled,
                    integration.fineGrainedPermissions,
                    Jsonb(integration.config),
                    Jsonb(integration.credentials),
                    Jsonb(
                        {
                            name: tool.model_dump()
                            for name, tool in integration.tools.items()
                        }
                    ),
                ),
            )
            return integration.redacted()
        self.integrations.setdefault(owner_id, {})[integration.key] = integration
        return integration.redacted()

    def get_integration(
        self, owner_id: str, integration_key: str
    ) -> IntegrationSpec | None:
        if self.database_url:
            rows = self.db_rows(
                """
                SELECT * FROM owner_integrations
                WHERE LOWER(owner_id) = LOWER(%s) AND key = %s
                """,
                (owner_id, integration_key),
            )
            return self.row_to_integration(rows[0]) if rows else None
        return self.integrations.get(owner_id, {}).get(integration_key)

    def delete_integration(self, owner_id: str, integration_key: str) -> bool:
        if self.database_url:
            rows = self.db_rows(
                """
                WITH deleted_connections AS (
                    DELETE FROM integration_connections
                    WHERE LOWER(owner_id) = LOWER(%s) AND integration_key = %s
                )
                DELETE FROM owner_integrations
                WHERE LOWER(owner_id) = LOWER(%s) AND key = %s
                RETURNING key
                """,
                (owner_id, integration_key, owner_id, integration_key),
            )
            return bool(rows)
        return (
            self.integrations.get(owner_id, {}).pop(integration_key, None) is not None
        )

    def save_tool(
        self, owner_id: str, integration_key: str, tool: ToolSpec
    ) -> ToolSpec | None:
        integration = self.get_integration(owner_id, integration_key)
        if not integration:
            return None
        integration.tools[tool.name] = tool
        self.save_integration(owner_id, integration)
        return tool

    def update_tool(
        self, owner_id: str, integration_key: str, tool_name: str, patch: dict[str, Any]
    ) -> ToolSpec | None:
        integration = self.get_integration(owner_id, integration_key)
        if not integration or tool_name not in integration.tools:
            return None
        current = integration.tools[tool_name]
        if "accessMode" in patch and current.maxAccessMode:
            priority = {"disabled": 0, "approval_required": 1, "enabled": 2}
            requested = patch["accessMode"]
            if priority.get(requested, 0) > priority.get(current.maxAccessMode, 0):
                raise ValueError(
                    f"Tool '{tool_name}' cannot exceed the organization-managed '{current.maxAccessMode}' access level."
                )
        next_tool = current.model_copy(update=patch)
        if "accessMode" in patch:
            next_tool.enabled = patch["accessMode"] != "disabled"
        integration.tools[tool_name] = next_tool
        self.save_integration(owner_id, integration)
        return next_tool

    def create_agent_key_value(self) -> str:
        return f"cla_{token_urlsafe(24)}"

    def row_to_permission_profile(self, row: dict[str, Any]) -> PermissionProfile:
        return PermissionProfile(
            id=str(row["id"]),
            ownerId=str(row["owner_id"]),
            name=str(row["name"]) if row.get("name") is not None else None,
            snapshot=PermissionProfileSnapshot.model_validate(
                row.get("snapshot") or {}
            ),
            agentApiKey=str(row.get("api_key") or ""),
            createdAt=self.iso(row.get("created_at")) or now_iso(),
            updatedAt=self.iso(row.get("updated_at")) or now_iso(),
        )

    def ensure_permission_profile_api_key(
        self, owner_id: str, profile_id: str
    ) -> dict[str, Any]:
        if self.database_url:
            rows = self.db_rows(
                """
                INSERT INTO agent_api_keys (profile_id, owner_id, api_key, created_at, updated_at)
                VALUES (%s, %s, %s, NOW(), NOW())
                ON CONFLICT (profile_id) DO UPDATE SET owner_id = EXCLUDED.owner_id
                RETURNING *
                """,
                (profile_id, owner_id, self.create_agent_key_value()),
            )
            return rows[0]
        value = self.profile_agent_keys.get(profile_id)
        if value is None:
            value = self.create_agent_key_value()
            self.profile_agent_keys[profile_id] = value
        return {
            "profile_id": profile_id,
            "owner_id": owner_id,
            "api_key": value,
            "created_at": now_iso(),
            "updated_at": now_iso(),
        }

    def rotate_permission_profile_api_key(
        self, owner_id: str, profile_id: str, value: str | None = None
    ) -> dict[str, Any]:
        value = value or self.create_agent_key_value()
        if self.database_url:
            rows = self.db_rows(
                """
                INSERT INTO agent_api_keys (profile_id, owner_id, api_key, created_at, updated_at)
                VALUES (%s, %s, %s, NOW(), NOW())
                ON CONFLICT (profile_id) DO UPDATE SET
                    owner_id = EXCLUDED.owner_id,
                    api_key = EXCLUDED.api_key,
                    updated_at = NOW()
                RETURNING *
                """,
                (profile_id, owner_id, value),
            )
            return rows[0]
        updated_at = now_iso()
        self.profile_agent_keys[profile_id] = value
        profile = self.permission_profiles.get(owner_id, {}).get(profile_id)
        if profile is not None:
            self.permission_profiles[owner_id][profile_id] = profile.model_copy(
                update={"agentApiKey": value, "updatedAt": updated_at}
            )
        return {
            "profile_id": profile_id,
            "owner_id": owner_id,
            "api_key": value,
            "created_at": updated_at,
            "updated_at": updated_at,
        }

    def list_permission_profiles(self, owner_id: str) -> list[PermissionProfile]:
        if self.database_url:
            rows = self.db_rows(
                """
                SELECT p.*, k.api_key
                FROM permission_profiles p
                LEFT JOIN agent_api_keys k ON k.profile_id = p.id
                WHERE LOWER(p.owner_id) = LOWER(%s)
                ORDER BY p.name IS NOT NULL ASC, p.updated_at DESC, p.name ASC
                """,
                (owner_id,),
            )
            return [self.row_to_permission_profile(row) for row in rows]
        return list(self.permission_profiles.get(owner_id, {}).values())

    def get_permission_profile(
        self, owner_id: str, profile_id: str
    ) -> PermissionProfile | None:
        if self.database_url:
            rows = self.db_rows(
                """
                SELECT p.*, k.api_key
                FROM permission_profiles p
                LEFT JOIN agent_api_keys k ON k.profile_id = p.id
                WHERE LOWER(p.owner_id) = LOWER(%s) AND p.id = %s
                """,
                (owner_id, profile_id),
            )
            return self.row_to_permission_profile(rows[0]) if rows else None
        return self.permission_profiles.get(owner_id, {}).get(profile_id)

    def get_default_permission_profile(self, owner_id: str) -> PermissionProfile | None:
        if self.database_url:
            rows = self.db_rows(
                """
                SELECT p.*, k.api_key
                FROM permission_profiles p
                LEFT JOIN agent_api_keys k ON k.profile_id = p.id
                WHERE LOWER(p.owner_id) = LOWER(%s) AND p.name IS NULL
                LIMIT 1
                """,
                (owner_id,),
            )
            return self.row_to_permission_profile(rows[0]) if rows else None
        for profile in self.permission_profiles.get(owner_id, {}).values():
            if profile.name is None:
                return profile
        return None

    def get_or_create_default_permission_profile(
        self, owner_id: str
    ) -> PermissionProfile:
        profile = self.get_default_permission_profile(owner_id)
        if profile is not None:
            return profile
        return self.save_permission_profile(
            owner_id,
            PermissionProfile(
                ownerId=owner_id,
                name=None,
                snapshot=PermissionProfileSnapshot(),
            ),
        )

    def permission_profile_name_exists(
        self, owner_id: str, name: str, exclude_id: str | None = None
    ) -> bool:
        normalized_name = name.strip().casefold()
        for profile in self.list_permission_profiles(owner_id):
            if profile.name is None:
                continue
            if exclude_id and profile.id == exclude_id:
                continue
            if profile.name.strip().casefold() == normalized_name:
                return True
        return False

    def save_permission_profile(
        self, owner_id: str, profile: PermissionProfile
    ) -> PermissionProfile:
        if self.database_url:
            self.execute_db(
                """
                INSERT INTO permission_profiles (
                    id, owner_id, name, snapshot, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    owner_id = EXCLUDED.owner_id,
                    name = EXCLUDED.name,
                    snapshot = EXCLUDED.snapshot,
                    updated_at = NOW()
                """,
                (
                    profile.id,
                    owner_id,
                    profile.name,
                    Jsonb(profile.snapshot.model_dump()),
                    profile.createdAt,
                ),
            )
            self.ensure_permission_profile_api_key(owner_id, profile.id)
            saved = self.get_permission_profile(owner_id, profile.id)
            return saved or profile
        api_key = profile.agentApiKey or self.profile_agent_keys.get(profile.id)
        if not api_key:
            api_key = self.create_agent_key_value()
        self.profile_agent_keys[profile.id] = api_key
        profile = profile.model_copy(
            update={
                "ownerId": owner_id,
                "agentApiKey": api_key,
                "updatedAt": now_iso(),
            }
        )
        self.permission_profiles.setdefault(owner_id, {})[profile.id] = profile
        return profile

    def row_to_access_request(self, row: dict[str, Any]) -> AccessRequest:
        return AccessRequest(
            id=str(row["id"]),
            agentId=row.get("agent_id"),
            agentClass=row.get("agent_class"),
            integrationKey=str(row["integration_key"]),
            toolName=str(row["function_name"]),
            scopes=row.get("scopes") or [],
            requestedMinutes=int(row.get("requested_minutes") or 240),
            channels=row.get("channels") or [],
            notificationTargets=row.get("notification_targets") or {},
            justification=str(row.get("justification") or ""),
            agentData=row.get("agent_data") or {},
            createdAt=self.iso(row.get("created_at")) or now_iso(),
            status=row.get("status") or "pending",
            decidedAt=self.iso(row.get("decided_at")),
            decidedBy=row.get("decided_by"),
        )

    def list_access_requests(self, owner_id: str | None = None) -> list[AccessRequest]:
        if self.database_url:
            if owner_id:
                rows = self.db_rows(
                    """
                    SELECT * FROM access_requests
                    WHERE LOWER(COALESCE(notification_targets->>'in_app', '')) = LOWER(%s)
                    ORDER BY created_at DESC
                    """,
                    (owner_id,),
                )
                return [self.row_to_access_request(row) for row in rows]
            rows = self.db_rows(
                "SELECT * FROM access_requests ORDER BY created_at DESC"
            )
            return [self.row_to_access_request(row) for row in rows]
        requests = [
            request
            for requests in self.access_requests.values()
            for request in requests.values()
        ]
        if owner_id:
            return [
                request
                for request in requests
                if self.access_request_matches_owner(request, owner_id)
            ]
        return requests

    def find_matching_pending_access_request(
        self,
        owner_id: str,
        agent_id: str | None,
        agent_class: str | None,
        integration_key: str,
        tool_name: str,
        scopes: list[str],
    ) -> AccessRequest | None:
        if self.database_url:
            rows = self.db_rows(
                """
                SELECT * FROM access_requests
                WHERE status = 'pending'
                  AND LOWER(COALESCE(notification_targets->>'in_app', '')) = LOWER(%s)
                  AND COALESCE(agent_id, '') = COALESCE(%s, '')
                  AND COALESCE(agent_class, '') = COALESCE(%s, '')
                  AND integration_key = %s
                  AND function_name = %s
                ORDER BY created_at DESC
                """,
                (owner_id, agent_id, agent_class, integration_key, tool_name),
            )
            for row in rows:
                request = self.row_to_access_request(row)
                if self.same_scopes(request.scopes, scopes):
                    return request
            return None
        for request in self.access_requests.get(
            self.normalize_owner_id(owner_id), {}
        ).values():
            if request.status != "pending":
                continue
            if (
                request.agentId == agent_id
                and request.agentClass == agent_class
                and request.integrationKey == integration_key
                and request.toolName == tool_name
                and self.same_scopes(request.scopes, scopes)
            ):
                return request
        return None

    def save_access_request(
        self, owner_id: str, request: AccessRequest
    ) -> AccessRequest:
        request = self.owner_scoped_access_request(owner_id, request)
        if self.database_url:
            data = dict(request.agentData)
            self.execute_db(
                """
                INSERT INTO access_requests (
                    id, agent_id, agent_class, integration_key, function_name, scopes,
                    requested_minutes, channels, notification_targets, justification, agent_data,
                    created_at, status, decided_at, decided_by
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET
                    agent_id = EXCLUDED.agent_id,
                    agent_class = EXCLUDED.agent_class,
                    integration_key = EXCLUDED.integration_key,
                    function_name = EXCLUDED.function_name,
                    scopes = EXCLUDED.scopes,
                    requested_minutes = EXCLUDED.requested_minutes,
                    channels = EXCLUDED.channels,
                    notification_targets = EXCLUDED.notification_targets,
                    justification = EXCLUDED.justification,
                    agent_data = EXCLUDED.agent_data,
                    status = EXCLUDED.status,
                    decided_at = EXCLUDED.decided_at,
                    decided_by = EXCLUDED.decided_by
                """,
                (
                    request.id,
                    request.agentId,
                    request.agentClass,
                    request.integrationKey,
                    request.toolName,
                    Jsonb(request.scopes),
                    request.requestedMinutes,
                    Jsonb(request.channels),
                    Jsonb(request.notificationTargets),
                    request.justification,
                    Jsonb(data),
                    request.createdAt,
                    request.status,
                    request.decidedAt,
                    request.decidedBy,
                ),
            )
            request.agentData = data
            return request
        self.access_requests.setdefault(owner_id, {})[request.id] = request
        return request

    def decide_access_request(
        self, owner_id: str | None, request_id: str, status: str, reviewer: str
    ) -> AccessRequest | None:
        if self.database_url:
            decided_at = now_iso()
            rows = self.db_rows(
                """
                UPDATE access_requests
                SET status = %s, decided_at = %s, decided_by = %s
                WHERE id = %s
                  AND (
                    %s::text IS NULL
                    OR LOWER(COALESCE(notification_targets->>'in_app', '')) = LOWER(%s)
                  )
                RETURNING *
                """,
                (status, decided_at, reviewer, request_id, owner_id, owner_id),
            )
            return self.row_to_access_request(rows[0]) if rows else None
        for request in [
            request
            for requests in self.access_requests.values()
            for request in requests.values()
        ]:
            if request.id != request_id:
                continue
            if owner_id and not self.access_request_matches_owner(request, owner_id):
                continue
            request.status = status  # type: ignore[assignment]
            request.decidedAt = now_iso()
            request.decidedBy = reviewer
            return request
        return None

    def row_to_managed_connector(self, row: dict[str, Any]) -> ManagedConnector:
        return ManagedConnector(
            slug=str(row["slug"]),
            name=str(row["name"]),
            description=str(row["description"]),
            logoUrl=row.get("logo_url"),
            iconBg=row.get("icon_bg"),
            iconColor=row.get("icon_color"),
            appUrl=row.get("app_url"),
            docsUrl=row.get("docs_url"),
            categories=row.get("categories") or [],
            authModes=row.get("auth_modes") or [],
            authStrategy=row["auth_strategy"],
            provider=row.get("provider") or "mcp",
            oauthConfigured=bool(row.get("encrypted_oauth_client")),
            credentialLabel=str(row["credential_label"]),
            credentialPlaceholder=str(row["credential_placeholder"]),
            credentialHelp=str(row["credential_help"]),
            apiBaseUrl=row.get("api_base_url") or None,
            serverUrl=row.get("server_url"),
            openApiUrl=row.get("open_api_url"),
            oauthConfig=row.get("oauth_config"),
            tools=row.get("functions") or [],
            enabled=bool(row["enabled"]),
            createdAt=row["created_at"].isoformat()
            if hasattr(row.get("created_at"), "isoformat")
            else str(row.get("created_at")),
            updatedAt=row["updated_at"].isoformat()
            if hasattr(row.get("updated_at"), "isoformat")
            else str(row.get("updated_at")),
        )

    def list_managed_connectors(self) -> list[ManagedConnector]:
        if self.database_url:
            rows = self.db_rows("SELECT * FROM managed_connectors ORDER BY slug ASC")
            return [self.row_to_managed_connector(row) for row in rows]
        return list(self.managed_connectors.values())

    def save_managed_connector(self, connector: ManagedConnector) -> ManagedConnector:
        connector.updatedAt = now_iso()
        if connector.authStrategy == "oauth2":
            connector.oauthConfigured = bool(connector.oauthClientId)
        else:
            connector.oauthConfigured = connector.authStrategy != "oauth2"
        if not connector.authModes:
            connector.authModes = [connector.authStrategy]
        if self.database_url:
            self.execute_db(
                """
                INSERT INTO managed_connectors (
                    slug, name, description, logo_url, icon_bg, icon_color, app_url, docs_url, categories,
                    auth_modes, auth_strategy, provider, credential_label, credential_placeholder,
                    credential_help, api_base_url, server_url, open_api_url, oauth_config,
                    encrypted_oauth_client, functions, enabled, created_at, updated_at
                ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (slug) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    logo_url = EXCLUDED.logo_url,
                    icon_bg = EXCLUDED.icon_bg,
                    icon_color = EXCLUDED.icon_color,
                    app_url = EXCLUDED.app_url,
                    docs_url = EXCLUDED.docs_url,
                    categories = EXCLUDED.categories,
                    auth_modes = EXCLUDED.auth_modes,
                    auth_strategy = EXCLUDED.auth_strategy,
                    provider = EXCLUDED.provider,
                    credential_label = EXCLUDED.credential_label,
                    credential_placeholder = EXCLUDED.credential_placeholder,
                    credential_help = EXCLUDED.credential_help,
                    api_base_url = EXCLUDED.api_base_url,
                    server_url = EXCLUDED.server_url,
                    open_api_url = EXCLUDED.open_api_url,
                    oauth_config = EXCLUDED.oauth_config,
                    encrypted_oauth_client = EXCLUDED.encrypted_oauth_client,
                    functions = EXCLUDED.functions,
                    enabled = EXCLUDED.enabled,
                    updated_at = NOW()
                """,
                (
                    connector.slug,
                    connector.name,
                    connector.description,
                    connector.logoUrl,
                    connector.iconBg,
                    connector.iconColor,
                    connector.appUrl,
                    connector.docsUrl,
                    Jsonb(connector.categories),
                    Jsonb(connector.authModes),
                    connector.authStrategy,
                    connector.provider,
                    connector.credentialLabel,
                    connector.credentialPlaceholder,
                    connector.credentialHelp,
                    connector.apiBaseUrl or "",
                    connector.serverUrl,
                    connector.openApiUrl,
                    Jsonb(connector.oauthConfig) if connector.oauthConfig else None,
                    encrypt_credentials(
                        {
                            "clientId": connector.oauthClientId,
                            **(
                                {"clientSecret": connector.oauthClientSecret}
                                if connector.oauthClientSecret
                                else {}
                            ),
                        }
                    )
                    if connector.oauthClientId
                    else ("configured" if connector.oauthConfigured else None),
                    Jsonb([tool.model_dump() for tool in connector.tools]),
                    connector.enabled,
                ),
            )
            return connector
        self.managed_connectors[connector.slug] = connector
        return connector

    def delete_managed_connector(self, slug: str) -> bool:
        if self.database_url:
            rows = self.db_rows(
                "DELETE FROM managed_connectors WHERE slug = %s RETURNING slug", (slug,)
            )
            return bool(rows)
        return self.managed_connectors.pop(slug, None) is not None

    def get_managed_connector(self, slug: str) -> ManagedConnector | None:
        if self.database_url:
            rows = self.db_rows(
                "SELECT * FROM managed_connectors WHERE slug = %s", (slug,)
            )
            return self.row_to_managed_connector(rows[0]) if rows else None
        return self.managed_connectors.get(slug)

    def list_connections(
        self, owner_id: str | None = None, filters: dict[str, Any] | None = None
    ) -> list[dict[str, Any]]:
        if self.database_url:
            filters = filters or {}
            owner_filter = owner_id or filters.get("ownerId")
            provider = filters.get("provider")
            integration_key = filters.get("integrationKey")
            limit = int(filters.get("limit") or 100)
            offset = int(filters.get("offset") or 0)
            rows = self.db_rows(
                """
                SELECT * FROM integration_connections
                WHERE (%s::text IS NULL OR LOWER(owner_id) = LOWER(%s))
                  AND (%s::text IS NULL OR LOWER(provider) = LOWER(%s))
                  AND (%s::text IS NULL OR LOWER(integration_key) = LOWER(%s))
                ORDER BY provider ASC, external_account_id ASC NULLS LAST, owner_id ASC, integration_key ASC
                LIMIT %s OFFSET %s
                """,
                (
                    owner_filter,
                    owner_filter,
                    provider,
                    provider,
                    integration_key,
                    integration_key,
                    limit,
                    offset,
                ),
            )
        else:
            rows = []
            for (saved_owner, _), record in self.connections.items():
                if owner_id and saved_owner.lower() != owner_id.lower():
                    continue
                if (
                    filters
                    and filters.get("ownerId")
                    and saved_owner.lower() != str(filters.get("ownerId")).lower()
                ):
                    continue
                if (
                    filters
                    and filters.get("provider")
                    and str(record.get("provider", "")).lower()
                    != str(filters.get("provider")).lower()
                ):
                    continue
                if (
                    filters
                    and filters.get("integrationKey")
                    and record.get("integrationKey") != filters.get("integrationKey")
                ):
                    continue
                rows.append(
                    {
                        "owner_id": saved_owner,
                        "integration_key": record.get("integrationKey"),
                        "provider": record.get("provider"),
                        "auth_strategy": record.get("authStrategy"),
                        "token_type": record.get("tokenType"),
                        "scopes": record.get("scopes") or [],
                        "expires_at": record.get("expiresAt"),
                        "external_account_id": record.get("externalAccountId"),
                        "external_workspace_id": record.get("externalWorkspaceId"),
                        "display_name": record.get("displayName"),
                        "metadata": record.get("metadata") or {},
                        "created_at": record.get("createdAt"),
                        "updated_at": record.get("updatedAt"),
                    }
                )
        query = (filters or {}).get("q") or ""
        result = []
        for row in rows:
            item = {
                "ownerId": row.get("owner_id"),
                "integrationKey": row.get("integration_key"),
                "provider": row.get("provider"),
                "authStrategy": row.get("auth_strategy"),
                "tokenType": row.get("token_type"),
                "scopes": row.get("scopes") or [],
                "expiresAt": self.iso(row.get("expires_at")),
                "externalAccountId": row.get("external_account_id"),
                "externalWorkspaceId": row.get("external_workspace_id"),
                "displayName": row.get("display_name"),
                "metadata": row.get("metadata") or {},
                "createdAt": self.iso(row.get("created_at")) or now_iso(),
                "updatedAt": self.iso(row.get("updated_at")) or now_iso(),
            }
            if (
                query
                and query.lower()
                not in " ".join(str(v or "") for v in item.values()).lower()
            ):
                continue
            if owner_id:
                item.pop("ownerId", None)
            if filters and filters.get("admin"):
                item.pop("metadata", None)
            result.append(item)
        return result

    def list_notifications(self) -> list[dict[str, Any]]:
        if self.database_url:
            rows = self.db_rows("SELECT * FROM notifications ORDER BY created_at DESC")
            return [
                {
                    "id": str(row["id"]),
                    "channel": row["channel"],
                    "recipient": row["recipient"],
                    "subject": row["subject"],
                    "body": row["body"],
                    "metadata": row.get("metadata") or {},
                    "createdAt": self.iso(row.get("created_at")) or now_iso(),
                }
                for row in rows
            ]
        return []

    def read_oauth_client(self, connector: ManagedConnector) -> dict[str, str] | None:
        if connector.oauthClientId:
            result = {"clientId": connector.oauthClientId}
            if connector.oauthClientSecret:
                result["clientSecret"] = connector.oauthClientSecret
            return result
        if not self.database_url:
            return None
        rows = self.db_rows(
            "SELECT encrypted_oauth_client FROM managed_connectors WHERE slug = %s",
            (connector.slug,),
        )
        encrypted = rows[0].get("encrypted_oauth_client") if rows else None
        if not encrypted or encrypted == "configured":
            return None
        data = decrypt_credentials(encrypted)
        client_id = str(data.get("clientId") or "").strip()
        if not client_id:
            return None
        result = {"clientId": client_id}
        client_secret = str(data.get("clientSecret") or "").strip()
        if client_secret:
            result["clientSecret"] = client_secret
        return result

    def save_oauth_state(
        self,
        state: str,
        owner_id: str,
        integration_key: str,
        provider: str,
        code_verifier: str | None,
        redirect_to: str,
        redirect_uri: str,
        callback_url: str | None,
        expires_at: str,
    ) -> None:
        if self.database_url:
            self.execute_db(
                """INSERT INTO oauth_states (state, owner_id, integration_key, provider, code_verifier, redirect_to, redirect_uri, callback_url, created_at, expires_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s)
                ON CONFLICT (state) DO UPDATE SET owner_id = EXCLUDED.owner_id, integration_key = EXCLUDED.integration_key, provider = EXCLUDED.provider, code_verifier = EXCLUDED.code_verifier, redirect_to = EXCLUDED.redirect_to, redirect_uri = EXCLUDED.redirect_uri, callback_url = EXCLUDED.callback_url, expires_at = EXCLUDED.expires_at""",
                (
                    state,
                    owner_id,
                    integration_key,
                    provider,
                    code_verifier,
                    redirect_to,
                    redirect_uri,
                    callback_url,
                    expires_at,
                ),
            )
        else:
            self.oauth_states[state] = {
                "state": state,
                "owner_id": owner_id,
                "integration_key": integration_key,
                "provider": provider,
                "code_verifier": code_verifier,
                "redirect_to": redirect_to,
                "redirect_uri": redirect_uri,
                "callback_url": callback_url,
                "expires_at": expires_at,
            }

    def consume_oauth_state(self, state: str, provider: str) -> dict[str, Any] | None:
        if self.database_url:
            rows = self.db_rows(
                "DELETE FROM oauth_states WHERE state = %s AND provider = %s AND expires_at > NOW() RETURNING *",
                (state, provider),
            )
            return rows[0] if rows else None
        row = self.oauth_states.pop(state, None)
        return row if row and row.get("provider") == provider else None

    def record_tool_invocation(
        self,
        owner_id: str,
        integration: IntegrationSpec,
        tool: ToolSpec,
        scopes: list[str],
        payload: dict[str, Any],
        outcome: str,
        error_message: str | None = None,
        agent_id: str | None = None,
        agent_class: str | None = None,
    ) -> None:
        invoked_at = now_iso()
        if not self.database_url:
            self.tool_invocations.append(
                {
                    "id": token_urlsafe(18),
                    "ownerId": owner_id,
                    "agentId": agent_id,
                    "agentClass": agent_class,
                    "integrationKey": integration.key,
                    "toolName": tool.name,
                    "scopes": scopes,
                    "provider": integration.provider,
                    "kind": integration.kind,
                    "authStrategy": integration.authStrategy,
                    "outcome": outcome,
                    "invokedAt": invoked_at,
                    "payloadKeys": list(payload.keys()),
                    "errorMessage": error_message,
                }
            )
            return
        self.execute_db(
            """INSERT INTO tool_invocations (id, owner_id, agent_id, agent_class, integration_key, function_name, scopes, provider, kind, auth_strategy, outcome, invoked_at, duration_ms, payload_keys, error_message)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), %s, %s, %s)""",
            (
                token_urlsafe(18),
                owner_id,
                agent_id,
                agent_class,
                integration.key,
                tool.name,
                Jsonb(scopes),
                integration.provider,
                integration.kind,
                integration.authStrategy,
                outcome,
                None,
                Jsonb(list(payload.keys())),
                error_message,
            ),
        )

    def save_connection(
        self,
        owner_id: str,
        integration_key: str,
        provider: str,
        auth_strategy: str,
        credentials: dict[str, Any],
        metadata: dict[str, Any],
    ) -> dict[str, Any]:
        encrypted = encrypt_credentials(credentials)
        if self.database_url:
            self.execute_db(
                """INSERT INTO integration_connections (owner_id, integration_key, provider, auth_strategy, encrypted_credentials, token_type, scopes, expires_at, external_account_id, external_workspace_id, display_name, metadata, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                ON CONFLICT (owner_id, integration_key) DO UPDATE SET provider = EXCLUDED.provider, auth_strategy = EXCLUDED.auth_strategy, encrypted_credentials = EXCLUDED.encrypted_credentials, token_type = EXCLUDED.token_type, scopes = EXCLUDED.scopes, expires_at = EXCLUDED.expires_at, external_account_id = EXCLUDED.external_account_id, external_workspace_id = EXCLUDED.external_workspace_id, display_name = EXCLUDED.display_name, metadata = EXCLUDED.metadata, updated_at = NOW()""",
                (
                    owner_id,
                    integration_key,
                    provider,
                    auth_strategy,
                    encrypted,
                    metadata.get("tokenType"),
                    Jsonb(metadata.get("scopes") or []),
                    metadata.get("expiresAt"),
                    metadata.get("externalAccountId"),
                    metadata.get("externalWorkspaceId"),
                    metadata.get("displayName"),
                    Jsonb(metadata.get("metadata") or {}),
                ),
            )
        record = {
            "integrationKey": integration_key,
            "provider": provider,
            "authStrategy": auth_strategy,
            "tokenType": metadata.get("tokenType"),
            "scopes": metadata.get("scopes") or [],
            "expiresAt": metadata.get("expiresAt"),
            "externalAccountId": metadata.get("externalAccountId"),
            "externalWorkspaceId": metadata.get("externalWorkspaceId"),
            "displayName": metadata.get("displayName"),
            "metadata": metadata.get("metadata") or {},
            "createdAt": now_iso(),
            "updatedAt": now_iso(),
        }
        self.connections[(owner_id, integration_key)] = {
            **record,
            "credentials": credentials,
        }
        return record

    def get_connection(
        self, owner_id: str, integration_key: str
    ) -> dict[str, Any] | None:
        if self.database_url:
            rows = self.db_rows(
                "SELECT * FROM integration_connections WHERE LOWER(owner_id) = LOWER(%s) AND integration_key = %s",
                (owner_id, integration_key),
            )
            if not rows:
                return None
            row = rows[0]
            return {
                "ownerId": row.get("owner_id"),
                "integrationKey": row.get("integration_key"),
                "provider": row.get("provider"),
                "authStrategy": row.get("auth_strategy"),
                "credentials": decrypt_credentials(row["encrypted_credentials"]),
                "tokenType": row.get("token_type"),
                "scopes": row.get("scopes") or [],
                "expiresAt": self.iso(row.get("expires_at")),
                "externalAccountId": row.get("external_account_id"),
                "externalWorkspaceId": row.get("external_workspace_id"),
                "displayName": row.get("display_name"),
                "metadata": row.get("metadata") or {},
                "createdAt": self.iso(row.get("created_at")) or now_iso(),
                "updatedAt": self.iso(row.get("updated_at")) or now_iso(),
            }
        record = self.connections.get(
            (owner_id, integration_key)
        ) or self.connections.get((owner_id.lower(), integration_key))
        if not record:
            return None
        return {"ownerId": owner_id, **record}

    def get_connection_credentials(
        self, owner_id: str, integration_key: str
    ) -> dict[str, Any] | None:
        record = self.get_connection(owner_id, integration_key)
        return record.get("credentials") if record else None

    def has_agent_api_keys(self) -> bool:
        if self.database_url:
            return bool(self.db_rows("SELECT owner_id FROM agent_api_keys LIMIT 1"))
        return bool(self.profile_agent_keys or self.agent_keys)

    def find_agent_api_key(self, api_key: str) -> dict[str, Any] | None:
        value = api_key.strip()
        if not value:
            return None
        if self.database_url:
            rows = self.db_rows(
                """
                SELECT k.*, p.id AS permission_profile_id, p.name AS permission_profile_name
                FROM agent_api_keys k
                JOIN permission_profiles p ON p.id = k.profile_id
                WHERE k.api_key = %s
                """,
                (value,),
            )
            if not rows:
                return None
            row = rows[0]
            return {
                "ownerId": row["owner_id"],
                "apiKey": row["api_key"],
                "permissionProfileId": row.get("permission_profile_id"),
                "permissionProfileName": row.get("permission_profile_name"),
                "createdAt": self.iso(row.get("created_at")),
                "updatedAt": self.iso(row.get("updated_at")),
            }
        for owner_id, profiles in self.permission_profiles.items():
            for profile_id in profiles:
                if self.profile_agent_keys.get(profile_id) == value:
                    profile = profiles[profile_id]
                    return {
                        "ownerId": owner_id,
                        "apiKey": value,
                        "permissionProfileId": profile_id,
                        "permissionProfileName": profile.name,
                        "createdAt": profile.createdAt,
                        "updatedAt": profile.updatedAt,
                    }
        for owner_id, stored in self.agent_keys.items():
            if stored == value:
                profile = self.get_default_permission_profile(owner_id)
                return {
                    "ownerId": owner_id,
                    "apiKey": stored,
                    "permissionProfileId": profile.id if profile else None,
                    "permissionProfileName": None,
                    "createdAt": now_iso(),
                    "updatedAt": now_iso(),
                }
        return None

    def find_scoped_api_key(self, kind: str, api_key: str) -> dict[str, Any] | None:
        value = api_key.strip()
        if not value:
            return None
        if not self.database_url:
            bucket = {"user": self.user_keys, "admin": self.admin_keys}[kind]
            for owner_id, stored in bucket.items():
                if stored == value:
                    return {
                        "ownerId": owner_id,
                        "apiKey": stored,
                        "createdAt": now_iso(),
                        "updatedAt": now_iso(),
                    }
            return None
        table = "user_api_keys" if kind == "user" else "admin_api_keys"
        rows = self.db_rows(
            f"SELECT * FROM {table} WHERE api_key_hash = %s", (self.hash_key(value),)
        )
        if not rows:
            return None
        row = rows[0]
        return {
            "ownerId": row["owner_id"],
            "apiKey": value,
            "createdAt": self.iso(row.get("created_at")),
            "updatedAt": self.iso(row.get("updated_at")),
        }

    def get_key(self, owner_id: str, kind: str) -> dict[str, Any]:
        if kind == "agent":
            profile = self.get_or_create_default_permission_profile(owner_id)
            if profile.agentApiKey:
                key = {
                    "api_key": profile.agentApiKey,
                    "created_at": profile.createdAt,
                    "updated_at": profile.updatedAt,
                }
            else:
                key = self.rotate_permission_profile_api_key(owner_id, profile.id)
            value = str(key["api_key"])
            self.agent_keys[owner_id] = value
            return {
                "apiKey": value,
                "key": self.key_status(
                    value, key.get("created_at"), key.get("updated_at")
                ),
                "hasKey": True,
                "permissionProfileId": profile.id,
            }
        if not self.database_url:
            bucket = {"user": self.user_keys, "admin": self.admin_keys}[kind]
            value = bucket.get(owner_id)
            return {
                "apiKey": value,
                "key": self.key_status(value),
                "hasKey": value is not None,
            }
        table = "user_api_keys" if kind == "user" else "admin_api_keys"
        rows = self.db_rows(f"SELECT * FROM {table} WHERE owner_id = %s", (owner_id,))
        if not rows:
            return {"apiKey": None, "key": None, "hasKey": False}
        row = rows[0]
        value = self.decrypt_api_key_value(row.get("encrypted_api_key"))
        return {
            "apiKey": value,
            "key": self.stored_key_status(
                row.get("key_prefix"),
                row.get("key_suffix"),
                row.get("created_at"),
                row.get("updated_at"),
            ),
            "hasKey": True,
        }

    def save_key(self, owner_id: str, kind: str, value: str) -> dict[str, Any]:
        if kind == "agent":
            profile = self.get_or_create_default_permission_profile(owner_id)
            key = self.rotate_permission_profile_api_key(owner_id, profile.id, value)
            self.agent_keys[owner_id] = value
            return {
                "apiKey": value,
                "key": self.key_status(
                    value, key.get("created_at"), key.get("updated_at")
                ),
                "permissionProfileId": profile.id,
            }
        if not self.database_url:
            bucket = {"user": self.user_keys, "admin": self.admin_keys}[kind]
            bucket[owner_id] = value
            return {"apiKey": value, "key": self.key_status(value)}
        table = "user_api_keys" if kind == "user" else "admin_api_keys"
        self.execute_db(
            f"""INSERT INTO {table} (owner_id, api_key_hash, key_prefix, key_suffix, encrypted_api_key, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, NOW(), NOW())
            ON CONFLICT (owner_id) DO UPDATE SET api_key_hash = EXCLUDED.api_key_hash, key_prefix = EXCLUDED.key_prefix,
            key_suffix = EXCLUDED.key_suffix, encrypted_api_key = EXCLUDED.encrypted_api_key, updated_at = NOW()""",
            (
                owner_id,
                self.hash_key(value),
                value[:12],
                value[-4:],
                encrypt_api_key(value),
            ),
        )
        return {"apiKey": value, "key": self.key_status(value)}

    def delete_key(self, owner_id: str, kind: str) -> bool:
        if kind == "agent":
            profile = self.get_default_permission_profile(owner_id)
            if profile is None:
                return False
            self.agent_keys.pop(owner_id, None)
            self.profile_agent_keys.pop(profile.id, None)
            profiles = self.permission_profiles.get(owner_id, {})
            if profile.id in profiles:
                profiles[profile.id] = profile.model_copy(update={"agentApiKey": ""})
            if self.database_url:
                rows = self.db_rows(
                    "DELETE FROM agent_api_keys WHERE profile_id = %s RETURNING owner_id",
                    (profile.id,),
                )
                return bool(rows)
            return True
        if not self.database_url:
            bucket = {"user": self.user_keys, "admin": self.admin_keys}[kind]
            return bucket.pop(owner_id, None) is not None
        table = "user_api_keys" if kind == "user" else "admin_api_keys"
        rows = self.db_rows(
            f"DELETE FROM {table} WHERE owner_id = %s RETURNING owner_id", (owner_id,)
        )
        return bool(rows)

    def list_temporary_grants(
        self, owner_id: str | None = None
    ) -> list[dict[str, Any]]:

        if self.database_url:
            if owner_id:
                rows = self.db_rows(
                    """SELECT * FROM temporary_grants
                    WHERE LOWER(owner_id) = LOWER(%s)
                    ORDER BY created_at DESC""",
                    (owner_id,),
                )
            else:
                rows = self.db_rows(
                    "SELECT * FROM temporary_grants ORDER BY created_at DESC"
                )
            return [
                {
                    "id": str(row["id"]),
                    "ownerId": str(row.get("owner_id") or ""),
                    "agentId": row.get("agent_id"),
                    "agentClass": row.get("agent_class"),
                    "integrationKey": str(row["integration_key"]),
                    "toolName": str(row["function_name"]),
                    "scopes": row.get("scopes") or [],
                    "grantedBy": str(row["granted_by"]),
                    "createdAt": self.iso(row.get("created_at")) or now_iso(),
                    "expiresAt": self.iso(row.get("expires_at")) or now_iso(),
                }
                for row in rows
            ]
        grants = list(self.temporary_grants.values())
        if owner_id:
            return [
                grant
                for grant in grants
                if str(grant.get("ownerId") or "").lower() == owner_id.lower()
            ]
        return grants

    def save_temporary_grant(self, grant: dict[str, Any]) -> dict[str, Any]:
        if self.database_url:
            self.execute_db(
                """INSERT INTO temporary_grants (id, owner_id, agent_id, agent_class, integration_key, function_name, scopes, granted_by, created_at, expires_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                ON CONFLICT (id) DO UPDATE SET owner_id = EXCLUDED.owner_id, agent_id = EXCLUDED.agent_id, agent_class = EXCLUDED.agent_class, integration_key = EXCLUDED.integration_key, function_name = EXCLUDED.function_name, scopes = EXCLUDED.scopes, granted_by = EXCLUDED.granted_by, created_at = EXCLUDED.created_at, expires_at = EXCLUDED.expires_at""",
                (
                    grant["id"],
                    grant["ownerId"],
                    grant.get("agentId"),
                    grant.get("agentClass"),
                    grant["integrationKey"],
                    grant["toolName"],
                    Jsonb(grant.get("scopes") or []),
                    grant["grantedBy"],
                    grant["createdAt"],
                    grant["expiresAt"],
                ),
            )
        else:
            self.temporary_grants[grant["id"]] = grant
        return grant

    def list_owner_tool_usage_summaries(self, owner_id: str) -> list[dict[str, Any]]:
        if self.database_url:
            rows = self.db_rows(
                """SELECT integration_key, function_name, MAX(invoked_at) AS last_invoked_at,
                (ARRAY_AGG(outcome ORDER BY invoked_at DESC))[1] AS last_outcome, COUNT(*) AS invocation_count
                FROM tool_invocations WHERE LOWER(owner_id) = LOWER(%s)
                GROUP BY integration_key, function_name""",
                (owner_id,),
            )
            return [
                {
                    "integrationKey": str(row["integration_key"]),
                    "toolName": str(row["function_name"]),
                    "lastInvokedAt": self.iso(row.get("last_invoked_at")) or now_iso(),
                    "lastInvocationOutcome": row.get("last_outcome"),
                    "invocationCount": int(row.get("invocation_count") or 0),
                }
                for row in rows
            ]
        summaries: dict[tuple[str, str], dict[str, Any]] = {}
        for record in self.tool_invocations:
            if str(record.get("ownerId", "")).lower() != owner_id.lower():
                continue
            key = (str(record.get("integrationKey")), str(record.get("toolName")))
            current = summaries.get(key)
            if not current or str(record.get("invokedAt")) > str(
                current.get("lastInvokedAt")
            ):
                summaries[key] = {
                    "integrationKey": key[0],
                    "toolName": key[1],
                    "lastInvokedAt": str(record.get("invokedAt")),
                    "lastInvocationOutcome": record.get("outcome"),
                    "invocationCount": 0,
                }
            summaries[key]["invocationCount"] = (
                int(summaries[key].get("invocationCount") or 0) + 1
            )
        return list(summaries.values())

    def purge_expired_grants(self) -> int:
        if self.database_url:
            rows = self.db_rows(
                "DELETE FROM temporary_grants WHERE expires_at <= NOW() RETURNING id"
            )
            return len(rows)
        return 0

    def overview(self) -> dict[str, Any]:
        connections = self.list_connections(
            filters={"admin": True, "limit": 1000, "offset": 0}
        )
        access_requests = self.list_access_requests(None)
        notifications = self.list_notifications()
        users: dict[str, dict[str, Any]] = {}
        for connection in connections:
            owner = connection.get("ownerId") or "unknown"
            summary = users.setdefault(
                owner,
                {
                    "ownerId": owner,
                    "totalConnections": 0,
                    "integrations": set(),
                    "providers": set(),
                    "totalAccessRequests": 0,
                    "pendingAccessRequests": 0,
                    "notifications": 0,
                    "duplicateExternalAccounts": [],
                    "connections": [],
                },
            )
            summary["totalConnections"] += 1
            summary["integrations"].add(connection.get("integrationKey"))
            summary["providers"].add(connection.get("provider"))
            summary["connections"].append(connection)
        for request in access_requests:
            owner = self.access_request_owner_id(request)
            if not owner or owner == "case-by-case-approvals":
                continue
            summary = users.setdefault(
                owner,
                {
                    "ownerId": owner,
                    "totalConnections": 0,
                    "integrations": set(),
                    "providers": set(),
                    "totalAccessRequests": 0,
                    "pendingAccessRequests": 0,
                    "notifications": 0,
                    "duplicateExternalAccounts": [],
                    "connections": [],
                },
            )
            summary["totalAccessRequests"] += 1
            if request.status == "pending":
                summary["pendingAccessRequests"] += 1
        duplicate_groups: dict[tuple[str, str], list[dict[str, Any]]] = {}
        for connection in connections:
            external_id = str(connection.get("externalAccountId") or "").strip().lower()
            provider = str(connection.get("provider") or "").strip().lower()
            if not external_id or not provider:
                continue
            duplicate_groups.setdefault((provider, external_id), []).append(connection)
        duplicates = [
            {
                "provider": provider,
                "externalAccountId": external_id,
                "connections": group,
                "owners": sorted(
                    {
                        str(item.get("ownerId") or "")
                        for item in group
                        if item.get("ownerId")
                    }
                ),
            }
            for (provider, external_id), group in duplicate_groups.items()
            if len(
                {(item.get("ownerId"), item.get("integrationKey")) for item in group}
            )
            > 1
        ]
        user_list = []
        for summary in users.values():
            summary["integrations"] = sorted(x for x in summary["integrations"] if x)
            summary["providers"] = sorted(x for x in summary["providers"] if x)
            summary["duplicateExternalAccounts"] = [
                dup for dup in duplicates if summary["ownerId"] in dup["owners"]
            ]
            user_list.append(summary)
        return {
            "totalConnections": len(connections),
            "connectedOwners": len(users),
            "managedConnectors": len(self.list_managed_connectors()),
            "totalAccessRequests": len(access_requests),
            "pendingAccessRequests": sum(
                1 for r in access_requests if r.status == "pending"
            ),
            "notifications": len(notifications),
            "duplicateExternalAccounts": duplicates,
            "users": user_list,
        }

    def rotate_key(self, bucket: dict[str, str], owner_id: str, prefix: str) -> str:
        value = f"{prefix}_{token_urlsafe(24)}"
        bucket[owner_id] = value
        return value


repository = Repository()
