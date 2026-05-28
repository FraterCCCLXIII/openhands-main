from __future__ import annotations

import base64
import json
import re
import secrets
import urllib.error
import urllib.parse
import urllib.request
from collections.abc import Callable
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import (
    JSONResponse,
    PlainTextResponse,
    RedirectResponse,
    Response,
    StreamingResponse,
)
from pydantic import ValidationError

from .auth import DEFAULT_OWNER, is_admin_owner
from .config import INTERNAL_AUTH_HEADER, get_default_config
from .managed_connectors import (
    get_managed_connector,
    integration_catalog_snapshot,
    list_managed_connectors,
)
from .models import (
    AccessRequest,
    ContextInvocationRequest,
    IntegrationSpec,
    ManagedConnector,
    ManagedConnectorTool,
    ToolSpec,
    now_iso,
)
from .oauth_flow import (
    credentials_for,
    ensure_managed_oauth_client,
    exchange_oauth_code,
    start_oauth_redirect,
)
from .openapi_tools import generate_openapi_tools
from .repository import repository
from .route_manifest import ROUTES
from .static_files import mount_static_files


app = FastAPI(
    title="OpenHands Integrations Hub Python Backend",
    version="0.1.0",
    description="FastAPI backend with route correspondence to the Next.js integrations hub API.",
)


@app.exception_handler(ValidationError)
async def validation_error_handler(_request: Request, exc: ValidationError):
    return JSONResponse(status_code=422, content={"detail": exc.errors()})


DEPRECATED_ADMIN_INTEGRATIONS_MESSAGE = "Admin API keys can no longer manage self-scoped integrations. Use the user API key with /api/user/integrations instead."
RAW_CONNECTOR_INSTALL_FORBIDDEN_DETAIL = "Only app administrators can install integrations from arbitrary connector URLs. Use a managed connector instead."
RAW_CONNECTOR_DISCOVERY_FORBIDDEN_DETAIL = "Only app administrators can discover tools from arbitrary MCP server URLs. Ask an administrator to register a managed connector instead."
ADMIN_CONNECTOR_MANAGEMENT_DETAIL = (
    "Only app administrators can manage service-level connectors."
)
ADMIN_NOTIFICATIONS_DETAIL = "Only app administrators can view notifications."
ADMIN_KEY_MANAGEMENT_DETAIL = "Only app administrators can manage admin API keys."

DEPRECATED_ADMIN_CONNECTIONS_MESSAGE = "Admin API keys can no longer read self-scoped OAuth connections. Use the user API key with /api/user/connections instead."


def admin_connection_filters(request: Request) -> dict[str, Any]:
    params = request.query_params
    return {
        "ownerId": params.get("ownerId"),
        "provider": params.get("provider"),
        "integrationKey": params.get("integrationKey"),
        "q": params.get("q"),
        "limit": int(params.get("limit") or 100),
        "offset": int(params.get("offset") or 0),
        "admin": True,
    }


def base_url(request: Request) -> str:
    return f"{request.url.scheme}://{request.url.netloc}"


def context_openapi(owner: str, request: Request) -> dict[str, Any]:
    connection_keys = {
        item["integrationKey"] for item in repository.list_connections(owner)
    }
    paths: dict[str, Any] = {}
    for integration in repository.list_integrations(owner):
        if not integration.enabled or (
            integration.authStrategy == "oauth2"
            and integration.key not in connection_keys
        ):
            continue
        for tool in integration.tools.values():
            if not tool.enabled or tool.accessMode == "disabled":
                continue
            paths[f"/api/context/{integration.key}/{tool.name}"] = {
                "post": {
                    "summary": tool.description or tool.name,
                    "description": "Invocation identity is optional; agentId and agentClass default to null when omitted. Enabled tools are callable by default unless you configure an agent-class policy to narrow access.",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "examples": {
                                    "default": {
                                        "value": {
                                            "scopes": tool.defaultScopes,
                                            "payload": {},
                                        }
                                    }
                                }
                            }
                        },
                    },
                    "responses": {"200": {"description": "Tool invocation result"}},
                    "security": [{"ContextApiKey": []}],
                }
            }
    return {
        "openapi": "3.0.3",
        "info": {"title": "OpenHands Integrations Hub Context API", "version": "0.1.0"},
        "servers": [{"url": base_url(request)}],
        "paths": paths,
        "components": {
            "securitySchemes": {"ContextApiKey": {"type": "http", "scheme": "bearer"}},
            "schemas": {
                "ContextInvokeRequest": {"type": "object"},
                "ContextInvocationResult": {"type": "object"},
                "ErrorResponse": {"type": "object"},
            },
        },
    }


def user_openapi(request: Request, is_admin: bool) -> dict[str, Any]:
    json_content = {"application/json": {"schema": {"type": "object"}}}
    paths = {
        "/api/user/integrations": {
            "get": {
                "summary": "List owner integrations",
                "responses": {
                    "200": {
                        "description": "Owner integrations",
                        "content": json_content,
                    }
                },
            },
            "post": {
                "summary": "Install an owner integration",
                "requestBody": {"required": True, "content": json_content},
                "responses": {
                    "200": {"description": "Saved integration", "content": json_content}
                },
            },
        },
        "/api/user/integrations/{integrationKey}": {
            "delete": {
                "summary": "Delete an owner integration",
                "parameters": [
                    {
                        "name": "integrationKey",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                    }
                ],
                "responses": {
                    "200": {"description": "Delete result", "content": json_content}
                },
            }
        },
        "/api/user/integrations/{integrationKey}/tools/{toolName}": {
            "patch": {
                "summary": "Set owner tool access mode",
                "parameters": [
                    {
                        "name": "integrationKey",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                    },
                    {
                        "name": "toolName",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                    },
                ],
                "requestBody": {
                    "required": True,
                    "content": {
                        "application/json": {
                            "schema": {
                                "type": "object",
                                "properties": {
                                    "accessMode": {
                                        "type": "string",
                                        "enum": [
                                            "enabled",
                                            "disabled",
                                            "approval_required",
                                        ],
                                    }
                                },
                                "required": ["accessMode"],
                            }
                        }
                    },
                },
                "responses": {
                    "200": {"description": "Updated tool", "content": json_content}
                },
            }
        },
        "/api/user/connections": {
            "get": {
                "summary": "List owner OAuth/API connections",
                "responses": {
                    "200": {"description": "Connections", "content": json_content}
                },
            }
        },
        "/api/user/access-requests": {
            "get": {
                "summary": "List owner access requests",
                "responses": {
                    "200": {"description": "Access requests", "content": json_content}
                },
            }
        },
        "/api/user/access-requests/{requestId}/approve": {
            "post": {
                "summary": "Approve an access request",
                "parameters": [
                    {
                        "name": "requestId",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                    }
                ],
                "requestBody": {"required": False, "content": json_content},
                "responses": {
                    "200": {"description": "Temporary grant", "content": json_content}
                },
            }
        },
        "/api/user/access-requests/{requestId}/reject": {
            "post": {
                "summary": "Reject an access request",
                "parameters": [
                    {
                        "name": "requestId",
                        "in": "path",
                        "required": True,
                        "schema": {"type": "string"},
                    }
                ],
                "responses": {
                    "200": {"description": "Rejected request", "content": json_content}
                },
            }
        },
        "/api/user/key": {
            "get": {
                "summary": "Reveal user automation API key status/value",
                "responses": {
                    "200": {"description": "User key", "content": json_content}
                },
            },
            "post": {
                "summary": "Rotate user automation API key",
                "responses": {
                    "200": {"description": "New user key", "content": json_content}
                },
            },
            "delete": {
                "summary": "Revoke user automation API key",
                "responses": {
                    "200": {"description": "Revocation result", "content": json_content}
                },
            },
        },
        "/api/user/agent-key": {
            "get": {
                "summary": "Get or create restricted agent API key",
                "responses": {
                    "200": {"description": "Agent key", "content": json_content}
                },
            },
            "post": {
                "summary": "Rotate restricted agent API key",
                "responses": {
                    "200": {"description": "New agent key", "content": json_content}
                },
            },
        },
    }
    if is_admin:
        paths["/api/managed-connectors"] = {
            "get": {
                "summary": "List managed connectors",
                "responses": {
                    "200": {
                        "description": "Managed connectors",
                        "content": json_content,
                    }
                },
            },
            "post": {
                "summary": "Create or update a managed connector",
                "requestBody": {"required": True, "content": json_content},
                "responses": {
                    "200": {
                        "description": "Saved managed connector",
                        "content": json_content,
                    }
                },
            },
        }
    return {
        "openapi": "3.0.3",
        "info": {"title": "OpenHands Integrations Hub User API", "version": "0.1.0"},
        "servers": [{"url": base_url(request)}],
        "security": [{"UserApiKey": []}],
        "tags": [
            {"name": "Integrations"},
            {"name": "Case-by-case approvals"},
            {"name": "API keys"},
        ],
        "paths": paths,
        "components": {
            "securitySchemes": {"UserApiKey": {"type": "http", "scheme": "bearer"}},
            "schemas": {
                "IntegrationSpec": {"type": "object"},
                "ToolSpec": {"type": "object"},
                "AccessRequest": {"type": "object"},
                "TemporaryGrant": {"type": "object"},
                "ErrorResponse": {
                    "type": "object",
                    "properties": {"detail": {"type": "string"}},
                },
            },
        },
    }


