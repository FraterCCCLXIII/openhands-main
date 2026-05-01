---
title: "Learning to Verify AI-Generated Code"
slug: "20260305-learning-to-verify-ai-generated-code"
excerpt: "LLMs made generating code cheap. The real bottleneck is verification: checking that a change is correct, follows repo conventions, and is something your team can trust, review, and merge. This post introduces the first layer of our verification stack."
coverImage: "/assets/webflow/blog/20260305-learning-to-verify-ai-generated-code/learning-to-verify-ai-cover.png"
date: "2026-03-05T12:00:00.000Z"
authors:
  - name: "Xingyao Wang"
ogImage:
  url: "/assets/webflow/blog/20260305-learning-to-verify-ai-generated-code/learning-to-verify-ai-cover.png"
---

<p>LLMs made generating code cheap. The real bottleneck is <strong>verification</strong>: checking that a change is correct, follows repo conventions, and is something your team can trust, review, and merge.</p><p>In OpenHands, we think of this as a <strong>verification stack</strong>: a layered set of verifiers that helps coding agents fail fast and produce changes humans can confidently merge.</p><p><strong>This post introduces the first layer of our stack:</strong> a trajectory-level verifier implemented as a small, fast <strong>critic model</strong>. We&#x27;ll share the second layer of the stack in a follow-up post soon.</p><h2>What this critic does</h2><p>The critic scores an agent&#x27;s <strong>trajectory</strong> (conversation, tool calls, and actions). You can use it to decide whether to continue, stop, or refine; to pick among multiple attempts; and to collect lightweight feedback that improves the agent over time.</p><figure class="w-richtext-align-center w-richtext-figure-type-image"><div><img src="/assets/webflow/blog/20260305-learning-to-verify-ai-generated-code/critic-diagram.png" alt="Critic model scoring diagram" loading="lazy"/></div></figure><p>Because the model is small, it&#x27;s fast (often sub-second to ~1s) and cheap enough to run during an interactive session.</p><h2>Why production use is different from benchmarks</h2><p><a href="https://arxiv.org/abs/2412.21139">Previous academic work</a> has trained critic models on datasets like SWE-Bench and SWE-Gym. Training a critic is convenient because you often have <strong>verified rewards</strong> (e.g., unit tests) to label each attempt as correct or not.</p><p>But those verified rewards usually don&#x27;t exist in real-world, human-in-the-loop development. Production sessions are messy: goals evolve, success signals are sparse or delayed, and what matters is often whether the work survives review and merges.</p><p>In practice, we found that critics trained only on benchmark traces translate poorly to production. So this critic is trained on <strong>real-world production traces</strong>, using sparse signals such as <strong>PR merge</strong> and <strong>code survival</strong>.</p><div class="w-embed"><div class="table-wrapper">
<table>
  <thead>
    <tr>
      <th>Training / signal</th>
      <th>AUC on production outcomes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Trained on benchmark-style data only</td>
      <td>~0.45-0.48 (worst than random)</td>
    </tr>
    <tr>
      <td>Trained with production supervision (outcome proxy: PR merge)</td>
      <td>0.58</td>
    </tr>
    <tr>
      <td>Trained with production supervision (outcome proxy: code survival)</td>
      <td><strong>0.69</strong></td>
    </tr>
  </tbody>
