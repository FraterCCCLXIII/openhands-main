# Design Dark Factory

> Automated design review system with human-in-the-loop for PR/issue queues across OpenHands, Agent Canvas, and enterprise repositories.

## Overview

The Design Dark Factory is an autonomous design review pipeline that:
1. **Monitors** multiple input sources (GitHub PRs/issues, Slack mentions, Linear tickets, Notion pages)
2. **Triages** incoming work by extracting context and categorizing priority
3. **Reviews** design aspects of PRs and issues using specialized AI agents
4. **Surfaces** reviews for human approval before action
5. **Tracks** all outstanding work in a unified dashboard

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DESIGN DARK FACTORY                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   GitHub     │  │    Slack     │  │    Linear    │  │   Notion     │     │
│  │  PRs/Issues  │  │   Mentions   │  │   Tickets    │  │    Pages     │     │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘     │
│         │                 │                 │                 │              │
│         └────────────┬────┴────────┬────────┴────────┬────────┘              │
│                      ▼             ▼                 ▼                       │
│              ┌─────────────────────────────────────────┐                     │
│              │         CONTEXT AGGREGATOR              │                     │
│              │  • Extract mentions to @paulbloch       │                     │
│              │  • Correlate across sources             │                     │
│              │  • Build unified work items             │                     │
│              └────────────────┬────────────────────────┘                     │
│                               ▼                                              │
│              ┌─────────────────────────────────────────┐                     │
│              │           TRIAGE ENGINE                 │                     │
│              │  • Categorize: design-review, bug, etc  │                     │
│              │  • Prioritize by urgency + impact       │                     │
│              │  • Route to appropriate review queue    │                     │
│              └────────────────┬────────────────────────┘                     │
│                               ▼                                              │
│              ┌─────────────────────────────────────────┐                     │
│              │        DESIGN REVIEW AGENTS             │                     │
│              │  • PR Design Review Agent               │                     │
│              │  • Issue Spec Analysis Agent            │                     │
│              │  • Architecture Impact Agent            │                     │
│              └────────────────┬────────────────────────┘                     │
│                               ▼                                              │
│              ┌─────────────────────────────────────────┐                     │
│              │       HUMAN-IN-THE-LOOP GATE            │                     │
│              │  • Slack approval thread                │                     │
│              │  • Review before posting/merging        │                     │
│              │  • Override/edit capabilities           │                     │
│              └────────────────┬────────────────────────┘                     │
│                               ▼                                              │
│              ┌─────────────────────────────────────────┐                     │
│              │           ACTION EXECUTOR               │                     │
│              │  • Post GitHub review comments          │                     │
│              │  • Update Linear status                 │                     │
│              │  • Create Notion summaries              │                     │
│              └─────────────────────────────────────────┘                     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Input Sources

### 1. GitHub (PRs & Issues)

**Target Repositories:**
- `OpenHands/OpenHands` (agent-canvas frontend)
- Enterprise repositories (configurable list)

**Trigger Types:**

| Event | Trigger | Use Case |
|-------|---------|----------|
| PR opened | `pull_request.opened` | Auto-generate design review |
| PR labeled | `pull_request.labeled` | Trigger on `design-review` label |
| Issue opened | `issues.opened` | Analyze for design implications |
| @mention in comment | `issue_comment.created` | Direct request for design input |
| PR ready for review | `pull_request.ready_for_review` | Full design analysis |

**Data Extracted:**
- PR diff and changed files
- Issue description and labels
- Linked issues/PRs
- Author history and recent context
- Repository AGENTS.md and specs/

### 2. Slack Mentions

**Tracking:** Personal account mentions (`@paulbloch`) across configured channels

**Implementation:** Polling automation (webhooks require public URL)

**Data Extracted:**
- Message content and thread context
- Channel and timestamp
- Linked URLs (GitHub, Linear, Notion)
- Sender information
- Thread replies for full context

**Polling Schedule:** Every 5 minutes

### 3. Linear Tickets

**Tracking:** All tickets assigned to or mentioning the user

**Implementation:** 
- Webhook if publicly reachable
- Polling fallback every 15 minutes

**Data Extracted:**
- Ticket title, description, priority
- Labels and project
- Linked GitHub PRs
- Comments and history
- Related tickets

### 4. Notion Pages

**Tracking:** Configured databases and pages