def managed_openapi(request: Request) -> dict[str, Any]:
    json_content = {"application/json": {"schema": {"type": "object"}}}
    return {
        "openapi": "3.0.3",
        "info": {
            "title": "Managed Connectors API",
            "version": "1.0.0",
            "description": "Create, list, index, and delete managed connector definitions used by the integrations hub.",
        },
        "servers": [{"url": base_url(request)}],
        "security": [{"UserOrAdminSession": []}],
        "tags": [{"name": "Managed Connectors"}],
        "paths": {
            "/api/managed-connectors": {
                "get": {
                    "tags": ["Managed Connectors"],
                    "summary": "List managed connectors",
                    "responses": {
                        "200": {
                            "description": "Managed connectors",
                            "content": json_content,
                        }
                    },
                },
                "post": {
                    "tags": ["Managed Connectors"],
                    "summary": "Create or update a managed connector",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "$ref": "#/components/schemas/ManagedConnectorUpsert"
                                }
                            }
                        },
                    },
                    "responses": {
                        "200": {
                            "description": "Saved connector",
                            "content": json_content,
                        },
                        "403": {"description": "Admin required"},
                    },
                },
            },
            "/api/managed-connectors/{slug}": {
                "delete": {
                    "tags": ["Managed Connectors"],
                    "summary": "Delete a managed connector",
                    "parameters": [
                        {
                            "name": "slug",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string"},
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Delete result",
                            "content": json_content,
                        },
                        "403": {"description": "Admin required"},
                    },
                }
            },
            "/api/managed-connectors/{slug}/functions": {
                "post": {
                    "tags": ["Managed Connectors"],
                    "summary": "Index connector tool definitions",
                    "parameters": [
                        {
                            "name": "slug",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string"},
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Updated connector",
                            "content": json_content,
                        },
                        "403": {"description": "Admin required"},
                    },
                }
            },
        },
        "components": {
            "securitySchemes": {
                "UserOrAdminSession": {"type": "http", "scheme": "bearer"}
            },
            "schemas": {
                "ManagedConnectorUpsert": {"type": "object"},
                "ManagedConnectorTool": {"type": "object"},
                "ManagedConnector": {"type": "object"},
                "ErrorResponse": {
                    "type": "object",
                    "properties": {"detail": {"type": "string"}},
                },
            },
        },
    }


def admin_openapi(request: Request) -> dict[str, Any]:
    doc = user_openapi(request, True)
    doc["info"]["title"] = "OpenHands Integrations Hub Admin API"
    doc["security"] = [{"AdminApiKey": []}]
    doc["components"]["securitySchemes"] = {
        "AdminApiKey": {"type": "http", "scheme": "bearer"}
    }
    doc["paths"].update(
        {
            "/api/admin/connections": {
                "get": {
                    "summary": "List integration connections across owners",
                    "responses": {"200": {"description": "Admin connection summaries"}},
                }
            },
            "/api/admin/overview": {
                "get": {
                    "summary": "Get operational overview metrics",
                    "responses": {"200": {"description": "Operational overview"}},
                }
            },
            "/api/admin/access-requests": {
                "get": {
                    "summary": "List access requests across owners",
                    "responses": {"200": {"description": "Access requests"}},
                }
            },
            "/api/admin/key": {
                "get": {
                    "summary": "Reveal admin automation API key status/value",
                    "responses": {"200": {"description": "Admin key"}},
                },
                "post": {
                    "summary": "Rotate admin automation API key",
                    "responses": {"200": {"description": "New admin key"}},
                },
                "delete": {
                    "summary": "Revoke admin automation API key",
                    "responses": {"200": {"description": "Revocation result"}},
                },
            },
        }
    )
    return doc


def openapi_document(title: str) -> dict[str, Any]:
    return {
        "openapi": "3.0.0",
        "info": {"title": title, "version": "0.1.0"},
        "paths": {
            path: {
                method.lower(): {"responses": {"200": {"description": "OK"}}}
                for method, route_path in ROUTES
                if route_path == path
            }
            for path in sorted({route_path for _, route_path in ROUTES})
        },
    }


def get_by_path(source: dict[str, Any], path: str) -> Any:
    value: Any = source
    for part in path.split("."):
        if not isinstance(value, dict):
            return None
        value = value.get(part)
    return value


def resolve_template(template: Any, payload: dict[str, Any]) -> Any:
    if (
        isinstance(template, str)
        and template.startswith("{{")
        and template.endswith("}}")
    ):
        return get_by_path(payload, template[2:-2].strip())
    if isinstance(template, list):
        return [
            value
            for item in template
            if (value := resolve_template(item, payload)) is not None
        ]
    if isinstance(template, dict):
        return {
            key: value
            for key, item in template.items()
            if (value := resolve_template(item, payload)) is not None
        }
    return template


def path_template(path: str, payload: dict[str, Any]) -> str:
    result = path
    for part in path.split("{{")[1:]:
        name = part.split("}}", 1)[0].strip()
        value = get_by_path(payload, name)
        if value is None or isinstance(value, (dict, list)):
            raise HTTPException(
                status_code=400,
                detail=f"Path placeholder '{name}' must resolve to a string, number, or boolean.",
            )
        result = result.replace(
            "{{" + name + "}}", urllib.parse.quote(str(value), safe="")
        )
    return result


def http_auth_headers(
    integration: IntegrationSpec, credentials: dict[str, Any]
) -> dict[str, str]:
    if integration.authStrategy == "api_key" and credentials.get("secret"):
        return {
            str(credentials.get("headerName") or "X-API-Key"): str(
                credentials["secret"]
            )
        }
    if integration.authStrategy in {"oauth2", "bearer"} and credentials.get(
        "accessToken"
    ):
        return {"Authorization": f"Bearer {credentials['accessToken']}"}
    if (
        integration.authStrategy == "basic"
        and credentials.get("username")
        and credentials.get("password")
    ):
        return {
            "Authorization": "Basic "
            + base64.b64encode(
                f"{credentials['username']}:{credentials['password']}".encode()
            ).decode()
        }
    return {}


def http_api_base_url(integration: IntegrationSpec) -> str:
    base = (
        integration.config.get("apiBaseUrl")
        if isinstance(integration.config, dict)
        else None
    )
    if not base and isinstance(integration.config, dict):
        slug = integration.config.get("managedConnectorSlug")
        connector = get_managed_connector(str(slug)) if slug else None
        base = connector.apiBaseUrl if connector else None
    return str(base or "").rstrip("/")


def multipart_value_bytes(value: Any) -> tuple[bytes, str | None, str | None]:
    if isinstance(value, dict):
        filename = str(value.get("filename")) if value.get("filename") else None
        content_type = (
            str(value.get("contentType")) if value.get("contentType") else None
        )
        if value.get("contentBase64"):
            return (
                base64.b64decode(str(value["contentBase64"])),
                filename,
                content_type or "application/octet-stream",
            )
        if value.get("text") is not None:
            return (
                str(value["text"]).encode(),
                filename,
                content_type or ("text/plain" if filename else None),
            )
        return json.dumps(value).encode(), filename, content_type or "application/json"
    return str(value).encode(), None, None


def encode_multipart_form(body: Any) -> tuple[bytes, str]:
    boundary = f"----openhands-{secrets.token_hex(16)}"
    body_record = body if isinstance(body, dict) else {}
    chunks: list[bytes] = []
    for key, value in body_record.items():
        values = value if isinstance(value, list) else [value]
        for item in values:
            if item is None:
                continue
            data, filename, content_type = multipart_value_bytes(item)
            disposition = f'form-data; name="{key}"'
            if filename:
                disposition += f'; filename="{filename}"'
            chunks.append(
                f"--{boundary}\r\nContent-Disposition: {disposition}\r\n".encode()
            )
            if content_type:
                chunks.append(f"Content-Type: {content_type}\r\n".encode())
            chunks.append(b"\r\n")
            chunks.append(data)
            chunks.append(b"\r\n")
    chunks.append(f"--{boundary}--\r\n".encode())
    return b"".join(chunks), f"multipart/form-data; boundary={boundary}"


