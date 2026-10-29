# OpenHands Learning Center: Course Content

**Date:** 2026-10-29
**Purpose:** Teachable lessons on (1) AI fundamentals, (2) AI agents, (3) AI-assisted software development and its best practices, and (4) how to use the OpenHands Agent Canvas product (conversations and the feed, factories, automations, skills, plugins, MCP servers, agent profiles and settings). Lessons are ordered by estimated learner interest.

## How this file was built

- **Articles.** The public openhands.dev blog was scraped with `scripts/scrape-openhands-articles.mjs` (117 posts found in the sitemap, 0 failures; public pages only). Per-article findings, tags and categories were reused from the research-hub extension data (`OpenHands-research-hub/src/fixtures/canvas-extensions/research-hub/extension.js`, generated 2026-10-29), which holds 117 distilled articles plus OpenHands Index results. About 40 articles were read through their distilled findings; the full scraped text was not re-read post by post. Where a lesson says "the article reports", the claim is the article's, not independently verified.
- **Popularity signal.** `docs/website-chat-question-analysis.md` plus tag and recency counts (see "Ranking method").
- **Repo docs and code.** `docs/`, `specs/`, `AGENTS.md` and `.agents/skills/`, plus the product code and the English UI strings in `src/i18n/translation.json`. Product steps use the real UI labels found there.
- **Public docs.** Two pages of docs.openhands.dev were fetched (skills adding; managing automations). Others were not fetched.

## What is NOT covered

- Pricing and plan details of OpenHands Cloud or Enterprise (they change; see openhands.dev).
- SDK programming (Python/TypeScript) beyond a pointer.
- Installation on specific Linux distributions, Windows specifics, Kubernetes/Helm operation.
- Anything inside Canvas Apps (beta extensions) beyond a mention.
- Live behaviour of the running product: nothing here was verified by driving the app; it is read from code and docs. Items that could not be verified are in each lesson's "To verify" list.

---

## How to use this file

Lessons are independent but have prerequisites. Each has Level, time, goal, key concepts, steps or explanation, best practices, common mistakes, five check questions, sources and a "To verify" list.

**Path A: New to AI** (about 5 hours): M01, M02, M03, M04, M06, M07, M12.
**Path B: Developer new to OpenHands** (about 5.5 hours): M03, M05, M04, M06, M09, M08, M13.
**Path C: Team lead setting up factories and automations** (about 5 hours): M03, M10, M08, M09, M07, M11, M06.

---

## Ranking method and its limits

Modules are ranked by estimated learner interest using three weak signals. This is a judgement, not a measurement.

1. **Website chat questions** (`docs/website-chat-question-analysis.md`): 7 conversations in one day, of which 5 were real questions (Gentoo install, multi-VPS orchestration, Cursor CLI, single vs multi-agent, Devstral). This is far too small to show frequencies; it only hints that visitors ask "can I fit this into my setup?" (platform, integrations, models, architecture) and that blog posts trigger concept questions.
2. **Topic frequency across the 117 articles**, counted by keyword match on tags and slugs (rough, overlapping clusters): models/LLM choice/cost/local 45; Canvas/product/ACP/cloud/SDK 43; verification/review/testing/benchmarks 40; agents and coding agents 31; security/guardrails 21; automation/workflow/factory 15; skills/plugins/MCP 5.
3. **Recency.** 61 of 117 articles are from the last 180 days. Share of each cluster in that window: models 26 of 45, product 22 of 43, verification 20 of 40, security 16 of 21, agents 15 of 31, automation 9 of 15, skills 2 of 5.

Limits: blog output reflects what OpenHands chooses to publish, not what learners want; no traffic, search or course-completion data was available; the chat sample is tiny. Beginner fundamentals are placed first because they are prerequisites for the rest, not because the data proves demand. Re-rank once 4-8 weeks of chat transcripts and docs analytics exist.

## Ranked module index

| Rank | Module | Audience | Level | Time | Interest rationale | Primary sources |
|---|---|---|---|---|---|---|
| 1 | M01 AI, LLMs, tokens and context | Everyone | Beginner | 40 min | Prerequisite to everything; chat visitors ask model questions | what-are-coding-agents, how-to-choose-open-source-llm, context-condensation post |
| 2 | M02 Choosing models: families, tiers, cost, open vs local | Everyone choosing a model | Beginner | 50 min | Largest article cluster (45); Devstral question; very recent | model guides, OpenHands Index, local-llm |
| 3 | M03 What an AI agent is | Everyone | Beginner | 45 min | Core concept; single vs multi-agent chat question | ai-agent-vs-ai-assistant, what-are-coding-agents, agentic-coding posts |
| 4 | M04 AI-assisted development: workflow, best practices, mistakes | Developers | Intermediate | 60 min | Biggest practical value; prompting and workflow recur in guides | vibe-coding, claude-code best practices, ai-code-generation |
| 5 | M05 OpenHands basics: conversations and the feed | New OpenHands users | Beginner | 45 min | First thing every user does; install/platform questions | code, docs, ACP_AGENTS |
| 6 | M06 Reviewing, testing and verifying agent work | Developers, leads | Intermediate | 55 min | Verification cluster of 40 articles, 20 recent | verification-stack, code-review-checklist, debugging post |
| 7 | M07 Security and guardrails | Developers, security | Intermediate | 50 min | 16 of 21 security-cluster articles are recent | prompt-injection, sandboxing, AGENTS/specs |
| 8 | M08 Setting up Automations | Developers, leads | Intermediate | 60 min | Product focus of the last two monthly updates | code, managing-automations doc, workflow-automation |
| 9 | M09 Skills, plugins, MCP servers, profiles and settings | Developers | Intermediate | 70 min | Cursor CLI/integration question; customisation is how users fit it to their stack | code, skills docs, creating-effective-skills |
| 10 | M10 Multi-agent systems: coordinators, workers, verifiers | Leads, advanced | Advanced | 50 min | Direct chat question; swarm and CAID articles | dont-sleep-on-single-agent, agentic-swarm, CAID |
| 11 | M11 Setting up a Factory (prototype) | Team leads | Advanced | 55 min | Newest concept; dark-factory article; prototype only | code, dark-factory article, specs |
| 12 | M12 Evaluating agents: benchmarks and your own evals | Leads, researchers | Advanced | 45 min | Benchmark articles are frequent but audience narrower | ai-coding-benchmarks-explained, OpenHands Index |
| 13 | M13 Where agents run: backends, self-hosting, ACP agents | Platform owners | Advanced | 50 min | The highest-intent chat question (multi-VPS); chat gap list | SELF_HOSTING, ACP_AGENTS, architecture |

---

# Lessons

---

## M01. AI, machine learning, LLMs, tokens and context

**Level:** Beginner | **Time:** 40 min | **Prerequisites:** none

**Goal:** Explain in plain words what an LLM is, what tokens and context windows are, why models hallucinate, and what drives cost.

### Key concepts

- **Artificial intelligence (AI):** an umbrella term for software that does tasks we associate with human thinking, such as understanding text or planning.
- **Machine learning (ML):** a way to build such software by fitting a mathematical model to many examples instead of writing rules by hand.
- **Large language model (LLM):** an ML model trained on very large amounts of text (and often code and images) to predict what text comes next. It produces answers by repeatedly predicting the next small piece of text.
- **Token:** the small unit of text a model reads and writes, often a word piece. Prices and limits are counted in tokens. Roughly, a token is a few characters; the exact split depends on the model.
- **Context window:** the maximum amount of text (prompt, conversation so far, tool output, and the reply) the model can consider at once. It is the model's working memory for one request; it does not remember earlier conversations unless something re-supplies them.
- **Prompt:** the instructions and material you give the model. **Prompting** is the craft of writing them well.
- **Inference:** running a trained model to get an answer (as opposed to training it).
- **Hallucination:** output that is fluent and confident but wrong or invented, such as a package that does not exist.

### Explanation

An LLM does not look facts up. It generates likely text based on patterns learned in training, plus whatever you put in the context. That is why it can write correct code from a clear description and also invent an API that looks plausible. Whether this counts as "understanding" is debated; for practical work, treat the output as a strong draft that needs checking.

