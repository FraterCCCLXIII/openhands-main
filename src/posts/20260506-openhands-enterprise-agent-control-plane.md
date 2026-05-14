---
title: 'From Agents to Systems: Introducing OpenHands Enterprise, the Agent Control Plane'
slug: openhands-enterprise-agent-control-plane
excerpt: 'OpenHands Enterprise gives teams a system for running AI agents across the organization, with the infrastructure required to control, observe, and scale that work. Today we are also making OpenHands Automations generally available.'
coverImage: /assets/webflow/blog/20260506-openhands-enterprise-agent-control-plane/20260506-openhands-enterprise-agent-control-plane-cover.png
coverAlt: 'Cover image: From Agents to Systems: Introducing OpenHands Enterprise, the Agent Control Plane'
date: '2026-05-06T12:00:00.000Z'
authors:
  - name: OpenHands Team
ogImage:
  url: /assets/webflow/blog/20260506-openhands-enterprise-agent-control-plane/20260506-openhands-enterprise-agent-control-plane-cover.png
seoTitleDate: 'May 05, 2026'
---
Teams are starting to use AI agents for real engineering work, but that usage breaks down quickly at scale. There is no centralized control over what agents can access or how they behave, which makes them difficult to approve for production use. Workflows are fragmented across tools and scripts, with little ability to reuse or standardize how work gets done. Teams also lack visibility into what agents are actually doing. There is no reliable audit trail, no clear understanding of cost, and no way to improve performance over time.

As a result, most organizations get stuck. Agents show promise, but they are too risky, too opaque, and too inconsistent to scale.

## Run agents as a system, not one-off tools

