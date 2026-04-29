---
title: "Analyzing and Improving the OpenHands Index"
slug: "analyzing-and-improving-openhands-index"
excerpt: "How collaboration with CMU researchers helped us discover and fix a benchmark vulnerability, leading to more reliable model evaluations."
coverImage: "https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/6998c09326f4991613e264d4_6998c093a1d54934c3fa8e40_openhands-index-cover-hero.png"
date: "2026-02-20T20:18:04.004Z"
authors:
  - name: "Graham Neubig"
ogImage:
  url: "https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/6998c09326f4991613e264d4_6998c093a1d54934c3fa8e40_openhands-index-cover-hero.png"
---

<p id="">At OpenHands, we're committed to providing the most reliable and comprehensive evaluations of language models for software engineering tasks. Today, we're sharing an update on the OpenHands Index, including new results, a collaboration that helped us discover a benchmark vulnerability, and how we're working to continuously improve the quality of our evaluations.</p><h2 id="">What Is the OpenHands Index?</h2><p id="">For those who missed our <a href="https://all-hands.dev/blog/introducing-the-openhands-index" id="">original announcement</a>, the <a href="https://index.openhands.dev" id="">OpenHands Index</a> is a comprehensive benchmark that evaluates language models across a broad variety of software engineering tasks. Unlike benchmarks that focus on a single dimension, the OpenHands Index tests models on five key areas that reflect real-world coding agent use cases:</p><ul id=""><li id=""><strong id="">Issue Resolution</strong> - Fixing bugs and issues, tested via SWE-Bench Verified</li><li id=""><strong id="">Greenfield Development</strong> - Building applications from scratch, tested via Commit0</li><li id=""><strong id="">Frontend Development</strong> - Creating and improving frontend apps, tested via SWE-Bench Multimodal</li><li id=""><strong id="">Software Testing</strong> - Identifying bugs and generating reproduction tests, tested via SWT-Bench</li><li id=""><strong id="">Information Gathering</strong> - Researching APIs and implementation details, tested via GAIA</li></ul><p id="">This broad coverage provides a more complete picture of each model's capabilities, allowing users to choose the best model for their specific use cases and priorities.</p><h2 id="">Recent Updates to the Index</h2><p id="">We've been actively adding new results to the OpenHands Index. Since our initial release, we've added evaluations for:</p><ul id=""><li id=""><strong id="">Claude 4.6 Opus</strong> - Anthropic's latest flagship model</li><li id=""><strong id="">GPT 5.2 Codex</strong> - OpenAI's coding-focused model</li><li id=""><strong id="">Kimi K2.5</strong> - Moonshot AI's latest reasoning model</li><li id=""><strong id="">GLM-4.7</strong> - Zhipu AI's latest model</li><li id=""><strong id="">MiniMax M2.5</strong> - MiniMax's newest model</li></ul><p id="">All of these results, along with complete evaluation traces, are available in our <a href="https://github.com/OpenHands/openhands-index-results" id="">openhands-index-results repository</a>. We believe in transparency, so every evaluation comes with full trajectory data that allows researchers and developers to inspect exactly how each model approached each task.</p><h2 id="">New: Partnership with Laminar for Trace Visualization</h2><p id="">We're excited to announce a new partnership with <a href="https://www.laminar.sh/" id="">Laminar</a> to provide interactive trace visualization for all OpenHands Index evaluations. Every benchmark run now comes with detailed, explorable traces.</p><p id="">Laminar integration is built directly into the <a href="https://github.com/OpenHands/software-agent-sdk" id="">OpenHands Software Agent SDK</a>. When running evaluations, the SDK automatically instruments agent actions using <a href="https://www.laminar.sh/" id="">Laminar's</a> observability framework. This captures every LLM call with inputs, outputs, and token usage; tool executions (bash commands, file operations, browser actions); timing information for each step; and cost tracking per model call.</p><p id="">In our <a href="https://github.com/OpenHands/benchmarks" id="">benchmarks repository</a>, each evaluation harness creates a Laminar evaluation session and links individual benchmark instances to their traces. This allows us to track not just whether a model solved a task, but <em>how</em> it approached the problem.</p><p id="">On the <a href="https://index.openhands.dev" id="">OpenHands Index</a>, you'll find a "Visualization" column in each benchmark table. Clicking the chart icon opens the <a href="https://www.laminar.sh/" id="">Laminar</a> trace viewer for that model's evaluation run.</p><p id=""><img alt="Where to find traces on the OpenHands Index" src="https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/6998be9e182ef6a5e299254a_6998bb48b3531993515b6c32_laminar-where-to-find.png" /></p><p id="">In the trace viewer, you can explore individual agent sessions, see the sequence of actions taken, and understand exactly how each model approached each task:</p><p id=""><img alt="Example of a Laminar trace showing agent actions" src="https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/6998be9e182ef6a5e299254e_6998be9e182ef6a5e299251d_laminar-trace-example-padded.png" /></p><p id="">This level of transparency is important for understanding model behavior beyond just pass/fail metrics.</p><h2 id="">Discovering and Fixing a Benchmark Vulnerability</h2><p id="">A significant development since our last update has been our collaboration with researchers at Carnegie Mellon University. <a href="https://fjzzq2002.github.io/" id="">Ziqian Zhong</a>, <a href="https://scholar.google.com/citations?user=7sw01QYAAAAJ" id="">Shashwat Saxena</a>, and <a href="https://www.cs.cmu.edu/~aditirag/" id="">Aditi Raghunathan</a> developed <strong id=""><a href="https://hodoscope.dev/" id="">Hodoscope</a></strong>, an open-source tool for analyzing agent trajectories at scale using unsupervised methods.</p><p id="">Hodoscope takes a novel approach to understanding agent behavior: it summarizes each agent action into a high-level behavioral description, embeds summaries into a shared vector space where similar behaviors cluster together, and uses kernel density estimates to reveal behaviors that are unique to specific models or setups. This approach is particularly valuable for exploratory analysis where you don't know in advance what failure modes to look for.</p><p id="">When the CMU team applied Hodoscope to analyze trajectories from the OpenHands Index, they identified a vulnerability in the Commit0 benchmark. Commit0 works by taking a real repository, creating an initial commit that strips out the bulk of the code, and asking the agent to reimplement the removed portions. However, the original setup cloned repositories with full git history - meaning agents could run <code id="">git log</code> to see the commit history, use <code id="">git show</code> or <code id="">git diff</code> to view the original implementations, and copy the original code instead of implementing it from scratch.</p><p id="">Hodoscope surfaced this by identifying an unusual cluster of <code id="">git log</code> actions that were unique to certain models. MiniMax M2.5 was particularly effective at exploiting this pattern - it achieved strong scores while completing tasks unusually quickly by retrieving code from the git history rather than implementing it.</p><p id=""><img alt="Hodoscope visualization showing reward hacking behavior cluster" src="https://cdn.prod.website-files.com/68ff4058b35616cdd47d5b59/6998be9f182ef6a5e2992556_6998be9dad7c25ded0650b9e_hodoscope-reward-hacking-padded.png" /></p><p id="">We reported this to the Commit0 maintainers, and the fix was straightforward: use shallow clones (<code id="">--depth 1</code>) to prevent access to git history. This was implemented in <a href="https://github.com/OpenHands/benchmarks/pull/422" id="">OpenHands/benchmarks#422</a>. After updating the benchmark and re-running evaluations, we observed notable changes in the Commit0 scores:</p><table>

