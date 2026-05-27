---
title: 'The Software Agent Control Plane'
slug: agent-control-plane
excerpt: 'OpenHands views the software-agent stack as harness, orchestrator, and control plane. Here''s why the control plane is becoming essential for running software agents securely at scale.'
coverImage: /assets/webflow/blog/agent-control-plane/cover.png
coverAlt: 'The Software Agent Control Plane cover image'
date: '2026-04-03T12:00:00.000+00:00'
authors:
  - name: Robert Brennan
ogImage:
  url: /assets/webflow/blog/agent-control-plane/cover.png
---
The tech stack for running software agents—agents that write, test, and ship code—is still growing and evolving. At OpenHands, we see three pillars in the stack:

- The Harness: an agentic loop on top of one or more LLMs

- The Orchestrator: an environment—or set of environments—for agents to run in

- The Control Plane: a way to observe and orchestrate many agents at scale

![Diagram of the OpenHands agent control plane with runtime environments, routing, budgets, policies, and observability](/assets/webflow/blog/agent-control-plane/agent-control-plane-diagram.png)

The Control Plane is an emerging category. While other projects can claim pieces of the control plane—LiteLLM for budgeting, OpenRouter for routing, Gray Swan for security, and Laminar or Langfuse for observability—OpenHands Enterprise is the first to put all of this together in one platform.

![Diagram of the OpenHands agent control plane with runtime environments, routing, budgets, policies, and observability](/assets/webflow/blog/agent-control-plane/agent-control-plane-diagram.png)

## What is an Agent Control Plane?

In short, it is a way to control your agents.

Agents are powerful. But they are also expensive, chaotic, and dangerous. You need guardrails and visibility in place if you are going to run them securely.

An Agent Control Plane gives you a central place to define all sorts of guardrails:

- LLM routing policies

- MCP access

- Secrets access

- Budgets

- User management and auth

And it provides a central pane of glass, letting you observe and audit every agentic workflow in your organization.

At OpenHands, we are specifically focused on the Control Plane for *software* agents—agents that are making modifications to your codebase, touching your infrastructure, leaving code reviews, and more. These agents come with their own specific challenges.

## Why do we need a Control Plane?

Most developers today are comfortable with the Harness. They are running Claude Code or Cursor directly on their desktop against their local filesystem. This is a great way to get started with agents and to build intuition for their capabilities.

But your laptop does not really scale. It is a sensitive environment with all sorts of files and secrets the agent does not need access to. Even if you are sandboxing agents on your local machine, there are only so many that can run simultaneously before you start dealing with resource contention. Running on a schedule, or in response to events happening in third-party systems, is also tricky. And when agents are running directly on laptops, the organization gets little visibility into how they are being used and where all those tokens are going.

At OpenHands, we encourage our customers to use Kubernetes-based runtimes, running each agent inside a container on cloud infrastructure. We have a turnkey runtime container that includes Python and JavaScript tooling, along with tmux and a Chromium browser—all the tools the OpenHands agent needs. We have also helped customers build custom runtimes based on hardened images and add tooling from other ecosystems like Go or Java. And when agents are in the cloud, they can easily be triggered to run on a schedule or based on events happening in Slack, GitHub, and Jira.

Once you have agents running in the cloud, observability and control become major issues. Often these agents are not directly monitored—engineers just wait for them to open pull requests. The agents might not even belong to a particular employee.

Platform, security, and finance teams need a way to understand what is happening and make global changes.

This is where the Control Plane comes in.

### Cost Control

In 2025, most organizations were happy to spend aggressively on agent projects, desperate to keep up with the pace of innovation.

But as the technology matures in 2026, we are seeing CFOs start to push back. LLM bills are growing quickly as engineers find more and more uses for agents.

At this point, most organizations can at least segment their token spend by user. But if you ask questions like “how much are you spending on bug fixes versus greenfield development?” or “which developers have the highest rate of merges per token?” they often cannot answer.

An Agent Control Plane solves this. Not only is every token tracked, it is also associated with a user, a session, a Git repository, related skills or plugins, and more. You can even add customized labels to each session with additional metadata. This allows you to slice the data and understand the total cost and ROI of different use cases. You might decide to discontinue some workflows based on that data, or downgrade to a cheaper model to improve ROI.

Even better, you can start setting up *budgets* on a per-project or per-use-case basis. Instead of just giving each developer a chunk of money to burn through, you can make sure that money is going to the right types of projects.

### Security

Agents can be dangerous. We have seen countless instances where agents have innocently deleted a production database or exposed secrets. Prompt injection makes things even worse—all it takes is one poisoned resource and an attacker can take full control of your agents.

An Agent Control Plane helps tackle the security problem from two angles:

- It sets clear policies for how agents run and what they have access to

- It provides an audit trail for every action an agent takes

The former is important for prevention. When an agent runs locally, it has access to all of that developer's secrets. When it runs behind a Control Plane, the control plane decides which secrets it gets. And the Control Plane can hook into each agent action to analyze it for prompt injection or other potential risks, halting the agent until a human can review.

The latter is important for detecting problems and improving your prevention measures. You can periodically review audit logs for suspicious activity or prompt injection attempts, and check how the system responded. If an agent does go off the rails and do something dangerous, you can review exactly what happened and take measures to ensure the accident is not repeated.

As one example, we had a client detect an agent attempting to access Pastebin, contrary to company policy. While the agent was acting innocently enough—it just wanted to use Pastebin as a storage area for a small sample app—the team identified this as a vector for exfiltration and established a new policy blocking access to that domain.

### Productivity

Platform teams need a way to understand how agents are being used and where they are being successful. They need ways to incorporate feedback—including failures—into the agent development lifecycle.

When agents are running behind a Control Plane, it is much easier to measure your successes and failures. You can define metrics for any given skill, plugin, or workflow, then improve them over time.

At OpenHands, for example, we get a lot of use out of our code review plugin. But we also measure how often the automated suggestions are accepted or rejected, and track those events inside our control plane. Periodically, we review the rejections and find ways to improve the code review plugin.

## Build or Buy

Some large companies are leading the charge here by building homegrown control planes. Stripe has [Minions](https://stripe.dev/blog/minions-stripes-one-shot-end-to-end-coding-agents), and Coinbase has [Forge](https://rywalker.com/research/coinbase-forge). It is understandable that these early adopters felt the need to build their own Agent Control Planes—they were feeling the power and pain of running agents at scale, and the market had not yet caught on.

Fortunately, at OpenHands, we have been close to this problem since the early days of agents. We have been running agents in the cloud since early 2024—a lifetime ago in AI years. And we have built an extensive enterprise offering on top of our open source foundation.

If you are interested in what the world looks like after Claude Code, [chat with us](https://openhands.dev/enterprise)!