OpenHands Enterprise provides a fully self-hosted, on-premise system for running AI agents across an organization, with the infrastructure required to control, observe, and scale that work. At the center is the [Agent Control Plane](https://openhands.dev/blog/agent-control-plane), which manages how agents operate across workflows, repositories, and teams. It enforces access policies, tracks usage and cost, and provides a complete record of agent activity.

Running agents as a system requires more than control. It requires a consistent way to define and execute work across that system.

### Turn agent usage into repeatable workflows with OpenHands Automations

Today, we are excited to share that [OpenHands Automations](https://docs.openhands.dev/openhands/usage/automations/overview#automations-overview) is now available in [OpenHands Enterprise](https://openhands.dev/enterprise). Automations are how teams move from one-off agent usage to repeatable, system-driven workflows.

![OpenHands Automations dashboard showing scheduled automations for issue categorization and PR summary](/assets/webflow/blog/openhands-enterprise-agent-control-plane/20260506-openhands-enterprise-agent-control-plane-automations.png)

Instead of running agents manually, teams can define workflows once and run them on a schedule or trigger them based on real events across their systems. These workflows can be reused across repositories and teams, turning what was previously fragmented agent usage into a shared system for execution.

This is not limited to a single use case. It is a pattern that applies across common engineering workflows. Use cases include:

- **Vulnerability remediation at scale:** Automatically detect, fix, and open PRs for vulnerabilities across your codebase on a schedule.
- **Dependency upgrades across repositories:** Trigger updates when new versions are released and apply changes across all affected services.
- **PR review and feedback workflows:** Review pull requests automatically with consistent feedback, suggestions, and issue detection.
- **Incident response and remediation:** Trigger agents from alerts to investigate issues and propose fixes in real time.
- **Large-scale codebase changes:** Apply migrations or refactors across hundreds of repositories with a single workflow.
All execution runs inside a sandboxed runtime, which isolates agent activity and ensures that work is performed in a controlled environment. This makes it possible to run agents on demand, integrate them into real systems, and scale usage without introducing risk. Run your first [automation](https://docs.openhands.dev/openhands/usage/automations/overview#automations-overview) today.

## Make agent adoption viable at scale

This shift is not about incremental productivity. It changes how engineering work gets done at the organizational level.

For platform, DevOps, and infrastructure leaders responsible for what runs in production, this creates a path to safely operationalize agents. Instead of one-off experiments scattered across teams, agent workflows become defined, repeatable systems that can be deployed, monitored, and improved over time. You increase output without adding headcount by moving repetitive work into systems that run consistently across the organization.

For security and compliance teams, this introduces the controls required to approve agent usage in production. Access is scoped, activity is auditable, and execution is contained within defined boundaries, making agent usage in production enforceable and accountable.

For engineering leadership and the business, this creates a more predictable model for execution. Work is no longer fragmented across tools and teams. It becomes measurable, governed, and aligned to outcomes, allowing organizations to scale automation without introducing operational risk.

## Shift from manual execution to system-driven workflows

The biggest change is not what agents can do. It is how developers use them. Instead of building and running isolated automations, teams define workflows once and run them across systems.

A task like code review or vulnerability remediation no longer needs to be handled manually across repositories. It becomes a repeatable workflow that runs consistently, either on a schedule or in response to events. Developers shift from executing work to defining how it should be done and reviewing the results. Over time, teams refine these workflows, improving performance without starting from scratch.

The result is a move from fragmented automation to a coordinated system for executing engineering work.

## The Agent Control Plane

Running a single agent is a local problem. Running hundreds across an organization is a coordination problem. The Agent Control Plane is the layer that solves that. It provides centralized control over how agents operate across repositories, teams, and environments, ensuring that automation can scale without losing visibility or control.

![Agent Control Plane architecture showing default policies, guardrails, budgeting, observability, LLM gateway, reporting, plugin marketplace, and integrations](/assets/webflow/blog/openhands-enterprise-agent-control-plane/20260506-openhands-enterprise-agent-control-plane-diagram.png)

At a technical level, it introduces a few core capabilities:

- **Orchestration:** Workflows are no longer tied to individual sessions. They can be defined once and executed across many repositories in parallel, with built-in scheduling, retries, and state management.
- **Organization plugins and skills:** With an available Plugin Marketplace, agent builders can publish plugins and skills that developers in the organization can use in their own workflows.
- **Sandboxed execution:** All agent activity runs inside isolated environments. Code execution, file access, and external calls are contained and observable. This reduces risk and creates a consistent execution model.
- **Observability and auditability:** Every conversation is logged and tied to a user. You can trace what happened, when it happened, and why. This is critical for both debugging and compliance.
- **Cost attribution:** Usage is tracked at the organization, user, and conversation level, giving teams clear visibility into how LLM costs are spent. Budgets can also be enforced at the organization and user level.
As organizations begin to scale automation, the next challenge is not just control, but optimization.

To support this, OpenHands introduced the [OpenHands Index](https://index.openhands.dev/), a benchmark and leaderboard that evaluates how AI agents perform across real software engineering tasks. It provides a standardized way to compare models based on ability, cost, and runtime, helping teams choose the right model for each workflow and continuously improve how agents operate.

Together, these capabilities turn agent usage from something ad hoc into a system that can be managed, measured, and improved over time. Teams can scale automation while maintaining control, security, and accountability.

## How to get started

You do not need to adopt everything at once. Most teams start small and expand over time.

1. **Start with a single workflow:** Pick a narrow, repeatable task such as dependency updates or PR reviews and run it with an agent.
2. **Move into a controlled environment:** Run that workflow inside a sandboxed runtime with defined permissions. Start introducing boundaries around what the agent can access.
3. **Define the workflow in code:** Use the SDK to make the workflow repeatable across repositories.
4. **Connect it to real systems:** Trigger the workflow based on events from systems like GitHub or your issue tracker.
5. **Scale with the control plane:** Manage execution across teams, enforce policies, and track cost and behavior as usage grows.
Ready to get started? [Sign up and try OpenHands live](https://app.all-hands.dev/) or take a look at our [open source](https://docs.openhands.dev/overview/quickstart) for running and experimenting with OpenHands locally. If you want to go deeper, [join our community](https://openhands.dev/community) to collaborate, share use cases, and contribute to the project as it evolves. When you are ready to bring structure, security, and scale to production, [OpenHands Enterprise](https://openhands.dev/enterprise) gives your team the control plane needed to run agents confidently across your organization. Download it, try it, break it, build with it. And when it is time to scale, [we are here to help](https://openhands.dev/contact).

## About OpenHands

OpenHands is an open-source platform for building and running autonomous AI coding agents, with the control layer needed to run them safely at scale. The mission is to make agent-based software development accessible, transparent, and controllable by default. That starts in the open. The core framework is open source, giving developers and platform teams full visibility into how agents execute work and interact with their systems. The project has over 72,000 GitHub stars, millions of downloads, and contributions from hundreds of developers. It is used by engineers at large enterprises and fast-growing startups alike. The long-term vision is to become the full stack AI coding agent platform for software engineering. Not just helping developers write code, but running meaningful parts of the software lifecycle.
