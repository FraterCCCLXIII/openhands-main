---
title: "How to Evaluate Agent Skills (And Why You Should)"
slug: "evaluating-agent-skills"
excerpt: "Skills can make coding agents dramatically better, slightly more reliable, or actively worse. This post shows how to evaluate agent skills with deterministic tasks, verifiers, and no-skill baselines so you can measure what actually helps."
coverImage: "/assets/webflow/blog/evaluating-agent-skills/evaluating-agent-skills-cover.png"
date: "2026-03-18T18:13:51.459Z"
authors:
  - name: "Rajiv Shah"
ogImage:
  url: "/assets/webflow/blog/evaluating-agent-skills/evaluating-agent-skills-cover.png"
---

<p id="">Skills are becoming a core building block for AI coding agents. Research is documenting their value. For example, <a href="https://arxiv.org/abs/2602.12670" id="">SkillsBench</a> found large gains across a broad task set. At OpenHands, we also recently wrote about <a href="https://openhands.dev/blog/20260227-creating-effective-agent-skills" id="">how to create effective agent skills</a>.</p><p id="">But a useful skill is not just something that sounds smart. It is something that measurably improves outcomes on a real task. Some skills are transformative. Some are just guardrails. Some actually make the agent worse.</p><p id="">This post and accompanying repo look at the other side of the problem: <strong id="">how to evaluate whether a skill is helping at all</strong>.</p><h2 id="">Why evaluate skills?</h2><p id="">If skills just codify knowledge, why bother evaluating them?</p><p id="">Because poorly written skills can reduce performance. In SkillsBench, most skills helped, but some produced negative deltas. In other words, the added guidance made the model less effective, not more.</p><p id="">There is a second reason too: as models improve, some skills stop mattering. Boris Cherny, a developer on Claude Code, <a href="https://www.youtube.com/watch?v=PQU9o_5rHC4&amp;t=611s" id="">put it this way</a>:</p><blockquote id=""><p id="">"The capability changes with every model. The thing that you want is do the minimal possible thing in order to get the model on track. Delete your claude.md and then, if the model gets off track, add back a little bit at a time. What you're probably going to find is with every model you have to add less and less."</p></blockquote><p id="">And finally, skills are model-dependent. A workflow that helps one model may be unnecessary, or harmful, for another.</p><p id="">That is why evaluation matters. "Improved skill" is just a hypothesis until it is measured.</p><h2 id="">What makes a skill evaluation useful?</h2><p id="">A good skill evaluation has three ingredients:</p><ol id=""><li id="">A bounded task the agent can finish in one run</li><li id="">A deterministic verifier that can say pass or fail</li><li id="">A no-skill baseline to compare against</li></ol><p id="">That last point is the one teams most often skip. If you only test the skill-enabled version, success tells you almost nothing. Maybe the model would have passed anyway. Maybe the skill made it slower. Maybe the same task would have been easier without the added constraints.</p><p id="">So the minimum comparison is:</p><ul id=""><li id=""><strong id="">No-skill</strong>: the agent gets the task with no procedural guidance</li><li id=""><strong id="">Skill-enabled</strong>: the agent gets the same task with the skill injected</li></ul><p id="">Pass/fail is the primary metric. Runtime, event count, and tool usage are useful secondary metrics because they tell you whether the skill also made the agent more efficient.</p><h2 id="">A hands-on evaluation setup</h2><p id="">To make this concrete, I built the <a href="https://github.com/rajshah4/evaluating-skills-tutorial" id="">evaluating-skills-tutorial</a> repo. It contains:</p><ul id=""><li id="">three deterministic tasks</li><li id="">a no-skill baseline and an improved skill for each task</li><li id="">local verifiers</li><li id="">scripts to run evaluations on OpenHands Cloud or a local agent server</li><li id="">saved result summaries you can inspect and reproduce</li></ul><p id="">We ran the tasks across five models:</p><ul id=""><li id="">Claude Sonnet 4.5</li><li id="">Gemini 3 Pro</li><li id="">Gemini 3 Flash</li><li id="">Kimi K2</li><li id="">MiniMax M2.5</li></ul><p id="">The point was not to produce one grand benchmark number. It was to show how different tasks reveal different kinds of skill value.</p><h2 id="">Three tasks, three different stories</h2><h3 id="">1. Dependency audit: the skill is essential</h3><p id="">The first task asks the agent to inspect a <code id="">package-lock.json</code> and produce a <code id="">report.json</code> containing only HIGH and CRITICAL vulnerabilities.</p><p id="">This task is procedural. Without guidance, agents tend to improvise: they try different scanners, refresh vulnerability databases, or include findings that should have been filtered out.</p><p id="">The improved skill fixes that by encoding a specific workflow:</p><ul id=""><li id="">check for a pinned offline Trivy snapshot</li><li id="">prefer deterministic local inputs</li><li id="">keep only HIGH and CRITICAL findings</li><li id="">extract CVSS scores in a specific priority order</li><li id="">sort the output deterministically</li></ul><p id="">The result is dramatic:</p><table>