def invoke_http_tool(
    owner: str, integration: IntegrationSpec, tool: ToolSpec, payload: dict[str, Any]
) -> Any:
    base = http_api_base_url(integration)
    request_template = (
        tool.config.get("request") if isinstance(tool.config, dict) else None
    )
    if not base:
        raise HTTPException(
            status_code=400,
            detail=f"Integration '{integration.key}' is missing an apiBaseUrl configuration.",
        )
    if (
        not isinstance(request_template, dict)
        or not request_template.get("method")
        or not request_template.get("path")
    ):
        raise HTTPException(
            status_code=400,
            detail=f"Tool '{tool.name}' is missing an HTTP request template.",
        )
    method = str(request_template["method"]).upper()
    path = path_template(str(request_template["path"]), payload).lstrip("/")
    url = f"{base}/{path}"
    query = resolve_template(request_template.get("query") or {}, payload)
    if isinstance(query, dict) and query:
        url += "?" + urllib.parse.urlencode(query, doseq=True)
    headers = http_auth_headers(integration, credentials_for(owner, integration))
    header_values = resolve_template(request_template.get("headers") or {}, payload)
    if isinstance(header_values, dict):
        headers.update(
            {str(k): str(v) for k, v in header_values.items() if v is not None}
        )
    body = resolve_template(request_template.get("body"), payload)
    data = None
    if method not in {"GET", "HEAD"} and body is not None:
        content_type = request_template.get("contentType") or "json"
        if content_type == "form_urlencoded":
            data = urllib.parse.urlencode(
                body if isinstance(body, dict) else {}
            ).encode()
            headers["Content-Type"] = "application/x-www-form-urlencoded"
        elif content_type == "multipart_form_data":
            data, multipart_content_type = encode_multipart_form(body)
            headers["Content-Type"] = multipart_content_type
        elif content_type == "text":
            data = (body if isinstance(body, str) else json.dumps(body)).encode()
            headers["Content-Type"] = "text/plain"
        else:
            data = json.dumps(body).encode()
            headers["Content-Type"] = "application/json"
    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=20) as response:
            raw = response.read()
            content_type = response.headers.get("content-type", "")
            if response.status == 204:
                return None
            if "application/json" in content_type:
                return json.loads(raw.decode() or "null")
            if (
                content_type.startswith("text/")
                or "xml" in content_type
                or "html" in content_type
            ):
                return raw.decode()
            return {
                "contentType": content_type or "application/octet-stream",
                "sizeBytes": len(raw),
                "contentBase64": base64.b64encode(raw).decode(),
            }
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode(errors="replace")
        raise HTTPException(
            status_code=502,
            detail=f"{integration.name} {tool.name} failed ({exc.code}): {detail or exc.reason}",
        ) from exc


MCP_PROTOCOL_VERSION = "2025-11-25"
MCP_CLIENT_INFO = {"name": "agent-integrations-hub-fastapi", "version": "0.2.0"}


def mcp_server_url(integration: IntegrationSpec, tool: ToolSpec) -> str:
    config = tool.config if isinstance(tool.config, dict) else {}
    server_url = config.get("serverUrl") or integration.config.get("serverUrl")
    if not server_url and isinstance(integration.config, dict):
        slug = integration.config.get("managedConnectorSlug")
        connector = get_managed_connector(str(slug)) if slug else None
        server_url = connector.serverUrl if connector else None
    if not isinstance(server_url, str) or not server_url.strip():
        raise HTTPException(
            status_code=400,
            detail=f"Integration '{integration.key}' is missing an MCP serverUrl configuration.",
        )
    return server_url.strip()


def mcp_tool_name(tool: ToolSpec) -> str:
    config = tool.config if isinstance(tool.config, dict) else {}
    tool_name = config.get("toolName")
    return (
        tool_name.strip()
        if isinstance(tool_name, str) and tool_name.strip()
        else tool.name
    )


def mcp_transport_urls(default_url: str, *configs: dict[str, Any]) -> list[str]:
    for config in configs:
        order = config.get("mcpTransportOrder") if isinstance(config, dict) else None
        if not isinstance(order, list):
            continue
        urls = [
            str(item.get("url")).strip()
            for item in order
            if isinstance(item, dict)
            and item.get("transport") == "streamable_http"
            and str(item.get("url") or "").strip()
        ]
        return urls or [default_url]
    return [default_url]


def retry_mcp_transports[T](
    urls: list[str], operation: Callable[[str], T], fallback: T
) -> T:
    last_error: HTTPException | None = None
    for url in urls:
        try:
            return operation(url)
        except HTTPException as exc:
            last_error = exc
        except httpx.HTTPError as exc:
            last_error = HTTPException(status_code=502, detail=str(exc))
    if last_error:
        raise last_error
    return fallback


def discover_mcp_tools_with_transport_order(
    server_url: str, headers: dict[str, str], *configs: dict[str, Any]
) -> dict[str, ToolSpec]:
    return retry_mcp_transports(
        mcp_transport_urls(server_url, *configs),
        lambda url: discover_mcp_tools(url, headers),
        {},
    )


def parse_sse_json_messages(text: str) -> list[Any]:
    messages: list[Any] = []
    data_lines: list[str] = []
    for line in text.splitlines():
        if line.startswith("data:"):
            data_lines.append(line[5:].lstrip())
            continue
        if line.strip():
            continue
        if data_lines:
            messages.append(json.loads("\n".join(data_lines)))
            data_lines = []
    if data_lines:
        messages.append(json.loads("\n".join(data_lines)))
    return messages


def parse_mcp_http_response(
    response: httpx.Response, expected_id: int | None
) -> tuple[dict[str, Any] | None, str | None]:
    if response.status_code >= 400:
        raise HTTPException(
            status_code=response.status_code,
            detail=response.text or response.reason_phrase,
        )
    session_id = response.headers.get("mcp-session-id")
    if response.status_code == 202 or not response.content:
        return None, session_id
    content_type = response.headers.get("content-type", "")
    if "text/event-stream" in content_type:
        raw_messages = parse_sse_json_messages(response.text)
    else:
        payload = response.json()
        raw_messages = payload if isinstance(payload, list) else [payload]
    messages = [message for message in raw_messages if isinstance(message, dict)]
    message = next(
        (
            item
            for item in messages
            if expected_id is None or item.get("id") == expected_id
        ),
        messages[0] if messages else None,
    )
    if not message:
        return None, session_id
    if isinstance(message.get("error"), dict):
        error = message["error"]
        raise HTTPException(
            status_code=502, detail=str(error.get("message") or "MCP tool call failed.")
        )
    result = message.get("result")
    return (result if isinstance(result, dict) else {"result": result}), session_id


def post_mcp_message(
    client: httpx.Client,
    server_url: str,
    headers: dict[str, str],
    body: dict[str, Any],
    session_id: str | None,
    protocol_version: str | None,
    expected_id: int | None,
) -> tuple[dict[str, Any] | None, str | None]:
    request_headers = {
        **headers,
        "Accept": "application/json, text/event-stream",
        "Content-Type": "application/json",
    }
    if session_id:
        request_headers["mcp-session-id"] = session_id
    if protocol_version:
        request_headers["mcp-protocol-version"] = protocol_version
    response = client.post(server_url, headers=request_headers, json=body)
    return parse_mcp_http_response(response, expected_id)


def invoke_mcp_session(
    client: httpx.Client,
    server_url: str,
    headers: dict[str, str],
    tool_name: str,
    payload: dict[str, Any],
) -> dict[str, Any]:
    initialized, session_id = post_mcp_message(
        client,
        server_url,
        headers,
        {
            "jsonrpc": "2.0",
            "id": 1,
            "method": "initialize",
            "params": {
                "protocolVersion": MCP_PROTOCOL_VERSION,
                "capabilities": {},
                "clientInfo": MCP_CLIENT_INFO,
            },
        },
        None,
        None,
        1,
    )
    protocol_version = str(
        (initialized or {}).get("protocolVersion") or MCP_PROTOCOL_VERSION
    )
    post_mcp_message(
        client,
        server_url,
        headers,
        {"jsonrpc": "2.0", "method": "notifications/initialized"},
        session_id,
        protocol_version,
        None,
    )
    result, _ = post_mcp_message(
        client,
        server_url,
        headers,
        {
            "jsonrpc": "2.0",
            "id": 2,
            "method": "tools/call",
            "params": {"name": tool_name, "arguments": payload},
        },
        session_id,
        protocol_version,
        2,
    )
    return result or {}


def invoke_mcp_tool(
    owner: str, integration: IntegrationSpec, tool: ToolSpec, payload: dict[str, Any]
) -> Any:
    server_url = mcp_server_url(integration, tool)
    headers = http_auth_headers(integration, credentials_for(owner, integration))
    tool_name = mcp_tool_name(tool)
    config = tool.config if isinstance(tool.config, dict) else {}

    def call_transport(candidate_url: str) -> dict[str, Any]:
        with httpx.Client(timeout=20, follow_redirects=True) as client:
            return invoke_mcp_session(
                client, candidate_url, headers, tool_name, payload
            )

    return retry_mcp_transports(
        mcp_transport_urls(server_url, config, integration.config), call_transport, {}
    )


def invoke_tool_payload(
    owner: str, integration: IntegrationSpec, tool: ToolSpec, payload: dict[str, Any]
) -> Any:
    if tool.executionMode == "mock":
        return (
            tool.mockResponse if tool.mockResponse is not None else {"payload": payload}
        )
    if integration.kind == "api":
        return invoke_http_tool(owner, integration, tool, payload)
    return invoke_mcp_tool(owner, integration, tool, payload)


