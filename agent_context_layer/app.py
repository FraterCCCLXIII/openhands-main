from __future__ import annotations

import json
import os
from html import escape
from typing import Any

from fastapi import FastAPI, Form, Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from pydantic import BaseModel, Field
from starlette.middleware.sessions import SessionMiddleware

from agent_context_layer.auth import GoogleOAuthClient
from agent_context_layer.models import AccessRequest, FunctionSpec, IntegrationSpec, NotificationChannel, PolicyRule
from agent_context_layer.services import ContextLayerError, ContextLayerService


class IntegrationCreate(BaseModel):
    key: str
    name: str
    kind: str
    auth_strategy: str
    enabled: bool = True
    fine_grained_permissions: bool = True
    config: dict[str, Any] = Field(default_factory=dict)
    credentials: dict[str, Any] = Field(default_factory=dict)


class FunctionCreate(BaseModel):
    name: str
    description: str = ""
    enabled: bool = True
    fine_grained_permissions: bool = True
    default_scopes: set[str] = Field(default_factory=set)
    execution_mode: str = "simulated"
    config: dict[str, Any] = Field(default_factory=dict)
    mock_response: dict[str, Any] = Field(default_factory=dict)


class PolicyUpdate(BaseModel):
    rules: list[PolicyRule]


class AccessRequestCreate(BaseModel):
    agent_id: str
    agent_class: str
    integration_key: str
    function_name: str
    scopes: set[str] = Field(default_factory=set)
    requested_minutes: int = 30
    channels: list[NotificationChannel] = Field(default_factory=list)
    notification_targets: dict[str, str] = Field(default_factory=dict)
    justification: str = ""


class AccessRequestDecision(BaseModel):
    approver: str
    duration_minutes: int | None = None


class ContextInvokeRequest(BaseModel):
    agent_id: str
    agent_class: str
    scopes: set[str] = Field(default_factory=set)
    payload: dict[str, Any] = Field(default_factory=dict)


