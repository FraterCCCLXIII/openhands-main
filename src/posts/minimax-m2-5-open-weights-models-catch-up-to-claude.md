---
title: 'MiniMax M2.5: Open Weights Models Catch Up to Claude Sonnet'
slug: minimax-m2-5-open-weights-models-catch-up-to-claude
excerpt: 'With the new release of MiniMax M2.5, there is now an open model that is basically up to the quality of Claude Sonnet. We got early access to test it.'
coverImage: /assets/webflow/blog/minimax-m2-5-open-weights-models-catch-up-to-claude/Screenshot_2026-02-12_at_1.56.30_AM.png
date: '2026-02-12T12:00:00.000Z'
authors:
  - name: OpenHands Team
ogImage:
  url: /assets/webflow/blog/minimax-m2-5-open-weights-models-catch-up-to-claude/Screenshot_2026-02-12_at_1.56.30_AM.png
seoTitleDate: 'Feb 11, 2026'
---
# MiniMax M2.5: Open Weights Models Catch Up to Claude Sonnet

For a long time, Claude has been the reigning leader in coding models. There have been few models that have been able to come close, although arguably OpenAI with its new model, GPT 5.3 Codex, is making a play for the throne as well.

And up until now, while great progress had been made on open models, there had not really been an open model that could come near the quality and versatility of the flagship models in the Claude Family, Sonnet and Opus. Today, I feel that we can say this has changed at least to some extent: with the new release of [MiniMax M2.5](https://www.minimax.io/), there is a model that I can impartially say is basically up to the quality of Claude Sonnet.

We got early access to the models, so read below for our testing and impressions, and also directions on a **limited-time offer on using MiniMax-M2.5 free** on the OpenHands Cloud.

# The Numbers

We have recently released the OpenHands Index, a broad coverage benchmark that spans a variety of tasks in software engineering: issue resolution, greenfield app development, frontend development, software testing, and information gathering.

The reason why we created such a benchmark was because we wanted to know as soon as possible after a model release whether it was a model that was worth paying attention to across several axes: accuracy, cost, and issue resolution time (all of which are important to developers of course). You can see more details about it in on the [OpenHands Index Site](https://index.openhands.dev/) or our [blog](https://openhands.dev/blog/openhands-index) explaining the motivation further.

First, the most important numbers, the composite average over the index are shown below:

![OpenHands Index composite benchmark scores showing MiniMax M2.5 in 4th place](/assets/webflow/blog/minimax-m2-5-open-weights-models-catch-up-to-claude/Screenshot_2026-02-12_at_1.56.30_AM.png)

MiniMax-M2.5 clocks in at 4th, behind only models in Claude’s premium Opus family, and OpenAI’s special purpose coding model GPT-5.2 Codex. It is also the first open model (indicated with a blue open lock) that has exceeded Claude Sonnet on my recent tests.

Looking at the cost-performance tradeoff, the model has significantly pushed up the frontier, it’s basically a two-horse race between Claude Opus on the most capable but pricy side, and M2.5 on the very inexpensive and still highly capable side. At a price point approximately 13x cheaper than Opus, it could open up a new set of use cases that were not possible otherwise.

![Cost vs performance chart comparing MiniMax M2.5 to Claude Opus](/assets/webflow/blog/minimax-m2-5-open-weights-models-catch-up-to-claude/Screenshot_2026-02-12_at_1.58.39_AM.png)

Looking more concretely at the task breakdown, M2.5 performed particularly well at long-running tasks of developing new apps from scratch, and had solid performance across all other categories. This capability has long been one where smaller models have struggled, so it is nice to see open models catching up here. It also was quite strong on issue resolution and software testing.

![Task breakdown scores for MiniMax M2.5 across different software engineering tasks](/assets/webflow/blog/minimax-m2-5-open-weights-models-catch-up-to-claude/Screenshot_2026-02-12_at_2.05.17_AM.png)

In addition, looking at the model size, M2.5 is 230B parameters, with 10B active parameters, which is relatively small among the highly capable open models that we have evaluated. This means that it could also be locally deployed for those interested in doing so.

![Model size comparison chart showing M2.5 at 230B parameters with 10B active](/assets/webflow/blog/minimax-m2-5-open-weights-models-catch-up-to-claude/Screenshot_2026-02-12_at_2.02.47_AM.png)

# Vibe Checks

Of course, we can’t rely solely on benchmarks to see how well a model is doing, it is equally important to actually try out the model ourselves! So we put it through its paces. Typically open models have struggled with **generalization** — they were quite good at one-shot solving of bugs on repos, but less good at doing more complex things like interacting with APIs, etc. Here are some things we tried out:

- Checking the review on a pull request using the github API, fixing the review comments, and resolving them through the github API.
- Filtering through all the pull requests open on a repo, and assigning them to the appropriate maintainer to review using git blame.
- Finding out why a frontend app was not displaying properly and fixing the issues.
and several others. Overall, the model proved quite capable, and all of the tasks we tried it managed to finish, although sometimes with a little back-and-forth. Very impressive!

That being said, we there were some issues. For instance, the model pushed to the wrong branch once, and also in one of our benchmarks it was instructed to add its answer between the solution tags “”, but occasionally it forgot, leading to a lower score on this information gathering task. So while a very strong model, there is still room to improve.

# Limited Time Free Usage of MiniMax M2.5

As part of our early access to M2.5 for testing purposes, MiniMax has extended the opportunity for OpenHands users to access their model for **free** on the OpenHands cloud for a limited time.

To access M2.5, travel to the [OpenHands Cloud LLM Settings](https://app.all-hands.dev/settings), select OpenHands as the provider, then `minimax-m2.5` as your model.

![](/assets/webflow/blog/minimax-m2-5-open-weights-models-catch-up-to-claude/Screenshot 2026-02-12 at 9.46.50 AM.png)

You’ll be able to code with this very capable model entirely for free through the [GUI](https://docs.openhands.dev/openhands/usage/cloud/cloud-ui), [CLI](https://docs.openhands.dev/openhands/usage/cli/installation), [SDK](https://docs.openhands.dev/sdk), or integrations into [GitHub](https://docs.openhands.dev/openhands/usage/cloud/github-installation) and [Slack](https://docs.openhands.dev/openhands/usage/cloud/slack-installation).

# Final Words

We’re pretty excited about this moment! OpenHands + MiniMax M2.5 now offer a fully open stack that is quite capable and accessible for software engineering. And this is not to mention the other exciting releases that are coming out from other model providers such as Qwen3-Coder-Next and GLM-5.

We’ll be continuing testing these out and reporting back to the community, so keep your eyes open for future reports on these as well! If you’d like to follow in real time, feel free to join us on [Slack](https://openhands.dev/joinslack) as well, where we discuss developments.

Happy coding!