def effective_scopes(tool: ToolSpec, requested_scopes: list[str]) -> list[str]:
    return sorted(set(requested_scopes or tool.defaultScopes))


def active_temporary_grant(
    agent_id: str | None,
    agent_class: str | None,
    integration_key: str,
    tool_name: str,
    scopes: list[str],
) -> dict[str, Any] | None:
    current = now_iso()
    for grant in repository.list_temporary_grants():
        if grant.get("agentId") != agent_id or grant.get("agentClass") != agent_class:
            continue
        if (
            grant.get("integrationKey") != integration_key
            or grant.get("toolName") != tool_name
        ):
            continue
        if str(grant.get("expiresAt") or "") <= current:
            continue
        grant_scopes = grant.get("scopes") or []
        if not grant_scopes or all(scope in grant_scopes for scope in scopes):
            return grant
    return None


def policy_allows(
    policy: dict[str, Any] | None,
    integration: IntegrationSpec,
    tool: ToolSpec,
    scopes: list[str],
) -> bool:
    if not policy:
        return True
    fine_grained = integration.fineGrainedPermissions and tool.fineGrainedPermissions
    for rule in policy.get("rules") or []:
        if not rule.get("enabled", True):
            continue
        if rule.get("integrationKey") != integration.key:
            continue
        tool_names = rule.get("toolNames") or []
        if fine_grained and tool_names and tool.name not in tool_names:
            continue
        rule_scopes = rule.get("scopes") or []
        if rule_scopes and not all(scope in rule_scopes for scope in scopes):
            continue
        return True
    return False


def ensure_pending_access_request(
    owner: str,
    integration: IntegrationSpec,
    tool: ToolSpec,
    scopes: list[str],
    agent_id: str | None,
    agent_class: str | None,
) -> None:
    if repository.find_matching_pending_access_request(
        owner, agent_id, agent_class, integration.key, tool.name, scopes
    ):
        return
    repository.save_access_request(
        owner,
        AccessRequest(
            agentId=agent_id,
            agentClass=agent_class,
            integrationKey=integration.key,
            toolName=tool.name,
            scopes=scopes,
        ),
    )


def deny_tool_invocation(
    owner: str,
    integration: IntegrationSpec,
    tool: ToolSpec,
    scopes: list[str],
    payload: dict[str, Any],
    agent_id: str | None,
    agent_class: str | None,
    reason: str,
    create_access_request: bool = False,
) -> None:
    if create_access_request:
        ensure_pending_access_request(
            owner, integration, tool, scopes, agent_id, agent_class
        )
    repository.record_tool_invocation(
        owner,
        integration,
        tool,
        scopes,
        payload,
        "denied",
        reason,
        agent_id,
        agent_class,
    )
    raise HTTPException(status_code=403, detail=reason)


def invoke_enabled_tool(
    owner: str,
    integration: IntegrationSpec,
    tool: ToolSpec,
    scopes: list[str],
    payload: dict[str, Any],
    agent_id: str | None = None,
    agent_class: str | None = None,
) -> Any:
    scopes = effective_scopes(tool, scopes)
    grant = active_temporary_grant(
        agent_id, agent_class, integration.key, tool.name, scopes
    )
    if tool.accessMode == "approval_required" and not grant:
        deny_tool_invocation(
            owner,
            integration,
            tool,
            scopes,
            payload,
            agent_id,
            agent_class,
            "Human approval is required before calling this tool.",
            True,
        )

    policy = repository.get_policy(agent_class) if agent_class else None
    if (
        tool.accessMode != "approval_required"
        and policy
        and not policy_allows(policy, integration, tool, scopes)
        and not grant
    ):
        deny_tool_invocation(
            owner,
            integration,
            tool,
            scopes,
            payload,
            agent_id,
            agent_class,
            "Permission required by agent class policy.",
        )

    tool.invocationCount = (tool.invocationCount or 0) + 1
    tool.lastInvokedAt = now_iso()
    try:
        data = invoke_tool_payload(owner, integration, tool, payload)
    except HTTPException as exc:
        tool.lastInvocationOutcome = "error"
        repository.save_tool(owner, integration.key, tool)
        repository.record_tool_invocation(
            owner,
            integration,
            tool,
            scopes,
            payload,
            "error",
            str(exc.detail),
            agent_id,
            agent_class,
        )
        raise
    tool.lastInvocationOutcome = "success"
    repository.save_tool(owner, integration.key, tool)
    repository.record_tool_invocation(
        owner,
        integration,
        tool,
        scopes,
        payload,
        "success",
        agent_id=agent_id,
        agent_class=agent_class,
    )
    return data


def mcp_content_text(data: Any) -> str:
    return data if isinstance(data, str) else json.dumps(data)


def root_template_variable(value: str) -> str:
    return value.split(".", 1)[0].strip()


def collect_template_variables(value: Any) -> set[str]:
    variables: set[str] = set()
    if isinstance(value, str):
        for match in re.finditer(r"{{\s*([A-Za-z0-9_.-]+)\s*}}", value):
            variable = root_template_variable(match.group(1))
            if variable:
                variables.add(variable)
    elif isinstance(value, list):
        for item in value:
            variables.update(collect_template_variables(item))
    elif isinstance(value, dict):
        for item in value.values():
            variables.update(collect_template_variables(item))
    return variables


def json_schema_properties(schema: Any) -> tuple[dict[str, Any], set[str]]:
    if (
        not isinstance(schema, dict)
        or schema.get("type") != "object"
        or not isinstance(schema.get("properties"), dict)
    ):
        return {}, set()
    required = (
        schema.get("required") if isinstance(schema.get("required"), list) else []
    )
    return dict(schema["properties"]), {str(item) for item in required}


def mcp_tool_input_schema(tool: ToolSpec) -> dict[str, Any]:
    properties: dict[str, Any] = {
        "contextAgentId": {
            "type": ["string", "null"],
            "description": "Optional agent ID override for this call.",
        },
        "contextAgentClass": {
            "type": ["string", "null"],
            "description": "Optional agent class override for this call.",
        },
        "contextScopes": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Optional requested scopes for this call.",
        },
    }
    required: set[str] = set()
    config = tool.config if isinstance(tool.config, dict) else {}
    schema_properties, schema_required = json_schema_properties(
        config.get("inputSchema")
    )
    properties.update(schema_properties)
    required.update(schema_required)
    for variable in sorted(collect_template_variables(config.get("request"))):
        properties.setdefault(
            variable,
            {"description": f"Value for request template variable '{variable}'."},
        )
    return {
        "type": "object",
        "properties": properties,
        "required": sorted(required),
        "additionalProperties": True,
    }


def mcp_tool_list(owner: str) -> list[dict[str, Any]]:
    tools: list[dict[str, Any]] = []
    for integration in repository.list_integrations(owner):
        if not integration.enabled:
            continue
        for tool in integration.tools.values():
            if not tool.enabled or tool.accessMode == "disabled":
                continue
            tools.append(
                {
                    "name": f"{integration.key}__{tool.name}",
                    "description": tool.description,
                    "inputSchema": mcp_tool_input_schema(tool),
                }
            )
    return tools


def jsonrpc_response(
    body: dict[str, Any], result: Any = None, error: dict[str, Any] | None = None
) -> dict[str, Any]:
    response = {"jsonrpc": "2.0", "id": body.get("id")}
    if error is not None:
        response["error"] = error
    else:
        response["result"] = result
    return response


def mcp_call(owner: str, body: dict[str, Any]) -> dict[str, Any] | Response:
    method = body.get("method")
    if method == "initialize":
        return jsonrpc_response(
            body,
            {
                "protocolVersion": body.get("params", {}).get(
                    "protocolVersion", "2024-11-05"
                ),
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "integrations-hub-fastapi", "version": "0.1.0"},
            },
        )
    if method == "notifications/initialized":
        return Response(status_code=202)
    if method == "tools/list":
        return jsonrpc_response(body, {"tools": mcp_tool_list(owner)})
    if method == "tools/call":
        params = body.get("params", {})
        name = params.get("name", "")
        if "__" not in name:
            return jsonrpc_response(
                body,
                error={
                    "code": -32602,
                    "message": "Tool name must use integration__tool format.",
                },
            )
        integration_key, tool_name = name.split("__", 1)
        integration = repository.get_integration(owner, integration_key)
        if not integration:
            return jsonrpc_response(
                body, error={"code": -32004, "message": "Integration not found."}
            )
        tool = integration.tools.get(tool_name)
        if not tool or not tool.enabled or tool.accessMode == "disabled":
            return jsonrpc_response(
                body, error={"code": -32003, "message": "Tool is disabled."}
            )
        arguments = params.get("arguments", {})
        argument_payload = arguments if isinstance(arguments, dict) else {}
        requested_scopes = argument_payload.pop(
            "contextScopes", params.get("scopes", [])
        )
        scopes = requested_scopes if isinstance(requested_scopes, list) else []
        agent_id = argument_payload.pop("contextAgentId", None)
        agent_class = argument_payload.pop("contextAgentClass", None)
        try:
            data = invoke_enabled_tool(
                owner,
                integration,
                tool,
                scopes,
                argument_payload,
                agent_id,
                agent_class,
            )
        except HTTPException as exc:
            return jsonrpc_response(
                body,
                error={"code": -32000 - exc.status_code, "message": str(exc.detail)},
            )
        return jsonrpc_response(
            body, {"content": [{"type": "text", "text": mcp_content_text(data)}]}
        )
    return jsonrpc_response(
        body, error={"code": -32601, "message": f"Unsupported MCP method: {method}"}
    )