def create_app(service: ContextLayerService | None = None) -> FastAPI:
    app = FastAPI(title="Agent Context Layer", version="0.1.0")
    app.add_middleware(SessionMiddleware, secret_key=os.getenv("SESSION_SECRET", "local-dev-secret"))
    app.state.service = service or ContextLayerService()
    app.state.service.seed_demo_data()
    app.state.google_oauth = GoogleOAuthClient()

    @app.exception_handler(ContextLayerError)
    async def handle_context_error(_: Request, exc: ContextLayerError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

    @app.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.get("/", response_class=HTMLResponse)
    async def home(request: Request) -> str:
        user = request.session.get("user")
        google_enabled = app.state.google_oauth.config.enabled
        return _page(
            "Agent Context Layer",
            f"""
            <section class='hero'>
              <h1>Agent Context Layer</h1>
              <p>One endpoint for APIs and MCP-style services, with policy, approval, and notification controls.</p>
              <div class='actions'>
                <a class='button' href='/admin'>Open admin</a>
                <a class='button secondary' href='/login'>{'Switch account' if user else 'Login'}</a>
              </div>
              <ul>
                <li>Google login ready: <strong>{'enabled' if google_enabled else 'configure GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET'}</strong></li>
                <li>Unified endpoint: <code>POST /api/context/{{integration}}/{{function}}</code></li>
                <li>Dynamic approval: <code>POST /api/access-requests</code> and approve through UI or API</li>
              </ul>
            </section>
            """,
        )

    @app.get("/login", response_class=HTMLResponse)
    async def login_page(_: Request) -> str:
        google_enabled = app.state.google_oauth.config.enabled
        google_button = (
            "<a class='button' href='/auth/google/start'>Continue with Google</a>"
            if google_enabled
            else "<p class='muted'>Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to enable Google login.</p>"
        )
        return _page(
            "Login",
            f"""
            <h1>Login</h1>
            <p>Use a standard provider like Google or the local dev login for testing.</p>
            <div class='stack'>{google_button}</div>
            <form method='post' action='/auth/dev-login' class='card'>
              <label>Email <input type='email' name='email' value='admin@example.com' required></label>
              <label>Name <input type='text' name='name' value='Admin User' required></label>
              <button type='submit'>Use dev login</button>
            </form>
            """,
        )

    @app.get('/auth/google/start')
    async def google_start(request: Request) -> RedirectResponse:
        return RedirectResponse(app.state.google_oauth.build_authorize_url(request), status_code=302)

    @app.get('/auth/google/callback', name='google_callback')
    async def google_callback(request: Request, code: str, state: str) -> RedirectResponse:
        request.session['user'] = await app.state.google_oauth.authenticate(request, code, state)
        return RedirectResponse('/admin', status_code=302)

    @app.post('/auth/dev-login')
    async def dev_login(request: Request, email: str = Form(...), name: str = Form(...)) -> RedirectResponse:
        request.session['user'] = {'provider': 'dev', 'email': email, 'name': name}
        return RedirectResponse('/admin', status_code=303)

    @app.post('/auth/logout')
    async def logout(request: Request) -> RedirectResponse:
        request.session.clear()
        return RedirectResponse('/', status_code=303)

    @app.get('/admin', response_class=HTMLResponse)
    async def admin_dashboard(request: Request):
        user = request.session.get('user')
        if not user:
            return RedirectResponse('/login', status_code=303)
        service: ContextLayerService = app.state.service
        integrations = service.list_integrations()
        access_requests = service.list_access_requests()
        notifications = service.list_notifications()[:10]
        return _page(
            'Admin',
            f"""
            <header class='toolbar'>
              <div>
                <h1>Admin dashboard</h1>
                <p>Signed in as <strong>{escape(user['email'])}</strong> via {escape(user['provider'])}.</p>
              </div>
              <form method='post' action='/auth/logout'><button type='submit'>Logout</button></form>
            </header>
            <section class='grid'>
              <article class='card'>
                <h2>Add integration</h2>
                <form method='post' action='/admin/integrations' class='stack'>
                  <input name='key' placeholder='integration key' required>
                  <input name='name' placeholder='Display name' required>
                  <select name='kind'><option value='api'>API</option><option value='mcp'>MCP</option></select>
                  <select name='auth_strategy'>
                    <option value='none'>none</option><option value='oauth2'>oauth2</option><option value='api_key'>api_key</option>
                    <option value='bearer'>bearer</option><option value='basic'>basic</option><option value='mcp_session'>mcp_session</option>
                  </select>
                  <textarea name='config_json' placeholder='{"base_url": "https://api.example.com"}'></textarea>
                  <button type='submit'>Create integration</button>
                </form>
              </article>
              <article class='card'>
                <h2>Agent access requests</h2>
                {''.join(_render_request_card(item) for item in access_requests) or '<p class="muted">No access requests yet.</p>'}
              </article>
            </section>
            <section class='card'>
              <h2>Registered integrations</h2>
              {''.join(_render_integration_card(item) for item in integrations)}
            </section>
            <section class='card'>
              <h2>Recent notifications</h2>
              {''.join(_render_notification_row(item) for item in notifications) or '<p class="muted">No notifications sent yet.</p>'}
            </section>
            """,
        )

    @app.post('/admin/integrations')
    async def admin_create_integration(
        key: str = Form(...),
        name: str = Form(...),
        kind: str = Form(...),
        auth_strategy: str = Form(...),
        config_json: str = Form('{}'),
    ) -> RedirectResponse:
        config = json.loads(config_json or '{}')
        app.state.service.register_integration(
            IntegrationSpec(key=key, name=name, kind=kind, auth_strategy=auth_strategy, config=config)
        )
        return RedirectResponse('/admin', status_code=303)

    @app.post('/admin/requests/{request_id}/approve')
    async def admin_approve_request(request_id: str, approver: str = Form(...), duration_minutes: int = Form(30)) -> RedirectResponse:
        app.state.service.approve_access_request(request_id, approver=approver, duration_minutes=duration_minutes)
        return RedirectResponse('/admin', status_code=303)

    @app.post('/admin/requests/{request_id}/reject')
    async def admin_reject_request(request_id: str, approver: str = Form(...)) -> RedirectResponse:
        app.state.service.reject_access_request(request_id, approver=approver)
        return RedirectResponse('/admin', status_code=303)

    @app.get('/api/auth/providers')
    async def auth_providers() -> dict[str, Any]:
        return {'google': app.state.google_oauth.config.enabled, 'dev_login': True}

    @app.get('/api/integrations')
    async def list_integrations() -> list[dict[str, Any]]:
        return [item.model_dump(mode='json') for item in app.state.service.list_integrations()]

    @app.post('/api/integrations')
    async def create_integration(payload: IntegrationCreate) -> dict[str, Any]:
        return app.state.service.register_integration(IntegrationSpec(**payload.model_dump())).model_dump(mode='json')

    @app.post('/api/integrations/{integration_key}/functions')
    async def create_function(integration_key: str, payload: FunctionCreate) -> dict[str, Any]:
        return app.state.service.add_function(integration_key, FunctionSpec(**payload.model_dump())).model_dump(mode='json')

    @app.post('/api/integrations/{integration_key}/toggle')
    async def toggle_integration(integration_key: str, enabled: bool) -> dict[str, Any]:
        return app.state.service.set_integration_enabled(integration_key, enabled).model_dump(mode='json')

    @app.post('/api/integrations/{integration_key}/functions/{function_name}/toggle')
    async def toggle_function(integration_key: str, function_name: str, enabled: bool) -> dict[str, Any]:
        return app.state.service.set_function_enabled(integration_key, function_name, enabled).model_dump(mode='json')

    @app.put('/api/agent-classes/{agent_class}')
    async def update_policy(agent_class: str, payload: PolicyUpdate) -> dict[str, Any]:
        return app.state.service.upsert_agent_policy(agent_class, payload.rules).model_dump(mode='json')

    @app.get('/api/access-requests')
    async def access_requests() -> list[dict[str, Any]]:
        return [item.model_dump(mode='json') for item in app.state.service.list_access_requests()]

    @app.post('/api/access-requests')
    async def create_access_request(payload: AccessRequestCreate) -> dict[str, Any]:
        return app.state.service.create_access_request(AccessRequest(**payload.model_dump())).model_dump(mode='json')

    @app.post('/api/access-requests/{request_id}/approve')
    async def approve_access_request(request_id: str, payload: AccessRequestDecision) -> dict[str, Any]:
        return app.state.service.approve_access_request(request_id, payload.approver, payload.duration_minutes).model_dump(mode='json')

    @app.post('/api/access-requests/{request_id}/reject')
    async def reject_access_request(request_id: str, payload: AccessRequestDecision) -> dict[str, Any]:
        return app.state.service.reject_access_request(request_id, payload.approver).model_dump(mode='json')

    @app.get('/api/notifications')
    async def notifications() -> list[dict[str, Any]]:
        return [item.model_dump(mode='json') for item in app.state.service.list_notifications()]

    @app.post('/api/context/{integration_key}/{function_name}')
    async def invoke_context(integration_key: str, function_name: str, payload: ContextInvokeRequest) -> dict[str, Any]:
        return await app.state.service.invoke_context(
            agent_id=payload.agent_id,
            agent_class=payload.agent_class,
            integration_key=integration_key,
            function_name=function_name,
            payload=payload.payload,
            requested_scopes=payload.scopes,
        )

    return app


def _page(title: str, body: str) -> str:
    return f"""
    <!doctype html>
    <html lang='en'>
      <head>
        <meta charset='utf-8'>
        <meta name='viewport' content='width=device-width, initial-scale=1'>
        <title>{escape(title)}</title>
        <style>
          body {{ font-family: Inter, Arial, sans-serif; margin: 0; background: #0f172a; color: #e2e8f0; }}
          main {{ max-width: 1100px; margin: 0 auto; padding: 3rem 1.25rem; }}
          .hero, .card {{ background: #111827; border: 1px solid #334155; border-radius: 18px; padding: 1.25rem; margin-bottom: 1rem; }}
          .grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1rem; }}
          .toolbar {{ display: flex; justify-content: space-between; gap: 1rem; align-items: start; }}
          .stack {{ display: grid; gap: .75rem; }}
          label {{ display: grid; gap: .35rem; }}
          input, textarea, select, button {{ font: inherit; border-radius: 10px; border: 1px solid #475569; padding: .7rem .8rem; }}
          textarea {{ min-height: 88px; }}
          button, .button {{ background: #4f46e5; color: white; text-decoration: none; display: inline-block; cursor: pointer; }}
          .button.secondary {{ background: #1e293b; }}
          .actions {{ display: flex; gap: .75rem; margin: 1rem 0; }}
          code {{ background: #1e293b; padding: .2rem .35rem; border-radius: 8px; }}
          .muted {{ color: #94a3b8; }}
          .pill {{ display: inline-block; margin-right: .5rem; background: #1e293b; padding: .2rem .5rem; border-radius: 999px; }}
          .request-actions {{ display: flex; flex-wrap: wrap; gap: .5rem; margin-top: .75rem; }}
        </style>
      </head>
      <body>
        <main>{body}</main>
      </body>
    </html>
    """


def _render_integration_card(integration: IntegrationSpec) -> str:
    rendered_functions = ''.join(
        f"<li><strong>{escape(function.name)}</strong> — {'enabled' if function.enabled else 'disabled'}; scopes: {escape(', '.join(sorted(function.default_scopes)) or 'none')}</li>"
        for function in integration.functions.values()
    ) or "<li class='muted'>No functions registered.</li>"
    return f"""
    <article class='card'>
      <h3>{escape(integration.name)} <span class='pill'>{escape(integration.key)}</span></h3>
      <p>{escape(str(integration.kind))} / {escape(str(integration.auth_strategy))} / {'enabled' if integration.enabled else 'disabled'}</p>
      <ul>{rendered_functions}</ul>
    </article>
    """


def _render_request_card(access_request: AccessRequest) -> str:
    actions = ''
    if access_request.status == 'pending':
        actions = f"""
        <div class='request-actions'>
          <form method='post' action='/admin/requests/{escape(access_request.id)}/approve'>
            <input type='hidden' name='approver' value='admin-ui'>
            <input type='hidden' name='duration_minutes' value='{access_request.requested_minutes}'>
            <button type='submit'>Approve</button>
          </form>
          <form method='post' action='/admin/requests/{escape(access_request.id)}/reject'>
            <input type='hidden' name='approver' value='admin-ui'>
            <button type='submit'>Reject</button>
          </form>
        </div>
        """
    return f"""
    <div class='card'>
      <strong>{escape(access_request.integration_key)}.{escape(access_request.function_name)}</strong>
      <p>{escape(access_request.agent_id)} ({escape(access_request.agent_class)}) requested {escape(', '.join(sorted(access_request.scopes)) or 'default scopes')}.</p>
      <p>Status: <strong>{escape(str(access_request.status))}</strong> for {access_request.requested_minutes} minutes.</p>
      {actions}
    </div>
    """


def _render_notification_row(notification: Any) -> str:
    return f"""
    <div class='card'>
      <strong>{escape(str(notification.channel))}</strong> → {escape(notification.recipient)}
      <p>{escape(notification.subject)}</p>
      <p class='muted'>{escape(notification.body)}</p>
    </div>
    """
