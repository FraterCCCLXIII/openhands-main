# Learning Center video map

Videos for each lesson and sub-lesson of `learning-center-content.md`: ours (from the openhands.dev articles and the OpenHands YouTube channel) first, then the best outside YouTube video where ours does not cover a topic well enough. Built 2026-10-29.

## How to read this

- **Fit:** `best` teaches the sub-lesson directly, `good` mostly, `partial` only in part. Where nothing fit, the sub-lesson is a **gap** and, for product how-tos, a **new recording** is needed.
- **Use:** `whole` means play the full video; `clip` gives start and end times. Clips are shown as YouTube links that start at the right second and as embed URLs with `start` and `end`.
- **Licences:** every video checked has the standard YouTube licence, not Creative Commons. Embedding with start and end times is allowed. **Downloading and re-hosting a clip needs the creator's permission.** For OpenHands' own videos that is a question for the team.
- **Verification:** subagents read each video's length, date, licence and chapters with `yt-dlp` before YouTube began blocking it. I then re-checked every video id against YouTube's oEmbed endpoint: each exists and its title and channel match. Lengths, dates and chapter-based clip times come from the agents' earlier `yt-dlp` reads and were not re-checked. Where a candidate could not be fully verified it is listed under *Candidates to confirm*, not as a pick.
- **Dated product videos:** the product UI has changed a lot. Product videos older than late September 2026 are flagged `may be outdated`.

## Summary