def internal_auth_secret() -> str:
    """Get the internal auth secret from config."""
    cfg = get_default_config()
    return (
        cfg.internal_auth_secret.get_secret_value() if cfg.internal_auth_secret else ""
    )


def is_auth_disabled() -> bool:
    """Check if authentication is disabled."""
    return get_default_config().disable_auth


def requires_dashboard_session(path: str, method: str) -> bool:
    if path in {
        "/api/user/key",
        "/api/user/agent-key",
        "/api/admin/key",
        "/api/oauth/connections",
        "/api/notifications",
        "/api/agent-classes/{agentClass}",
    }:
        return True
    if path.startswith("/api/integrations") and path not in {
        "/api/integrations/managed-connectors",
        "/api/integrations/oauth-provider-catalog",
    }:
        return True
    if path.startswith("/api/case-by-case-approvals"):
        return True
    if path == "/api/oauth/{provider}/start":
        return True
    if path.startswith("/api/managed-connectors") and method != "GET":
        return True
    return False


def authorize_dashboard_owner(request: Request) -> str:
    if is_auth_disabled():
        return owner_id(request)
    secret = internal_auth_secret()
    if not secret:
        raise HTTPException(
            status_code=503, detail="Dashboard API authentication is not configured."
        )
    if request.headers.get(INTERNAL_AUTH_HEADER) != secret:
        raise HTTPException(
            status_code=401,
            detail="Sign in to the dashboard before using this endpoint.",
        )
    owner = (request.headers.get("x-owner-id") or "").strip().lower()
    if not owner:
        raise HTTPException(
            status_code=401,
            detail="Sign in to the dashboard before using this endpoint.",
        )
    return owner


def extract_api_key(request: Request) -> str:
    authorization = (request.headers.get("authorization") or "").strip()
    if authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    return (request.headers.get("x-api-key") or "").strip()


def authorized_agent_owner(request: Request, purpose: str) -> str:
    if not repository.has_agent_api_keys():
        raise HTTPException(
            status_code=503,
            detail=f"Open the dashboard once to provision a personal integrations-hub API key before agents {purpose}.",
        )
    record = repository.find_agent_api_key(extract_api_key(request))
    if not record:
        raise HTTPException(
            status_code=401,
            detail="Provide a valid personal integrations-hub API key in the Authorization bearer header or X-API-Key.",
            headers={"WWW-Authenticate": 'Bearer realm="agent-integrations-hub"'},
        )
    return str(record["ownerId"]).lower()


def authorize_user_api_owner(request: Request) -> tuple[str, bool]:
    record = repository.find_scoped_api_key("user", extract_api_key(request))
    if not record:
        raise HTTPException(
            status_code=401,
            detail="Provide a valid user API key in the Authorization bearer header or X-API-Key.",
            headers={"WWW-Authenticate": 'Bearer realm="integrations-hub-user-api"'},
        )
    owner = str(record["ownerId"]).lower()
    return owner, is_admin_owner(owner)


def authorize_admin_api_owner(request: Request) -> str:
    record = repository.find_scoped_api_key("admin", extract_api_key(request))
    if not record:
        raise HTTPException(
            status_code=401,
            detail="Provide a valid admin API key in the Authorization bearer header or X-API-Key.",
            headers={"WWW-Authenticate": 'Bearer realm="integrations-hub-admin-api"'},
        )
    owner = str(record["ownerId"]).lower()
    if not is_admin_owner(owner):
        raise HTTPException(
            status_code=403,
            detail="This endpoint requires an active admin API key for an allowlisted admin user.",
        )
    return owner


def owner_id(request: Request) -> str:
    return (request.headers.get("x-owner-id") or DEFAULT_OWNER).strip().lower()


def optional_trimmed_config(config: dict[str, Any], key: str) -> str | None:
    value = config.get(key)
    if not isinstance(value, str):
        return None
    trimmed = value.strip()
    return trimmed or None


def require_app_admin(owner: str, detail: str) -> None:
    if not is_admin_owner(owner):
        raise HTTPException(status_code=403, detail=detail)


def assert_user_can_save_integration(owner: str, integration: IntegrationSpec) -> None:
    if is_admin_owner(owner):
        return
    managed_slug = optional_trimmed_config(integration.config, "managedConnectorSlug")
    api_base_url = optional_trimmed_config(integration.config, "apiBaseUrl")
    server_url = optional_trimmed_config(integration.config, "serverUrl")
    if not managed_slug or api_base_url or server_url:
        raise HTTPException(
            status_code=403, detail=RAW_CONNECTOR_INSTALL_FORBIDDEN_DETAIL
        )


def assert_user_can_discover_integration(owner: str, payload: dict[str, Any]) -> None:
    if is_admin_owner(owner) or payload.get("kind") == "managed":
        return
    raise HTTPException(
        status_code=403, detail=RAW_CONNECTOR_DISCOVERY_FORBIDDEN_DETAIL
    )


def key_status(value: str | None) -> dict[str, Any] | None:
    return (
        None
        if not value
        else {
            "keyPrefix": value[:8],
            "keySuffix": value[-6:],
            "recoverable": True,
            "createdAt": now_iso(),
            "updatedAt": now_iso(),
        }
    )


ACCESS_PRIORITY = {"disabled": 0, "approval_required": 1, "enabled": 2}


def subtract_unused_window(value: int, unit: str) -> str:
    reference = datetime.now(UTC)
    if unit == "weeks":
        cutoff = reference - timedelta(days=value * 7)
    elif unit == "months":
        month = reference.month - value
        year = reference.year
        while month <= 0:
            month += 12
            year -= 1
        day = min(reference.day, 28)
        cutoff = reference.replace(year=year, month=month, day=day)
    else:
        cutoff = reference - timedelta(days=value)
    return cutoff.isoformat().replace("+00:00", "Z")


def disable_unused_tools(owner: str, body: dict[str, Any]) -> dict[str, Any]:
    value = int(body.get("thresholdValue") or 30)
    unit = str(body.get("thresholdUnit") or "days")
    if value <= 0 or unit not in {"days", "weeks", "months"}:
        raise HTTPException(
            status_code=400,
            detail="thresholdValue must be positive and thresholdUnit must be days, weeks, or months.",
        )
    cutoff = subtract_unused_window(value, unit)
    usage = {
        (summary["integrationKey"], summary["toolName"]): summary
        for summary in repository.list_owner_tool_usage_summaries(owner)
        if str(summary.get("lastInvokedAt") or "") < cutoff
    }
    disabled: list[dict[str, Any]] = []
    for listed in repository.list_integrations(owner):
        integration = repository.get_integration(owner, listed.key)
        if not integration:
            continue
        changed = False
        for tool_name, tool in list(integration.tools.items()):
            if tool.accessMode == "disabled":
                continue
            summary = usage.get((integration.key, tool_name))
            if not summary:
                continue
            integration.tools[tool_name] = tool.model_copy(
                update={"accessMode": "disabled", "enabled": False}
            )
            disabled.append(
                {
                    "integrationKey": integration.key,
                    "toolName": tool_name,
                    "lastInvokedAt": summary["lastInvokedAt"],
                }
            )
            changed = True
        if changed:
            repository.save_integration(owner, integration)
    disabled.sort(key=lambda item: (item["integrationKey"], item["toolName"]))
    return {
        "thresholdValue": value,
        "thresholdUnit": unit,
        "cutoffIso": cutoff,
        "disabledCount": len(disabled),
        "disabledTools": disabled,
        "updatedIntegrations": repository.list_integrations(owner),
    }


def oauth_provider_catalog() -> list[dict[str, Any]]:
    managed = {connector.slug: connector for connector in list_managed_connectors()}
    catalog = []
    for provider in integration_catalog_snapshot()["providers"]:
        slug = provider["slug"]
        connector = managed.get(slug)
        catalog.append(
            {
                "slug": slug,
                "name": connector.name if connector else provider["name"],
                "description": connector.description
                if connector
                else provider["description"],
                "categories": connector.categories
                if connector and connector.categories
                else provider["categories"],
                "availability": provider["availability"],
                "managedConnectorSlug": connector.slug
                if connector
                else provider.get("managedConnectorSlug"),
                "authStrategy": connector.authStrategy
                if connector
                else provider["authStrategy"],
                "popularityRank": provider["popularityRank"],
                "appUrl": connector.appUrl if connector else provider.get("appUrl"),
                "docsUrl": connector.docsUrl if connector else provider.get("docsUrl"),
                "registrationDefaults": connector.response()
                if connector
                else provider.get("registrationDefaults"),
                "notes": provider.get("notes", ""),
            }
        )
    return catalog