**Context is finite and quality can fall before the limit.** The OpenHands article on choosing open-source models notes that advertised context length is not the same as effective context quality: models can get worse at retrieval, instruction following or tool choice well before the maximum. In long agent sessions the history grows every turn, so cost and confusion grow too. OpenHands' condenser research reports that summarising older history cut per-turn API cost by up to about 2x on its tests while keeping the solve rate similar (54% vs 53% on the tested subset), and that unmanaged history cost grows roughly quadratically with length. These are the authors' benchmark numbers on one setup.

**Hallucination is measured, not hypothetical.** The AI code generation article cites a USENIX Security 2025 analysis of 576,000 code samples finding invented package names about 5.2% of the time for commercial models and about 21.7% for open-source ones, and a later replication reporting roughly 4.6% to 6.1% on newer models (code-review-checklist article). Invented package names are a security risk because attackers can register them ("slopsquatting"). Treat these as indicative; rates vary by model, prompt and date.

**Cost.** You pay per token in and out (or a subscription that hides this). Things that raise cost: long contexts, many turns, large tool outputs, "reasoning" models that think at length, and running many agents. Things that lower it: smaller models for simple work, prompt caching, condensing history, and starting a fresh conversation for a new task. OpenHands shows a context meter, token usage and cost in a conversation (see M05).

**Model families and tiers** are covered in M02.

### Best practices

- Put what the model needs (files, constraints, the definition of done) in the prompt; do not assume it knows your project.
- Ask for checkable output (tests, commands to run) rather than trusting prose.
- Keep one task per conversation when you can.

### Common mistakes

- Treating a confident answer as a verified one.
- Pasting huge logs into context when a short excerpt would do.
- Assuming a larger context window means better use of it.

### Check your understanding

1. In one sentence, what does an LLM do when it answers?
2. Why can a model know your question but still forget something said "a long time ago" in a long chat?
3. Name two things that make a long agent session cost more per turn.
4. What is slopsquatting and why does hallucination enable it?
5. Why is "the code looks right" not evidence that it works?

### Sources

- https://openhands.dev/blog/how-to-choose-open-source-llm (effective vs advertised context)
- https://openhands.dev/blog/openhands-context-condensensation-for-more-efficient-ai-agents (condenser results)
- https://openhands.dev/blog/ai-code-generation (hallucination statistics)
- https://openhands.dev/blog/code-review-checklist (replication rates)
- `src/i18n/translation.json` (context meter, compact context strings)

### To verify

- Current typical tokens-per-word ratios per model (not in sources).
- Whether the condenser defaults match the numbers in the 2025 post (Condenser settings page exists; defaults not checked).

---

## M02. Choosing models: families, tiers, cost, open vs closed, local

**Level:** Beginner | **Time:** 50 min | **Prerequisites:** M01

**Goal:** Pick a sensible model for a task and understand the trade-offs in capability, price, speed, openness and privacy.

### Key concepts

- **Model family:** a line of models from one maker (for example Claude, GPT, Gemini, Qwen, Kimi, MiniMax, DeepSeek, Devstral). Makers usually offer several sizes in a family.
- **Tier:** a position within a family trading capability for speed and price. In this repo's prototype factory code a four-tier map is used (tier 1 Haiku, 2 Sonnet, 3 Opus, 4 Fable) for assigning agent roles; it is a prototype convention, not a product rule (`src/utils/feed-agent-role.ts`).
- **Open-weight model:** the trained weights are downloadable and can be self-hosted. The OpenHands article notes this is not the same as Open Source AI under the OSI definition, which also asks about training data, code and unrestricted use.
- **Mixture of experts (MoE):** a design where only part of the model runs for each token, so a large total size can have a smaller active size. The Recursive Flint post describes a 40B MoE with about 2.5B active parameters per token.
- **Model-agnostic:** the application depends little on one provider. The model-agnostic article says this does not make models interchangeable; prompts, tool behaviour and quality still differ, so you still evaluate.
- **BYOK (bring your own key):** you supply your own provider API key. The article cautions that BYOK alone does not tell you where your data goes; check credentials, prompts, logs and billing paths.
- **Quantization:** storing weights at lower precision (for example 4-bit) so a model fits in less memory, with some quality cost.

### Explanation

A 2025 OpenHands author guide described four model types and per-session costs (Claude Sonnet roughly $1-7 per median session; large open-weight models like Qwen3 Coder 480B or Kimi-K2 roughly $0.25-$2; mid-size open models on consumer hardware at hardware and electricity cost only). It is explicitly subjective and dated; prices and leaders have moved. The May 2026 Index update reports Opus 4.7 at the top of the cost/performance chart with GPT-5.5 close, DeepSeek-3.2-Thinker the cheapest contender at about one tenth of Claude's price, and Claude and GPT leading time to resolution. Use these as examples of the shape of the trade-off, not as a current ranking.

**Choose by task, not leaderboard.** The article on open-source LLMs lists five criteria: licence, benchmark fit for your actual task, hardware footprint, context behaviour and ecosystem support, and warns that harness, prompt, serving backend and quantization can change agent performance even with identical weights.

**Local models.** The local-LLM article gives rough hardware tiers (a 16 GB Mac or 8 GB VRAM runs 7B-8B at 4-bit; 24 GB VRAM up to about 32B; 70B at 4-bit generally needs more than one 24 GB consumer GPU) and default local endpoints for Ollama, LM Studio, llama.cpp and Jan. It stresses that running locally does not by itself make a workflow private: tools, retrieval and telemetry also move data.

**Mixing models.** OpenHands LLM profiles let you save named model configurations and switch between them; the May 2026 post describes planning with a strong model and implementing with a cheaper one.

### Steps in OpenHands (verified in code/strings)

1. Open **Settings** and the **LLM** page. The page lets you create, edit and activate saved **LLM profiles** (strings: "Add LLM Profile", "Manage LLM profiles"). A profile stores a model, optional base URL and key; **Provider Connections** let several profiles share one provider key (August 2026 update).
2. For automatic choice between profiles, the **Model Router** page (route `settings/meta-llm`) creates "meta-profiles" that route between your saved LLM profiles with a classifier prompt that must include the task text. It requires LLM profiles to exist first.
3. Choose which profile an agent uses in **Agent profiles** (M09) or switch in chat.

### Best practices

- Run your own small test set on two or three models before standardising.
- Use a cheaper model for routine, well-specified work; a stronger one for planning and hard debugging.
- Track cost per run; the automation detail page shows per-run cost (M08).

### Common mistakes

- Picking by a single benchmark score.
- Assuming "open" means "free to use however you like".
- Assuming a local model equals a private workflow.

### Check your understanding

1. What does "active parameters" mean in a mixture-of-experts model?
2. Why is BYOK not enough to answer "where does my code go?"
3. Give two reasons the same open-weight model can behave differently in two setups.
4. When would you use a cheap model, and when a strong one?
5. Why should a model recommendation be re-checked after a few months?

### Sources

- https://openhands.dev/blog/a-practical-guide-to-choosing-the-right-language-model-for-coding-agents
- https://openhands.dev/blog/how-to-choose-open-source-llm
- https://openhands.dev/blog/model-agnostic-meaning
- https://openhands.dev/blog/local-llm
- https://openhands.dev/blog/openhands-index-3-months-out
- https://openhands.dev/blog/recursive-flint-on-openhands
- https://openhands.dev/blog/model-choice-llm-profiles
- https://openhands.dev/blog/new-in-agent-canvas-august-2026
- `src/routes/llm-settings.tsx`, `src/routes/meta-llm-settings.tsx`, `src/i18n/translation.json`

### To verify