| Module | Overview pick | Sub-lessons | With a gap |
|---|---|---|---|
| M01 AI, machine learning, LLMs, tokens and context | [Large Language Models explained briefly](https://www.youtube.com/watch?v=LPZh9BOjkQs) (3Blue1Brown, 7:58) | 4 | 0 |
| M02 Choosing models: families, tiers, cost, open vs closed, local | [The BEST AI Models Right Now (Save MONEY & Get BETTER Results)](https://www.youtube.com/watch?v=r_AS63moJiA) (OpenHands, 8:01) | 5 | 1 |
| M03 What an AI agent is (and is not) | [What are AI Agents?](https://www.youtube.com/watch?v=F8NKVhkZZWI) (IBM Technology, 12:28) | 4 | 0 |
| M04 AI-assisted software development: workflow, best practices, common mistakes | [Claude Code best practices \| Code w/ Claude](https://www.youtube.com/watch?v=gv0WHhKelSE) (Anthropic, 25:53) | 7 | 1 |
| M05 OpenHands basics: conversations and the feed | [Agent Canvas v1 Is Live! Complete Setup & Getting Started Guide](https://www.youtube.com/watch?v=FpO-4bbM8Ko) (OpenHands, 12:00) | 5 | 4 |
| M06 Reviewing, testing and verifying agent work | [Stop Shipping Slop: The Future of AI Code Is Quality](https://www.youtube.com/watch?v=y60vYnBAvBI) (OpenHands, 57:02) | 5 | 2 |
| M07 Security and guardrails for agents | [Prompt Injection Security for AI Agents Webinar by OpenHands](https://www.youtube.com/watch?v=NcJYr1VaIXI) (OpenHands, 32:02) | 5 | 1 |
| M08 Setting up Automations | [Automate Repetitive Tasks with Agent Canvas](https://www.youtube.com/watch?v=3FzRrT3HH3w) (OpenHands, 2:49) | 5 | 5 |
| M09 Skills, plugins, MCP servers, agent profiles and settings | [OpenHands Roadmap Reveal: Plugins, Sub-Agents, Verification, and More](https://www.youtube.com/watch?v=hGm1XVwwIVk) (OpenHands, 41:14) | 4 | 3 |
| M10 Multi-agent systems: coordinators, workers and verifiers | [How Anthropic Builds Multi-Agent Systems: Patterns and Pitfalls](https://www.youtube.com/watch?v=IPu3HwtQb18) (Databricks Events, 17:55) | 8 | 4 |
| M11 Setting up a Factory (prototype on this branch) | [From Coding Assistants to AI Software Factories](https://www.youtube.com/watch?v=Sxn5rAoOZ2I) (OpenHands, 8:41) | 8 | 7 |
| M12 Evaluating agents: benchmarks and your own evals | [The OpenHands Index: Benchmarking LLMs as Software Engineering Agents](https://www.youtube.com/watch?v=gMQ4JRdsyy0) (OpenHands, 4:44) | 4 | 1 |
| M13 Where agents run: backends, self-hosting and ACP agents | [Agent Canvas Is Production Ready: Run & Automate AI Coding Agents](https://www.youtube.com/watch?v=6c6QWRGJ8vs) (OpenHands, 8:48) | 7 | 6 |

35 sub-lessons have a gap. They are listed in *Recording backlog* below.

## Lessons

### M01. AI, machine learning, LLMs, tokens and context

**Best single watch for the module:** [Large Language Models explained briefly](https://www.youtube.com/watch?v=LPZh9BOjkQs) — 3Blue1Brown, 7:58, 2024-11-20. Best single watch: eight-minute explanation of LLMs and next-word prediction.

#### Key concepts

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Large Language Models explained briefly](https://www.youtube.com/watch?v=LPZh9BOjkQs) — 3Blue1Brown | Outside | 7:58 | 2024-11-20 | best | whole | Eight-minute visual explanation of what an LLM is and how it predicts next text, matching the course's definition. |
| 2 | [AI, Machine Learning, Deep Learning and Generative AI Explained](https://www.youtube.com/watch?v=qYNweeDHiyU) — IBM Technology | Outside | 10:00 | 2024-08-05 | good | whole | Sorts out AI vs machine learning vs deep learning vs generative AI, the umbrella-term part of the concepts list. **Caveat:** 2024; does not cover tokens or context windows. |
| 3 | [Most devs don't understand how LLM tokens work](https://www.youtube.com/watch?v=nKSk_TiR8YA) — Matt Pocock | Outside | 10:57 | 2025-09-19 | good | whole | Shows what tokens are and why prices and limits are counted in them. **Caveat:** Tokens only; made for developers. |

#### Explanation

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Why LLMs get dumb (Context Windows Explained)](https://www.youtube.com/watch?v=TeQDr4DkLYo) — NetworkChuck | Outside | 15:17 | 2025-04-09 | good | whole | Why quality falls as the context fills, supporting 'quality can fall before the limit'. **Caveat:** Chat-focused, not agent-focused. |
| 2 | [Why do AI models hallucinate?](https://www.youtube.com/watch?v=005JLRt3gXI) — Claude | Outside | 5:13 | 2026-04-15 | best | whole | Anthropic explains why models hallucinate, covering the 'fluent but wrong' point. **Caveat:** Does not cover package hallucination/slopsquatting. |
| 3 | [AI Foundations: Tokens & Pricing](https://www.youtube.com/watch?v=Gauk0F6UBFo) — Cursor | Outside | 3:32 | 2025-09-27 | good | whole | Short intro to how tokens turn into price and cost. **Caveat:** Made by a vendor (Cursor); tool-specific examples. |

#### Best practices

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Prompting 101 \| Code w/ Claude](https://www.youtube.com/watch?v=ysPbXH0LpIE) — Anthropic | Outside | 24:52 | 2025-07-31 | good | whole | Practical prompting: put the needed context, constraints and definition of done in the prompt. **Caveat:** 25 minutes; Claude-centric, not coding-agent specific. |
| 2 | [How do you handle Context Management with an agent?](https://www.youtube.com/watch?v=W29N0Ad7yUY) — OpenHands | OpenHands channel | 2:46 | 2026-04-30 | good | whole | OpenHands clip on keeping context small and focused as agents work (one task per conversation). **Caveat:** Short webinar clip; fit judged from description. |

#### Common mistakes

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Why Large Language Models Hallucinate](https://www.youtube.com/watch?v=cfqtFvWOfg0) — IBM Technology | Outside | 9:37 | 2023-04-20 | good | whole | Explains why LLMs hallucinate and why confident answers are not verified answers. **Caveat:** 2023, older; concepts still hold. No verified video found on slopsquatting specifically. |
| 2 | [How do you handle Context Management with an agent?](https://www.youtube.com/watch?v=W29N0Ad7yUY) — OpenHands | OpenHands channel | 2:46 | 2026-04-30 | good | whole | Shows how piling history and tool output into a limited context window degrades results. **Caveat:** Short webinar clip. |
| 3 | [Most devs don’t understand how context windows work](https://www.youtube.com/watch?v=-uW5-TaVXu4) — Matt Pocock | Outside | 9:33 | 2025-10-22 | partial | whole | Counters 'bigger context window is always better' from a developer's view. **Caveat:** Not agent specific. |

### M02. Choosing models: families, tiers, cost, open vs closed, local

**Best single watch for the module:** [The BEST AI Models Right Now (Save MONEY & Get BETTER Results)](https://www.youtube.com/watch?v=r_AS63moJiA) — OpenHands, 8:01, 2026-05-26. OpenHands team on choosing models by cost and performance.

#### Key concepts

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [How to Choose Large Language Models: A Developer’s Guide to LLMs](https://www.youtube.com/watch?v=pYax2rupKEY) — IBM Technology | Outside | 6:56 | 2025-05-14 | good | whole | Overview of model families, sizes and the criteria for choosing a model. **Caveat:** May 2025; model names dated. |
| 2 | [Open Source vs Open Weight AI Models Explained](https://www.youtube.com/watch?v=KL_hBC3XcrY) — KodeKloud | Outside | 7:42 | 2026-09-09 | best | whole | Open-source vs open-weight models, matching the OSI caveat in the course. **Caveat:** Sep 2026; check against current licences. |
| 3 | [What is Mixture of Experts?](https://www.youtube.com/watch?v=sYDlVVyJYn4) — IBM Technology | Outside | 7:57 | 2024-08-28 | good | whole | Explains mixture of experts and why total size differs from active size. **Caveat:** 2024; generic, no OpenHands link. |

#### Explanation

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [The BEST AI Models Right Now (Save MONEY & Get BETTER Results)](https://www.youtube.com/watch?v=r_AS63moJiA) — OpenHands | OpenHands channel | 8:01 | 2026-05-26 | best | [0:28–2:35](https://www.youtube.com/watch?v=r_AS63moJiA&t=28s) What the Index measures and how to read cost vs performance<br>[6:20–7:15](https://www.youtube.com/watch?v=r_AS63moJiA&t=380s) When to use expensive vs cheap models | OpenHands team on cost vs performance, which models they use and when expensive vs cheap pays off. **Caveat:** Model rankings date quickly (May 2026). |
| 2 | [Local AI Explained: How to Run AI Models on Your Computer](https://www.youtube.com/watch?v=edIHPoWgIKU) — Tech With Tim | Outside | 24:27 | 2026-08-31 | good | [1:02–9:43](https://www.youtube.com/watch?v=edIHPoWgIKU&t=62s) Cloud vs local, model file, sizes, quantization, inference engine, hardware | Cloud vs local AI, model sizes, quantization and hardware needs in one walkthrough. **Caveat:** Aug 2026; tool-specific second half (LM Studio, Ollama, Docker). |
| 3 | [OpenHands + Devstral = A Fully Local Coding Agent](https://www.youtube.com/watch?v=oV9tAkS2Xic) — OpenHands | In our article ([post](https://www.openhands.dev/blog/devstral-a-new-state-of-the-art-open-model-for-coding-agents)) | 8:09 | 2025-05-21 | good | whole | Running a fully local coding agent with an open-weight model. **Caveat:** May 2025; Devstral era, dated model. |

#### Steps in OpenHands (verified in code/strings)

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Flexibly Choose your Coding Model with OpenHands LLM Profiles](https://www.youtube.com/watch?v=TQAdEjmpVfc) — OpenHands | In our article ([post](https://www.openhands.dev/blog/model-choice-llm-profiles)) | 3:13 | 2026-05-27 | best | whole | Shows LLM profiles: picking a default model and switching. **Caveat:** Mentions a /model command; the course flags that as unverified in this Canvas version. |
| 2 | [One AI Agent, Multiple LLMs: Automatic Model Routing in OpenHands](https://www.youtube.com/watch?v=Omk9szFLQcA) — OpenHands | OpenHands channel | 19:02 | 2026-10-15 | good | [0:21–10:11](https://www.youtube.com/watch?v=Omk9szFLQcA&t=21s) What the router is, choosing models per task, demo | Automatic model routing across profiles with a classifier prompt, matching the Model Router page. **Caveat:** 19 minutes. Chapters: 21-253 router intro and benefits, 253-611 demo. |
| 3 | [OpenHands Community Update: Agent Canvas, GPT-5.5 & LLM Profiles](https://www.youtube.com/watch?v=lbY9kNTdWec) — OpenHands | OpenHands channel | 32:47 | 2026-05-22 | partial | [27:55–32:47](https://www.youtube.com/watch?v=lbY9kNTdWec&t=1675s) LLM profiles, multi-model workflows, using profiles in Agent Canvas | Community call; LLM profiles segment shows multi-model workflows and cost optimisation. **Caveat:** Long call; only the clip is relevant. |

#### Best practices

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [How important is benchmarking and testing different LLMs?](https://www.youtube.com/watch?v=cEugXkov4IA) — OpenHands | OpenHands channel | 1:38 | 2026-04-07 | good | whole | OpenHands clip on why you should benchmark and test different LLMs yourself. **Caveat:** Short clip; fit judged from title only. |
| 2 | [The Best AI Coding Models Right Now (OpenHands Index Update)](https://www.youtube.com/watch?v=iOnvLwxECP0) — OpenHands | OpenHands channel | 5:34 | 2026-07-09 | good | [0:55–2:48](https://www.youtube.com/watch?v=iOnvLwxECP0&t=55s) Cost vs performance and issue-resolution/testing benchmarks<br>[5:17–5:32](https://www.youtube.com/watch?v=iOnvLwxECP0&t=317s) Final recommendations | Index update by task type with final model recommendations, useful for choosing per task. **Caveat:** Jul 2026; rankings dated. |
| 3 | [The OpenHands Index: Benchmarking LLMs as Software Engineering Agents](https://www.youtube.com/watch?v=gMQ4JRdsyy0) — OpenHands | OpenHands channel | 4:44 | 2026-01-29 | partial | whole | Explains the OpenHands Index as a way to choose models by evidence. **Caveat:** Jan 2026; does not teach the cheap-vs-strong workflow. |

#### Common mistakes

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Open Source vs Open Weight AI Models Explained](https://www.youtube.com/watch?v=KL_hBC3XcrY) — KodeKloud | Outside | 7:42 | 2026-09-09 | good | whole | Covers 'open does not mean free to use however you like'. **Caveat:** Does not cover single-benchmark or local-privacy mistakes. |
| 2 | [How important is benchmarking and testing different LLMs?](https://www.youtube.com/watch?v=cEugXkov4IA) — OpenHands | OpenHands channel | 1:38 | 2026-04-07 | partial | whole | Counters picking a model by one benchmark score. **Caveat:** Fit judged from title. |
| 3 | [Open Source vs Closed AI: LLMs, Agents & the AI Stack Explained](https://www.youtube.com/watch?v=_QfxGZGITGw) — IBM Technology | Outside | 8:33 | 2025-11-23 | partial | whole | Open vs closed AI trade-offs including ecosystem and control. **Caveat:** Nov 2025; broad, not coding specific. |

> **Gap:** No verified video found that addresses 'local does not mean private' directly; the local-model videos above cover the setup only.

### M03. What an AI agent is (and is not)

**Best single watch for the module:** [What are AI Agents?](https://www.youtube.com/watch?v=F8NKVhkZZWI) — IBM Technology, 12:28, 2024-07-15. Clear definition of AI agents.

#### Key concepts

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [What are AI Agents?](https://www.youtube.com/watch?v=F8NKVhkZZWI) — IBM Technology | Outside | 12:28 | 2024-07-15 | best | whole | Defines AI agents: goals, tools, reasoning and acting. **Caveat:** Jul 2024; general, not coding-specific. |
| 2 | [Chatbots vs AI Assistants: Key Differences](https://www.youtube.com/watch?v=M2C-yFocLu0) — IBM Technology | Outside | 6:33 | 2025-02-25 | good | whole | Chatbot vs assistant distinction; useful alongside the agent definition. **Caveat:** 2025; assistant/agent boundary stays fuzzy. |
| 3 | [AI Model vs Agentic Harness: What Actually Drives AI](https://www.youtube.com/watch?v=ZELPNFXJ4_o) — IBM Technology | Outside | 8:30 | 2026-08-25 | good | whole | Model vs harness: why the same model behaves differently in different agent software. **Caveat:** Aug 2026. |

#### Explanation

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [The Two Worlds of AI Coding](https://www.youtube.com/watch?v=C0kz3ps8RSk) — OpenHands | OpenHands channel | 1:50 | 2026-05-01 | best | whole | OpenHands explains inner loop vs outer loop agent workflows. **Caveat:** 110-second clip. |
| 2 | [From Coding Assistants to AI Software Factories](https://www.youtube.com/watch?v=Sxn5rAoOZ2I) — OpenHands | OpenHands channel | 8:41 | 2026-10-20 | partial | whole | OpenHands talk on moving from coding assistants to autonomous software factories. **Caveat:** Fit judged from title; could not read the description. |
| 3 | [How We Build Effective Agents: Barry Zhang, Anthropic](https://www.youtube.com/watch?v=D7_ipDqhtwk) — AI Engineer | Outside | 15:09 | 2025-04-04 | good | whole | Anthropic on how agents work as an LLM using tools in a loop, and when not to build one. **Caveat:** Apr 2025; builder-oriented. |

#### Best practices

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [What is Human In The Loop with AI? How HITL Shapes AI Systems](https://www.youtube.com/watch?v=9iS-YYLIXiw) — IBM Technology | Outside | 10:44 | 2026-03-17 | good | whole | Human-in-the-loop: where people should approve or review agent actions. **Caveat:** Mar 2026; general AI, not coding. |
| 2 | [What are the risks of running autonomous AI?](https://www.youtube.com/watch?v=E1JhEyWic0Y) — OpenHands | OpenHands channel | 0:56 | 2026-04-23 | good | whole | OpenHands clip on safeguards for autonomous loops: iteration limits and auto-approval risks. **Caveat:** 56-second clip. |
| 3 | [Building more effective AI agents](https://www.youtube.com/watch?v=uhJJgc-0iTQ) — Anthropic | Outside | 18:58 | 2025-10-17 | partial | [15:00–17:15](https://www.youtube.com/watch?v=uhJJgc-0iTQ&t=900s) Best practices for getting started with building agents | Anthropic talk on simple agent architectures, tools and context. **Caveat:** 19 minutes; includes multi-agent material beyond this module. |

#### Common mistakes

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [What are the risks of running autonomous AI?](https://www.youtube.com/watch?v=E1JhEyWic0Y) — OpenHands | OpenHands channel | 0:56 | 2026-04-23 | good | whole | Covers over-trusting autonomous runs: arbitrary commands, no human, cost blowouts. **Caveat:** Short clip. |
| 2 | [Prompt Injection Security for AI Agents Webinar by OpenHands](https://www.youtube.com/watch?v=NcJYr1VaIXI) — OpenHands | OpenHands channel | 32:02 | 2025-09-12 | partial | whole | Prompt-injection webinar on what happens when agents hold broad access. **Caveat:** 32 minutes; fit judged from title. |
| 3 | [AI Coding Agents: What Works and What Doesn't (Webinar)](https://www.youtube.com/watch?v=_rltvykJV4E) — OpenHands | OpenHands channel | 45:14 | 2025-06-24 | partial | whole | OpenHands webinar on what coding agents do well and badly. **Caveat:** Jun 2025, 45 minutes; fit judged from title. |

### M04. AI-assisted software development: workflow, best practices, common mistakes

**Best single watch for the module:** [Claude Code best practices \| Code w/ Claude](https://www.youtube.com/watch?v=gv0WHhKelSE) — Anthropic, 25:53, 2025-07-31. Anthropic's own talk on the agentic coding loop and practical habits that transfer to any coding agent.

#### Key concepts

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [The Explore → Plan → Code → Commit workflow in Claude Code](https://www.youtube.com/watch?v=xJQuF02NAK8) — Claude | Outside | 3:11 | 2026-05-17 | good | whole | Short walkthrough of explore, plan, code, commit, the plan-first loop behind the plan mode concept. **Caveat:** Claude Code UI, not OpenHands; Whole video only: chapters were not read (YouTube blocked lookups), so no clip timestamps are proposed. |
| 2 | [TDD, AI agents and coding with Kent Beck](https://www.youtube.com/watch?v=aSXaxOdVtAQ) — The Pragmatic Engineer | Outside | 1:15:32 | 2025-06-11 | partial | whole | Kent Beck on TDD with agents, covering test-first and agent behaviour. **Caveat:** Long (about 75 min), June 2025, general not OpenHands. |

#### The workflow

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [The Explore → Plan → Code → Commit workflow in Claude Code](https://www.youtube.com/watch?v=xJQuF02NAK8) — Claude | Outside | 3:11 | 2026-05-17 | best | whole | Explore, plan, code, commit in under 4 minutes. **Caveat:** Claude Code UI. Whole video only: chapters were not read (YouTube blocked lookups), so no clip timestamps are proposed. |
| 2 | [How Anthropic uses Claude Code: Agentic Software Engineering at Scale - Daisy Hollman](https://www.youtube.com/watch?v=shZgedW15vg) — NDC Conferences | Outside | 1:00:25 | 2026-08-11 | good | whole | How Anthropic engineers run agentic software engineering at scale. **Caveat:** Long (about 60 min); Claude Code specific. |
| 3 | [AI Coding Agents: What Works and What Doesn't (Webinar)](https://www.youtube.com/watch?v=_rltvykJV4E) — OpenHands | OpenHands channel | 45:14 | 2025-06-24 | good | whole | OpenHands webinar on what coding agents do well and badly in a real workflow. **Caveat:** Mid-2025, long (about 45 min); skim. |

#### Prompting essentials

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Claude Code best practices \| Code w/ Claude](https://www.youtube.com/watch?v=gv0WHhKelSE) — Anthropic | Outside | 25:53 | 2025-07-31 | good | whole | Anthropic's best practices on clear prompts, instruction files and giving the agent a way to verify. **Caveat:** Mid-2025; Claude Code specific. Whole video only: chapters were not read (YouTube blocked lookups), so no clip timestamps are proposed. |
| 2 | [Stop Shipping Slop: The Future of AI Code Is Quality](https://www.youtube.com/watch?v=y60vYnBAvBI) — OpenHands | OpenHands channel | 57:02 | 2026-03-31 | partial | whole | OpenHands talk on quality-focused agent use; touches on specifying work well. **Caveat:** Long (about 57 min); only partly about prompting. |

#### Context hygiene

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Advanced Context Engineering for Agents](https://www.youtube.com/watch?v=IS_y40zY-hc) — YC Root Access | Outside | 14:37 | 2025-08-25 | best | whole | Context engineering for agents: keeping context small, compaction and sub-agents. **Caveat:** Aug 2025; not OpenHands specific. |
| 2 | [How do you handle Context Management with an agent?](https://www.youtube.com/watch?v=W29N0Ad7yUY) — OpenHands | OpenHands channel | 2:46 | 2026-04-30 | good | whole | OpenHands short answer on managing context with an agent. **Caveat:** Under 3 min Q&A clip; thin depth. |

#### Where agents shine and struggle

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Ray Myers: "Velocity Is Dead."](https://www.youtube.com/watch?v=6_Smtxb_afw) — OpenHands | OpenHands channel | 0:31 | 2026-04-17 | best | whole | Ray Myers short on the Velocity Is Dead article's argument. **Caveat:** 31-second short; teaser only. |
| 2 | [Trusting Legacy Codebase Migrations: the Snapshot Tests Strategy](https://www.youtube.com/watch?v=zV1PYhuZwFY) — OpenHands | OpenHands channel | 2:26 | 2026-04-17 | good | whole | Snapshot (characterization) tests as the way to trust legacy migrations. **Caveat:** Short clip about 2.5 min. |
| 3 | [AI Coding Agents: What Works and What Doesn't (Webinar)](https://www.youtube.com/watch?v=_rltvykJV4E) — OpenHands | OpenHands channel | 45:14 | 2025-06-24 | good | whole | What works and what does not with coding agents, from OpenHands. **Caveat:** Mid-2025, long. |

#### Best practices

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Can AI Do Test-Driven Development? With Emily Bache](https://www.youtube.com/watch?v=g627Apd9zvY) — OpenHands | OpenHands channel | 25:16 | 2025-11-17 | good | whole | TDD with agents and Emily Bache, test-first discipline and small steps. **Caveat:** Long (about 25 min); Nov 2025. |
| 2 | [How do you keep AI on track when doing refactors?](https://www.youtube.com/watch?v=XDIe6EEoRvI) — OpenHands | OpenHands channel | 1:30 | 2026-02-19 | good | whole | Keeping AI on track in refactors with tests and small steps. **Caveat:** 90-second clip. |
| 3 | [Testing strategy and increments](https://www.youtube.com/watch?v=tWwiZnW2McI) — OpenHands | OpenHands channel | 1:12 | 2026-05-01 | partial | whole | Testing strategy and increments for agent-driven changes. **Caveat:** 72-second clip. |

#### Common mistakes

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [5 Concepts to Know for Coding with AI Agents](https://www.youtube.com/watch?v=hTAWHgQI4xg) — IBM Technology | Outside | 10:02 | 2026-10-12 | partial | whole | Concepts every developer should know when coding with agents, including pitfalls. **Caveat:** Oct 2026; general not OpenHands; not a dedicated mistakes list. |
| 2 | [AI Coding Agents: What Works and What Doesn't (Webinar)](https://www.youtube.com/watch?v=_rltvykJV4E) — OpenHands | OpenHands channel | 45:14 | 2025-06-24 | partial | whole | Webinar discussion of what does not work with agents. **Caveat:** Mid-2025, long. |

> **Gap:** No verified video is a dedicated 'common mistakes' list for agentic coding; picks are partial.

### M05. OpenHands basics: conversations and the feed

**Best single watch for the module:** [Agent Canvas v1 Is Live! Complete Setup & Getting Started Guide](https://www.youtube.com/watch?v=FpO-4bbM8Ko) — OpenHands, 12:00, 2026-06-16. Official v1 walkthrough; the first-run and model-choice chapters show starting a first agent conversation.

#### Key concepts

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Agent Canvas Is Production Ready: Run & Automate AI Coding Agents](https://www.youtube.com/watch?v=6c6QWRGJ8vs) — OpenHands | OpenHands channel | 8:48 | 2026-07-07 | best | [0:23–1:10](https://www.youtube.com/watch?v=6c6QWRGJ8vs&t=23s) What is Agent Canvas + parallel agents and git worktrees | Explains what Agent Canvas is, parallel agents and worktrees. |
| 2 | [Previewing Agent Canvas — Open Source AI Coding Platform](https://www.youtube.com/watch?v=PvIDa_U2Uc8) — OpenHands | OpenHands channel | 3:34 | 2026-05-28 | partial | whole | Early preview of the Canvas idea. **Caveat:** pre-v1 preview (May 2026); UI may differ |

> **Gap:** No video explains the Feed or conversation/workspace/backend vocabulary; a short recording is needed.

#### Steps

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Agent Canvas in under 10 Minutes: Mac Setup (No Docker) + First AI Agent Chat](https://www.youtube.com/watch?v=dz6zgOK0_7Q) — OpenHands | OpenHands channel | 11:02 | 2026-06-22 | good | whole | Mac setup then a first agent chat in Agent Canvas. **Caveat:** June 2026 UI; chapters not verified |
| 2 | [Agent Canvas v1 Is Live! Complete Setup & Getting Started Guide](https://www.youtube.com/watch?v=FpO-4bbM8Ko) — OpenHands | OpenHands channel | 12:00 | 2026-06-16 | good | [4:15–5:19](https://www.youtube.com/watch?v=FpO-4bbM8Ko&t=255s) Launch and first run, choose AI model | First run and model selection inside the v1 walkthrough. |

> **Gap:** Not covered: Feed page (/feed), Overview panel, context meter and Compact context, stop/archive/delete. Record on the current UI.

#### Choosing an agent

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Agent Canvas Is Production Ready: Run & Automate AI Coding Agents](https://www.youtube.com/watch?v=6c6QWRGJ8vs) — OpenHands | OpenHands channel | 8:48 | 2026-07-07 | best | [1:46–2:20](https://www.youtube.com/watch?v=6c6QWRGJ8vs&t=106s) Bring your own AI agent (ACP) | Short segment on bringing your own agent via ACP. |
| 2 | [Agent Canvas Is Officially Production Ready — Local AI Agents, Automations & Parallel Workflows](https://www.youtube.com/watch?v=ZeqmkbICrrg) — OpenHands | OpenHands channel | 48:02 | 2026-06-18 | good | [8:40–10:33](https://www.youtube.com/watch?v=ZeqmkbICrrg&t=520s) Bring Your Own Agent (ACP) | Longer ACP segment of the community call. **Caveat:** long parent video; clip only |
| 3 | [How to Perform Agent Agnostic Automated Software Engineering with the Agent Canvas](https://www.youtube.com/watch?v=vhpM_pfhwf0) — OpenHands | OpenHands channel | 5:29 | 2026-06-17 | partial | whole | Agent-agnostic use: switching between OpenHands, Codex, Gemini and others. **Caveat:** no chapters; description-based fit |

#### Best practices

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Performing Your Daily Workflow with AI Agents](https://www.youtube.com/watch?v=S_wap45Iq8U) — OpenHands | OpenHands channel | 11:30 | 2026-08-07 | partial | [4:42–11:30](https://www.youtube.com/watch?v=S_wap45Iq8U&t=282s) Automating daily routines, reading the report, scaling and delegation | Shows organising many parallel tasks and delegation in Agent Canvas. |

> **Gap:** No video on one-task-per-conversation, checking Changes view. Needs a screen recording.

#### Common mistakes

> **Gap:** Nothing available (skills not appearing in running conversation, uncompacted context). Needs new recording.

### M06. Reviewing, testing and verifying agent work

**Best single watch for the module:** [Stop Shipping Slop: The Future of AI Code Is Quality](https://www.youtube.com/watch?v=y60vYnBAvBI) — OpenHands, 57:02, 2026-03-31. OpenHands talk on quality and verification of AI-generated code.

#### Key concepts

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [OpenHands Critic is Here to Roast Your Code (CLI Demo + Ralph Wiggum + Community Updates)](https://www.youtube.com/watch?v=JgzwwLP8jL8) — OpenHands | OpenHands channel | 24:10 | 2026-01-23 | good | whole | Community call demoing the OpenHands Critic. **Caveat:** Long (about 24 min) and mixed topics; whole call, find the critic segment. |
| 2 | [Using AI models to determine agent quality](https://www.youtube.com/watch?v=ZwKfvRyfOlw) — OpenHands | OpenHands channel | 4:54 | 2026-05-04 | good | whole | Using AI models to judge agent quality, the LLM-as-judge idea. **Caveat:** About 5 min clip. |

#### Explanation

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Stop Shipping Slop: The Future of AI Code Is Quality](https://www.youtube.com/watch?v=y60vYnBAvBI) — OpenHands | OpenHands channel | 57:02 | 2026-03-31 | best | whole | Why verification is the bottleneck and what quality tooling looks like. **Caveat:** Long; March 2026. |
| 2 | [The Death of the Code Review: What the Data Actually Says — Laurie Voss, Arize AI](https://www.youtube.com/watch?v=_mi3alkqy4s) — AI Engineer | Outside | 24:40 | 2026-09-30 | good | whole | Data on whether code review survives AI code, discussed with evidence. **Caveat:** Sept 2026; external, not OpenHands. |
| 3 | [How I Review AI Code - (Meta Senior Staff Engineer)](https://www.youtube.com/watch?v=b2QkhmQ0sT0) — John Kim | Outside | 20:31 | 2026-09-21 | good | whole | A senior engineer's practical method for reviewing AI code. **Caveat:** Sept 2026; single creator opinion. |

#### Steps in OpenHands

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [OpenHands Critic is Here to Roast Your Code (CLI Demo + Ralph Wiggum + Community Updates)](https://www.youtube.com/watch?v=JgzwwLP8jL8) — OpenHands | OpenHands channel | 24:10 | 2026-01-23 | partial | whole | Shows the OpenHands Critic in the CLI. **Caveat:** CLI demo from Jan 2026, not Canvas Verification settings. |
| 2 | [Exploring concrete scoring for the critic agent (Full)](https://www.youtube.com/watch?v=NNqhqlk87TY) — OpenHands | OpenHands channel | 3:24 | 2026-04-17 | partial | whole | Discussion on concrete scoring for the critic agent. **Caveat:** Engineering discussion, not a UI how-to. |

> **Gap:** No verified video shows Canvas Settings > Verification or the PR review automation.

#### Best practices

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [How I Review AI Code - (Meta Senior Staff Engineer)](https://www.youtube.com/watch?v=b2QkhmQ0sT0) — John Kim | Outside | 20:31 | 2026-09-21 | best | whole | Review habits for AI-written code. **Caveat:** Sept 2026. |
| 2 | ["Looks Good to Me": A Practical Guide to Handling AI-Generated Code - Roman Zhukov](https://www.youtube.com/watch?v=LnZDY6XC5pA) — NDC Conferences | Outside | 1:00:46 | 2026-07-31 | good | whole | Practical guide to handling AI-generated code in review. **Caveat:** Long (about 61 min); July 2026. |
| 3 | [Can AI Do Test-Driven Development? With Emily Bache](https://www.youtube.com/watch?v=g627Apd9zvY) — OpenHands | OpenHands channel | 25:16 | 2025-11-17 | partial | whole | Test-first as a verification practice. **Caveat:** Nov 2025. |

#### Common mistakes

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [The Death of the Code Review: What the Data Actually Says — Laurie Voss, Arize AI](https://www.youtube.com/watch?v=_mi3alkqy4s) — AI Engineer | Outside | 24:40 | 2026-09-30 | partial | whole | What goes wrong when review is skipped or rushed for AI code. **Caveat:** Sept 2026. |
| 2 | ["Looks Good to Me": A Practical Guide to Handling AI-Generated Code - Roman Zhukov](https://www.youtube.com/watch?v=LnZDY6XC5pA) — NDC Conferences | Outside | 1:00:46 | 2026-07-31 | partial | whole | Pitfalls of rubber-stamping AI changes. **Caveat:** Long. |

> **Gap:** No verified short video on the specific mistakes listed (agent editing its own tests, giant diffs).

### M07. Security and guardrails for agents

**Best single watch for the module:** [Prompt Injection Security for AI Agents Webinar by OpenHands](https://www.youtube.com/watch?v=NcJYr1VaIXI) — OpenHands, 32:02, 2025-09-12. OpenHands' own webinar on prompt injection for software agents, matching the course source article.

#### Key concepts

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [What Is a Prompt Injection Attack?](https://www.youtube.com/watch?v=jrHRe9lSqqA) — IBM Technology | Outside | 10:57 | 2024-05-30 | good | whole | Clear introduction to prompt injection. **Caveat:** 2024; short 11 min and general, not agent-specific. |
| 2 | [OWASP's Top 10 Ways to Attack LLMs: AI Vulnerabilities Exposed](https://www.youtube.com/watch?v=gUNXZMcd2jU) — IBM Technology | Outside | 25:11 | 2026-03-07 | good | whole | OWASP LLM Top 10 including excessive agency. **Caveat:** Long (25 min); LLM apps in general. |
| 3 | [Prompt Injection, explained](https://www.youtube.com/watch?v=FgxwCaL6UTA) — Simon Willison | Outside | 12:16 | 2023-05-03 | partial | whole | Simon Willison's explanation of prompt injection. **Caveat:** Dated (May 2023), predates agents. |

#### Explanation

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Prompt Injection Security for AI Agents Webinar by OpenHands](https://www.youtube.com/watch?v=NcJYr1VaIXI) — OpenHands | OpenHands channel | 32:02 | 2025-09-12 | best | whole | Mitigations compared for software agents, by OpenHands. **Caveat:** Long; Sept 2025. |
| 2 | [The Lethal Trifecta Is Already on Your Laptops — Michael Patterson, Coder](https://www.youtube.com/watch?v=abw_m-DRi1k) — AI Engineer | Outside | 20:43 | 2026-10-10 | good | whole | The lethal trifecta in practice with coding agents on laptops. **Caveat:** Oct 2026; external. |
| 3 | [Containers Don't Make Your AI Agent Safe](https://www.youtube.com/watch?v=7Z7ID5BbZU4) — Web Dev Simplified | Outside | 36:16 | 2026-06-30 | good | whole | Why containers alone do not make an agent safe. **Caveat:** June 2026; single creator. |

#### Steps in OpenHands

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [How does OpenHands account for security while automating?](https://www.youtube.com/watch?v=9tuGbS0sZtI) — OpenHands | OpenHands channel | 1:28 | 2026-02-26 | partial | whole | OpenHands answer on security while automating. **Caveat:** 88-second Q&A, conceptual not a UI walkthrough. |
| 2 | [OpenHands Vulnerability Fixer - Dispatch Agents to Secure Your Code](https://www.youtube.com/watch?v=ovX-zk8eC_E) — OpenHands | In our article ([post](https://www.openhands.dev/blog/20260303-vulnerability-fixer)) | 3:37 | 2026-02-23 | partial | whole | Vulnerability Fixer agents dispatched with a human in the loop. **Caveat:** Product demo, marketing flavour. |

> **Gap:** No verified video demonstrates Secrets, Confirmation Mode, Security Analyzer or the Docker runtime in Canvas.

#### Best practices

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [How important is it to have a human in the CVE fix process?](https://www.youtube.com/watch?v=EHO5rzHt1a4) — OpenHands | OpenHands channel | 0:42 | 2026-03-10 | good | whole | Why a human stays in the CVE fix process. **Caveat:** 42-second clip. |
| 2 | [How does OpenHands account for security while automating?](https://www.youtube.com/watch?v=9tuGbS0sZtI) — OpenHands | OpenHands channel | 1:28 | 2026-02-26 | good | whole | Security considerations while automating. **Caveat:** 88 seconds. |
| 3 | [OpenHands & Grayswan: How AI is Transforming Cybersecurity](https://www.youtube.com/watch?v=1USXbQyJk3w) — OpenHands | OpenHands channel | 41:18 | 2026-09-01 | partial | whole | OpenHands with Grayswan on AI in cybersecurity. **Caveat:** Long (about 41 min), Sept 2026; partner-led, partly marketing. |

#### Common mistakes

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [What are the risks of running autonomous AI?](https://www.youtube.com/watch?v=E1JhEyWic0Y) — OpenHands | OpenHands channel | 0:56 | 2026-04-23 | partial | whole | Risks of running autonomous AI. **Caveat:** 56-second clip, shallow. |
| 2 | [Containers Don't Make Your AI Agent Safe](https://www.youtube.com/watch?v=7Z7ID5BbZU4) — Web Dev Simplified | Outside | 36:16 | 2026-06-30 | good | whole | Mistake of trusting a container as the whole defence. **Caveat:** June 2026. |

### M08. Setting up Automations

**Best single watch for the module:** [Automate Repetitive Tasks with Agent Canvas](https://www.youtube.com/watch?v=3FzRrT3HH3w) — OpenHands, 2:49, 2026-09-29. Official demo: create a scheduled automation from natural language (daily 9am news summary).

#### Key concepts

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Agent Canvas Is Production Ready: Run & Automate AI Coding Agents](https://www.youtube.com/watch?v=6c6QWRGJ8vs) — OpenHands | OpenHands channel | 8:48 | 2026-07-07 | good | [1:10–1:46](https://www.youtube.com/watch?v=6c6QWRGJ8vs&t=70s) Built-in automations | Brief on built-in automations in Agent Canvas. |
| 2 | [Automate Repetitive Tasks with Agent Canvas](https://www.youtube.com/watch?v=3FzRrT3HH3w) — OpenHands | OpenHands channel | 2:49 | 2026-09-29 | good | whole | Shows prompt, schedule and destination as an always-on workflow. |

> **Gap:** Schedule vs Event vs webhook triggers, runs and statuses are not taught by any verified video. An outside concept video could not be verified (YouTube bot check blocked metadata calls).

#### Steps (UI labels from the app)

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Automate Repetitive Tasks with Agent Canvas](https://www.youtube.com/watch?v=3FzRrT3HH3w) — OpenHands | OpenHands channel | 2:49 | 2026-09-29 | best | whole | Creates a scheduled automation with natural language in current Agent Canvas (Sept 2026). |
| 2 | [Agent Canvas v1 Is Live! Complete Setup & Getting Started Guide](https://www.youtube.com/watch?v=FpO-4bbM8Ko) — OpenHands | OpenHands channel | 12:00 | 2026-06-16 | good | [6:36–7:39](https://www.youtube.com/watch?v=FpO-4bbM8Ko&t=396s) Build your first automation; run on a schedule | First automation and running on a schedule. **Caveat:** may be outdated (June 2026) |
| 3 | [Agent Canvas v1 Is Live! Complete Setup & Getting Started Guide](https://www.youtube.com/watch?v=FpO-4bbM8Ko) — OpenHands | OpenHands channel | 12:00 | 2026-06-16 | partial | [7:39–11:50](https://www.youtube.com/watch?v=FpO-4bbM8Ko&t=459s) Connect Slack, GitHub and configure automated code reviews | Event triggers via Slack and GitHub integrations and automated code reviews. **Caveat:** may be outdated (June 2026) |

> **Gap:** Not covered: Templates page, Find opportunities, Import automation, Test/Draft, Activity Log, Git Sync, Agent Profile choice. Record on the current UI.

#### Design guidance (from the workflow-automation article)

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Performing Your Daily Workflow with AI Agents](https://www.youtube.com/watch?v=S_wap45Iq8U) — OpenHands | OpenHands channel | 11:30 | 2026-08-07 | partial | [4:42–9:04](https://www.youtube.com/watch?v=S_wap45Iq8U&t=282s) Automating daily routines and interpreting the workflow report | Practical example of a daily automated workflow and its report. |

> **Gap:** Shadow mode, least privilege and caps are not covered in a video.

#### Best practices

> **Gap:** No video. Record or write.

#### Common mistakes

> **Gap:** No video (public URL for events, disabled imports, SKIPPED). Needs a recording.

### M09. Skills, plugins, MCP servers, agent profiles and settings

**Best single watch for the module:** [OpenHands Roadmap Reveal: Plugins, Sub-Agents, Verification, and More](https://www.youtube.com/watch?v=hGm1XVwwIVk) — OpenHands, 41:14, 2026-03-16. Strategy segment on plugins, skills and repeatable use cases.

#### What each thing is

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [What is MCP? Integrate AI Agents with Databases & APIs](https://www.youtube.com/watch?v=eur8dUO9mvE) — IBM Technology | Outside | 3:46 | 2025-02-19 | good | whole | Short, clear explanation of what the Model Context Protocol is and how it connects agents to tools and data. **Caveat:** external; generic (not OpenHands UI) |
| 2 | [Your AI Agent Skills Might Be Hurting Performance?! And, how to fix it!](https://www.youtube.com/watch?v=k-L0z97QWHs) — OpenHands | OpenHands channel | 38:11 | 2026-03-27 | good | [13:30–18:30](https://www.youtube.com/watch?v=k-L0z97QWHs&t=810s) Evaluating Agent Skills (main topic) | Explains what skills are and how they can help or hurt. **Caveat:** community call; clip only |
| 3 | [Flexibly Choose your Coding Model with OpenHands LLM Profiles](https://www.youtube.com/watch?v=TQAdEjmpVfc) — OpenHands | In our article ([post](https://www.openhands.dev/blog/model-choice-llm-profiles)) | 3:13 | 2026-05-27 | good | whole | LLM profiles: save and switch model configurations. |

> **Gap:** No verified video on plugins vs skills vs agent profiles. Agent profiles and Skills/Plugins/MCP pages need a new recording.

#### Steps

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [OpenHands + MCPs in Action: Figma and Context7 Demos](https://www.youtube.com/watch?v=vDv1AQW3cfY) — OpenHands | OpenHands channel | 40:25 | 2025-10-20 | partial | [10:39–13:10](https://www.youtube.com/watch?v=vDv1AQW3cfY&t=639s) Figma MCP example | Using an MCP server (Figma) with OpenHands. **Caveat:** may be outdated (Oct 2025, old UI) |
| 2 | [Agent Canvas v1 Is Live! Complete Setup & Getting Started Guide](https://www.youtube.com/watch?v=FpO-4bbM8Ko) — OpenHands | OpenHands channel | 12:00 | 2026-06-16 | partial | [5:56–6:36](https://www.youtube.com/watch?v=FpO-4bbM8Ko&t=356s) Create LLM profiles | Creating LLM profiles in v1. **Caveat:** may be outdated (June 2026) |
| 3 | [One AI Agent, Multiple LLMs: Automatic Model Routing in OpenHands](https://www.youtube.com/watch?v=Omk9szFLQcA) — OpenHands | OpenHands channel | 19:02 | 2026-10-15 | partial | [0:21–4:13](https://www.youtube.com/watch?v=Omk9szFLQcA&t=21s) What is the Model Router and benefits | Model Router setting. |

> **Gap:** Not covered: /add-skill, Skills page, Plugins page, MCP page and marketplace, Agent profiles, Condenser, Secrets. All need a recording on the current UI.

#### Best practices

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Your AI Agent Skills Might Be Hurting Performance?! And, how to fix it!](https://www.youtube.com/watch?v=k-L0z97QWHs) — OpenHands | OpenHands channel | 38:11 | 2026-03-27 | good | [13:30–20:50](https://www.youtube.com/watch?v=k-L0z97QWHs&t=810s) Evaluating skills and performance insights across models | Skill performance insights across models, why to test against a baseline. **Caveat:** community call; clip only |

#### Common mistakes

> **Gap:** No video. Needs a recording.

### M10. Multi-agent systems: coordinators, workers and verifiers

**Best single watch for the module:** [How Anthropic Builds Multi-Agent Systems: Patterns and Pitfalls](https://www.youtube.com/watch?v=IPu3HwtQb18) — Databricks Events, 17:55, 2026-08-25. Anthropic's own patterns (single agent first, generator-verifier, orchestrator-subagent, agent teams) map directly onto the module.

#### Key concepts

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Multi Agent Systems Explained: How AI Agents & LLMs Work Together](https://www.youtube.com/watch?v=sWH0T4Zez6I) — IBM Technology | Outside | 7:57 | 2025-12-15 | good | whole | Short plain-English definition of multi-agent systems and how agents collaborate. **Caveat:** Generic, not coding-specific. |
| 2 | [Conceptual Guide: Multi Agent Architectures](https://www.youtube.com/watch?v=4nZl32FwU-o) — LangChain | Outside | 8:58 | 2024-10-16 | good | whole | Names the supervisor, hierarchical and network architectures, i.e. coordinator/worker vocabulary. **Caveat:** Oct 2024, LangGraph-flavoured. |

#### Explanation

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [How Anthropic Builds Multi-Agent Systems: Patterns and Pitfalls](https://www.youtube.com/watch?v=IPu3HwtQb18) — Databricks Events | Outside | 17:55 | 2026-08-25 | best | [2:33–9:06](https://www.youtube.com/watch?v=IPu3HwtQb18&t=153s) Start with one agent; three signals that justify multi-agent; generator-verifier; orchestrator/sub-agent (chapters) | Covers when multi-agent is justified (three signals), generator-verifier and orchestrator-subagent patterns, and the start-single advice. **Caveat:** Talk, not a tutorial. |
| 2 | [Single Agent Vs. Multi-Agent Systems in AI \| How To Choose The Right Architecture](https://www.youtube.com/watch?v=2lTFI6FAqhk) — Snowflake Developers | Outside | 3:44 | 2025-11-06 | good | whole | Direct single versus multi-agent decision framing in under 4 minutes. **Caveat:** Vendor (Snowflake) perspective. |
| 3 | [Automating Massive Refactors with OpenHands Agents Working in Parallel](https://www.youtube.com/watch?v=MKrPPa6lE0s) — OpenHands | OpenHands channel | 55:01 | 2025-12-05 | partial | whole | OpenHands demo of many agents working a large refactor in parallel. **Caveat:** 55 min; no chapters; whole video only. |

#### In this repo (prototype)

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [OpenHands Community Call: Agent Control Plane, Async AI Engineering & What’s Next](https://www.youtube.com/watch?v=20HNd4cb2vA) — OpenHands | OpenHands channel | 17:13 | 2026-05-08 | partial | whole | OpenHands community call with chapters on the Agent Control Plane and multi-agent orchestration, closest to conductor/worker roles. **Caveat:** Chapter timestamps appear to be in minutes mislabeled as seconds (last chapter 27-1033), so do not clip from them; whole video only. |

> **Gap:** No video shows the six factory roles (conductor, dispatcher, worker, verifier, janitor, scout); needs a new recording.

#### Best practices

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Git Worktrees Explained: The Feature That Unlocks Parallel AI Agents](https://www.youtube.com/watch?v=BGTOnMz_qcw) — Augment Code | Outside | 3:51 | 2026-03-10 | good | whole | Why git worktree isolation lets parallel agents avoid collisions. **Caveat:** Augment Code product context. |
| 2 | [How Anthropic Builds Multi-Agent Systems: Patterns and Pitfalls](https://www.youtube.com/watch?v=IPu3HwtQb18) — Databricks Events | Outside | 17:55 | 2026-08-25 | good | [13:30–17:55](https://www.youtube.com/watch?v=IPu3HwtQb18&t=810s) Test each agent in isolation; simplicity (chapters) | Test each agent in isolation, keep it simple, verify independently. **Caveat:** See above. |

#### Common mistakes

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [How Anthropic Builds Multi-Agent Systems: Patterns and Pitfalls](https://www.youtube.com/watch?v=IPu3HwtQb18) — Databricks Events | Outside | 17:55 | 2026-08-25 | good | [1:31–3:38](https://www.youtube.com/watch?v=IPu3HwtQb18&t=91s) Why teams start multi-agent too early; start with one agent (chapters) | Why most teams go multi-agent too early. **Caveat:** See above. |
| 2 | [Is Ralph multi-agent?](https://www.youtube.com/watch?v=_IQ08vPFc7I) — OpenHands | OpenHands channel | 1:12 | 2026-05-05 | partial | whole | Short OpenHands answer on whether the Ralph loop is multi-agent. **Caveat:** Very short, narrow. |

#### Check your understanding

> **Gap:** Assessment items; no video needed.

#### Sources

> **Gap:** Reference list; no video needed.

#### To verify

> **Gap:** Open question on sub-agent support. The OpenHands roadmap call (hGm1XVwwIVk) lists sub-agents but I did not verify its content beyond chapters; a product demo of sub-agent delegation needs recording.

### M11. Setting up a Factory (prototype on this branch)

**Best single watch for the module:** [From Coding Assistants to AI Software Factories](https://www.youtube.com/watch?v=Sxn5rAoOZ2I) — OpenHands, 8:41, 2026-10-20. OpenHands talk on moving from coding assistants to AI software factories, the closest conceptual framing of the prototype.

#### Key concepts

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [The Dark Factory: How Twin Sun Automated Their Entire Dev Pipeline](https://www.youtube.com/watch?v=kkvi2Rm-K84) — Arcturus Labs | Outside | 1:07:14 | 2026-04-29 | best | [10:45–27:50](https://www.youtube.com/watch?v=kkvi2Rm-K84&t=645s) What is a dark factory; PR review bot; inside the factory step by step (chapters) | Explains the dark factory concept and walks a real factory pipeline step by step. **Caveat:** 67 min; external company's Jira-based setup, not OpenHands. |
| 2 | [From Coding Assistants to AI Software Factories](https://www.youtube.com/watch?v=Sxn5rAoOZ2I) — OpenHands | OpenHands channel | 8:41 | 2026-10-20 | partial | whole | OpenHands framing of software factories. **Caveat:** Adjacent, see overview. |

> **Gap:** Coordinator, inbox and owner as shipped UI concepts: no video; new recording needed.

#### Steps (prototype, from code)

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Build A Kanban Board For Agent Workflows](https://www.youtube.com/watch?v=M2Qnz-cqARU) — OpenHands | In our article ([post](https://www.openhands.dev/blog/new-in-agent-canvas-september-2026)) | 6:24 | 2026-09-29 | partial | whole | OpenHands Kanban for agent workflows in Agent Canvas: nearest real UI for organising work across agents. **Caveat:** Not the Factory page. |

> **Gap:** Nothing teaches Add Factory, pipeline templates, agent rail or composer routing. New screen recording required.

#### What is simulated

> **Gap:** Prototype-specific; no video can cover it. Needs a new recording with demoTeam on/off.

#### Best practices (for the real concept)

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [The Dark Factory: How Twin Sun Automated Their Entire Dev Pipeline](https://www.youtube.com/watch?v=kkvi2Rm-K84) — Arcturus Labs | Outside | 1:07:14 | 2026-04-29 | best | [40:29–46:18](https://www.youtube.com/watch?v=kkvi2Rm-K84&t=2429s) Incremental adoption and opinionated approach (chapters) | Incremental adoption, going gradually darker, narrowing the space: matches start with one repeatable job and human review at ends. **Caveat:** Long; use clip. |
| 2 | [Building an AI Dark Factory:  A Codebase That Writes Its Own Code, Live](https://www.youtube.com/watch?v=Xg0tNz9pICI) — Cole Medin | Outside | 2:23:35 | 2026-04-14 | good | whole | Live build of a self-writing codebase pipeline. **Caveat:** 2.4 hours; whole video only (chapters not checked). |

#### Common mistakes

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [3 Advanced AI agent design patterns](https://www.youtube.com/watch?v=89KKm_a4M7A) — Google Cloud Tech | Outside | 8:00 | 2026-03-17 | partial | whole | Routing/coordinator patterns and their failure modes, relevant to the word-matching router caveat. **Caveat:** Google Cloud agent patterns, generic. |

> **Gap:** Router-specific pitfalls (vague request creates duplicate conversation) are prototype-only.

#### Check your understanding

> **Gap:** Assessment; no video needed.

#### Sources

> **Gap:** Reference list; no video needed.

#### To verify

> **Gap:** Open product questions; nothing to show.

### M12. Evaluating agents: benchmarks and your own evals

**Best single watch for the module:** [The OpenHands Index: Benchmarking LLMs as Software Engineering Agents](https://www.youtube.com/watch?v=gMQ4JRdsyy0) — OpenHands, 4:44, 2026-01-29. Introduces the OpenHands Index and how LLMs are benchmarked as software engineering agents.

#### Key concepts

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [The OpenHands Index: Benchmarking LLMs as Software Engineering Agents](https://www.youtube.com/watch?v=gMQ4JRdsyy0) — OpenHands | OpenHands channel | 4:44 | 2026-01-29 | best | whole | What the OpenHands Index measures. **Caveat:** Jan 2026; dated scores. |
| 2 | [OpenHands Index Explained in Community Call plus AMD and Share Convos](https://www.youtube.com/watch?v=NKPwFRu_CgA) — OpenHands | OpenHands channel | 32:06 | 2026-02-06 | good | whole | Community call explaining the Index. **Caveat:** Long (about 32 min), Feb 2026; find the Index segment. |

#### Explanation

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [The Best AI Coding Models Right Now (OpenHands Index Update)](https://www.youtube.com/watch?v=iOnvLwxECP0) — OpenHands | OpenHands channel | 5:34 | 2026-07-09 | good | whole | Index update on which coding models lead and at what cost. **Caveat:** July 2026, leaderboard values will age. |
| 2 | [How important is benchmarking and testing different LLMs?](https://www.youtube.com/watch?v=cEugXkov4IA) — OpenHands | OpenHands channel | 1:38 | 2026-04-07 | good | whole | Why benchmark and test different LLMs yourself. **Caveat:** About 98 seconds. |
| 3 | [Why AI evals are the hottest new skill for product builders \| Hamel Husain & Shreya Shankar](https://www.youtube.com/watch?v=BsWxPI9UM4c) — Lenny's Podcast | Outside | 1:46:33 | 2025-09-25 | good | whole | Hamel Husain and Shreya Shankar on building your own evals. **Caveat:** Long (over 1h45); Sept 2025, product-focused not coding-agent specific. |

#### Best practices

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Ship Real Agents: Hands-On Evals for Agentic Applications — Laurie Voss, Arize](https://www.youtube.com/watch?v=Xfl50508LZM) — AI Engineer | Outside | 2:04:18 | 2026-05-14 | good | whole | Hands-on evals for agentic applications. **Caveat:** Long (over 2h); May 2026, workshop style. |
| 2 | [Your AI Agent Skills Might Be Hurting Performance?! And, how to fix it!](https://www.youtube.com/watch?v=k-L0z97QWHs) — OpenHands | OpenHands channel | 38:11 | 2026-03-27 | good | whole | Evaluating skills with repeated runs, matching the skills article. **Caveat:** About 38 min, March 2026. |

#### Common mistakes

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Why AI evals are the hottest new skill for product builders \| Hamel Husain & Shreya Shankar](https://www.youtube.com/watch?v=BsWxPI9UM4c) — Lenny's Podcast | Outside | 1:46:33 | 2025-09-25 | partial | whole | Covers common eval pitfalls in conversation. **Caveat:** Long; not a dedicated mistakes list. |
| 2 | [How important is benchmarking and testing different LLMs?](https://www.youtube.com/watch?v=cEugXkov4IA) — OpenHands | OpenHands channel | 1:38 | 2026-04-07 | partial | whole | Warns against trusting one benchmark. **Caveat:** Short. |

> **Gap:** No verified video on benchmark contamination or quoting scores without harness and date; candidate videos were blocked before verification (see unverifiedCandidates).

### M13. Where agents run: backends, self-hosting and ACP agents

**Best single watch for the module:** [Agent Canvas Is Production Ready: Run & Automate AI Coding Agents](https://www.youtube.com/watch?v=6c6QWRGJ8vs) — OpenHands, 8:48, 2026-07-07. OpenHands Agent Canvas overview covering local-first, cloud-ready workflows and bring-your-own agent via ACP.

#### Key concepts

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Agent Canvas Is Production Ready: Run & Automate AI Coding Agents](https://www.youtube.com/watch?v=6c6QWRGJ8vs) — OpenHands | OpenHands channel | 8:48 | 2026-07-07 | good | [0:23–3:13](https://www.youtube.com/watch?v=6c6QWRGJ8vs&t=23s) What is Agent Canvas through local-first/cloud-ready (chapters) | Agent Canvas, local-first and cloud-ready, ACP agents. **Caveat:** Overview level. |
| 2 | [ACP: The Universal Remote Control for AI Agents — Alex Hancock, Block](https://www.youtube.com/watch?v=YkNulwcc5jk) — AI Engineer | Outside | 11:00 | 2026-09-09 | best | whole | Block engineer explains ACP: what it standardises and why. **Caveat:** Conference talk, 11 min. |
| 3 | [Agent Client Protocol : The “New MCP” for IDEs and Coding Agents](https://www.youtube.com/watch?v=Tn1Rl-qBOr4) — Prompt Engineering | Outside | 8:43 | 2025-09-14 | good | whole | ACP as the 'new MCP' for coding agents and IDEs. **Caveat:** Third-party explainer; Sept 2025. |

#### Steps

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Agent Canvas Mac Docker Install Guide + Slack, GitHub & Automations](https://www.youtube.com/watch?v=-z__jyDoOv4) — OpenHands | OpenHands channel | 8:32 | 2026-06-24 | best | whole | Official Mac Docker install, plus Slack, GitHub and automations. **Caveat:** Vendor demo; UI may have changed. |
| 2 | [Agent Canvas Windows Docker Install Guide + First AI Agent Chat](https://www.youtube.com/watch?v=Vmqxr65baAE) — OpenHands | OpenHands channel | 9:15 | 2026-06-26 | good | whole | Official Windows Docker install and first agent chat. **Caveat:** Windows only. |
| 3 | [OpenHands x Toad Partnership: Agent Client Protocol (ACP)](https://www.youtube.com/watch?v=ItnMgC5sc40) — OpenHands | OpenHands channel | 2:50 | 2025-12-23 | partial | whole | OpenHands with Toad via ACP. **Caveat:** Dec 2025, pre-Canvas; ACP presets in Settings are not shown. |

> **Gap:** No video on provisioning a remote VM with nginx and Let's Encrypt, connecting to several backends, or the Settings > Agent ACP preset flow. New recording needed.

#### Best practices

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [The Only Docker Tutorial You Need To Get Started](https://www.youtube.com/watch?v=DQdB7wFEygo) — The Coding Sloth | Outside | 11:53 | 2025-01-28 | partial | whole | Docker fundamentals before self-hosting an agent server. **Caveat:** Generic Docker, not agent specific. |
| 2 | [OpenHands Running Local LMs on the DGX Spark](https://www.youtube.com/watch?v=z13qTHR3tS0) — OpenHands | In our article ([post](https://www.openhands.dev/blog/host-your-own-coding-agents-with-openhands-using-nvidia-dgx-spark)) | 0:38 | 2025-10-14 | good | whole | OpenHands running local models on NVIDIA DGX Spark, a self-hosted setup. **Caveat:** Very short (38 s) and specific to that hardware. |

> **Gap:** Securing a remote machine before exposing ports is not covered by any verified video; new recording needed.

#### Common mistakes

> **Gap:** No video covers exposing an unauthenticated server, per-backend settings or Pi/OpenCode on Cloud.

#### Check your understanding

> **Gap:** Assessment; no video needed.

#### Sources

> **Gap:** Reference list; no video needed.

#### To verify

| # | Video | Source | Length | Date | Fit | Use | Notes |
|---|---|---|---|---|---|---|---|
| 1 | [Using a Local Agentic Coding LLM through Slack or GitHub with OpenHands](https://www.youtube.com/watch?v=4ukm7XK27ms) — OpenHands | In our article ([post](https://www.openhands.dev/blog/host-your-own-coding-agents-with-openhands-using-nvidia-dgx-spark)) | 3:20 | 2025-11-05 | partial | whole | Local model reached through Slack or GitHub with OpenHands, relevant to running models self-hosted. **Caveat:** 3 min 20 s, chapters unavailable; whole video only. |

> **Gap:** Gentoo and Cursor via Custom ACP cannot be answered by video.

## Recording backlog

Sub-lessons where nothing current covers the topic. Product how-tos need a new screen recording of the current UI.

| Module | Sub-lesson | What is missing |
|---|---|---|
| M02 | Common mistakes | No verified video found that addresses 'local does not mean private' directly; the local-model videos above cover the setup only. |
| M04 | Common mistakes | No verified video is a dedicated 'common mistakes' list for agentic coding; picks are partial. |
| M05 | Key concepts | No video explains the Feed or conversation/workspace/backend vocabulary; a short recording is needed. |
| M05 | Steps | Not covered: Feed page (/feed), Overview panel, context meter and Compact context, stop/archive/delete. Record on the current UI. |
| M05 | Best practices | No video on one-task-per-conversation, checking Changes view. Needs a screen recording. |
| M05 | Common mistakes | Nothing available (skills not appearing in running conversation, uncompacted context). Needs new recording. |
| M06 | Steps in OpenHands | No verified video shows Canvas Settings > Verification or the PR review automation. |
| M06 | Common mistakes | No verified short video on the specific mistakes listed (agent editing its own tests, giant diffs). |
| M07 | Steps in OpenHands | No verified video demonstrates Secrets, Confirmation Mode, Security Analyzer or the Docker runtime in Canvas. |
| M08 | Key concepts | Schedule vs Event vs webhook triggers, runs and statuses are not taught by any verified video. An outside concept video could not be verified (YouTube bot check blocked metadata calls). |
| M08 | Steps (UI labels from the app) | Not covered: Templates page, Find opportunities, Import automation, Test/Draft, Activity Log, Git Sync, Agent Profile choice. Record on the current UI. |
| M08 | Design guidance (from the workflow-automation article) | Shadow mode, least privilege and caps are not covered in a video. |
| M08 | Best practices | No video. Record or write. |
| M08 | Common mistakes | No video (public URL for events, disabled imports, SKIPPED). Needs a recording. |
| M09 | What each thing is | No verified video on plugins vs skills vs agent profiles. Agent profiles and Skills/Plugins/MCP pages need a new recording. |
| M09 | Steps | Not covered: /add-skill, Skills page, Plugins page, MCP page and marketplace, Agent profiles, Condenser, Secrets. All need a recording on the current UI. |
| M09 | Common mistakes | No video. Needs a recording. |
| M10 | In this repo (prototype) | No video shows the six factory roles (conductor, dispatcher, worker, verifier, janitor, scout); needs a new recording. |
| M10 | Check your understanding | Assessment items; no video needed. |
| M10 | Sources | Reference list; no video needed. |
| M10 | To verify | Open question on sub-agent support. The OpenHands roadmap call (hGm1XVwwIVk) lists sub-agents but I did not verify its content beyond chapters; a product demo of sub-agent delegation needs recording. |
| M11 | Key concepts | Coordinator, inbox and owner as shipped UI concepts: no video; new recording needed. |
| M11 | Steps (prototype, from code) | Nothing teaches Add Factory, pipeline templates, agent rail or composer routing. New screen recording required. |
| M11 | What is simulated | Prototype-specific; no video can cover it. Needs a new recording with demoTeam on/off. |
| M11 | Common mistakes | Router-specific pitfalls (vague request creates duplicate conversation) are prototype-only. |
| M11 | Check your understanding | Assessment; no video needed. |
| M11 | Sources | Reference list; no video needed. |
| M11 | To verify | Open product questions; nothing to show. |
| M12 | Common mistakes | No verified video on benchmark contamination or quoting scores without harness and date; candidate videos were blocked before verification (see unverifiedCandidates). |
| M13 | Steps | No video on provisioning a remote VM with nginx and Let's Encrypt, connecting to several backends, or the Settings > Agent ACP preset flow. New recording needed. |
| M13 | Best practices | Securing a remote machine before exposing ports is not covered by any verified video; new recording needed. |
| M13 | Common mistakes | No video covers exposing an unauthenticated server, per-backend settings or Pi/OpenCode on Cloud. |
| M13 | Check your understanding | Assessment; no video needed. |
| M13 | Sources | Reference list; no video needed. |
| M13 | To verify | Gentoo and Cursor via Custom ACP cannot be answered by video. |

## Appendix A. Videos embedded in our articles

| Video | Channel | Length | Date | Article | Used in |
|---|---|---|---|---|---|
| [VersaBench and OpenHands Versa: Building More Versatile Agents](https://www.youtube.com/watch?v=uc2P-7E0ZwE) | OpenHands | 4:41 | 2025-06-05 | [Building a Provably Versatile Agent](https://www.openhands.dev/blog/building-a-provably-versatile-agent) | not mapped |
| [OpenHands + Devstral = A Fully Local Coding Agent](https://www.youtube.com/watch?v=oV9tAkS2Xic) | OpenHands | 8:09 | 2025-05-21 | [Devstral: A new state-of-the-art open model for coding agents](https://www.openhands.dev/blog/devstral-a-new-state-of-the-art-open-model-for-coding-agents) | M02 |
| [OpenHands Running Local LMs on the DGX Spark](https://www.youtube.com/watch?v=z13qTHR3tS0) | OpenHands | 0:38 | 2025-10-14 | [Host Your Own Coding Agents with OpenHands using NVIDIA DGX Spark](https://www.openhands.dev/blog/host-your-own-coding-agents-with-openhands-using-nvidia-dgx-spark) | M13 |
| [Using a Local Agentic Coding LLM through Slack or GitHub with OpenHands](https://www.youtube.com/watch?v=4ukm7XK27ms) | OpenHands | 3:20 | 2025-11-05 | [Host Your Own Coding Agents with OpenHands using NVIDIA DGX Spark](https://www.openhands.dev/blog/host-your-own-coding-agents-with-openhands-using-nvidia-dgx-spark) | M13 |
| [Inside Claude Code With Its Creator Boris Cherny](https://www.youtube.com/watch?v=PQU9o_5rHC4) | Y Combinator | n/a | n/a | [How to Evaluate Agent Skills (And Why You Should)](https://www.openhands.dev/blog/evaluating-agent-skills) | not mapped |
| [OpenHands: Open-source AI Software Development Agents](https://www.youtube.com/watch?v=oB4JR98KRAA) | OpenHands | 2:13 | 2025-03-26 | [Introducing the OpenHands Cloud](https://www.openhands.dev/blog/introducing-the-openhands-cloud) | not mapped |
| [OpenHands Slack Integration](https://www.youtube.com/watch?v=hbloGmfZsJ4) | OpenHands | 3:47 | 2025-06-25 | [OpenHands Meets Slack: AI-Powered Development in Your Workspace](https://www.openhands.dev/blog/openhands-meets-slack-ai-powered-development-in-your-workspace) | not mapped |
| [Build A Kanban Board For Agent Workflows](https://www.youtube.com/watch?v=M2Qnz-cqARU) | OpenHands | 6:24 | 2026-09-29 | [OpenHands in September: Scoped Agents, Isolated Runtimes, Persistent Workflows](https://www.openhands.dev/blog/new-in-agent-canvas-september-2026) | M11 |
| [Flexibly Choose your Coding Model with OpenHands LLM Profiles](https://www.youtube.com/watch?v=TQAdEjmpVfc) | OpenHands | 3:13 | 2026-05-27 | [Simple, In-conversation Model Choice in OpenHands](https://www.openhands.dev/blog/model-choice-llm-profiles) | M02, M09 |
| [OpenHands CLI Demo](https://www.youtube.com/watch?v=PfvIx4y8h7w) | OpenHands | 1:58 | 2025-06-17 | [The OpenHands CLI: AI-Powered Development in Your Terminal](https://www.openhands.dev/blog/the-openhands-cli-ai-powered-development-in-your-terminal) | not mapped |
| [OpenHands Vulnerability Fixer - Dispatch Agents to Secure Your Code](https://www.youtube.com/watch?v=ovX-zk8eC_E) | OpenHands | 3:37 | 2026-02-23 | [The OpenHands Vulnerability Fixer: Automated Security Remediation with AI Agents](https://www.openhands.dev/blog/20260303-vulnerability-fixer) | M07 |

## Appendix B. Every upload on the OpenHands channel

Channel: https://www.youtube.com/@OpenHands-AI. Playlists: Guides, Webinars, OpenTalks (Robert Brennan, CEO), Community Meetings, Community Interviews, OpenHands Demo Reel.

159 uploads. The last column shows which lessons use the video; blank means not mapped to a lesson (yet). Sorted by views.

| Video | Type | Length | Date | Views | Lessons |
|---|---|---|---|---|---|
| [What is OpenHands?](https://www.youtube.com/watch?v=cvbfx84Omrw) | shorts | 0:29 | 2026-02-02 | 7100 |  |
| [How is OpenHands different from other tools?](https://www.youtube.com/watch?v=CyGtqqzc1Ow) | shorts | 2:10 | 2026-03-26 | 1800 |  |
| [Preparing for large-scale refactoring](https://www.youtube.com/watch?v=B2rqmGCs4Dg) | shorts | 0:37 | 2026-04-23 | 1400 |  |
| [Ray Myers: "Velocity Is Dead."](https://www.youtube.com/watch?v=6_Smtxb_afw) | shorts | 0:31 | 2026-04-17 | 1400 | M04 |
| [Introducing OpenHands' CEO  Robert Brennan](https://www.youtube.com/watch?v=zTjane8WyPM) | shorts | 0:26 | 2026-02-04 | 1300 |  |
| [Is AI replacing junior developers?](https://www.youtube.com/watch?v=zuLllcoSzLU) | shorts | 1:03 | 2026-04-03 | 1200 |  |
| [Where is software dev heading?](https://www.youtube.com/watch?v=z8bUDAua5Eo) | shorts | 1:53 | 2026-04-30 | 1000 |  |
| [The Ralph Wiggum Phenomenon](https://www.youtube.com/watch?v=KTXKNHIJyzU) | shorts | 0:23 | 2026-04-15 | 1000 |  |
| [How important is it to have a human in the CVE fix process?](https://www.youtube.com/watch?v=EHO5rzHt1a4) | shorts | 0:42 | 2026-03-10 | 1000 | M07 |
| [How does OpenHands account for security while automating?](https://www.youtube.com/watch?v=9tuGbS0sZtI) | shorts | 1:28 | 2026-02-26 | 1000 | M07 |
| [How does OpenHands look at using AI to refactor codebases?](https://www.youtube.com/watch?v=enJbefPdg4U) | shorts | 1:10 | 2026-02-17 | 1000 |  |
| [How does OpenHands help ease bottlenecks in the software dev life cycle?](https://www.youtube.com/watch?v=Lnz14S3zEcs) | shorts | 1:24 | 2026-02-24 | 917 |  |
| [How do you keep AI on track when doing refactors?](https://www.youtube.com/watch?v=o0_BmRhW5e8) | shorts | 1:20 | 2026-02-19 | 890 |  |
| [How important is benchmarking and testing different LLMs?](https://www.youtube.com/watch?v=cEugXkov4IA) | shorts | 1:38 | 2026-04-07 | 736 | M02, M12 |
| [Are there certain languages better suited for AI?](https://www.youtube.com/watch?v=vNQZPBQXMm8) | shorts | 1:42 | 2026-04-30 | 688 |  |
| [Where OpenHands is best fit](https://www.youtube.com/watch?v=9SpKIDM6IaU) | shorts | 0:43 | 2026-02-12 | 680 |  |
| [Who's Ray Myers and what he's up to?](https://www.youtube.com/watch?v=-3mgj-wq1Is) | shorts | 0:28 | 2026-04-30 | 671 |  |
| [Where is AI in software development headed?](https://www.youtube.com/watch?v=tgRalEcgX24) | shorts | 1:20 | 2026-03-31 | 458 |  |
| [What new developments are on the roadmap for OpenHands?](https://www.youtube.com/watch?v=8hXqDnR4jXU) | shorts | 1:30 | 2026-03-26 | 406 |  |
| [How does OpenHands resolve security problems? (Part 1)](https://www.youtube.com/watch?v=zacr_wKgIwg) | shorts | 0:54 | 2026-03-04 | 345 |  |
| [Testing strategy and increments](https://www.youtube.com/watch?v=tWwiZnW2McI) | shorts | 1:12 | 2026-05-01 | 309 | M04 |
| [How does the incremental method work?](https://www.youtube.com/watch?v=aHc8vsdbY7c) | shorts | 1:31 | 2026-05-04 | 293 |  |
| [How does OpenHands resolve security problems? (Part 2)](https://www.youtube.com/watch?v=4CKeTWjUobU) | shorts | 0:57 | 2026-03-04 | 287 |  |
| [What would an optimized implementation of OpenHands look like?](https://www.youtube.com/watch?v=XDsd8i8bPds) | shorts | 1:23 | 2026-04-08 | 121 |  |
| [How was OpenHands founded?](https://www.youtube.com/watch?v=ie5WF-Giub0) | shorts | 1:21 | 2026-02-10 | 108 |  |
| [From Coding Assistants to AI Software Factories](https://www.youtube.com/watch?v=Sxn5rAoOZ2I) | videos | 8:41 | 2026-10-20 | 1813 | M03, M11 |
| [Building an Open-Source AI Company: The Tradeoffs Nobody Talks About](https://www.youtube.com/watch?v=BtZTeuEPnNA) | videos | 7:28 | 2026-10-20 | 660 |  |
| [One AI Agent, Multiple LLMs: Automatic Model Routing in OpenHands](https://www.youtube.com/watch?v=Omk9szFLQcA) | videos | 19:02 | 2026-10-15 | 1498 | M02, M09 |
| [Will AI Coding Agents Have a Kubernetes Moment?](https://www.youtube.com/watch?v=BbN67-78VjE) | videos | 9:46 | 2026-10-15 | 458 |  |
| [Build A Kanban Board For Agent Workflows](https://www.youtube.com/watch?v=M2Qnz-cqARU) | videos | 6:24 | 2026-09-29 | 1137 | M11 |
| [Automate Repetitive Tasks with Agent Canvas](https://www.youtube.com/watch?v=3FzRrT3HH3w) | videos | 2:49 | 2026-09-29 | 760 | M08 |
| [OpenHands, Open source, and open models](https://www.youtube.com/watch?v=CO756YKg9ac) | videos | 11:27 | 2026-09-10 | 2055 |  |
| [OpenHands & Grayswan: How AI is Transforming Cybersecurity](https://www.youtube.com/watch?v=1USXbQyJk3w) | videos | 41:18 | 2026-09-01 | 1383 | M07 |
| [Performing Your Daily Workflow with AI Agents](https://www.youtube.com/watch?v=S_wap45Iq8U) | videos | 11:30 | 2026-08-07 | 3605 | M05, M08 |
| [The Best AI Coding Models Right Now (OpenHands Index Update)](https://www.youtube.com/watch?v=iOnvLwxECP0) | videos | 5:34 | 2026-07-09 | 1723 | M02, M12 |
| [Agent Canvas Is Production Ready: Run & Automate AI Coding Agents](https://www.youtube.com/watch?v=6c6QWRGJ8vs) | videos | 8:48 | 2026-07-07 | 2640 | M05, M08, M13 |
| [Agent Canvas Windows Docker Install Guide + First AI Agent Chat](https://www.youtube.com/watch?v=Vmqxr65baAE) | videos | 9:15 | 2026-06-26 | 724 | M13 |
| [Agent Canvas Windows Install Guide (NPM, No Docker) + First AI Agent Chat](https://www.youtube.com/watch?v=MLoJsKLKXXo) | videos | 8:29 | 2026-06-25 | 336 |  |
| [Agent Canvas Mac Docker Install Guide + Slack, GitHub & Automations](https://www.youtube.com/watch?v=-z__jyDoOv4) | videos | 8:32 | 2026-06-24 | 364 | M13 |
| [Agent Canvas in under 10 Minutes: Mac Setup (No Docker) + First AI Agent Chat](https://www.youtube.com/watch?v=dz6zgOK0_7Q) | videos | 11:02 | 2026-06-22 | 680 | M05 |
| [Agent Canvas Is Officially Production Ready — Local AI Agents, Automations & Parallel Workflows](https://www.youtube.com/watch?v=ZeqmkbICrrg) | videos | 48:02 | 2026-06-18 | 3498 | M05 |
| [How to Perform Agent Agnostic Automated Software Engineering with the Agent Canvas](https://www.youtube.com/watch?v=vhpM_pfhwf0) | videos | 5:29 | 2026-06-17 | 1767 | M05 |
| [🚀 Agent Canvas v1 Is Live! Complete Setup & Getting Started Guide](https://www.youtube.com/watch?v=FpO-4bbM8Ko) | videos | 12:00 | 2026-06-16 | 3576 | M05, M08, M09 |
| [OpenHands Community Call: Agent Canvas Beta Launch + Community Demos](https://www.youtube.com/watch?v=6DA57LRtJ6I) | videos | 45:12 | 2026-06-04 | 539 |  |
| [Previewing Agent Canvas — Open Source AI Coding Platform](https://www.youtube.com/watch?v=PvIDa_U2Uc8) | videos | 3:34 | 2026-05-28 | 1856 | M05 |
| [Flexibly Choose your Coding Model with OpenHands LLM Profiles](https://www.youtube.com/watch?v=TQAdEjmpVfc) | videos | 3:13 | 2026-05-27 | 7287 | M02, M09 |
| [The BEST AI Models Right Now (Save MONEY & Get BETTER Results)](https://www.youtube.com/watch?v=r_AS63moJiA) | videos | 8:01 | 2026-05-26 | 326 | M02 |
| [OpenHands Community Update: Agent Canvas, GPT-5.5 & LLM Profiles](https://www.youtube.com/watch?v=lbY9kNTdWec) | videos | 32:47 | 2026-05-22 | 479 | M02 |
| [Run OpenHands Agent Canvas on Mac!](https://www.youtube.com/watch?v=BenkkQmmFCg) | videos | 1:39 | 2026-05-13 | 851 |  |
| [OpenHands runs natively on Windows! Learn about Agent Canvas!](https://www.youtube.com/watch?v=WAxf_RRIrB8) | videos | 1:58 | 2026-05-12 | 1060 |  |
| [OpenHands' Agent Canvas: Exclusive Preview for the Community to Test!](https://www.youtube.com/watch?v=hgY_-3Pbmqw) | videos | 4:17 | 2026-05-12 | 537 |  |
| [OpenHands Community Call: Agent Control Plane, Async AI Engineering & What’s Next](https://www.youtube.com/watch?v=20HNd4cb2vA) | videos | 17:13 | 2026-05-08 | 463 | M10 |
| [OpenHands Enterprise - Agent Control Plane](https://www.youtube.com/watch?v=G3h6ecOPc4g) | videos | 10:31 | 2026-05-07 | 461 |  |
| [Ray's RALPH.md](https://www.youtube.com/watch?v=cC7eFod-27Y) | videos | 1:12 | 2026-05-05 | 442 |  |
| [Is Ralph multi-agent?](https://www.youtube.com/watch?v=_IQ08vPFc7I) | videos | 1:12 | 2026-05-05 | 137 | M10 |
| [What's next for OpenHands?](https://www.youtube.com/watch?v=V0nSeMcITqE) | videos | 4:16 | 2026-05-04 | 362 |  |
| [Using AI models to determine agent quality](https://www.youtube.com/watch?v=ZwKfvRyfOlw) | videos | 4:54 | 2026-05-04 | 87 | M06 |
| [The Two Worlds of AI Coding](https://www.youtube.com/watch?v=C0kz3ps8RSk) | videos | 1:50 | 2026-05-01 | 179 | M03 |
| [OpenHands GUI Update: New features](https://www.youtube.com/watch?v=J3PU_Nm0f7w) | videos | 3:34 | 2026-05-01 | 654 |  |
| [OpenHands Roadmap: What’s coming next](https://www.youtube.com/watch?v=RQJGBQsipQE) | videos | 5:02 | 2026-04-30 | 318 |  |
| [Ralph Wiggum: The next Swiss Army Knife of AI Coding?](https://www.youtube.com/watch?v=5YdYv6XJWxY) | videos | 3:25 | 2026-04-30 | 133 |  |
| [What agent should I use to do the Ralph Wiggum technique?](https://www.youtube.com/watch?v=CSGoTBzEiPI) | videos | 2:01 | 2026-04-30 | 44 |  |
| [How do you handle Context Management with an agent?](https://www.youtube.com/watch?v=W29N0Ad7yUY) | videos | 2:46 | 2026-04-30 | 66 | M01, M04 |
| [What can Ralph teach us?](https://www.youtube.com/watch?v=snVmEhWYkAI) | videos | 1:35 | 2026-04-30 | 33 |  |
| [We Removed 30,000 Lines of Code... Here's What Happened](https://www.youtube.com/watch?v=H8wIK1_0zNU) | videos | 40:56 | 2026-04-28 | 167 |  |
| [What are the risks of running autonomous AI?](https://www.youtube.com/watch?v=E1JhEyWic0Y) | videos | 0:56 | 2026-04-23 | 168 | M03, M07 |
| [Trusting Legacy Codebase Migrations: the Snapshot Tests Strategy](https://www.youtube.com/watch?v=zV1PYhuZwFY) | videos | 2:26 | 2026-04-17 | 171 | M04 |
| [The Ralph Wiggum Phenomenon: This “Meme” Is Changing How We Use AI Agents](https://www.youtube.com/watch?v=vQZ20Xiy8fE) | videos | 4:15 | 2026-04-17 | 237 |  |
| [Exploring concrete scoring for the critic agent (Full)](https://www.youtube.com/watch?v=NNqhqlk87TY) | videos | 3:24 | 2026-04-17 | 50 | M06 |
| [Intro to the Ralph Wiggum Method: "Just enough orchestration"](https://www.youtube.com/watch?v=ydfs36Ol1tA) | videos | 3:02 | 2026-04-15 | 97 |  |
| [Exploring concrete scoring for the critic agent (Part 2)](https://www.youtube.com/watch?v=F7XIZzlU1KQ) | videos | 1:43 | 2026-04-15 | 47 |  |
| [Exploring concrete scoring for the Critic agent (Part 1)](https://www.youtube.com/watch?v=IJhCmXi34JM) | videos | 1:41 | 2026-04-14 | 44 |  |
| [Discussion about Ralph.md](https://www.youtube.com/watch?v=nW-dXKPQR4o) | videos | n/a | n/a | n/a |  |
| [How to Get Started with OpenHands (CLI, Cloud & SDK Explained)](https://www.youtube.com/watch?v=jQ2ft0RKhsY) | videos | 23:49 | 2026-04-10 | 5045 |  |
| [What OpenHands Needs Most Right Now (Community Call Breakdown)](https://www.youtube.com/watch?v=H9qp7gHwJsQ) | videos | 33:06 | 2026-04-10 | 100 |  |
| [What would an optimized implementation of OpenHands look like?](https://www.youtube.com/watch?v=H4Y_GD7AiJU) | videos | 1:33 | 2026-04-08 | 106 |  |
| [Why linking migrated code with comments is important](https://www.youtube.com/watch?v=zsnigI_rKUA) | videos | 1:58 | 2026-04-08 | 100 |  |
| [How important is benchmarking and testing different LLMs?](https://www.youtube.com/watch?v=J6gTJPcck1U) | videos | 1:40 | 2026-04-07 | 198 |  |
| [Ralph Wiggum Presentation](https://www.youtube.com/watch?v=5dO6L75oF5o) | videos | 3:52 | 2026-04-07 | 100 |  |
| [Engineering the COBOL Workflow (Full)](https://www.youtube.com/watch?v=Z0Rc6UGb098) | videos | 3:03 | 2026-04-03 | 162 |  |
| [Is AI replacing junior developers?](https://www.youtube.com/watch?v=WDeZZah9aqM) | videos | 1:06 | 2026-04-03 | 1566 |  |
| [Open Hands Cloud Updates](https://www.youtube.com/watch?v=TsGG2dtUYf4) | videos | 1:12 | 2026-04-02 | 63 |  |
| [Engineering the COBOL Workflow (Part 2)](https://www.youtube.com/watch?v=raSOOE2prY0) | videos | 1:08 | 2026-04-02 | 46 |  |
| [Where is AI in software development headed?](https://www.youtube.com/watch?v=Cck0vVSdGhM) | videos | 1:38 | 2026-03-31 | 115 |  |
| [Stop Shipping Slop: The Future of AI Code Is Quality](https://www.youtube.com/watch?v=y60vYnBAvBI) | videos | 57:02 | 2026-03-31 | 1016 | M04, M06 |
| [Engineering the COBOL Workflow (Part 1)](https://www.youtube.com/watch?v=UCd5CNOvX-8) | videos | 1:56 | 2026-03-31 | 62 |  |
| [Configuring the OpenHands CLI](https://www.youtube.com/watch?v=0cvtEbq1VwY) | videos | 2:36 | 2026-03-30 | 578 |  |
| [Your AI Agent Skills Might Be Hurting Performance?! And, how to fix it!](https://www.youtube.com/watch?v=k-L0z97QWHs) | videos | 38:11 | 2026-03-27 | 311 | M09, M12 |
| [Quick intro to Ralph](https://www.youtube.com/watch?v=sk4adNQjS_g) | videos | 0:47 | 2026-03-27 | 196 |  |
| [How is OpenHands different from other tools?](https://www.youtube.com/watch?v=RXFbC1s6lyA) | videos | 2:10 | 2026-03-26 | 4268 |  |
| [What new developments are on the roadmap for OpenHands?](https://www.youtube.com/watch?v=sZp1ZJwTbwg) | videos | 1:33 | 2026-03-24 | 152 |  |
| [Why the two-phase approach works (Full)](https://www.youtube.com/watch?v=G_Q8JWfX9IQ) | videos | 2:39 | 2026-03-19 | 185 |  |
| [OpenHands Roadmap Reveal: Plugins, Sub-Agents, Verification, and More](https://www.youtube.com/watch?v=hGm1XVwwIVk) | videos | 41:14 | 2026-03-16 | 608 | M09 |
| [How important is it to have a human in the CVE fix process?](https://www.youtube.com/watch?v=J3XE2aPt_ow) | videos | 0:43 | 2026-03-10 | 280 |  |
| [Why the two-phase approach works (Part 2)](https://www.youtube.com/watch?v=Qqo6Gs9ty3w) | videos | 1:37 | 2026-03-09 | 221 |  |
| [How does OpenHands resolve security problems?](https://www.youtube.com/watch?v=NV_NQ-N_M9M) | videos | 2:49 | 2026-03-03 | 323 |  |
| [Why the two-phase approach works (Part 1)](https://www.youtube.com/watch?v=G0J6vVFl3JE) | videos | 1:03 | 2026-03-02 | 161 |  |
| [MiniMax Is Now Free on OpenHands + Benchmark Fixes & AI Dev Workstation Demo](https://www.youtube.com/watch?v=f8j58qNvMe0) | videos | 25:59 | 2026-02-27 | 980 |  |
| [The Ralph Wiggum Phenomenon: Evolving Agentic Coding](https://www.youtube.com/watch?v=5syeNjq2ZCU) | videos | 55:23 | 2026-02-27 | 620 |  |
| [How does OpenHands account for security while automating?](https://www.youtube.com/watch?v=3r2_vHRlIjQ) | videos | 2:33 | 2026-02-26 | 89 |  |
| [How does "The Loop" work?](https://www.youtube.com/watch?v=ET2OKt8xNwQ) | videos | 1:20 | 2026-02-25 | 238 |  |
| [How does OpenHands help ease bottlenecks in the software dev life cycle?](https://www.youtube.com/watch?v=HPi8g2vRFpg) | videos | 2:18 | 2026-02-24 | 115 |  |
| [The two-phase solution to the COBOL problem](https://www.youtube.com/watch?v=feZUOys4Aik) | videos | 1:46 | 2026-02-23 | 92 |  |
| [OpenHands Vulnerability Fixer - Dispatch Agents to Secure Your Code](https://www.youtube.com/watch?v=ovX-zk8eC_E) | videos | 3:37 | 2026-02-23 | 1476 | M07 |
| [How do you keep AI on track when doing refactors?](https://www.youtube.com/watch?v=XDIe6EEoRvI) | videos | 1:30 | 2026-02-19 | 93 | M04 |
| [How OpenHands solves the COBOL problem (Part 2)](https://www.youtube.com/watch?v=FRqzNYlPNb8) | videos | 0:49 | 2026-02-18 | 77 |  |
| [How does OpenHands look at using AI to refactor codebases?](https://www.youtube.com/watch?v=7xjHHe0P3W4) | videos | 1:15 | 2026-02-17 | 1003 |  |
| [How OpenHands solves the COBOL problem (Part 1)](https://www.youtube.com/watch?v=J_dmfpCGZa4) | videos | 0:57 | 2026-02-16 | 113 |  |
| [Where OpenHands is best fit](https://www.youtube.com/watch?v=bLL3Q5P1Vn4) | videos | 1:28 | 2026-02-12 | 2049 |  |
| [Exploring the COBOL problem (Full)](https://www.youtube.com/watch?v=GoSFDD07hHs) | videos | 4:08 | 2026-02-11 | 943 |  |
| [How was OpenHands founded?](https://www.youtube.com/watch?v=m3IyhQFQU5A) | videos | 1:21 | 2026-02-10 | 1026 |  |
| [Exploring the COBOL problem (Part 2)](https://www.youtube.com/watch?v=FUWN-1jfQ4Y) | videos | 1:31 | 2026-02-09 | 117 |  |
| [OpenHands Index Explained in Community Call plus AMD and Share Convos](https://www.youtube.com/watch?v=NKPwFRu_CgA) | videos | 32:06 | 2026-02-06 | 218 | M12 |
| [Introducing OpenHands' CEO Robert Brennan](https://www.youtube.com/watch?v=29Efj7jwH8Q) | videos | 0:26 | 2026-02-04 | 249 |  |
| [Exploring the COBOL problem (Part 1)](https://www.youtube.com/watch?v=qVbgw-YGuNg) | videos | 2:37 | 2026-02-03 | 221 |  |
| [What is OpenHands?](https://www.youtube.com/watch?v=6XXJ7crUIgA) | videos | 0:29 | 2026-02-02 | 3234 |  |
| [The OpenHands Index: Benchmarking LLMs as Software Engineering Agents](https://www.youtube.com/watch?v=gMQ4JRdsyy0) | videos | 4:44 | 2026-01-29 | 1474 | M02, M12 |
| [OpenHands Critic is Here to Roast Your Code (CLI Demo + Ralph Wiggum + Community Updates)](https://www.youtube.com/watch?v=JgzwwLP8jL8) | videos | 24:10 | 2026-01-23 | 432 | M06 |
| [Refactoring COBOL to Java with Agentic AI  with an Iterative Refinement Workflow](https://www.youtube.com/watch?v=4LUtguF160A) | videos | 56:44 | 2026-01-23 | 1259 |  |
| [OpenHands CLI Update: Cloud Sync, Web Mode, Real-Time Events](https://www.youtube.com/watch?v=tzgXm8WkAiY) | videos | 7:09 | 2026-01-15 | 228 |  |
| [OpenHands CLI Gets a Major Glow-Up (Web UI, Cloud Sync & More)](https://www.youtube.com/watch?v=IAAQYygnfSI) | videos | 22:43 | 2026-01-09 | 848 |  |
| [A New OpenHands CLI: Experimental UI and Power Features](https://www.youtube.com/watch?v=SjAJYB0Nrl4) | videos | 4:58 | 2025-12-29 | 1895 |  |
| [OpenHands V1 Lands: Faster Agents, New SDK, What’s Next](https://www.youtube.com/watch?v=DtYBYt2w43g) | videos | 2:49 | 2025-12-26 | 762 |  |
| [OpenHands x Toad Partnership: Agent Client Protocol (ACP)](https://www.youtube.com/watch?v=ItnMgC5sc40) | videos | 2:50 | 2025-12-23 | 465 | M13 |
| [OpenHands migrates COBOL to Java and Toad Integration!](https://www.youtube.com/watch?v=WbF5BvGYWP4) | videos | 47:20 | 2025-12-19 | 179 |  |
| [Running OpenHands with ACP, AMD, & More](https://www.youtube.com/watch?v=jVJ79HfWIRM) | videos | 21:36 | 2025-12-05 | 285 |  |
| [Automating Massive Refactors with OpenHands Agents Working in Parallel](https://www.youtube.com/watch?v=MKrPPa6lE0s) | videos | 55:01 | 2025-12-05 | 1795 | M10 |
| [Can AI Do Test-Driven Development? With Emily Bache](https://www.youtube.com/watch?v=g627Apd9zvY) | videos | 25:16 | 2025-11-17 | 1265 | M04, M06 |
| [OpenHands Free, Open Source Agent SDK is HERE](https://www.youtube.com/watch?v=PGiS__JFq5c) | videos | 26:05 | 2025-11-14 | 995 |  |
| [Debugging Production Issues with AI Agents](https://www.youtube.com/watch?v=5ZsBbbtQCrA) | videos | 13:07 | 2025-11-10 | 2354 |  |
| [Using a Local Agentic Coding LLM through Slack or GitHub with OpenHands](https://www.youtube.com/watch?v=4ukm7XK27ms) | videos | 3:20 | 2025-11-05 | 2601 | M13 |
| [You Ship, We Listen: OpenHands Community Q&A](https://www.youtube.com/watch?v=Gu3fJ6czzno) | videos | 50:35 | 2025-10-31 | 112 |  |
| [Goodbye V0 CLI. Hello V1.](https://www.youtube.com/watch?v=ztn-JFS8AAA) | videos | 13:43 | 2025-10-31 | 251 |  |
| [OpenHands + MCPs in Action: Figma and Context7 Demos](https://www.youtube.com/watch?v=vDv1AQW3cfY) | videos | 40:25 | 2025-10-20 | 941 | M09 |
| [NVIDIA DGX Spark is available with OpenHands 🤩](https://www.youtube.com/watch?v=dOK_Xa5-MQI) | videos | 26:23 | 2025-10-17 | 309 |  |
| [OpenHands v1 CLI Is Here! Setup with WSL in 90 seconds](https://www.youtube.com/watch?v=Kzvy-FGHcYk) | videos | 1:36 | 2025-10-14 | 677 |  |
| [OpenHands Running Local LMs on the DGX Spark](https://www.youtube.com/watch?v=z13qTHR3tS0) | videos | 0:38 | 2025-10-14 | 649 | M13 |
| [Claude 4.5 Arrives! OpenHands Updates, SDK Progress & Hackathon Highlights (Oct 2025](https://www.youtube.com/watch?v=ToROEkRwLU8) | videos | 12:34 | 2025-10-04 | 276 |  |
| [OpenHands Community Call - September 18th](https://www.youtube.com/watch?v=6TDEkLvDkqg) | videos | 18:22 | 2025-09-19 | 210 |  |
| [OpenHands v1: Our Biggest Release Yet (Coming Soon)](https://www.youtube.com/watch?v=6lk5_rBE6Qo) | videos | 10:39 | 2025-09-16 | 654 |  |
| [Prompt Injection Security for AI Agents Webinar by OpenHands](https://www.youtube.com/watch?v=NcJYr1VaIXI) | videos | 32:02 | 2025-09-12 | 306 | M03, M07 |
| [How to use the OpenHands CLI with your OpenHands Cloud LLM Key](https://www.youtube.com/watch?v=Y_8vYxept4A) | videos | 3:34 | 2025-09-08 | 1286 |  |
| [OpenHands Community Call - September 5, 2025](https://www.youtube.com/watch?v=Xn-HiWYvLck) | videos | 24:32 | 2025-09-05 | 278 |  |
| [OpenHands Community Call - August 22, 2025](https://www.youtube.com/watch?v=UMixeoja4-w) | videos | 27:08 | 2025-08-22 | 155 |  |
| [Run OpenHands Locally on Windows 11 Home \| Full Setup with Docker, UV & CLI](https://www.youtube.com/watch?v=Kp40Qqz4ZPw) | videos | 7:33 | 2025-08-20 | 6284 |  |
| [Implementing Figma Designs with OpenHands CLI](https://www.youtube.com/watch?v=QlK71nSsGH8) | videos | 3:13 | 2025-08-18 | 526 |  |
| [Fixing Real Issues with OpenHands: Live from the Backlog](https://www.youtube.com/watch?v=rtvrKlUGH2c) | videos | 46:08 | 2025-08-12 | 535 |  |
| [OpenHands Visual Debugging](https://www.youtube.com/watch?v=jMyTCXpEz10) | videos | 3:48 | 2025-07-21 | 1155 |  |
| [How We Build OpenHands with OpenHands (Webinar)](https://www.youtube.com/watch?v=CLpwray59-k) | videos | 57:24 | 2025-07-17 | 2053 |  |
| [What will software development look like in 2026?](https://www.youtube.com/watch?v=UoxjPQ2dvK4) | videos | 42:48 | 2025-06-30 | 3011 |  |
| [OpenHands Slack Integration](https://www.youtube.com/watch?v=hbloGmfZsJ4) | videos | 3:47 | 2025-06-25 | 957 |  |
| [AI Coding Agents: What Works and What Doesn't (Webinar)](https://www.youtube.com/watch?v=_rltvykJV4E) | videos | 45:14 | 2025-06-24 | 1652 | M03, M04 |
| [OpenHands CLI Demo](https://www.youtube.com/watch?v=PfvIx4y8h7w) | videos | 1:58 | 2025-06-17 | 9509 |  |
| [Researching and Implementing a Web Site w/ OpenHands](https://www.youtube.com/watch?v=FYMy-_8LCTk) | videos | 5:30 | 2025-06-05 | 798 |  |
| [VersaBench and OpenHands Versa: Building More Versatile Agents](https://www.youtube.com/watch?v=uc2P-7E0ZwE) | videos | 4:41 | 2025-06-05 | 695 |  |
| [OpenHands + Devstral = A Fully Local Coding Agent](https://www.youtube.com/watch?v=oV9tAkS2Xic) | videos | 8:09 | 2025-05-21 | 33688 | M02 |
| [AI Coding Your First Product with Bethany Crystal](https://www.youtube.com/watch?v=5JoYrjWIoMI) | videos | 33:20 | 2025-05-05 | 563 |  |
| [OpenHands: Open-source AI Software Development Agents](https://www.youtube.com/watch?v=oB4JR98KRAA) | videos | 2:13 | 2025-03-26 | 36324 |  |
| [OpenHand Software Development Agent Meetup, March 2025](https://www.youtube.com/watch?v=JWtXRYO0jB4) | streams | 2:03:21 | 2025-03-27 | 668 |  |

## Appendix C. Candidates to confirm

Found by the agents but not fully verified because YouTube blocked `yt-dlp`. Title and channel below were confirmed with oEmbed; length, chapters and fit still need a look before use.

| Video | Channel | Agent's note |
|---|---|---|
| [AI Evaluations Clearly Explained in 50 Minutes (Real Example) \| Hamel Husain](https://www.youtube.com/watch?v=uiza7wp1KrE) | Peter Yang | Hamel Husain, AI evaluations explained, Peter Yang channel; M12 explanation/best practices |
| [How To Build AI Evals](https://www.youtube.com/watch?v=mF4CaijvJos) | Hamel Husain | Hamel Husain, How To Build AI Evals; M12 best practices |
| [7 Most Common AI Eval Mistakes (From Teaching 5K+ Engineers & PMs)](https://www.youtube.com/watch?v=Ime2rOZTVAw) | Hamel Husain | Hamel Husain, 7 Most Common AI Eval Mistakes; M12 common mistakes (best candidate) |
| [How Anthropic Actually Writes AI Evals for Agents](https://www.youtube.com/watch?v=pDp8Gm64EmY) | LiftoffPM | LiftoffPM, How Anthropic Actually Writes AI Evals for Agents; M12 |
| [AI Agent Evals: The 4 Layers Most Teams Skip](https://www.youtube.com/watch?v=Kleu3ROhpvY) | Damian Galarza | Damian Galarza, AI Agent Evals: 4 Layers; M12 |
| [Evaluate agents on SWE-Bench](https://www.youtube.com/watch?v=MzlYtN7uPKY) | LangChain | LangChain, Evaluate agents on SWE-Bench; M12 key concepts |
| [How SWE-bench Changed the Way We Test AI Coders](https://www.youtube.com/watch?v=uamd4C7AFXo) | KodeKloud | KodeKloud, How SWE-bench Changed the Way We Test AI Coders; M12 key concepts |
| [Everything You Need to Know About Coding with AI // NOT vibe coding](https://www.youtube.com/watch?v=5fhcklZe-qE) | ForrestKnight | ForrestKnight, coding with AI not vibe coding; M04 common mistakes |
| [3 reasons sandboxing won't secure your AI agent](https://www.youtube.com/watch?v=TsYDazwHJ6U) | Zack Korman | Zack Korman, 3 reasons sandboxing won't secure your AI agent; M07 explanation |
| [How I Review AI-Generated Code](https://www.youtube.com/watch?v=As2xy_cSx00) | Owain Lewis | Owain Lewis, How I Review AI-Generated Code; M06 best practices |
| [AI Benchmarks Are Fake!?](https://www.youtube.com/watch?v=pHAbwL7w83Q) | Better Stack | Better Stack, AI Benchmarks Are Fake; M12 common mistakes |
| [Claude Agent Skills Explained](https://www.youtube.com/watch?v=fOxC44g8vig) | Anthropic | Anthropic 'Claude Agent Skills Explained' 195s per search listing; search-listing data only, not fully verified (YouTube bot check) |
| [What are skills?](https://www.youtube.com/watch?v=bjdBVZa66oU) | Claude | Claude 'What are skills?' 174s; search-listing data only, not fully verified (YouTube bot check) |
| [The Model Context Protocol (MCP)](https://www.youtube.com/watch?v=CQywdSdi5iA) | Anthropic | Anthropic 'The Model Context Protocol (MCP)' 1175s; search-listing data only, not fully verified (YouTube bot check) |
| [Skills vs MCP vs RAG vs Memory: What AI Agents Need to Know](https://www.youtube.com/watch?v=X4FVEEegCbk) | IBM Technology | IBM 'Skills vs MCP vs RAG vs Memory' 551s; search-listing data only, not fully verified (YouTube bot check) |
| [AGENTS.md Explained: One File to Rule All Agents](https://www.youtube.com/watch?v=TC7dK0gwgg0) | proflead | proflead 'AGENTS.md Explained' 190s; search-listing data only, not fully verified (YouTube bot check) |
| [Webhooks for Beginners – From Polling to Real‑Time Events](https://www.youtube.com/watch?v=bXY7899m6M8) | Ctrl Alt Explain | Ctrl Alt Explain 'Webhooks for Beginners' 453s; search-listing data only, not fully verified (YouTube bot check) |

## Appendix D. Agent notes

- All licenses are 'NA' in yt-dlp, meaning standard YouTube license. Embedding with start/end times is fine; downloading and re-hosting clips needs the creator's permission. Karpathy deep-dive chapters (verified): tokenization 467-867, hallucinations/tool use/working memory 4832-6106, models need tokens to think 6416-7271; his 2023 intro talk covers tool use 1663-2012. Candidates dropped because yt-dlp was rate-limited and they could not be verified: BacJ6sEhqMo, eW3oTyfeWZ0, w3kI6XlZXZQ, 615-yWyS1n0, I97FwirBidA, vD0E3EUb8-8.
- All picks verified with yt-dlp metadata (id, channel, duration, views, date, license) before YouTube blocked lookups. Licence is NA (standard YouTube licence) for every verified video: embed only, do not download or re-host. No chapters could be read, so every pick is whole-video.