def approve_access_request(
    owner: str | None,
    request_id: str,
    reviewer: str,
    duration_minutes: int | None = None,
) -> dict[str, Any]:
    request = repository.decide_access_request(owner, request_id, "approved", reviewer)
    if not request:
        raise HTTPException(status_code=404, detail="Access request not found.")
    created = now_iso()
    expires = (
        (
            datetime.now(UTC)
            + timedelta(minutes=duration_minutes or request.requestedMinutes)
        )
        .isoformat()
        .replace("+00:00", "Z")
    )
    return repository.save_temporary_grant(
        {
            "id": secrets.token_urlsafe(18),
            "agentId": request.agentId,
            "agentClass": request.agentClass,
            "integrationKey": request.integrationKey,
            "toolName": request.toolName,
            "scopes": request.scopes,
            "grantedBy": reviewer,
            "createdAt": created,
            "expiresAt": expires,
        }
    )


def reject_access_request(
    owner: str | None, request_id: str, reviewer: str
) -> AccessRequest:
    request = repository.decide_access_request(owner, request_id, "rejected", reviewer)
    if not request:
        raise HTTPException(status_code=404, detail="Access request not found.")
    return request


def clamp_access_mode(requested: str, maximum: str | None) -> str:
    if not maximum:
        return requested
    return (
        requested
        if ACCESS_PRIORITY.get(requested, 0) <= ACCESS_PRIORITY.get(maximum, 0)
        else maximum
    )


def apply_managed_constraints(integration: IntegrationSpec) -> IntegrationSpec:
    slug = (
        integration.config.get("managedConnectorSlug")
        if isinstance(integration.config, dict)
        else None
    )
    connector = get_managed_connector(str(slug)) if slug else None
    if not connector:
        return integration
    tools = connector_tools(connector)
    merged: dict[str, ToolSpec] = {}
    for name, indexed_tool in tools.items():
        existing = integration.tools.get(name)
        requested = existing.accessMode if existing else indexed_tool.accessMode
        access_mode = clamp_access_mode(requested, indexed_tool.accessMode)
        merged[name] = indexed_tool.model_copy(
            update={
                "accessMode": access_mode,
                "enabled": access_mode != "disabled",
                "maxAccessMode": indexed_tool.accessMode,
            }
        )
    return integration.model_copy(
        update={
            "kind": "mcp" if connector.provider == "mcp" else "api",
            "provider": connector.provider,
            "authStrategy": connector.authStrategy,
            "config": {"managedConnectorSlug": connector.slug},
            "tools": merged or integration.tools,
        }
    )


def connector_tools(connector: ManagedConnector) -> dict[str, ToolSpec]:
    source_tools = connector.tools
    if not source_tools and connector.provider == "http" and connector.openApiUrl:
        source_tools = generate_openapi_tools(
            connector.openApiUrl, connector.authStrategy
        )
    return {
        tool.name: ToolSpec(
            name=tool.name,
            description=tool.description,
            defaultScopes=tool.defaultScopes,
            accessMode=tool.accessMode,
            enabled=tool.accessMode != "disabled",
            config={
                **tool.config,
                **({"request": tool.request} if tool.request else {}),
            },
        )
        for tool in source_tools
    }


def managed_tool_from_tool_spec(
    tool: ToolSpec, access_mode: str
) -> ManagedConnectorTool:
    request = (
        tool.config.get("request")
        if isinstance(tool.config, dict)
        and isinstance(tool.config.get("request"), dict)
        else None
    )
    config = dict(tool.config)
    config.pop("request", None)
    return ManagedConnectorTool(
        name=tool.name,
        description=tool.description,
        defaultScopes=tool.defaultScopes,
        accessMode=access_mode,  # type: ignore[arg-type]
        request=request,
        config=config,
    )


def index_managed_connector_functions(
    slug: str, owner: str | None = None
) -> dict[str, Any]:
    connector = repository.get_managed_connector(slug)
    if not connector:
        raise HTTPException(status_code=404, detail="Managed connector not found.")
    existing_modes = {tool.name: tool.accessMode for tool in connector.tools}
    provider = connector.provider or ("http" if connector.openApiUrl else "mcp")

    if provider == "http":
        if not connector.openApiUrl:
            raise HTTPException(
                status_code=400,
                detail="Managed HTTP connectors need an OpenAPI URL before their tools can be indexed.",
            )
        generated_tools = generate_openapi_tools(
            connector.openApiUrl, connector.authStrategy
        )
        connector.tools = [
            tool.model_copy(
                update={"accessMode": existing_modes.get(tool.name, tool.accessMode)}
            )
            for tool in generated_tools
        ]
    else:
        server_url = (connector.serverUrl or connector.apiBaseUrl or "").strip()
        if not server_url:
            raise HTTPException(
                status_code=400,
                detail="Managed MCP connectors need a server URL before their tools can be indexed.",
            )
        credentials = (
            repository.get_connection_credentials(owner, connector.slug)
            if owner and connector.authStrategy == "oauth2"
            else {}
        )
        discovered = discover_mcp_tools(
            server_url, mcp_discovery_headers(connector.authStrategy, credentials or {})
        )
        connector.tools = [
            managed_tool_from_tool_spec(
                tool, existing_modes.get(name, tool.accessMode or "enabled")
            )
            for name, tool in discovered.items()
        ]

    connector.updatedAt = now_iso()
    return repository.save_managed_connector(connector).response()


def infer_auth_strategy(credentials: dict[str, Any]) -> str:
    if credentials.get("accessToken"):
        return "bearer"
    if credentials.get("secret"):
        return "api_key"
    if credentials.get("username") and credentials.get("password"):
        return "basic"
    return "none"


def managed_connector_credentials(
    connector: ManagedConnector, credentials: dict[str, Any]
) -> dict[str, Any]:
    if connector.authStrategy in {"none", "oauth2"}:
        return {}
    if connector.authStrategy == "api_key":
        secret = str(credentials.get("secret") or "").strip()
        if not secret:
            raise HTTPException(
                status_code=400,
                detail=f"{connector.credentialLabel} is required to use the {connector.name} connector.",
            )
        return {
            "headerName": str(
                credentials.get("headerName")
                or connector.apiKeyHeaderName
                or "X-API-Key"
            ),
            "secret": secret,
        }
    if connector.authStrategy == "bearer":
        access_token = str(credentials.get("accessToken") or "").strip()
        if not access_token:
            raise HTTPException(
                status_code=400,
                detail=f"{connector.credentialLabel} is required to use the {connector.name} connector.",
            )
        return {"accessToken": access_token}
    if connector.authStrategy == "basic":
        username = str(credentials.get("username") or "").strip()
        password = str(credentials.get("password") or "").strip()
        if not username or not password:
            raise HTTPException(
                status_code=400,
                detail=f"{connector.credentialLabel} is required to use the {connector.name} connector.",
            )
        return {"username": username, "password": password}
    raise HTTPException(
        status_code=400,
        detail=f"Managed connector '{connector.slug}' uses unsupported auth strategy '{connector.authStrategy}'.",
    )


def mcp_discovery_headers(
    auth_strategy: str, credentials: dict[str, Any]
) -> dict[str, str]:
    integration = IntegrationSpec(
        key="discovery",
        name="Discovery",
        kind="mcp",
        provider="mcp",
        authStrategy=auth_strategy,
        credentials=credentials,
    )
    return http_auth_headers(integration, credentials)


def discover_mcp_tools(server_url: str, headers: dict[str, str]) -> dict[str, ToolSpec]:
    with httpx.Client(timeout=20, follow_redirects=True) as client:
        initialized, session_id = post_mcp_message(
            client,
            server_url,
            headers,
            {
                "jsonrpc": "2.0",
                "id": 1,
                "method": "initialize",
                "params": {
                    "protocolVersion": MCP_PROTOCOL_VERSION,
                    "capabilities": {},
                    "clientInfo": MCP_CLIENT_INFO,
                },
            },
            None,
            None,
            1,
        )
        protocol_version = str(
            (initialized or {}).get("protocolVersion") or MCP_PROTOCOL_VERSION
        )
        post_mcp_message(
            client,
            server_url,
            headers,
            {"jsonrpc": "2.0", "method": "notifications/initialized"},
            session_id,
            protocol_version,
            None,
        )
        result, _ = post_mcp_message(
            client,
            server_url,
            headers,
            {"jsonrpc": "2.0", "id": 2, "method": "tools/list"},
            session_id,
            protocol_version,
            2,
        )
    tools = (result or {}).get("tools") or []
    discovered: dict[str, ToolSpec] = {}
    for item in tools:
        if not isinstance(item, dict) or not item.get("name"):
            continue
        name = str(item["name"])
        discovered[name] = ToolSpec(
            name=name,
            description=str(item.get("description") or item.get("title") or ""),
            config={"toolName": name, "inputSchema": item.get("inputSchema") or {}},
        )
    return discovered


