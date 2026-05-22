---
title: 'The OpenHands Index: 3 Months Out'
slug: openhands-index-3-months-out
excerpt: 'Three months after launch, the OpenHands Index adds new model results from frontier labs, startups, and new entrants, with updated views of accuracy, cost, and runtime across software engineering tasks.'
coverImage: /assets/webflow/blog/openhands-index/20260511-index-01-costper.png
date: '2026-05-11T12:00:00.000+00:00'
authors:
  - name: Juan Michelini
  - name: Graham Neubig
ogImage:
  url: /assets/webflow/blog/openhands-index/20260511-index-01-costper.png
seoTitleDate: 'May 11, 2026'
---
The [OpenHands Index](https://index.openhands.dev/) is a leaderboard that evaluates language models across a range of software engineering tasks: issue resolution, building greenfield apps, frontend development, software testing, and information gathering. It measures not just accuracy, but also cost and runtime, so you can pick the model that fits your tasks.

We released the [OpenHands Index](https://openhands.dev/blog/openhands-index) three months ago, and a lot has happened since then!

The most important thing is that we have added a bunch of new models across the board: we have representatives from both the big frontier labs like Anthropic, OpenAI, and Google DeepMind, as well as startups like DeepSeek, [z.ai](http://z.ai/), and Minimax, and new entrants such as NVIDIA. Let’s look at the results!

First, cost/performance, our main graph. We can see that overall Opus 4.7 takes the top spot, although GPT-5.5 is very competitive (it’s the OpenAI logo right next to Opus). GPT-5.4 does very well at a bit of a cheaper price point, and Gemini 3.1 Pro does well at even cheaper. Our least expensive contender DeepSeek-3.2-Thinker is very solid at 1/10 the price of Claude.

![OpenHands Index cost/performance comparison](/assets/webflow/blog/openhands-index/20260511-index-01-costper.png)

We also measure time to resolution for issues, since having quick responses can be important. Here we can see that the Claude and GPT models perform the best — they’re able to use effective parallel tool calling and efficient inference to finish problems quickly.

![OpenHands Index time to resolution comparison](/assets/webflow/blog/openhands-index-3-months-out/20260511-index-02-timeper.png)

Let’s look at the task-by-task breakdown. For resolving issues on Python repos (SWE-Bench), it’s a competitive field, with many models getting good results. For greenfield, long-horizon development, we see Claude and GPT take the show, they are very strong at performing big, long-running tasks. For frontend development, Claude and Gemini are strong, reflecting their strong multimodal capabilities and the new Claude Opus 4.7 stands out from the pack. But GLM-5.1 also takes close to a top place, a strong contender in where open models have struggled previously. For software testing, Claude is the run-away winner, it seems to have very strong debugging skills! And finally for information gathering, GPT takes the top, although Claude also has a strong showing.

![OpenHands Index task-by-task benchmark breakdown](/assets/webflow/blog/openhands-index-3-months-out/20260511-index-03-breakdown.png)

Finally, since we have been doing the index for a while now, we’re starting to get a picture of how models evolve over time! It seems that Claude is consistently a few months ahead of the trend, followed by GPT, and then the others in the pack.

![OpenHands Index model performance over time](/assets/webflow/blog/openhands-index-3-months-out/20260511-index-04-timecurve.png)

We’re looking to do some more frequent updates going forward, so watch this space when new models come out! And if you have any requests please feel free to ping us on [X](https://x.com/OpenHandsDev), [LinkedIn](https://www.linkedin.com/company/openhands-ai/), or [Slack](https://dub.sh/openhands).