- Current model names, prices and the present Index ranking (https://index.openhands.dev).
- Whether the `/model` chat command from the May 2026 post exists in this Canvas version (no `/model` handler was found in `src/`; the command may live in the Agent Server or SDK).
- Devstral specifics: only the May 2025 launch post was consulted via findings (Apache 2.0, Mistral, built for coding agents).

---

## M03. What an AI agent is (and is not)

**Level:** Beginner | **Time:** 45 min | **Prerequisites:** M01

**Goal:** Distinguish chatbots, assistants and agents; understand tools, the agent loop, memory and human-in-the-loop.

### Key concepts

- **Chatbot:** answers messages. It does not act on your system.
- **Assistant:** helps inside a tool (autocomplete, inline chat) while you stay in control step by step.
- **Agent:** an LLM set up to pursue a goal by repeatedly choosing actions (run a command, edit a file, browse), observing results and continuing until done. The OpenHands explainer defines a coding agent by execution, self-correction and autonomous iteration.
- **Tool:** a capability the agent can call (shell, file editor, browser, an MCP server). An agent can only do what its tools allow; removing a tool removes the ability (the Agent Profile tools hint in the UI says exactly this).
- **Agent loop:** think, act with a tool, observe the result, repeat. Also called the agentic loop.
- **Memory:** what the agent can see again. Short-term memory is the context window; longer-term memory is files (notes, instructions, skills) loaded at start. Canvas has an "Agent Context" setting where, per its description, the agent keeps notes under `.openhands/memory/` and loads them each new conversation.
- **Harness:** the software around the model (prompts, tools, loop). The same model can score differently in different harnesses.
- **Human-in-the-loop (HITL):** a person approves or reviews at chosen points.
- **Sandbox:** an isolated environment where the agent runs, limiting damage.

### Explanation

The June 2026 "agent vs assistant" article argues the remaining differences are initiative (does it start work itself?), trigger (a prompt versus a schedule or event), where it runs, how much control you keep between steps, and your role. It suggests assistants for exploratory or easily undone work and agents for work with clear success criteria that you would rather not watch. It cites a Stack Overflow 2025 survey (46% of developers distrust AI accuracy) and a Gartner prediction about task-specific agents, and warns about "agent washing" (relabelling plain tools as agents). A randomised trial of 16 experienced open-source developers, cited in the workflow automation article, found AI tools made them 19 percent slower on complex work in familiar repositories while they believed they were faster; the sample is small, and results are contested, so treat as a caution, not a law.

**Single vs multi-agent.** See M10. In short, a single agent has one model, one prompt and one action space; multi-agent setups vary at least one of those (2024 OpenHands post).

**Where agents run.** "Inner loop" means on your machine while you work; "outer loop" means in separate infrastructure on triggers (Dec 2025 article). The outer-loop article says most developers hit a limit around 2-3 local agents at once, and that running agents in their own infrastructure shrinks the blast radius to the tools and credentials explicitly connected.

### Best practices

- Give agents a verifiable goal and a way to check it (tests, a script).
- Match autonomy to risk: more review for irreversible actions.
- Limit tools and credentials to what the task needs.

### Common mistakes

- Giving an agent broad credentials "to make it work".
- Believing a "done" message. The observability article notes some failures look like successful runs when the model reports completion despite failed tools or unmet checks.
- Starting with the most complex workflow.

### Check your understanding

1. List three differences between an assistant and an agent.
2. What is the agent loop?
3. Why does removing a tool matter more than telling the agent not to use it?
4. What is the difference between inner-loop and outer-loop agents?
5. Why can "the agent said it finished" be misleading?

### Sources

- https://openhands.dev/blog/ai-agent-vs-ai-assistant
- https://openhands.dev/blog/what-are-coding-agents
- https://openhands.dev/blog/20251202-agents-in-the-outer-loop
- https://openhands.dev/blog/ai-agent-observability
- https://openhands.dev/blog/ai-agent-workflow-automation
- `src/i18n/translation.json` (Agent Profile tools hint; agent memory description)

### To verify

- Exact tool list for the OpenHands agent (the Agent Profiles page loads it from the server at runtime).

---

## M04. AI-assisted software development: workflow, best practices, common mistakes

**Level:** Intermediate | **Time:** 60 min | **Prerequisites:** M01, M03

**Goal:** Run a repeatable loop for working with a coding agent: scope, plan, implement, verify, review, merge.

### Key concepts

- **Agentic coding:** delegating multi-step coding tasks to an agent rather than accepting line completions.
- **Plan mode:** a read-only phase where the agent explores and writes a plan you approve before editing (recommended in the Claude Code best-practices article; OpenHands introduced a planning agent in March 2026 per its product update).
- **Definition of done:** a runnable pass/fail check the agent can use.
- **Characterization test:** a test recording what existing code currently does, used before refactoring legacy code.
- **TDD with agents:** write a failing test that reproduces the bug first, then fix. The 2025 "higher quality code" post uses this to counter an agent jumping to conclusions.

### The workflow

1. **Scope.** One purpose per task. Background-agent guidance recommends single-purpose prompts.
2. **Prepare guardrails the agent cannot skip:** type checks, linters and tests wired into pre-commit and CI, so the agent runs them.
3. **Explore and plan** (read-only), review the written plan.
4. **Implement in small pieces**, committing in revertible steps.
5. **Verify** with tests and checks the agent runs itself, then by you (M06).
6. **Review** the diff; for PRs, a two-tier review: the person who invoked the agent reviews the draft first, then a second person (2025 post calls the invoker review critical).
7. **Capture lessons** in repo instructions or a skill (M09) when the agent errs.

### Prompting essentials

State the goal, the constraints, where to look, how to verify, and what not to touch. Give an example of the output you expect. For long projects keep an instruction file short (project commands, architecture constraints, conventions) and add lines only as mistakes occur; the Claude Code article lists a bloated instruction file as a failure pattern. In OpenHands, project skills in `.agents/skills/` and the repo's `AGENTS.md` serve this role (this repo's AGENTS.md is an example).

### Context hygiene

Use a fresh conversation between unrelated tasks; compact long coherent sessions (OpenHands: "Compact context" in the conversation; the UI says it summarises older messages to free space); push heavy research to sub-agents.

### Where agents shine and struggle

Velocity-is-dead (Feb 2026) argues code output is no longer the bottleneck; delivery and testability are. Compilers are a best case (pure functions, an oracle) while most enterprise systems have incomplete tests, so backfill tests and isolate side effects first. The refactoring and COBOL-to-Java articles advocate iterative refinement with tests; the test-coverage anecdote (2024) shows an agent adding tests that both caught a missed Unicode case and encoded one wrong assumption, so a human still reviews.

### Best practices

- Verification before volume: measure PR quality and defect rate on one repo before running many agents.
- Keep PRs small; one source suggests a few hundred changed lines as a comfortable review ceiling.
- Prefer deterministic checks over model judgement where a check can be written.

### Common mistakes

Kitchen-sink sessions mixing tasks; correcting the agent in circles instead of restarting with a clearer prompt; trusting without verifying; accepting agent changes to CI or test config unnoticed; accepting new dependencies without checking they exist.

### Check your understanding

1. Why write the failing test before the fix?
2. What goes in a good prompt besides the goal?
3. When should you start a fresh conversation instead of correcting?
4. Why are pre-commit and CI checks "guardrails the agent cannot skip"?
5. What makes legacy refactoring riskier than a compiler project?

### Sources

- https://openhands.dev/blog/vibe-coding-higher-quality-code
- https://openhands.dev/blog/claude-code-best-practices-agentic-coding
- https://openhands.dev/blog/background-agents-for-coding-tasks
- https://openhands.dev/blog/20260219-velocity-is-dead
- https://openhands.dev/blog/using-openhands-to-improve-your-test-coverage
- https://openhands.dev/blog/ai-code-generation
- https://openhands.dev/blog/code-refactoring
- `AGENTS.md`, `.agents/skills/`

### To verify

- Whether Canvas exposes a plan-mode toggle (a Planner tab and "Planner" label exist; the mode switch itself was not located).

---

## M05. OpenHands basics: conversations and the feed

**Level:** Beginner | **Time:** 45 min | **Prerequisites:** M03

**Goal:** Start a conversation, choose workspace and agent, read its progress, and use the feed to track many conversations.

### Key concepts

- **Agent Canvas:** the OpenHands interface (a React front end) that connects to one or more **backends** (local Agent Server, Docker, remote VM, Cloud). It is not itself the thing that executes actions; the Agent Server does (`docs/architecture.md`).
- **Conversation:** one task thread with an agent, with its own workspace, history and cost.
- **Workspace:** the directory or repository the agent works in. Home lets you pick a repository or a workspace.
- **Backend:** the server that runs agents. Chosen under Settings, Backends.
- **Feed:** a view over your conversations as cards, with a composer, sorting and a Notifications toggle.
- **Sub-agent:** an agent spawned by another within a conversation (the feed surfaces sub-agents).

### Steps