def managed_mcp_discovery_credentials(
    owner: str,
    integration_key: str,
    connector: ManagedConnector,
    credentials: dict[str, Any],
) -> dict[str, Any]:
    if connector.authStrategy == "oauth2":
        saved_credentials = repository.get_connection_credentials(
            owner, integration_key
        )
        if not saved_credentials:
            raise HTTPException(
                status_code=403,
                detail=f"Connect {connector.name} for this user before discovering tools.",
            )
        return saved_credentials
    return managed_connector_credentials(connector, credentials)


def discover_managed_mcp_tools_for_owner(
    owner: str,
    integration_key: str,
    connector: ManagedConnector,
    credentials: dict[str, Any],
) -> dict[str, ToolSpec]:
    server_url = str(connector.serverUrl or connector.apiBaseUrl or "").strip()
    if not server_url:
        raise HTTPException(
            status_code=400,
            detail=f"Managed MCP connector '{connector.slug}' is missing a server URL.",
        )
    discovery_credentials = managed_mcp_discovery_credentials(
        owner, integration_key, connector, credentials
    )
    return discover_mcp_tools_with_transport_order(
        server_url,
        mcp_discovery_headers(connector.authStrategy, discovery_credentials),
    )


def discovered_integration(payload: dict[str, Any], owner: str) -> dict[str, Any]:
    config = payload.get("config") if isinstance(payload.get("config"), dict) else {}
    credentials = (
        payload.get("credentials")
        if isinstance(payload.get("credentials"), dict)
        else {}
    )
    slug = (
        payload.get("managedConnectorSlug")
        or config.get("managedConnectorSlug")
        or payload.get("key")
    )
    stored_connector = repository.get_managed_connector(str(slug)) if slug else None
    if stored_connector and not stored_connector.enabled:
        raise HTTPException(
            status_code=404, detail=f"Unknown managed connector '{slug}'."
        )
    connector = get_managed_connector(str(slug) if slug else "")
    if connector:
        integration_key = str(payload.get("key") or connector.slug)
        resolved_credentials = managed_connector_credentials(connector, credentials)
        tools = connector_tools(connector)
        if connector.provider == "mcp" and not tools:
            tools = discover_managed_mcp_tools_for_owner(
                owner, integration_key, connector, credentials
            )
        return {
            "key": integration_key,
            "name": payload.get("name") or connector.name,
            "kind": "mcp" if connector.provider == "mcp" else "api",
            "provider": connector.provider,
            "authStrategy": connector.authStrategy,
            "enabled": True,
            "fineGrainedPermissions": True,
            "config": {"managedConnectorSlug": connector.slug},
            "credentials": resolved_credentials,
            "tools": {name: tool.model_dump() for name, tool in tools.items()},
        }
    if payload.get("kind") != "mcp":
        raise HTTPException(
            status_code=400,
            detail="Only managed connectors and raw MCP discovery are supported.",
        )
    server_url = str(config.get("serverUrl") or "").strip()
    if not server_url:
        raise HTTPException(
            status_code=400, detail="MCP discovery requires config.serverUrl."
        )
    auth_strategy = infer_auth_strategy(credentials)
    tools = discover_mcp_tools_with_transport_order(
        server_url, mcp_discovery_headers(auth_strategy, credentials), config
    )
    return {
        "key": payload.get("key", "custom"),
        "name": payload.get("name", payload.get("key", "Custom integration")),
        "kind": "mcp",
        "provider": "mcp",
        "authStrategy": auth_strategy,
        "enabled": True,
        "fineGrainedPermissions": True,
        "config": {"serverUrl": server_url},
        "credentials": credentials,
        "tools": {name: tool.model_dump() for name, tool in tools.items()},
    }


async def json_body(request: Request) -> Any:
    return (
        await request.json()
        if request.headers.get("content-length") not in (None, "0")
        else {}
    )


