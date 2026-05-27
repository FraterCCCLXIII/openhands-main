---
title: 'Eight billion tokens in two weeks: How C3 AI brings agentic coding to every team with OpenHands'
slug: eight-billion-tokens-in-two-weeks-how-c3-ai-brings-agentic-coding-to-every-team-with-openhands
excerpt: 'C3 AI adopted OpenHands Cloud as enterprise-grade, self-hosted agentic coding infrastructure, letting sales, solution engineers, and builders collaborate through a chat interface while workflows run directly against C3 AI’s Ontology Objects for production-aligned code. In early rollout, they processed ~8B tokens in two weeks and cut a representative workflow from ~3,000 lines to ~254, shrinking delivery time from months to hours.'
coverImage: /assets/webflow/misc/694301052b3d4c5b35784c67_1.png
date: '2025-12-17T12:00:00.000+00:00'
authors:
  - name: Robert Brennan
ogImage:
  url: /assets/webflow/misc/694301052b3d4c5b35784c67_1.png
---
> “OpenHands was the only option that let us talk to an autonomous coding agent over the network at scale, the same way we talk to an LLM.”

[C3 AI](http://c3.ai/), a leading Enterprise AI software provider for accelerating digital transformation, is using OpenHands not only as a developer productivity tool, but as core infrastructure that any team or team member can invoke. Sales and solution engineers interact through a conversational front end while OpenHands plans, writes, runs, and iterates on code in managed sandboxes. Critically, these agentic workflows operate directly on C3 AI’s Objects, the unified semantic ontology that represents enterprise entities, relationships, behaviors, and operational context, ensuring that generated code aligns with how real businesses operate.

After installing OpenHands Cloud on C3 AI–managed clusters, C3 AI was able to provide frictionless access to a state-of-the-art coding agent inside their private cloud. In the first two weeks, the platform processed roughly eight billion tokens with a small internal user base, a strong signal of stability and scale. A representative workflow dropped from about 3,000 lines of hand-written code to roughly 254 lines, and engineering time fell from months to hours. As one leader put it, “OpenHands was the only option that let us talk to an autonomous coding agent over the network at scale, the same way we talk to an LLM”

## Customer snapshot

C3 AI delivers Enterprise AI solutions across industries, to many security-sensitive customers in government, industrial manufacturing, and healthcare. The C3 AI team adopted OpenHands first for internal builders, then expanded to sales and solution engineering through a conversational interface. By grounding every agent action in C3 AI’s Ontology Objects, spanning not only data structures but also business semantics, constraints, and cross-domain relationships, OpenHands ensures that generated logic is immediately production-ready and enterprise-aligned. Access now flows through C3 AI’s IT with simple provisioning, and for regulated cases OpenHands runs self-hosted inside C3 AI–managed clusters.

## Challenge

Before OpenHands Cloud, C3 AI’s R&D teams leveraged a range of frameworks that provided flexibility but required manual work to scale and operationalize. As their solutions matured, the team sought a more unified environment — one that extended beyond individual developer setups and focused CI workflows to enable fast, scalable feedback loops and collaborative experimentation. The goal was to empower both technical and domain experts to rapidly assemble and refine real-world solutions, all within enterprise-grade guardrails. “Autonomous coding agents can do a lot more than local dev workflows. We wanted every team to use them as easily as they use LLMs."

## Why OpenHands

C3 AI evaluated the market and found the best option that provided the flexibility, performance and scalability was OpenHands. This became even more apparent as the team started using and benchmarking OpenHands.

“OpenHands was the only off-the-shelf solution that let us prompt an autonomous coding agent remotely at scale, not just on a laptop or inside a narrow CI template."

Two things sealed it. First, a network accessible SDK that behaves like a familiar chat-like interface. Second, an architecture that abstracts memory, code generation, sandbox lifecycle, and iterative repair, while offering a clear route to self-hosted deployments.

“Once OpenHands Cloud came online in our private cloud, access became an email to IT and two clicks. That unlocked adoption overnight."

## Architecture and integration

C3 AI’s use case development flows can now begin with a standard LLM that acts as a requirements and prompt composer. Non-technical users can describe the functionality they need. The LLM asks follow-up questions, gathers constraints, and turns that intent into well-formed prompts for OpenHands. OpenHands then plans, writes code, runs it in isolated sandboxes, validates, and repairs, while the [C3 Agentic AI Platform](https://c3.ai/c3-agentic-ai-platform/) manages identity, permissions, secrets, and ontologies. Workspaces are snapshotted, versioned, and promoted through CI with tests that can be mined from the conversation. For restricted environments, OpenHands runs self-hosted inside C3 AI managed clusters.

“We prompt an LLM to shape the request, then we prompt OpenHands to build and ship. People focus on what they want, not how to wire the system."

!

## Implementation

The journey began early in the year with self-serve experimentation. Three weeks before the interview, C3 AI stood up OpenHands Cloud. Onboarding for sales and solution engineering was a short lunch and learn, then IT enabled accounts. From there, most users needed only two clicks to start.

“Autonomous coding agents never really get blocked if you design the workflow well. People can say, fix this part, and the system repairs itself in minutes."

## Results

Scale and adoption moved fast. The platform processed about eight billion tokens in roughly two weeks with a small internal user base, which suggests the managed sandboxes and scheduling layers absorbed real traffic without friction. Internal usage grew by roughly an order of magnitude once Cloud access went live and provisioning dropped to an email to IT followed by two clicks. A representative system fell from about 3,000 lines of hand-built code to roughly 254 lines, and delivery time dropped from months to hours.

Equally important, the chat style interface meant users did not need training beyond a brief lunch and learn, most treated it like a familiar chatbot, which reduced formal onboarding and accelerated time to first successful run. “It felt like a chatbot, not a new tool, that is why adoption moved so quickly” and “Access is an email to IT and two clicks” are consistent with the early experience reported by the team." Together, these signals point to a platform that is easy to adopt, capable of sustained load, and effective at turning conversational intent into production grade software.

## How teams use it

Sales and solution engineering capture requirements in chat, then the system plans a project, writes and runs code, and packages deliverables. For a refinery example, the agent could build an asset health model, plug it into a bespoke optimizer for parts ordering, chain those steps into a workflow, and generate a report that advises what to order and when. Non-technical users judge the output, then ask for changes in plain language while the agent edits code and ontology objects under the hood.

“The barrier to entry should match ChatGPT. You describe what you want. The system builds, tests, and improves it with you."

## Security and compliance posture

The C3 Agentic AI Platform manages users, roles, permissions, information access, and ontologies. OpenHands integrates with this, and self-hosted clusters keep sensitive workloads inside C3 AI’s boundary.

“Self-hosting OpenHands in our clusters gives us a path into our most secure environments."

## What is next

C3 AI plans to expand the library of building blocks that subject matter experts can compose, increase reuse across verticals, and harden policy and testing around long running agent trajectories. The team expects to track ROI through adoption, engagement, reuse rates, and eventually effects on sales cycle time in large enterprises.

‍

### Get started with OpenHands

[Talk with an engineer about your stack.](https://openhands.dev/contact)

[‍](https://openhands.dev/contact)[Explore self-hosted options with our team.](https://openhands.dev/pricing)

‍