1. Open Home. The launcher asks "What do you want to work on?" and has a Code/Automate mode toggle (spec HL-001). Describe the task in the box ("Describe an engineering task...").
2. Choose a repository (you can enter a public GitHub URL) or a workspace. If the LLM is not set up, Home shows "Your LLM isn't set up yet" with a Set up LLM action; follow it first (M02).
3. Launch. The conversation page has tabs (Canvas shows tabs such as Planner, files, browser; tabs can be pinned with "Customize tabs"), and an **Overview** panel listing workspace, thread statistics (your messages, compactions), activity (commands run, files touched, pages browsed, sub-threads), model, mode, git state with open pull requests and issues, MCP servers, and shortcuts to Add automation, Add skill, Add MCP server and Add secret.
4. Watch the **context window** meter and token usage. When context fills up the UI offers "Compact context", which summarises older messages (strings: "Context is filling up", "Compact context").
5. When the agent needs you it can ask; the feed Notifications list includes a "Needs your input" kind. In confirmation mode (Settings, Verification) the agent waits for approval of risky actions (see M07).
6. Stop, pause, archive or delete from the conversation menus. Deleting asks for confirmation and states it cannot be undone.
7. Open **Feed** (`/feed`). The composer asks "What should the agent work on?"; cards show conversations; you can sort by latest activity, oldest activity or title, and toggle Feed/Notifications. The feed in this build also shows simulated teammates and factories unless the URL has `?demoTeam=off`; treat those parts as a prototype (M11).

### Choosing an agent

Settings, Agent chooses the built-in **OpenHands** agent or an external **ACP** agent (Claude Code, Codex, Gemini CLI, Pi, OpenCode). A running conversation keeps the agent it started with; changes apply to later conversations (`docs/ACP_AGENTS.md`).

### Best practices

Keep one task per conversation; name the repo and branch in the first message; check the Changes view before pushing; start a new conversation after adding skills (they load at conversation start).

### Common mistakes

Expecting a new skill to appear in a running conversation; forgetting that models and agents are set per backend; leaving a long conversation uncompacted.

### Check your understanding

1. What does the Agent Server do that Canvas does not?
2. Where do you see how much of the context window is used?
3. What does confirmation mode change?
4. When does a change of agent in Settings take effect?
5. Why start a new conversation after installing a skill?

### Sources

`docs/architecture.md`; `docs/ACP_AGENTS.md`; `specs/home-launcher.md`; `src/routes.ts`; `src/components/features/feed/`; `src/i18n/translation.json`; https://openhands.dev/blog/introducing-agent-canvas; https://openhands.dev/blog/new-in-agent-canvas-august-2026.

### To verify

- Exact tab names in the conversation page for each backend.
- Which simulated feed elements disappear in a production build.
- Install steps per OS (not covered; the chat analysis flags this as a content gap).

---

## M06. Reviewing, testing and verifying agent work

**Level:** Intermediate | **Time:** 55 min | **Prerequisites:** M03, M04

**Goal:** Build layered verification so you can trust, and scale, agent output.

### Key concepts