**Implementation:** Polling (Notion doesn't support webhooks to external URLs)

**Data Extracted:**
- Page content and properties
- Linked items
- Recent updates
- Comments

**Polling Schedule:** Every 30 minutes

---

## Processing Pipeline

### Stage 1: Context Aggregator

Correlates mentions and work items across sources:

```python
# Pseudo-schema for unified work item
WorkItem = {
    "id": "wk_xxx",
    "title": str,
    "description": str,
    "source": "github" | "slack" | "linear" | "notion",
    "source_id": str,  # Original ID in source system
    "source_url": str,
    "mentions": [
        {"platform": str, "message": str, "timestamp": str, "sender": str}
    ],
    "linked_items": [
        {"type": "pr" | "issue" | "ticket", "id": str, "url": str}
    ],
    "context": {
        "repository": str,
        "files_changed": [str],
        "labels": [str],
        "priority": "p0" | "p1" | "p2" | "p3",
    },
    "created_at": str,
    "updated_at": str,
}
```

### Stage 2: Triage Engine

Categorizes and prioritizes work items:

**Categories:**
- `design-review`: PR needs design feedback
- `spec-analysis`: Issue needs design implications analyzed
- `architecture-review`: Changes touch core architecture
- `quick-feedback`: Simple question or acknowledgment needed
- `escalation`: Urgent or blocked item

**Priority Factors:**
1. Explicit urgency markers (`urgent`, `blocking`, `p0`)
2. Author (team leads, stakeholders)
3. Repository criticality (production vs internal)
4. Age of request
5. Number of mentions/pings

### Stage 3: Design Review Agents

Specialized agents for different review types:

#### PR Design Review Agent

**Prompt Template:**
```
Review this pull request for design quality. Focus on:

1. **Architecture Fit**: Does this change fit the existing architecture?
2. **API Design**: Are new APIs well-designed and consistent?
3. **Component Boundaries**: Are concerns properly separated?
4. **Naming**: Are names clear and consistent with codebase conventions?
5. **Extensibility**: Will this be easy to extend or modify?
6. **Testing Strategy**: Is the testing approach appropriate?

Repository: {repository}
PR Title: {title}
PR Description: {description}
Files Changed: {files_changed}

Diff:
{diff}

Repository Guidelines (from AGENTS.md):
{agents_md}

Provide a structured review with:
- Summary (1-2 sentences)
- Design Strengths (bullet points)
- Design Concerns (bullet points with severity: critical/major/minor)
- Suggested Changes (specific, actionable)
- Questions for Author (if any)
```

#### Issue Spec Analysis Agent

**Prompt Template:**
```
Analyze this issue for design implications:

Issue: {title}
Description: {description}
Labels: {labels}
Repository: {repository}

Provide:
1. Summary of the request
2. Design considerations for implementation
3. Potential approaches (with tradeoffs)
4. Questions that need answering before implementation
5. Related components or systems that might be affected
```

---

## Human-in-the-Loop Workflow

### Approval Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    REVIEW READY FOR APPROVAL                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📋 PR #1234: Add new settings panel                            │
│  Repository: OpenHands/OpenHands                                 │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  🤖 Design Review Summary:                                       │
│                                                                  │
│  ✅ Clean component structure                                    │
│  ✅ Follows existing patterns                                    │
│                                                                  │
│  ⚠️ Concerns:                                                    │
│  • [Major] New settings key not documented in schema             │
│  • [Minor] Consider extracting validation logic                  │
│                                                                  │
│  📝 Suggested comment:                                           │
│  "Overall solid implementation. Two suggestions: ..."            │
│                                                                  │
│  ────────────────────────────────────────────────────────────   │
│                                                                  │
│  [✅ Approve & Post]  [✏️ Edit]  [❌ Dismiss]  [⏸️ Hold]        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Slack Integration

Reviews are posted to a private approval channel:

1. **Review arrives** → Bot posts summary with action buttons
2. **Human reviews** → Can approve, edit, dismiss, or hold
3. **On approve** → Review posted to GitHub PR
4. **On edit** → Opens thread for modifications
5. **Metrics tracked** → Approval rate, edit frequency, time-to-action

### Override Capabilities

- **Edit review text** before posting
- **Adjust severity** of concerns
- **Add personal notes** not from AI
- **Batch approve** multiple reviews
- **Snooze** reviews for later
- **Escalate** to different reviewer

---

## Implementation with OpenHands Automations

### Automation 1: GitHub PR Design Review

```bash
curl -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PR Design Review - Agent Canvas",
    "prompt": "Review this PR for design quality following the repository design guidelines. Read the AGENTS.md and relevant specs. Generate a structured design review. Do NOT post the review - save it to /workspace/reviews/pending/{pr_number}.json for human approval.",
    "trigger": {
      "type": "event",
      "source": "github",
      "on": ["pull_request.opened", "pull_request.ready_for_review", "pull_request.labeled"],
      "filter": "repository.full_name == '\''OpenHands/OpenHands'\'' && (action != '\''labeled'\'' || contains(pull_request.labels[].name, '\''design-review'\''))"
    },
    "timeout": 600,
    "repos": [
      {"url": "https://github.com/OpenHands/OpenHands", "ref": "main"}
    ]
  }'
```

### Automation 2: Slack Mention Tracker

```bash
# This is a custom no-LLM script for efficient polling
cat > main.py << 'PYEOF'
"""Poll Slack for mentions and create work items. No LLM needed."""
import json, os, sys, urllib.request
from datetime import datetime, timedelta

CHANNEL_IDS = ["C12345678", "C87654321"]  # Channels to monitor
USER_TO_TRACK = "U12345678"  # Your Slack user ID

def get_secret(name):
    url = os.environ.get("AGENT_SERVER_URL", "").rstrip("/")
    key = os.environ.get("SESSION_API_KEY", "")
    if url:
        url = f"{url}/api/settings/secrets/{name}"
    else:
        api = os.environ["OPENHANDS_CLOUD_API_URL"].rstrip("/")
        url = f"{api}/api/v1/sandboxes/{os.environ['SANDBOX_ID']}/settings/secrets/{name}"
    with urllib.request.urlopen(urllib.request.Request(
        url, headers={"X-Session-API-Key": key}
    )) as r:
        return r.read().decode().strip()

def fire_callback(status="COMPLETED", error=None):
    url = os.environ.get("AUTOMATION_CALLBACK_URL", "")
    if not url: return
    body = {"status": status, "run_id": os.environ.get("AUTOMATION_RUN_ID", "")}
    if error: body["error"] = error
    try:
        urllib.request.urlopen(urllib.request.Request(url, data=json.dumps(body).encode(), headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {os.environ.get('AUTOMATION_CALLBACK_API_KEY', '')}",
        }))
    except Exception as e: print(f"Callback error: {e}")

def slack_api(method, params=None):
    token = get_secret("SLACK_BOT_TOKEN")
    url = f"https://slack.com/api/{method}"
    if params:
        url += "?" + "&".join(f"{k}={v}" for k, v in params.items())
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as r:
        return json.load(r)

def kv_get(key):
    # Use KV store for state persistence (see automation skill)
    token = os.environ.get("AUTOMATION_KV_TOKEN", "")
    if not token: return None
    # Implementation depends on KV store API
    return None

def kv_set(key, value):
    token = os.environ.get("AUTOMATION_KV_TOKEN", "")
    if not token: return
    # Implementation depends on KV store API
    pass

try:
    last_check = kv_get("last_slack_check") or (datetime.utcnow() - timedelta(minutes=10)).timestamp()
    
    mentions = []
    for channel_id in CHANNEL_IDS:
        result = slack_api("conversations.history", {
            "channel": channel_id,
            "oldest": str(last_check),
            "limit": "100"
        })
        for msg in result.get("messages", []):
            if f"<@{USER_TO_TRACK}>" in msg.get("text", ""):
                mentions.append({
                    "channel": channel_id,
                    "ts": msg["ts"],
                    "text": msg["text"],
                    "user": msg.get("user"),
                    "thread_ts": msg.get("thread_ts")
                })
    
    if mentions:
        # Save mentions for processing by triage automation
        os.makedirs("/workspace/mentions/slack", exist_ok=True)
        with open(f"/workspace/mentions/slack/{int(datetime.utcnow().timestamp())}.json", "w") as f:
            json.dump(mentions, f)
        print(f"Found {len(mentions)} new mentions")
    
    kv_set("last_slack_check", str(datetime.utcnow().timestamp()))
    fire_callback("COMPLETED")
    
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    fire_callback("FAILED", str(e))
    sys.exit(1)
PYEOF
```

### Automation 3: Human Approval Processor

```bash
curl -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Design Review Approval Processor",
    "prompt": "Check /workspace/reviews/pending/ for new reviews. For each review, post a summary to the approval Slack channel with action buttons. Track responses and process approved reviews by posting to GitHub. Move processed reviews to /workspace/reviews/posted/.",
    "trigger": {
      "type": "cron",
      "schedule": "*/5 * * * *",
      "timezone": "UTC"
    },
    "timeout": 300
  }'
```

### Automation 4: Linear Ticket Analyzer

```bash
curl -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Linear Ticket Design Analysis",
    "prompt": "Analyze new Linear tickets for design implications. For tickets labeled '\''design-needed'\'', generate a design analysis document. Save to /workspace/analyses/linear/{ticket_id}.md. Focus on: scope, affected systems, suggested approach, and open questions.",
    "trigger": {
      "type": "event",
      "source": "linear",
      "on": "Issue",
      "filter": "action == '\''create'\'' || (action == '\''update'\'' && contains(data.labelIds, '\''design-needed-label-id'\''))"
    },
    "timeout": 600
  }'
```

### Automation 5: Work Dashboard Generator

```bash
curl -X POST "${OPENHANDS_HOST}/api/automation/v1/preset/prompt" \
  -H "Authorization: Bearer ${OPENHANDS_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Daily Work Dashboard",
    "prompt": "Generate a comprehensive dashboard of all outstanding work. Pull from: GitHub (open PRs needing review, issues assigned), Linear (tickets in progress, blocked items), Notion (active docs). Create a prioritized summary with: P0 items needing immediate attention, P1 items due this week, all pending design reviews, and blocked items. Post to Slack #design-review channel.",
    "trigger": {
      "type": "cron",
      "schedule": "0 9 * * 1-5",
      "timezone": "America/Los_Angeles"
    },
    "timeout": 900
  }'
```

---

## Required Secrets

Configure these in OpenHands settings:

| Secret Name | Purpose |
|-------------|---------|
| `GITHUB_TOKEN` | GitHub API access (read PRs, post reviews) |
| `SLACK_BOT_TOKEN` | Slack API (read messages, post to channels) |
| `LINEAR_API_KEY` | Linear API access |
| `NOTION_API_KEY` | Notion API access |

---

## Directory Structure

```
/workspace/
├── reviews/
│   ├── pending/           # Reviews awaiting human approval
│   │   └── {pr_number}.json
│   ├── posted/            # Reviews that have been posted
│   │   └── {pr_number}.json
│   └── dismissed/         # Reviews dismissed by human
│       └── {pr_number}.json
├── mentions/
│   ├── slack/             # Slack mentions
│   │   └── {timestamp}.json
│   └── github/            # GitHub @mentions
│       └── {timestamp}.json
├── analyses/
│   ├── linear/            # Linear ticket analyses
│   │   └── {ticket_id}.md
│   └── notion/            # Notion page analyses
│       └── {page_id}.md
└── dashboards/
    └── {date}.md          # Daily dashboards
```

---

## Metrics & Observability

### Key Metrics

| Metric | Description |
|--------|-------------|
| `reviews.generated` | Total design reviews generated |
| `reviews.approved` | Reviews approved without edit |
| `reviews.edited` | Reviews edited before posting |
| `reviews.dismissed` | Reviews dismissed |
| `reviews.time_to_approval` | Time from generation to human action |
| `mentions.processed` | Total mentions processed |
| `mentions.actionable` | Mentions that resulted in work items |

### Observability

- All automation runs tagged with `design-dark-factory`
- Conversation links stored for audit trail
- Error alerts to Slack #design-factory-alerts

---

## Phase 1 Implementation Plan

### Week 1: Core Infrastructure
- [ ] Set up secrets in OpenHands
- [ ] Create GitHub PR design review automation
- [ ] Create basic Slack approval workflow
- [ ] Test end-to-end on agent-canvas repo

### Week 2: Slack Integration
- [ ] Implement Slack mention tracker
- [ ] Build approval UI in Slack
- [ ] Add edit and dismiss capabilities
- [ ] Test with real mentions

### Week 3: Linear & Notion
- [ ] Set up Linear webhook or polling
- [ ] Implement Linear ticket analyzer
- [ ] Set up Notion polling
- [ ] Cross-link items across sources

### Week 4: Dashboard & Polish
- [ ] Build daily dashboard generator
- [ ] Add metrics collection
- [ ] Create alerting for failures
- [ ] Documentation and runbook

---

## Future Enhancements

1. **Learning from Edits**: Track edit patterns to improve prompts
2. **Auto-Approval Rules**: Skip approval for low-risk, high-confidence reviews
3. **Multi-Repo Correlation**: Detect cross-repo impact
4. **Priority Learning**: ML-based priority assignment
5. **Review Templates**: Per-repo customization
6. **Batch Review Mode**: Process multiple PRs in focused sessions