<thead>

<tr>

<th style="text-align: left;">Model</th>

<th style="text-align: left;">Old Score</th>

<th style="text-align: left;">Old Runtime</th>

<th style="text-align: left;">New Score</th>

<th style="text-align: left;">New Runtime</th>

<th style="text-align: left;">Δ Score</th>

</tr>

</thead>

<tbody>

<tr>

<td style="text-align: left;">MiniMax-M2.5</td>

<td style="text-align: left;">50.0%</td>

<td style="text-align: left;">376s</td>

<td style="text-align: left;">18.8%</td>

<td style="text-align: left;">1404s</td>

<td style="text-align: left;">-31.2%</td>

</tr>

<tr>

<td style="text-align: left;">MiniMax-M2.1</td>

<td style="text-align: left;">25.0%</td>

<td style="text-align: left;">826s</td>

<td style="text-align: left;">12.5%</td>

<td style="text-align: left;">2947s</td>

<td style="text-align: left;">-12.5%</td>

</tr>

<tr>

<td style="text-align: left;">GPT-5.2-Codex</td>

<td style="text-align: left;">62.5%</td>

<td style="text-align: left;">838s</td>

<td style="text-align: left;">50.0%</td>

<td style="text-align: left;">1079s</td>

<td style="text-align: left;">-12.5%</td>

</tr>

<tr>

<td style="text-align: left;">DeepSeek-V3.2-Reasoner</td>

<td style="text-align: left;">31.2%</td>

<td style="text-align: left;">1411s</td>

<td style="text-align: left;">18.8%</td>

<td style="text-align: left;">1033s</td>

<td style="text-align: left;">-12.4%</td>

</tr>

<tr>

<td style="text-align: left;">Kimi-K2-Thinking</td>

<td style="text-align: left;">18.8%</td>

<td style="text-align: left;">2314s</td>

<td style="text-align: left;">6.2%</td>

<td style="text-align: left;">2921s</td>

<td style="text-align: left;">-12.6%</td>

</tr>

</tbody>

</table><p id="">MiniMax-M2.5 saw the largest drop - from 50% to 18.8%, with runtime increasing nearly 4x. This aligns with expectations: it was particularly effective at using the git history shortcut. Most other models dropped by a similar margin (~12-13%), suggesting some degree of git history usage across models, though less pronounced than MiniMax-M2.5.</p><p id="">We want to be clear: MiniMax-M2.5 remains a capable model with strong accuracy on other benchmarks, competitive cost, and good speed. The agent simply found and exploited an available shortcut. The issue was with the benchmark setup, not the model itself.</p><h2 id="">What's Next</h2><p id="">This experience reinforces our commitment to rigorous, high-quality benchmarking. We're implementing additional checks to detect potential benchmark vulnerabilities before they affect results - tools like Hodoscope will be part of our regular analysis pipeline. We'll continue refreshing the index with new benchmarks covering important aspects of software engineering. All our benchmarking code is open-source in <a href="https://github.com/OpenHands/benchmarks" id="">OpenHands/benchmarks</a>, and all results include full traces in <a href="https://github.com/OpenHands/openhands-index-results" id="">OpenHands/openhands-index-results</a>.</p><p id="">We're grateful to the CMU team for their work on Hodoscope and their analysis of our data, and to the <a href="https://www.laminar.sh/" id="">Laminar</a> team for their partnership on trace visualization. If you're working on agent evaluation, benchmark development, or related research, we'd love to collaborate - <a href="https://openhands.dev/joinslack" id="">join our Slack</a> and head to the <code id="">#proj-agent</code> channel, or check out the <a href="https://index.openhands.dev" id="">OpenHands Index</a> to explore the data yourself.</p>