<thead>

<tr>

<th style="text-align: left;">Condition</th>

<th style="text-align: left;">Pass Rate</th>

<th style="text-align: left;">Avg Runtime</th>

<th style="text-align: left;">Avg Events</th>

</tr>

</thead>

<tbody>

<tr>

<td style="text-align: left;">No-skill</td>

<td style="text-align: left;">0% (0/10)</td>

<td style="text-align: left;">266s</td>

<td style="text-align: left;">53</td>

</tr>

<tr>

<td style="text-align: left;">Improved-skill</td>

<td style="text-align: left;">100% (10/10)</td>

<td style="text-align: left;">109s</td>

<td style="text-align: left;">22</td>

</tr>

</tbody>

</table><p id="">This is the clearest example of a high-value skill. It does not just polish the output. It teaches the agent the actual workflow the task requires.</p><h3 id="">2. Financial report extraction: the skill is a safety net</h3><p id="">The second task asks the agent to read two quarterly financial reports and write a structured <code id="">answers.json</code> with extracted metrics and derived percentages.</p><p id="">Most strong models can already do this kind of task. The data is right there in the files. So the skill is not unlocking a hidden capability.</p><p id="">Instead, the improved skill adds:</p><ul id=""><li id="">exact formulas for derived metrics</li><li id="">instructions to use local files only</li><li id="">guidance to use Python for arithmetic instead of computing by hand</li></ul><p id="">The result:</p><table>

<thead>

<tr>

<th style="text-align: left;">Condition</th>

<th style="text-align: left;">Pass Rate</th>

<th style="text-align: left;">Avg Runtime</th>

</tr>

</thead>

<tbody>

<tr>

<td style="text-align: left;">No-skill</td>

<td style="text-align: left;">90% (9/10)</td>

<td style="text-align: left;">87s</td>

</tr>

<tr>

<td style="text-align: left;">Improved-skill</td>

<td style="text-align: left;">100% (10/10)</td>

<td style="text-align: left;">99s</td>

</tr>

</tbody>

</table><p id="">This is a different pattern. The skill helps with consistency more than capability. It acts as a guardrail and reduces the chance that one model gets the arithmetic or workflow slightly wrong.</p><h3 id="">3. Sales pivot analysis: the skill can help or hurt</h3><p id="">The third task asks the agent to combine an Excel workbook and a PDF into a new workbook with two sheets: <code id="">CombinedData</code> and <code id="">Summary</code>.</p><p id="">This skill provides a detailed no-install parsing path using Python built-ins like <code id="">zipfile</code> and <code id="">xml.etree.ElementTree</code>, plus exact sheet-structure requirements.</p><p id="">The overall result looks mildly positive:</p><table>

<thead>

<tr>

<th style="text-align: left;">Condition</th>