- **Verification stack (OpenHands):** layer 1 is an agent-level **critic** (a small model scoring the agent's trajectory before code is pushed); layer 2 is repo-level **code review skill plus QA agent** on every PR.
- **QA agent:** runs the software through four phases (Understand, Setup, Exercise, Report) and posts a structured report.
- **Deterministic check:** a test, linter or type-check with a yes/no answer.
- **LLM-as-judge:** a model grading another model's output; useful but not a substitute for deterministic checks (observability article).
- **Best-of-N and early stopping:** using the critic to pick among attempts or stop failed runs (March 2026 post).

### Explanation

The verification-stack article reports six months of data from the `software-agent-sdk` repo: over 1,000 bot reviews across 900+ PRs, 90% of PRs touched by the automated process, 23% needed multiple rounds, and mean time to merge down 58% since the review bot arrived. These are the authors' internal numbers, observed, not a controlled study. The critic article reports that critics trained on benchmark data score near random on production outcomes, and one trained on code survival reaches AUC 0.69 (merge-based 0.58); AUC 0.5 is chance. So critics are a useful signal, not a gate.

**Checklist for reviewing AI-authored changes** (code-review-checklist article): intent and scope; edge cases; tests; security (server-side validation, authorisation, secrets); dependencies exist and are wanted; CI or test config not quietly changed; code that looks overconfident. AI review is first-pass coverage; humans own intent, architecture, security judgement and merge approval.

**Debugging AI code.** The eight steps in the debugging article: reproduce; verify APIs and imports exist; static analysis; isolate and log; trace logic against intent; smallest fix; re-verify; know when to restart. It cites an analysis of 470 PRs where AI-authored changes had about 75% more logic and correctness findings, and Veracode's evaluation where 45% of AI samples failed security tests. Both are third-party and sample-dependent.

### Steps in OpenHands

1. Settings, **Verification**: shows Confirmation Mode, Security Analyzer (LLM or None) and the **Critic** (Enable Critic; Critic Mode "Finish and Message" or "All Actions"; optional model override and key). The critic can be set per profile (route `verification-settings.tsx`).
2. Use the conversation's changes view and pull-request shortcuts in the Overview; run tests in the terminal tab or ask the agent to.
3. Add a PR review automation from templates (M08); September 2026 update lists PR Review with scope check, maintainer handoff and head-commit checks.

### Best practices

Layer deterministic checks first, model review second, human last; make the agent run the checks; measure suggestion acceptance (the skills article uses suggestion_accuracy = AI suggestions reflected / AI suggestions).

### Common mistakes

Letting the agent edit the tests it is judged by; relying on LLM judgement for things a test can check; reviewing giant diffs.

### Check your understanding

1. Why is a deterministic check preferable to an LLM judge when available?
2. What does an AUC of 0.5 mean?
3. Name three items in an AI-specific review checklist.
4. What are the four QA agent phases?
5. Why might a PR have multiple review rounds and is that bad?

### Sources

- https://openhands.dev/blog/20260506-the-verification-stack
- https://openhands.dev/blog/20260305-learning-to-verify-ai-generated-code
- https://openhands.dev/blog/code-review-checklist
- https://openhands.dev/blog/debugging-ai-generated-code
- https://openhands.dev/blog/ai-agent-observability
- https://openhands.dev/blog/new-in-agent-canvas-september-2026
- `src/routes/verification-settings.tsx`, `src/i18n/translation.json`

### To verify

- The Critic API key requirement per provider (strings say OpenHands-provider users can leave it empty).
- Whether critic defaults are on or off.

---

## M07. Security and guardrails for agents

**Level:** Intermediate | **Time:** 50 min | **Prerequisites:** M03

**Goal:** Know the main agent risks and the layered controls that reduce them.

### Key concepts

- **Prompt injection:** hostile instructions hidden in content the agent reads (a web page, an issue) that try to redirect it.
- **Excessive agency (OWASP term):** an agent with too much functionality, access or autonomy.
- **Least privilege:** give only the credentials and tools the task needs.
- **Egress control:** restricting outbound network access.
- **Confirmation mode / security analyzer:** features that ask for approval or assess action risk before running.
- **Blast radius:** how much harm a mistake or attack can do.

### Explanation

The 2025 prompt-injection post compares mitigations: a model refusing is a soft block (non-deterministic and model-dependent); confirmation mode is called a stopgap since it limits agent value without adding much security; a security analyzer (built with Invariant Labs) assesses actions and can ask or refuse; sandboxing in a container helps but secrets, curl access and source code can still be exfiltrated; self-hosted Kubernetes can use network policy to allowlist domains.

The July 2026 sandboxing article describes an incident (as the article states it, not independently verified here) where an evaluation model escaped a proxy-based sandbox. Its recommendations: no outbound path even through a proxy for the highest-risk work, private package registries, mocked external APIs, strict egress rules, observability, and human approval for secret access, outbound requests, system package changes and pushes or deployments.

Supply chain: hallucinated packages (M01), and the code generation article's Veracode figure (45% of samples failing security tests). Governance: the observability article proposes tracing plans, tool calls, outcomes and cost/attribution, with an append-only record (dark-factory article).

### Steps in OpenHands

1. **Secrets** (Settings, Secrets): store keys as named secrets rather than pasting them into prompts. MCP credentials are not shared with automations unless also saved as a secret (the MCP install form offers "Also save as secret").
2. **Verification** page: enable Confirmation Mode and choose a Security Analyzer.
3. **Agent profiles**: choose a restricted tool set for risky-context work.
4. **Docker conversation runtime** (September 2026 update): per-conversation isolated container, enabled by an environment variable. See `docs/` and local-stack skill for the variable name; it was not confirmed here.
5. Scope git tokens to specific repositories.
6. Apps (beta) run JavaScript in the same browser context as Canvas (August 2026 update), so install only trusted ones.

### Best practices

Approve irreversible steps; separate credentials per agent; keep a run record; test automations in shadow mode first (M08).

### Common mistakes

Relying on "the model will refuse"; broad personal tokens; allowing arbitrary network from the sandbox; trusting content from issue trackers as instructions.

### Check your understanding

1. Why is model refusal only a soft block?
2. What does least privilege mean for an automation token?
3. Give two things sandboxing alone does not stop.
4. Which actions did the sandboxing article say need human approval?
5. Why is a third-party Canvas App a security decision?

### Sources

- https://openhands.dev/blog/mitigating-prompt-injection-attacks-in-software-agents
- https://openhands.dev/blog/agent-sandboxing-what-openai-got-wrong-with-the-huggingface-hack
- https://openhands.dev/blog/ai-agent-vs-ai-assistant
- https://openhands.dev/blog/new-in-agent-canvas-august-2026
- https://openhands.dev/blog/new-in-agent-canvas-september-2026
- `docs/DefenseClaw.md` (listed, not read in depth), `src/routes/verification-settings.tsx`, `src/routes/secrets-settings.tsx`

### To verify

- Name of the environment variable enabling the Docker conversation runtime.
- Security analyzer behaviour for the "LLM" choice.

---

## M08. Setting up Automations

**Level:** Intermediate | **Time:** 60 min | **Prerequisites:** M03, M05

**Goal:** Create, test, run and monitor an automation, choosing a sensible trigger and starting safely.

### Key concepts

- **Automation:** an agent job that starts without you typing a prompt, on a trigger.
- **Trigger:** what starts it. Setup offers **Schedule** ("Run on an interval or at a set time", cron-style) or **Event** ("Run when GitHub, Slack, or Linear fires"); the public docs also mention webhooks. Event sources need a public URL to deliver webhooks to your instance (string in the setup form).
- **Prompt, Plugin or Custom type:** an automation is a prompt for the agent, a plugin to run, or custom Python/script code with an entrypoint (setup form: "Automation type": Prompt, Plugin, Custom).
- **Template:** a pre-built definition from the catalog, installed from the **Templates** page. Templates come from `@openhands/extensions` and may carry a setup form (direct or assisted mode, `src/manifests/types.ts`).
- **Draft:** an unsaved automation under construction. Drafts persist across reloads and can be tested before creating (public docs); the form has Save draft and Test buttons.
- **Run:** one execution. Statuses on the detail page include Pending, Running, Failed, Cancelled, Skipped, Blocked, Partial and Needs review; run phases include Queued, Setting up sandbox, Uploading bundle, Starting, Preparing, Running agent.
- **Workflow / Routine / Responder:** the Automate section's three categories. Workflows are event-driven SDLC processes ("when/then"); Routines are scheduled scans, digests and reports; Responders are always-on chat-like connections that turn messages and mentions into Canvas conversations.
- **Identity:** which account an automation runs as is shown on the detail (v1.18.0 update).

### Steps (UI labels from the app)

1. Open **Automate** from the navigation. Sub-pages: Dashboard, Workflows, Routines, Responders, Templates. If no automation backend is configured Canvas says so (Canvas alone cannot run automations; `docs/architecture.md`).
2. Pick a starting point:
   - **Templates** page: browse, search and filter; choose one to open its setup form. Prebuilt templates documented at docs.openhands.dev (prebuilt-automations).
   - **Add automation**, then the setup assistant: describe the job; fields it fills are marked as filled by OpenHands and your edits clear the marker (public docs). The setup form has Name, Automation type, Prompt, Schedule (Frequency: Once, Hourly, Daily, Weekdays, Weekly, Custom cron; At; Timezone) or Event (Event source, Event key, Event filter), and additional options such as Timeout seconds. "Ask Agent" can fill the trigger.
   - **Find opportunities** starts a conversation that interviews you about recurring work and recommends 3-5 automations.
   - **Import automation** takes a JSON export; it arrives disabled and must be reviewed and turned on.
3. Choose the LLM profile (default "Current LLM settings") and, since v1.20.0, an Agent Profile (M09). The prompt's tool and MCP access then follow the profile.
4. Click **Test** to validate the draft; **Confirm and create** on the review step. Review the trigger and prompt first.
5. After creating, use the detail page: toggle Active/Inactive (Turn on/off), **Run now**, edit, export (Export JSON/CSV for the activity log), delete (confirmation, irreversible).
6. Watch the **Activity Log**: phase, outcome, cost per run (August 2026), "View conversation for run", or "View logs" for script runs (no conversation). If an automation is disabled the detail page explains why and when.
7. **Git Sync** (route `automations/git-sync`) syncs automation definitions with a repository.

### Design guidance (from the workflow-automation article)

Decide three things: trigger, scope, handoff. Start with one high-toil, low-risk job (flaky-test triage, dependency bumps, routine PR review). Run in shadow mode for a week or two before widening scope. Use isolated sandboxes, least-privilege access, caps on iterations and budget, and a human gate at irreversible steps.

### Best practices

Name for outcome; keep prompts specific; pick a cheaper LLM profile for simple jobs; review the first runs by hand; save needed credentials as secrets since MCP credentials are not shared with automations.

### Common mistakes

Event trigger without a public URL; leaving imported automations disabled and wondering why nothing runs; vague prompts; no budget cap; treating SKIPPED as failure (public docs: it usually means the backend hit its concurrency limit).

### Check your understanding

1. What are the three decisions that define an automated workflow?
2. When would you use an Event trigger instead of a Schedule?
3. Why is an imported automation disabled by default?
4. What is shadow mode and why use it?
5. Which parts of a run can you inspect afterwards?

### Sources

- `src/components/features/automations/`, `src/routes/automations-list.tsx`, `src/routes/automation-templates.tsx`, `src/routes/automation-setup-*.tsx`, `src/manifests/types.ts`, `src/i18n/translation.json`
- https://docs.openhands.dev/openhands/usage/agent-canvas/managing-automations
- https://openhands.dev/blog/ai-agent-workflow-automation
- https://openhands.dev/blog/new-in-agent-canvas-august-2026, https://openhands.dev/blog/new-in-agent-canvas-september-2026

### To verify

- Exact entry point labels of the "Add automation" menu on a fresh install.
- Webhook trigger as a separate type in the UI (docs mention it; setup form shows Schedule and Event).
- Concurrency limit values and timeout ceiling (deployment-specific; the app reads them from `/v1/capabilities`).

---

## M09. Skills, plugins, MCP servers, agent profiles and settings

**Level:** Intermediate | **Time:** 70 min | **Prerequisites:** M05

**Goal:** Know what each customisation mechanism is and which to use.

### What each thing is

| Thing | What it is | Where it lives | Use when |
|---|---|---|---|
| **Skill** | A folder with a `SKILL.md` (AgentSkills format) of reusable instructions, optionally scripts and references. Only metadata is always loaded; full content loads when triggered ("progressive disclosure"). | Project: `.agents/skills/`; user: `~/.agents/skills/` (public docs) | You want the agent to follow a procedure or know project conventions |
| **Plugin** | A bundle (source such as `github:owner/plugin`) that can add skills and other capabilities; enabled plugins load into new conversations | Skills and Plugins pages | You want to install a packaged capability, or attach one to a conversation or automation |
| **MCP server** | An external tool provider using the Model Context Protocol (for example issue trackers, databases). Adds tools, not instructions | MCP page | The agent needs to act on or read a system |
| **Agent profile** | A saved agent setup: which LLM profile, which tools, MCP servers and secrets it gets | Settings, Agent profiles | Different jobs need different capability or risk |
| **LLM profile** | A saved model configuration | Settings, LLM | Switch models; set per automation |
| **Secret** | A named stored credential | Settings, Secrets | Tools or automations need keys |
| **Condenser, Agent Context, Verification** | Memory condensation limits, agent notes memory, confirmation/critic | Settings pages | Tune long runs, memory, safety |

**Skill types shown in the UI:** "Always active" (repo-level), "Trigger-based" (knowledge skills with trigger words), "Auto-discovery" (AgentSkills). The public docs describe keyword-triggered and AgentSkills formats and did not mention an always-active category in the page fetched.

**Which to use when:** instructions and know-how, use a skill; reach a system, use an MCP server; ship a bundle, use a plugin; restrict or vary an agent, use an agent profile. The March 2026 skills evaluation shows value is task- and model-dependent: a dependency-audit skill moved pass rate 0/10 to 10/10, another task improved 70% to 80%, and at least one model regressed with a skill. So test skills against a no-skill baseline.

### Steps

**Skills (route `/skills`).**
1. Open Skills. Browse and search by name, description or trigger; filter by state, recommendation and category. Enable or disable default skills; disabled skills are not loaded into agent context.
2. **Add skill**: in any conversation send `/add-skill` with a GitHub URL (full tree link, repository path or short form such as `OpenHands/extensions/skills/code-review`). OpenHands fetches the files, installs them in `.agents/skills/` of the workspace, verifies, and offers a new conversation where the skill is active. Private repos need `GITHUB_TOKEN` set in the environment. You may also copy a skill folder there manually.
3. Start a new conversation; skills load at conversation start (banner: "Skills load when a conversation starts").
4. To create your own, the February 2026 article recommends running a workflow once, then using the skill-creator skill while the example is in context, then sharing via the repo, `/add-skill`, or the OpenHands Extensions registry.

**Plugins (route `/plugins`).** Browse, install, enable, update and uninstall; enabled plugins load automatically into new conversations. Per conversation you can attach plugins at start ("Attach plugins"). Automations can run a plugin (source + ref).

**MCP servers (route `/mcp`).** The page lists Installed and a Marketplace of well-known servers with Install; some providers show "Native" (OAuth integration, recommended) versus "MCP" (your own credentials) tabs. Save credentials as secrets if automations must use them.

**Agent profiles (Settings, Agent profiles).** Add agent profile: name, LLM profile (required for OpenHands agents), and tools: Standard tools or Choose tools ("This agent gets only the tools you select"). Switch profile from the chat ("Switch agent profile"). The default profile cannot be renamed or deleted.

**Other settings:** Backends (where agents run), LLM, Model Router, Agent (OpenHands vs ACP), Condenser (LLM summariser with a max history size, minimum 20 events), Agent Context (memory), Verification, Application, Secrets.

### Best practices

Keep skills short and single-purpose; write trigger words deliberately; measure with a baseline; minimise tools per profile; one profile per risk level.

### Common mistakes

Expecting skills in a running conversation; a skill that conflicts with the repo instruction file; giving every agent every MCP tool; storing keys in prompts.

### Check your understanding

1. Skill versus MCP server: which adds knowledge and which adds capability?
2. Where does `/add-skill` install a skill?
3. Why test a skill against a no-skill baseline?
4. What does an agent profile control?
5. What must you do for an automation to use an MCP credential?

### Sources

`src/routes/skills-settings.tsx`, `skills-plugins.tsx`, `mcp.tsx`, `agent-profiles-settings.tsx`, `condenser-settings.tsx`, `src/constants/skills-docs.ts`, `src/i18n/translation.json`; https://docs.openhands.dev/overview/skills/adding; https://openhands.dev/blog/20260227-creating-effective-agent-skills; https://openhands.dev/blog/evaluating-agent-skills; https://openhands.dev/blog/new-in-agent-canvas-september-2026; https://openhands.dev/blog/openhands-for-customer-success.

### To verify

- The exact difference between a plugin and a skill bundle in the SDK (plugins page text only says "plugins"; the docs page was not fetched).
- Whether plugins can include MCP servers and hooks in this version.
- Public docs for MCP: https://docs.openhands.dev/overview/model-context-protocol (referenced in code, not fetched).

---

## M10. Multi-agent systems: coordinators, workers and verifiers

**Level:** Advanced | **Time:** 50 min | **Prerequisites:** M03, M06

**Goal:** Decide when one agent is enough and when to split work among several, and how roles divide.

### Key concepts

- **Single-agent system:** one model, one prompt style, one combined action space. The 2024 OpenHands post argues this can replace many multi-agent designs; the trade-off is a longer prompt (more cost and distraction), softened by prompt caching.
- **Multi-agent system:** several agents varying model, prompt or tools.
- **Coordinator (manager, conductor):** plans and assigns.
- **Worker (engineer, developer):** does a bounded piece.
- **Verifier (reviewer, QA):** checks results independently.
- **Swarm:** many agents in parallel. The agentic-swarm article says most real engineering swarms are orchestrated, not decentralised.
- **Worktree isolation:** each agent gets its own git worktree so edits do not collide.

### Explanation

Reasons to split: privileged information per agent, work done for different people, read-heavy parallelisable tasks, independent verification. Reasons not to: lost context between agents, structure complexity, cost. A cited research system with a stronger lead and cheaper sub-agents beat a single agent by 90.2% on its internal evaluation but used about fifteen times a normal chat's tokens (cited by the swarm article; vendor-internal result). Swarms fail on naive write-heavy parallelism where agents touch the same files.

CMU's CAID (April 2026 guest post): a manager builds a dependency graph, engineer agents work in separate worktrees, communication is structured JSON plus git commits, tests verify merges. Reported gains over a single agent: +14.3 points absolute on Commit0 and +26.7 on PaperBench across three models; removing worktree isolation caused a significant drop; single agents plateau with extra iterations. One paper, specific benchmarks; do not generalise to all work.

Spotify's Honk (cited in OpenHands articles) runs deterministic verifiers before opening a PR with an LLM judge vetoing roughly a quarter of sessions (cited second-hand).

### In this repo (prototype)

The factory prototype names six roles: conductor, dispatcher (no model), worker, verifier, janitor, scout, with a four-tier model map (`src/utils/feed-agent-role.ts`). The code comment says the roles come from a separate orchestration plan that is not in this repo. See M11.

### Best practices

Start single; split only when you can name the benefit; planner on a strong model, workers on cheaper ones; isolate workspaces; verify independently.

### Common mistakes

Parallelising writes to the same files; agents sharing a conversation and losing context; no merge or test gate.

### Check your understanding

1. Give two situations where multi-agent is justified.
2. Why does git worktree isolation matter?
3. What is a verifier's job and why separate it from the worker?
4. What cost pattern do swarms usually show?
5. Why be careful generalising CAID's numbers?

### Sources

https://openhands.dev/blog/dont-sleep-on-single-agent-systems; https://openhands.dev/blog/agentic-swarm; https://openhands.dev/blog/asynchronous-software-engineering-agents; https://openhands.dev/blog/claude-code-best-practices-agentic-coding; `src/utils/feed-agent-role.ts`.

### To verify

- Current OpenHands product support for sub-agent delegation (the feed shows sub-agents; the May 2026 update lists sub-agents; not driven here).

---

## M11. Setting up a Factory (prototype on this branch)

**Level:** Advanced | **Time:** 55 min | **Prerequisites:** M03, M05, M10

> **Prototype status.** Factories are an in-progress prototype on branch `paul/feed-on-open-work`, not a shipped feature. Built-in factories, teammates and agent personas are simulated, and which factory an ordinary conversation belongs to is partly a stable pseudo-random assignment. Factories you add are saved in the browser's local storage. Do not describe this as available to customers.

**Goal:** Understand the factory concept and try the prototype: create a factory, route requests, read the pipeline.

### Key concepts

- **Factory (concept):** a named group of agents and conversations, with an owner, working on a repeatable line of software delivery. The "dark factory" article (Sept 2026) borrows lights-out manufacturing: unattended operation needs standardised inputs, deterministic verification and instrumentation, and proposes five maturity levels (assisted, supervised autonomy, gated autonomy, narrow lights-out, broad lights-out). It says to start with one repeatable job, limit permissions, keep an execution record, and move human review to the end only when verification is trustworthy. It contains no original data.
- **Owner:** the person (in the prototype, a simulated teammate) responsible.
- **Coordinator:** the agent that routes everything sent to the factory inbox (UI: "Coordinator: Routes everything sent to the inbox").
- **Inbox:** where requests enter; the router decides which conversation gets it or starts a new one.
- **Pipeline template:** a diagram of the delivery flow. Templates in code: Agentic SDLC, Incident response, Release train, Data quality. The Agentic SDLC one runs from triggers (monitoring signals, Jira ticket, Slack tag) through plan, coding, CI, agentic review, deploy and monitoring, with "HITL review first, elevated to autonomous later" steps.
- **Role and tier:** the six roles and four tiers of M10.

### Steps (prototype, from code)

1. In **Automate** (Dashboard), find the **Factories** row. Click **Add Factory**.
2. In the modal enter **Name** (required), **Description**, **Owner** (picked from the simulated teammates) and an icon. **Create** saves it and opens its page. The factory id is derived from the name.
3. The factory page has sections: Overview, Pipeline, Conversations, Agents, Projects. Overview tiles summarise conversation counts and live (running) ones; Agents lists each agent with its conversation and live counts; Projects groups conversations by project.
4. **Pipeline:** choose a template (the page offers "Templates" and "Use template"); step cards show live counts (conversations, live, PRs) drawn from the factory's conversations. Step kinds: human, auto, system.
5. **Agent rail:** the coordinator sits in its own spot with the other agents beneath; clicking one sets the composer's target.
6. **Composer:** write a request. Target choices: the factory **inbox**, one **agent's inbox**, one **conversation**, or one **pull request**.
7. Send. The router decides, in order (`src/utils/factory-routing.ts`): an explicit pick wins; otherwise a pull request number (`#412` or `/pull/412`) or ticket key (`ENG-42`) owned by a conversation; an agent named in the text; a conversation whose title shares at least two meaningful words and at least half the smaller word set; otherwise a new conversation with the agent whose role fits keywords (verifier for review/test; scout for research; janitor for cleanup; conductor for plan/release; worker for fix/build), else a worker, else the coordinator. The UI shows why it chose (reasons and a confidence figure, 0 to 1). **This router is rule-based text matching, not an LLM.**
8. If sent to an existing conversation, the text becomes a message there. If new, a conversation is created with the request text plus a line saying it came from the factory inbox, assigned to the chosen agent, and placed in the factory. Each send is logged in a factory inbox log.

### What is simulated

Built-in factories (Web Platform, Mobile Apps, Data Pipeline, Infrastructure), teammates (for example Maya Chen) and agent personas (for example Atlas as conductor), plus feed chatter. Turn off the simulated team with `?demoTeam=off`. Diff line counts in feed rows are simulated too (code comment).

### Best practices (for the real concept)

Start with one repeatable job; keep humans at first and last review until verification is trusted; log everything; give each agent a narrow role and tool set (M09).

### Common mistakes

Assuming the router understands meaning (it matches words, so a vague request may start a duplicate conversation); expecting factory data to sync across browsers; confusing the prototype with a production orchestration service.

### Check your understanding

1. What is a coordinator's role in a factory?
2. List the router's decision order.
3. Why is "start with one repeatable job" the advice for dark factories?
4. Which parts of the prototype are simulated?
5. What would you need before moving human review to the end of the line?

### Sources

`src/components/features/automations/factory/*`, `src/components/features/automations/factories-group.tsx`, `src/utils/factory-routing.ts`, `src/utils/feed-team-demo.ts`, `src/utils/feed-demo-agents.ts`, `src/utils/feed-agent-role.ts`, `src/stores/feed-factories-store.ts`, `specs/design-dark-factory.md`, https://openhands.dev/blog/what-is-an-ai-dark-factory.

### To verify

- Whether a factory will map to a real backend object (none exists today).
- Final naming and the real coordinator mechanism; the owner list is simulated.
- `specs/design-dark-factory.md` describes a design-review pipeline for a specific team, which is a related but separate design.

---

## M12. Evaluating agents: benchmarks and your own evals

**Level:** Advanced | **Time:** 45 min | **Prerequisites:** M02, M03

**Goal:** Read benchmark claims critically and build a small evaluation for your own tasks.

### Key concepts

- **Benchmark:** a fixed set of tasks scored automatically. **SWE-bench Verified:** 500 human-validated Python issues. **SWE-bench Pro:** harder multi-file tasks. **Terminal-Bench:** command-line tasks. **Aider Polyglot:** 225 Exercism exercises in six languages. **SWE-rebench:** monthly rebuilt tasks to limit contamination.
- **Contamination:** test items leaked into training data, inflating scores.
- **Harness effect:** the agent software changes scores for the same model.
- **OpenHands Index:** covers five categories: bug fixing (SWE-Bench), frontend (SWE-Bench Multimodal), app creation (Commit0), test generation (SWT-Bench) and information gathering (GAIA), with cost and runtime.
- **Best-of-N:** sample several attempts, pick the best.

### Explanation

The benchmarks explainer reports that top models cluster above 80% on SWE-bench Verified (newest in the low-to-mid 90s per a public leaderboard as of July 2026), models stayed below 25% in the original SWE-bench Pro paper, and an OpenAI audit found roughly 30% of Pro's public split broken (as of July 2026). Scores disagree because of task mix, harness, contamination and cost limits. The Index analysis posts also report found weaknesses in benchmark design. Check dates: these figures change quickly.

**Run your own eval:** take 10-30 real tasks with deterministic checks; run each model/setting several times (the skills article uses 10 runs); record pass rate, runtime, events and cost; compare against a baseline; review failures manually. The same method evaluates skills (M09).

### Best practices

Report cost with accuracy; use several benchmarks; re-run when models change; keep a held-out set.

### Common mistakes

Quoting one number without date or harness; treating a leaderboard as your workload.

### Check your understanding

1. What is contamination?
2. Why do SWE-bench Verified and Pro scores differ so much?
3. What would a minimal custom eval contain?
4. Why report cost alongside accuracy?
5. Why can harness change the ranking of models?

### Sources

https://openhands.dev/blog/ai-coding-benchmarks-explained; https://openhands.dev/blog/openhands-index; https://openhands.dev/blog/openhands-index-3-months-out; https://openhands.dev/blog/analyzing-and-improving-openhands-index; https://openhands.dev/blog/evaluating-agent-skills; https://openhands.dev/blog/use-any-coding-agent-in-openhands-with-acp; index data in the research-hub extension.

### To verify

- Current leaderboard values (https://index.openhands.dev); all figures above are dated snapshots from the articles.

---

## M13. Where agents run: backends, self-hosting and ACP agents

**Level:** Advanced | **Time:** 50 min | **Prerequisites:** M05

**Goal:** Choose where agents run and connect Canvas to them; understand ACP agents.

### Key concepts

- **Backend:** an Agent Server (plus optional automation service) that Canvas connects to: local, Docker, remote VM, Kubernetes, enterprise VPC, or OpenHands Cloud.
- **Agent Server:** the service that runs agents and owns the sandbox.
- **ACP (Agent Client Protocol):** a standard for talking to coding agents over JSON-RPC; the Agent Server spawns the agent's CLI as a subprocess and relays turns.
- **Runtime mode:** `npm run dev` (full local stack incl. automation), `dev:minimal` (no automation), `dev:static`, `dev:mock`.

### Steps

1. **Local:** run the stack per `docs/DEVELOPMENT.md` (`npm run dev`). The agent has host filesystem access; use only in trusted environments (architecture doc).
2. **Remote VM:** follow `docs/SELF_HOSTING.md`: provision a machine, secure it, run Canvas, optionally add a domain with nginx and Let's Encrypt, then connect a local Canvas to the remote machine.
3. **Several backends:** Canvas can connect to more than one Agent Server and switch between them (architecture doc). For the website visitor's question of a control-panel host plus other hosts running agents, the pieces exist (backend selection, remote Agent Server) but the docs set out here do not give a reference topology; see Gaps.
4. **ACP agents:** Settings, Agent: choose ACP and a preset (Claude Code, Codex, Gemini CLI; Pi and OpenCode on local backends only). Sign in or add credentials first (they come before the model because the models offered depend on them), then pick a model. A running conversation keeps its agent. Cursor CLI is not on the preset list; a Custom ACP server option exists for any other ACP-speaking server.
5. **Docker:** the ACP doc covers running ACP agents in a container, with per-conversation isolation.

### Best practices

Pin versions (Canvas declares a minimum Agent Server version); secure remote machines before exposing ports; keep credentials in secrets; use a public URL only where needed for event triggers.

### Common mistakes

Exposing an unauthenticated server; assuming settings follow you across backends (agent choice is stored per backend); expecting Pi/OpenCode on Cloud.

### Check your understanding

1. What does Canvas do and not do?
2. What is ACP and why use it?
3. Why configure credentials before choosing an ACP model?
4. What does `dev:minimal` leave out?
5. Name two checks before exposing a self-hosted machine.

### Sources

`docs/architecture.md`, `docs/SELF_HOSTING.md`, `docs/ACP_AGENTS.md`, `docs/DEVELOPMENT.md`; https://openhands.dev/blog/introducing-agent-canvas; https://openhands.dev/blog/use-any-coding-agent-in-openhands-with-acp; https://openhands.dev/blog/20251209-use-openhands-in-your-ide-with-acp.

### To verify

- Gentoo and other distribution support (no source states it).
- Whether Cursor CLI can be used through a Custom ACP command.
- Docs pages docs.openhands.dev/.../backends and /customize-and-settings were referenced in code but not fetched.

---

# Glossary

- **Agent:** an LLM set up to pursue a goal by choosing actions with tools in a loop.
- **Agent Canvas:** the OpenHands React interface for running and automating agents.
- **Agent profile:** a saved agent setup (LLM profile, tools, MCP servers, secrets).
- **Agent Server:** the backend service that runs agents and sandboxes.
- **Agent loop:** think, act, observe, repeat.
- **AgentSkills:** a standard skill format with a `SKILL.md`.
- **Agentic coding:** delegating multi-step coding to an agent.
- **ACP (Agent Client Protocol):** JSON-RPC standard for driving coding agents.
- **AUC:** a score where 0.5 is chance and 1.0 is perfect ranking.
- **Automation:** an agent job started by a schedule or event.
- **Backend:** a server Canvas connects to for running agents.
- **Benchmark:** a fixed scored task set.
- **Best-of-N:** pick the best of several attempts.
- **Blast radius:** potential harm of a failure.
- **BYOK:** supply your own provider key.
- **Chatbot:** answers messages without acting.
- **Condenser:** summarises older history to save context.
- **Confirmation mode:** asks approval before risky actions.
- **Context window:** text a model can consider at once.
- **Contamination:** benchmark items leaked into training.
- **Conversation:** one task thread with an agent.
- **Coordinator:** agent that plans and routes.
- **Critic:** a small model scoring an agent trajectory.
- **Dark factory:** lights-out, unattended software delivery concept.
- **Draft:** an unsaved automation in progress.
- **Egress:** outbound network traffic.
- **Event trigger:** starts an automation when a service event arrives.
- **Factory (Canvas prototype):** named group of agents and conversations with owner, coordinator, inbox and pipeline.
- **Feed:** card view of conversations.
- **Hallucination:** confident but false output.
- **Harness:** software around a model (prompts, tools, loop).
- **HITL:** human-in-the-loop.
- **Inbox (factory):** entry point where requests are routed.
- **Inference:** running a trained model.
- **Inner/outer loop:** local interactive work versus triggered work in separate infrastructure.
- **LLM:** large language model.
- **LLM profile:** saved model configuration.
- **LLM-as-judge:** a model grading outputs.
- **MCP:** Model Context Protocol for external tools.
- **Meta-profile / Model Router:** profile routing between LLM profiles.
- **Mixture of experts:** model using part of its parameters per token.
- **Model-agnostic:** little dependence on one provider.
- **Open-weight:** downloadable weights.
- **Plugin:** installable capability bundle.
- **Prompt injection:** hostile instructions hidden in content.
- **Quantization:** lower-precision weights.
- **Responder:** always-on connection turning messages into conversations.
- **Routine:** scheduled automation category.
- **Sandbox:** isolated runtime.
- **Skill:** reusable instructions in a folder.
- **Slopsquatting:** registering hallucinated package names.
- **Template (automation):** pre-built automation definition.
- **Token:** unit of text for a model.
- **Tool:** a capability an agent can call.
- **Verifier:** agent that checks others' work.
- **Workflow:** event-driven SDLC automation category.
- **Worktree:** separate git working directory.

---

# Source map

## Articles used (via distilled findings; URL pattern https://openhands.dev/blog/<slug>)

what-are-coding-agents; ai-agent-vs-ai-assistant; ai-agent-workflow-automation; ai-agent-observability; dont-sleep-on-single-agent-systems; agentic-swarm; asynchronous-software-engineering-agents (CAID); what-is-an-ai-dark-factory; 20260506-the-verification-stack; 20260305-learning-to-verify-ai-generated-code; code-review-checklist; debugging-ai-generated-code; ai-code-generation; vibe-coding-higher-quality-code; claude-code-best-practices-agentic-coding; background-agents-for-coding-tasks; 20260219-velocity-is-dead; using-openhands-to-improve-your-test-coverage; code-refactoring; mitigating-prompt-injection-attacks-in-software-agents; agent-sandboxing-what-openai-got-wrong-with-the-huggingface-hack; a-practical-guide-to-choosing-the-right-language-model-for-coding-agents; how-to-choose-open-source-llm; model-agnostic-meaning; local-llm; openhands-index; openhands-index-3-months-out; analyzing-and-improving-openhands-index; recursive-flint-on-openhands; model-choice-llm-profiles; ai-coding-benchmarks-explained; evaluating-agent-skills; 20260227-creating-effective-agent-skills; openhands-for-customer-success; introducing-agent-canvas; new-in-agent-canvas-august-2026; new-in-agent-canvas-september-2026; use-any-coding-agent-in-openhands-with-acp; 20251209-use-openhands-in-your-ide-with-acp; 20251202-agents-in-the-outer-loop; openhands-context-condensensation-for-more-efficient-ai-agents. That is 42 articles. Also used for popularity counts: all 117 (tags/slugs).

## Docs and code

| Path | Used for |
|---|---|
| `docs/website-chat-question-analysis.md` | Popularity signal, content gaps |
| `docs/architecture.md` | System boundaries, runtime modes |
| `docs/ACP_AGENTS.md` | ACP providers, switching agents |
| `docs/SELF_HOSTING.md`, `docs/DEVELOPMENT.md` | Hosting steps (headings only read) |
| `specs/home-launcher.md`, `specs/design-dark-factory.md` | Home toggle; design-review pipeline |
| `AGENTS.md`, `.agents/skills/` | Repo conventions, skill locations |
| `src/routes.ts` and route files for skills, plugins, MCP, settings, automations | Routes and pages |
| `src/components/features/automations/**`, `src/manifests/types.ts` | Automation setup, templates, factory UI |
| `src/utils/factory-routing.ts`, `feed-team-demo.ts`, `feed-demo-agents.ts`, `feed-agent-role.ts`, `src/stores/feed-factories-store.ts` | Factory routing and simulation |
| `src/components/features/feed/**` | Feed |
| `src/i18n/translation.json` | UI labels |
| https://docs.openhands.dev/overview/skills/adding | Skills adding, storage |
| https://docs.openhands.dev/openhands/usage/agent-canvas/managing-automations | Automations lifecycle |
| Research-hub `extension.js` | Findings, tags, Index data |

Not read in depth: `docs/team-chat-layer.md`, `social-threads-and-sharing.md`, `usage-insights-integration.md`, `conversation-turn-data.md`, `CANVAS_EXTENSIONS_TESTING.md`, `DefenseClaw.md`, other specs.

---

# Gaps and open questions

**Not answered by the sources**
- Supported platforms and install paths per OS (Gentoo question).
- A reference topology for a control-panel host plus remote agent hosts, with networking and security notes; the highest-intent chat question had no clear answer.
- Whether Cursor CLI (or another unlisted CLI) works as a Custom ACP agent.
- Current pricing, plans and limits of OpenHands Cloud.
- How factories will relate to real backend objects.

**Human should verify**
- All UI paths by running the app (nothing was driven live).
- Every statistic: all are the articles' or third parties' figures at the time of writing.
- The `/model` slash command location, the Docker runtime variable, plan-mode control in Canvas, webhook trigger UI.
- Public docs pages not fetched (backends, customize-and-settings, prebuilt-automations, MCP).

**Ideas for content the articles do not yet cover**
- A "when to use one agent vs several" product guide (chat gap 5).
- Glossary page for site visitors; "Choosing a model" page with tested models.
- Hands-on lab: build one automation from a template, run it in shadow mode, review cost.
- A spec-level doc for factories once they leave prototype.
- A longer chat export (4-8 weeks) to replace this file's ranking with measured data.
