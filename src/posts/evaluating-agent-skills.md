---
title: 'How to Evaluate Agent Skills (And Why You Should)'
slug: evaluating-agent-skills
excerpt: 'Skills can make coding agents dramatically better, slightly more reliable, or actively worse. This post shows how to evaluate agent skills with deterministic tasks, verifiers, and no-skill baselines so you can measure what actually helps.'
coverImage: /assets/webflow/blog/evaluating-agent-skills/evaluating-agent-skills-cover.png
date: '2026-03-18T12:00:00.000+00:00'
authors:
  - name: Rajiv Shah
ogImage:
  url: /assets/webflow/blog/evaluating-agent-skills/evaluating-agent-skills-cover.png
seoTitleDate: 'Mar 18, 2026'
---
Skills are becoming a core building block for AI coding agents. Research is documenting their value. For example, [SkillsBench](https://arxiv.org/abs/2602.12670) found large gains across a broad task set. At OpenHands, we also recently wrote about [how to create effective agent skills](https://openhands.dev/blog/20260227-creating-effective-agent-skills).

But a useful skill is not just something that sounds smart. It is something that measurably improves outcomes on a real task. Some skills are transformative. Some are just guardrails. Some actually make the agent worse.

This post and accompanying repo look at the other side of the problem: **how to evaluate whether a skill is helping at all**.

## Why evaluate skills?

If skills just codify knowledge, why bother evaluating them?

Because poorly written skills can reduce performance. In SkillsBench, most skills helped, but some produced negative deltas. In other words, the added guidance made the model less effective, not more.

There is a second reason too: as models improve, some skills stop mattering. Boris Cherny, a developer on Claude Code, [put it this way](https://www.youtube.com/watch?v=PQU9o_5rHC4&t=611s):

> "The capability changes with every model. The thing that you want is do the minimal possible thing in order to get the model on track. Delete your claude.md and then, if the model gets off track, add back a little bit at a time. What you're probably going to find is with every model you have to add less and less."

And finally, skills are model-dependent. A workflow that helps one model may be unnecessary, or harmful, for another.

That is why evaluation matters. "Improved skill" is just a hypothesis until it is measured.

## What makes a skill evaluation useful?

A good skill evaluation has three ingredients:

1. A bounded task the agent can finish in one run

1. A deterministic verifier that can say pass or fail

1. A no-skill baseline to compare against

That last point is the one teams most often skip. If you only test the skill-enabled version, success tells you almost nothing. Maybe the model would have passed anyway. Maybe the skill made it slower. Maybe the same task would have been easier without the added constraints.

So the minimum comparison is:

- **No-skill**: the agent gets the task with no procedural guidance

- **Skill-enabled**: the agent gets the same task with the skill injected

Pass/fail is the primary metric. Runtime, event count, and tool usage are useful secondary metrics because they tell you whether the skill also made the agent more efficient.

## A hands-on evaluation setup

To make this concrete, I built the [evaluating-skills-tutorial](https://github.com/rajshah4/evaluating-skills-tutorial) repo. It contains:

- three deterministic tasks

- a no-skill baseline and an improved skill for each task

- local verifiers

- scripts to run evaluations on OpenHands Cloud or a local agent server

- saved result summaries you can inspect and reproduce

We ran the tasks across five models:

- Claude Sonnet 4.5

- Gemini 3 Pro

- Gemini 3 Flash

- Kimi K2

- MiniMax M2.5

The point was not to produce one grand benchmark number. It was to show how different tasks reveal different kinds of skill value.

## Three tasks, three different stories

### 1. Dependency audit: the skill is essential

The first task asks the agent to inspect a `package-lock.json` and produce a `report.json` containing only HIGH and CRITICAL vulnerabilities.

This task is procedural. Without guidance, agents tend to improvise: they try different scanners, refresh vulnerability databases, or include findings that should have been filtered out.

The improved skill fixes that by encoding a specific workflow:

- check for a pinned offline Trivy snapshot

- prefer deterministic local inputs

- keep only HIGH and CRITICAL findings

- extract CVSS scores in a specific priority order

- sort the output deterministically

The result is dramatic:

| Condition | Pass Rate | Avg Runtime | Avg Events |
| --- | --- | --- | --- |
| No-skill | 0% (0/10) | 266s | 53 |
| Improved-skill | 100% (10/10) | 109s | 22 |

This is the clearest example of a high-value skill. It does not just polish the output. It teaches the agent the actual workflow the task requires.

### 2. Financial report extraction: the skill is a safety net

The second task asks the agent to read two quarterly financial reports and write a structured `answers.json` with extracted metrics and derived percentages.

Most strong models can already do this kind of task. The data is right there in the files. So the skill is not unlocking a hidden capability.

Instead, the improved skill adds:

- exact formulas for derived metrics

- instructions to use local files only

- guidance to use Python for arithmetic instead of computing by hand

The result:

| Condition | Pass Rate | Avg Runtime |
| --- | --- | --- |
| No-skill | 90% (9/10) | 87s |
| Improved-skill | 100% (10/10) | 99s |

This is a different pattern. The skill helps with consistency more than capability. It acts as a guardrail and reduces the chance that one model gets the arithmetic or workflow slightly wrong.

### 3. Sales pivot analysis: the skill can help or hurt

The third task asks the agent to combine an Excel workbook and a PDF into a new workbook with two sheets: `CombinedData` and `Summary`.

This skill provides a detailed no-install parsing path using Python built-ins like `zipfile` and `xml.etree.ElementTree`, plus exact sheet-structure requirements.

The overall result looks mildly positive:

| Condition | Pass Rate |
| --- | --- |
| No-skill | 70% (7/10) |
| Improved-skill | 80% (8/10) |

But that aggregate number hides the interesting part: the effect varies by model and backend.

- Some models pass more reliably with the skill

- Some models already solve the task better without the extra guidance

- At least one model regressed on the skill-enabled version in Cloud

This is the key lesson: **skills can be counterproductive**. If a skill nudges the model into a brittle implementation path, it may reduce robustness rather than increase it.

## The bigger lesson

These three tasks produce three different conclusions:

1. Some skills are essential

1. Some skills mainly improve reliability

1. Some skills are mixed and must be measured carefully

If you only evaluate one task, it is easy to overgeneralize.

If you only tested the dependency audit, you would conclude that skills are transformative.

If you only tested the financial report, you might conclude they are modest quality-of-life improvements.

If you only tested the sales pivot task, you might conclude skills are overengineering.

All three conclusions would be incomplete.

The right takeaway is that **skill quality is task-dependent and model-dependent**.

## What traces add

Pass/fail tells you whether the skill worked. Traces tell you why.

When you inspect traces, you can often see patterns like:

- unnecessary exploration in no-skill runs

- clean, direct workflows in successful skill-enabled runs

- overconstraint or brittle recovery in failed skill-enabled runs

Here is an example trace from a sales pivot analysis run, viewed in Laminar:

![Trace example from Laminar](/assets/webflow/blog/evaluating-agent-skills/evaluating-agent-skills-trace-example.png)

That makes traces especially useful for improving a skill after the first round of evaluation. The verifier tells you whether you won or lost; the trace helps you understand what to fix.

In the tutorial repo, we used [Laminar](https://www.lmnr.ai/) for observability, but the evaluation loop is not tied to one tracing stack. OpenHands is OTEL-compatible, so you can plug in whatever observability system you prefer.

## How to evaluate your own skills

If you want to test whether a skill actually helps, use a loop like this:

1. Choose a bounded task

1. Define one output artifact

1. Write a deterministic verifier

1. Run the task with no skill

1. Run the same task with the skill enabled

1. Compare pass/fail first, then runtime and traces

That is enough to give you a signal.

You do not need a huge benchmark to start. A small number of carefully designed tasks is often enough to show whether your skill is adding real value.

## Try it yourself

The full repo is available here:

- [evaluating-skills-tutorial](https://github.com/rajshah4/evaluating-skills-tutorial)

It includes the task definitions, skills, verifiers, result summaries, and scripts needed to reproduce the runs or adapt the setup for your own workflows.

The main point of the project is simple:

**Do not assume a skill is helping just because it exists. Measure it.**

---

This tutorial was inspired by [SkillsBench](https://github.com/benchflow-ai/skillsbench) and adapts its core idea of evaluating skills on deterministic tasks with local verifiers.