<th style="text-align: left;">Pass Rate</th>

</tr>

</thead>

<tbody>

<tr>

<td style="text-align: left;">No-skill</td>

<td style="text-align: left;">70% (7/10)</td>

</tr>

<tr>

<td style="text-align: left;">Improved-skill</td>

<td style="text-align: left;">80% (8/10)</td>

</tr>

</tbody>

</table><p id="">But that aggregate number hides the interesting part: the effect varies by model and backend.</p><ul id=""><li id="">Some models pass more reliably with the skill</li><li id="">Some models already solve the task better without the extra guidance</li><li id="">At least one model regressed on the skill-enabled version in Cloud</li></ul><p id="">This is the key lesson: <strong id="">skills can be counterproductive</strong>. If a skill nudges the model into a brittle implementation path, it may reduce robustness rather than increase it.</p><h2 id="">The bigger lesson</h2><p id="">These three tasks produce three different conclusions:</p><ol id=""><li id="">Some skills are essential</li><li id="">Some skills mainly improve reliability</li><li id="">Some skills are mixed and must be measured carefully</li></ol><p id="">If you only evaluate one task, it is easy to overgeneralize.</p><p id="">If you only tested the dependency audit, you would conclude that skills are transformative.</p><p id="">If you only tested the financial report, you might conclude they are modest quality-of-life improvements.</p><p id="">If you only tested the sales pivot task, you might conclude skills are overengineering.</p><p id="">All three conclusions would be incomplete.</p><p id="">The right takeaway is that <strong id="">skill quality is task-dependent and model-dependent</strong>.</p><h2 id="">What traces add</h2><p id="">Pass/fail tells you whether the skill worked. Traces tell you why.</p><p id="">When you inspect traces, you can often see patterns like:</p><ul id=""><li id="">unnecessary exploration in no-skill runs</li><li id="">clean, direct workflows in successful skill-enabled runs</li><li id="">overconstraint or brittle recovery in failed skill-enabled runs</li></ul><p id="">Here is an example trace from a sales pivot analysis run, viewed in Laminar:</p><p id=""><img alt="Trace example from Laminar" src="/assets/webflow/blog/evaluating-agent-skills/evaluating-agent-skills-trace-example.png" /></p><p id="">That makes traces especially useful for improving a skill after the first round of evaluation. The verifier tells you whether you won or lost; the trace helps you understand what to fix.</p><p id="">In the tutorial repo, we used <a href="https://www.lmnr.ai/" id="">Laminar</a> for observability, but the evaluation loop is not tied to one tracing stack. OpenHands is OTEL-compatible, so you can plug in whatever observability system you prefer.</p><h2 id="">How to evaluate your own skills</h2><p id="">If you want to test whether a skill actually helps, use a loop like this:</p><ol id=""><li id="">Choose a bounded task</li><li id="">Define one output artifact</li><li id="">Write a deterministic verifier</li><li id="">Run the task with no skill</li><li id="">Run the same task with the skill enabled</li><li id="">Compare pass/fail first, then runtime and traces</li></ol><p id="">That is enough to give you a signal.</p><p id="">You do not need a huge benchmark to start. A small number of carefully designed tasks is often enough to show whether your skill is adding real value.</p><h2 id="">Try it yourself</h2><p id="">The full repo is available here:</p><ul id=""><li id=""><a href="https://github.com/rajshah4/evaluating-skills-tutorial" id="">evaluating-skills-tutorial</a></li></ul><p id="">It includes the task definitions, skills, verifiers, result summaries, and scripts needed to reproduce the runs or adapt the setup for your own workflows.</p><p id="">The main point of the project is simple:</p><p id=""><strong id="">Do not assume a skill is helping just because it exists. Measure it.</strong></p><hr /><p id="">This tutorial was inspired by <a href="https://github.com/benchflow-ai/skillsbench" id="">SkillsBench</a> and adapts its core idea of evaluating skills on deterministic tasks with local verifiers.</p>