</table>
</div></div><p>That gap is why we train this critic on <strong>real-world user–agent interactions</strong>. We use the kinds of sparse signals you can actually get in production (PR merge and code survival), and turn traces into dense supervision via rubrics.</p><h2>How we train it (from production traces)</h2><p>We train the critic from <strong>real-world user–agent interactions</strong> using a pipeline that mirrors the figures below.</p><figure class="w-richtext-align-center w-richtext-figure-type-image"><div><img src="/assets/webflow/blog/20260305-learning-to-verify-ai-generated-code/training-pipeline.png" alt="Training pipeline diagram" loading="lazy"/></div></figure><h3>Step 1: Assign credit to agent segments</h3><p>We standardize each interaction into <strong>segments</strong>: user request → agent actions/tools → finish. Segments are the unit we train and evaluate on, and they&#x27;re crucial in production, where a single chat often contains multiple &quot;segments/tries.&quot;</p><figure class="w-richtext-align-center w-richtext-figure-type-image"><div><img src="/assets/webflow/blog/20260305-learning-to-verify-ai-generated-code/segment-diagram.png" alt="Agent segment diagram" loading="lazy"/></div></figure><h3>Step 2: Turn traces into dense supervision</h3><p>We annotate every segment with <strong>Critic Rubrics</strong>: <strong>24 trace-observable features</strong> describing behavioral quality and common failure modes (misunderstood intent, didn&#x27;t follow instructions, scope creep, and more). Because they come from the trace itself, this supervision covers essentially <strong>100%</strong> of segments.</p><p>To validate that this isn&#x27;t just taxonomy for taxonomy&#x27;s sake, we run regressions from rubric features to sparse outcomes. The takeaway is that <strong>rubrics are predictive of real outcomes</strong>, and what&#x27;s predictive can differ between benchmarks and production.</p><figure class="w-richtext-align-center w-richtext-figure-type-image"><div><img src="/assets/webflow/blog/20260305-learning-to-verify-ai-generated-code/rubrics-predictive.png" alt="Rubrics predictive analysis" loading="lazy"/></div></figure><h3>Step 3: Ground with sparse outcomes, then train the critic</h3><p>For the small subset of segments where we can align production signals, we attach sparse outcome proxies—primarily <strong>code survival</strong> (~4% coverage) and <strong>PR merge</strong> (~6% coverage).</p><p>We then train a small <strong>semi-supervised, multi-task critic</strong> that learns to predict rubric features (dense) and success from outcome proxies (sparse), turning previously unlabeled segments into usable training data.</p><h2>Does it work? Key evaluation takeaways</h2><p>We structure the evaluation into two parts.</p><p>First, we evaluate the critic itself: real-world supervision is necessary, and critics trained only on benchmark-style datasets are near-random on real-world outcomes (AUC ~0.45–0.48). Outcome proxies also matter—despite being sparser, <strong>code survival</strong> is a stronger training signal than PR merge (intrinsic AUC 0.69 vs 0.58).</p><p>Then, we evaluate the <strong>finalized critic</strong> on downstream inference-time scaling, in two modes we use in practice: <strong>Best-of-N Selection</strong> (rerank multiple attempts and pick the best) and <strong>Early Stopping</strong> (accept as soon as the score clears a threshold). Unless otherwise noted, the downstream results below use our best-performing supervision setup—<strong>code survival as the outcome proxy, with rubric supervision enabled</strong> (motivated by the intrinsic AUC comparison above).</p><p>The payoff shows up at inference time. On the mixed-outcome subset of SWE-bench Verified (instances where at least one run succeeds and at least one fails), critic-guided selection substantially improves inference-time scaling (Best@8 73.8% vs Random@8 57.9%) and makes early stopping cheaper (+17.7 over random with 1.35 attempts on average).</p><div class="w-embed"><div class="table-wrapper">
<table>
  <thead>
    <tr>
      <th>Selection mode</th>
      <th>Metric</th>
      <th>Random</th>
      <th>Critic (trained on code survival + rubrics)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Best-of-N Selection</td>
      <td>Best@8 (mixed-outcome SWE-bench)</td>
      <td>57.9%</td>
      <td><strong>73.8%</strong></td>
    </tr>
    <tr>
      <td>Early Stopping</td>
      <td>Δ vs random</td>
      <td>0.0</td>
      <td><strong>+17.7</strong></td>
    </tr>
    <tr>
      <td>Early Stopping</td>
      <td>Avg attempts</td>
      <td>8.0</td>
      <td><strong>1.35</strong></td>
    </tr>
  </tbody>
</table>
</div></div><p>For the full ablation grid and additional details, please refer to <a href="https://arxiv.org/abs/2603.03800">our paper</a>.</p><h2>Try it today</h2><h3>OpenHands SDK</h3><p>The critic is integrated into the OpenHands Software Agent SDK, so you can call it programmatically and use the score in your own loops (e.g., reranking, early stopping, iterative refinement).</p><p>SDK guide: <a href="https://docs.openhands.dev/sdk/guides/critic">https://docs.openhands.dev/sdk/guides/critic</a></p><h3>OpenHands CLI</h3><p>The critic + early stopping (accept as soon as the score clears a threshold) is also integrated into the OpenHands CLI (<strong>free when using the OpenHands Model Provider</strong>). You can enable it, perform <strong>iterative refinement</strong> with it, and optionally configure different <strong>acceptance thresholds</strong>.</p><p>CLI guide: <a href="https://docs.openhands.dev/openhands/usage/cli/critic">https://docs.openhands.dev/openhands/usage/cli/critic</a></p><h2>What&#x27;s next</h2><p>This post covered layer one: judging an entire trajectory. Layer two is more surgical—it focuses on catching patch-level issues early (repo conventions, common footguns, and the kinds of problems that waste reviewer time). We&#x27;ll publish a follow-up post soon that introduces layer two and shows how it composes with the critic.</p><p>In the meantime, here are the best places to go deeper or try it yourself:</p><ul role="list"><li><strong>Docs:</strong><ul role="list"><li>SDK guide: <a href="https://docs.openhands.dev/sdk/guides/critic">https://docs.openhands.dev/sdk/guides/critic</a></li><li>CLI guide: <a href="https://docs.openhands.dev/openhands/usage/cli/critic">https://docs.openhands.dev/openhands/usage/cli/critic</a></li></ul></li><li><strong>Paper (arXiv):</strong> <a href="https://arxiv.org/abs/2603.03800">https://arxiv.org/abs/2603.03800</a></li><li><strong>Model weights:</strong> <a href="https://huggingface.co/OpenHands/openhands-critic-4b-v1.0">https://huggingface.co/OpenHands/openhands-critic-4b-v1.0</a></li><li><strong>Code / GitHub repo:</strong> <a href="https://github.com/OpenHands/critic-rubrics">https://github.com/OpenHands/critic-rubrics</a></li></ul><p>If you&#x27;re deploying OpenHands in a team setting and want critic-based verification wired into your workflow (policy checks, custom thresholds, feedback pipelines), reach out—we&#x27;re happy to help.</p>