async def fastapi_handler(request: Request):
    params = request.path_params
    path = request.scope["route"].path
    method = request.method
    owner = (
        authorize_dashboard_owner(request)
        if requires_dashboard_session(path, method)
        else owner_id(request)
    )
    user_api_is_admin = is_admin_owner(owner)
    if path.startswith("/api/context"):
        owner = authorized_agent_owner(request, "call /api/context")
    if path == "/api/mcp":
        owner = authorized_agent_owner(request, "connect to MCP")
    if path.startswith("/api/user/") and path not in {
        "/api/user/key",
        "/api/user/agent-key",
    }:
        owner, user_api_is_admin = authorize_user_api_owner(request)
    if path.startswith("/api/admin/") and path != "/api/admin/key":
        owner = authorize_admin_api_owner(request)
        user_api_is_admin = True
    body = await json_body(request) if method in {"POST", "PATCH", "PUT"} else {}

    if path == "/api/health":
        return {"status": "ok", "backend": "fastapi"}

    if path == "/api/context/openapi":
        return context_openapi(owner, request)
    if path == "/api/user/openapi":
        return user_openapi(request, user_api_is_admin)
    if path == "/api/admin/openapi":
        return admin_openapi(request)
    if path in {
        "/api/managed-connectors/openapi",
        "/api/admin/managed-connectors/openapi",
    }:
        return managed_openapi(request)

    if path == "/api/context/skill":
        lines = ["# OpenHands Integrations Hub", "", "Available tools:"]
        for integration in repository.list_integrations(owner):
            for tool in integration.tools.values():
                if tool.enabled and tool.accessMode != "disabled":
                    lines.append(
                        f"- `{integration.key}.{tool.name}` — {tool.description or 'No description'}"
                    )
        return PlainTextResponse("\n".join(lines) + "\n")

    if path == "/api/mcp":
        if method == "GET":
            return StreamingResponse(
                iter([": connected\n\n"]), media_type="text/event-stream"
            )
        if method == "DELETE":
            return {"terminated": True}
        return mcp_call(owner, body if isinstance(body, dict) else {})

    if path.startswith("/api/admin/integrations") and path not in {
        "/api/admin/integrations/managed-connectors",
        "/api/admin/integrations/oauth-provider-catalog",
        "/api/admin/integrations/discover",
    }:
        raise HTTPException(
            status_code=410, detail=DEPRECATED_ADMIN_INTEGRATIONS_MESSAGE
        )

    if path.endswith("/oauth-provider-catalog"):
        return oauth_provider_catalog()

    if path in {"/api/oauth/connections", "/api/user/connections"}:
        return repository.list_connections(owner)

    if path == "/api/admin/oauth/connections":
        raise HTTPException(
            status_code=410, detail=DEPRECATED_ADMIN_CONNECTIONS_MESSAGE
        )

    if path == "/api/admin/connections":
        return repository.list_connections(filters=admin_connection_filters(request))

    if path == "/api/notifications":
        require_app_admin(owner, ADMIN_NOTIFICATIONS_DETAIL)
        return repository.list_notifications()

    if path == "/api/admin/notifications":
        return repository.list_notifications()

    if path == "/api/oauth/{provider}/start":
        return start_oauth_redirect(request, params["provider"], owner)

    if path == "/api/oauth/{provider}/callback":
        provider = params["provider"]
        state = request.query_params.get("state", "")
        code = request.query_params.get("code", "")
        error = request.query_params.get("error")
        if error:
            return RedirectResponse(
                f"/integrations?oauth_status=error&oauth_provider={provider}&oauth_error={urllib.parse.quote(error)}"
            )
        connection = exchange_oauth_code(provider, state, code)
        return RedirectResponse(
            f"/integrations?oauth_status=connected&oauth_provider={provider}&integrationKey={connection['integrationKey']}"
        )

    if path == "/api/cron/expire-grants":
        try:
            secret = get_default_config().require_cron_secret()
        except RuntimeError as exc:
            raise HTTPException(status_code=503, detail=str(exc)) from exc
        if request.headers.get("authorization") != f"Bearer {secret}":
            raise HTTPException(status_code=401, detail="Unauthorized")
        return {"purged": repository.purge_expired_grants()}

    if path == "/api/agent-classes/{agentClass}":
        rules = body.get("rules", []) if isinstance(body, dict) else []
        if not isinstance(rules, list):
            raise HTTPException(status_code=400, detail="Policy rules must be a list.")
        normalized_rules = [
            {
                "integrationKey": str(rule.get("integrationKey") or ""),
                "toolNames": [str(item) for item in (rule.get("toolNames") or [])],
                "scopes": [str(item) for item in (rule.get("scopes") or [])],
                "enabled": bool(rule.get("enabled", True)),
            }
            for rule in rules
            if isinstance(rule, dict) and str(rule.get("integrationKey") or "").strip()
        ]
        return repository.upsert_policy(params["agentClass"], normalized_rules)

    if path == "/api/integrations" or path == "/api/user/integrations":
        if method == "GET":
            return repository.list_integrations(owner)
        integration = IntegrationSpec.model_validate(body)
        if integration.authStrategy == "oauth2" and integration.credentials:
            raise HTTPException(
                status_code=400,
                detail="OAuth integrations cannot store credentials directly. Save per-user OAuth connections instead.",
            )
        assert_user_can_save_integration(owner, integration)
        return repository.save_integration(
            owner, apply_managed_constraints(integration)
        )

    if (
        path == "/api/integrations/{integrationKey}"
        or path == "/api/user/integrations/{integrationKey}"
    ):
        if not repository.delete_integration(owner, params["integrationKey"]):
            raise HTTPException(status_code=404, detail="Integration not found.")
        return {"deleted": True, "integrationKey": params["integrationKey"]}

    if path == "/api/integrations/{integrationKey}/toggle":
        integration = repository.get_integration(owner, params["integrationKey"])
        if not integration:
            raise HTTPException(status_code=404, detail="Integration not found.")
        integration.enabled = bool(body.get("enabled", not integration.enabled))
        return repository.save_integration(
            owner, apply_managed_constraints(integration)
        )

    if path == "/api/integrations/{integrationKey}/tools":
        tool = repository.save_tool(
            owner, params["integrationKey"], ToolSpec.model_validate(body)
        )
        if not tool:
            raise HTTPException(status_code=404, detail="Integration not found.")
        return tool

    if path in {
        "/api/integrations/{integrationKey}/tools/{toolName}",
        "/api/user/integrations/{integrationKey}/tools/{toolName}",
    }:
        try:
            tool = repository.update_tool(
                owner, params["integrationKey"], params["toolName"], body
            )
        except ValueError as exc:
            raise HTTPException(status_code=403, detail=str(exc)) from exc
        if not tool:
            raise HTTPException(status_code=404, detail="Tool not found.")
        return tool

    if path == "/api/integrations/{integrationKey}/tools/{toolName}/toggle":
        access_mode = "enabled" if body.get("enabled", True) else "disabled"
        try:
            tool = repository.update_tool(
                owner,
                params["integrationKey"],
                params["toolName"],
                {"accessMode": access_mode, "enabled": access_mode != "disabled"},
            )
        except ValueError as exc:
            raise HTTPException(status_code=403, detail=str(exc)) from exc
        if not tool:
            raise HTTPException(status_code=404, detail="Tool not found.")
        return tool

    if path in {"/api/integrations/discover", "/api/admin/integrations/discover"}:
        if path == "/api/integrations/discover" and isinstance(body, dict):
            assert_user_can_discover_integration(owner, body)
        return discovered_integration(body, owner)

    if path == "/api/integrations/disable-unused":
        return disable_unused_tools(owner, body if isinstance(body, dict) else {})

    if path in {
        "/api/integrations/managed-connectors",
        "/api/admin/integrations/managed-connectors",
    }:
        return [
            connector.option()
            for connector in list_managed_connectors()
            if connector.enabled
        ]

    if path == "/api/managed-connectors" or path == "/api/admin/managed-connectors":
        if method == "GET":
            return [connector.response() for connector in list_managed_connectors()]
        require_app_admin(owner, ADMIN_CONNECTOR_MANAGEMENT_DETAIL)
        connector = ensure_managed_oauth_client(ManagedConnector.model_validate(body))
        return repository.save_managed_connector(connector).response()

    if (
        path == "/api/managed-connectors/{slug}"
        or path == "/api/admin/managed-connectors/{slug}"
    ):
        require_app_admin(owner, ADMIN_CONNECTOR_MANAGEMENT_DETAIL)
        if not repository.delete_managed_connector(params["slug"]):
            raise HTTPException(status_code=404, detail="Managed connector not found.")
        return {"deleted": True, "slug": params["slug"]}

    if path == "/api/managed-connectors/{slug}/functions":
        require_app_admin(owner, ADMIN_CONNECTOR_MANAGEMENT_DETAIL)
        return index_managed_connector_functions(params["slug"], owner)

    if path == "/api/context/{integrationKey}/{toolName}":
        integration = repository.get_integration(owner, params["integrationKey"])
        payload = ContextInvocationRequest.model_validate(body)
        if not integration or not integration.enabled:
            raise HTTPException(
                status_code=404, detail="Integration not found or disabled."
            )
        tool = integration.tools.get(params["toolName"])
        if not tool or not tool.enabled or tool.accessMode == "disabled":
            raise HTTPException(status_code=403, detail="Tool is disabled.")
        data = invoke_enabled_tool(
            owner,
            integration,
            tool,
            payload.scopes,
            payload.payload,
            payload.agentId,
            payload.agentClass,
        )
        return {
            "integration": integration.key,
            "tool": tool.name,
            "provider": integration.provider,
            "kind": integration.kind,
            "authStrategy": integration.authStrategy,
            "decision": {
                "allowed": True,
                "reason": "Tool is enabled.",
                "effectiveScopes": payload.scopes,
            },
            "data": data,
        }

    if path in {"/api/case-by-case-approvals", "/api/user/access-requests"}:
        return repository.list_access_requests(owner)

    if path == "/api/admin/access-requests":
        return repository.list_access_requests(None)

    if path.endswith("/approve") or path.endswith("/reject"):
        request_id = params["requestId"]
        request_owner = None if path.startswith("/api/admin/") else owner
        if path.endswith("/approve"):
            duration = body.get("durationMinutes") if isinstance(body, dict) else None
            return approve_access_request(
                request_owner, request_id, owner, int(duration) if duration else None
            )
        return reject_access_request(request_owner, request_id, owner)

    if path == "/api/user/key":
        bucket, prefix = repository.user_keys, "clu"
    elif path == "/api/user/agent-key":
        bucket, prefix = repository.agent_keys, "cla"
    elif path == "/api/admin/key":
        bucket, prefix = repository.admin_keys, "clad"
    else:
        bucket = prefix = None
    if bucket is not None:
        key_kind = (
            "agent" if prefix == "cla" else "user" if prefix == "clu" else "admin"
        )
        if key_kind == "admin":
            require_app_admin(owner, ADMIN_KEY_MANAGEMENT_DETAIL)
        if method == "DELETE":
            return {"revoked": repository.delete_key(owner, key_kind)}
        if method == "POST":
            value = repository.rotate_key(bucket, owner, prefix)  # type: ignore[arg-type]
            data = repository.save_key(owner, key_kind, value)
        else:
            data = repository.get_key(owner, key_kind)
        if key_kind == "agent":
            key = data.get("key") or {}
            return {
                "ownerId": owner,
                "apiKey": data["apiKey"],
                "createdAt": key.get("createdAt") or now_iso(),
                "updatedAt": key.get("updatedAt") or now_iso(),
            }
        if method == "POST":
            return data
        return {"hasKey": data["hasKey"], "key": data["key"], "apiKey": data["apiKey"]}

    if path == "/api/admin/overview":
        return repository.overview()

    raise HTTPException(
        status_code=501,
        detail=f"FastAPI handler for {method} {path} is not implemented.",
    )


async def auth_handler(request: Request):
    owner = owner_id(request)
    path = request.url.path
    if path.endswith("/session"):
        return {
            "user": {"name": owner, "email": owner},
            "expires": "2099-01-01T00:00:00.000Z",
        }
    if path.endswith("/providers"):
        return {
            "github": {
                "id": "github",
                "name": "GitHub",
                "type": "oauth",
                "signinUrl": "/api/auth/signin/github",
                "callbackUrl": "/api/auth/callback/github",
            }
        }
    if path.endswith("/csrf"):
        return {"csrfToken": "fastapi-preview-csrf"}
    if "/signin" in path:
        return RedirectResponse("/integrations")
    if "/signout" in path:
        return RedirectResponse("/signin")
    if "/callback" in path:
        return RedirectResponse("/integrations")
    return {"ok": True}


for route_method, route_path in ROUTES:
    app.add_api_route(
        route_path,
        fastapi_handler,
        methods=[route_method],
        name=f"{route_method} {route_path}",
    )

app.add_api_route(
    "/api/health", fastapi_handler, methods=["GET"], name="GET /api/health"
)

for auth_path in [
    "/api/auth/session",
    "/api/auth/providers",
    "/api/auth/csrf",
    "/api/auth/signin/{provider}",
    "/api/auth/signout",
    "/api/auth/callback/{provider}",
]:
    app.add_api_route(
        auth_path, auth_handler, methods=["GET", "POST"], name=f"AUTH {auth_path}"
    )

# Mount static files for SPA serving (K8s/Docker mode only).
# This must be called AFTER all API routes are registered, as it includes
# a catch-all route for SPA client-side routing.
# On Vercel, STATIC_DIR is not set, so this is a no-op.
mount_static_files(app)
