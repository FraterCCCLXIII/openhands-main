---
title: "Evaluation of LLMs as Coding Agents on SWE-Bench (at 30x Speed!)"
excerpt: "We evaluated LLMs as coding agents on SWE-Bench Lite, using an evaluation framework we built for efficient evaluation of coding agents."
coverImage: "/assets/blog/20241004-evaluation-of-llms-as-coding-agents/accuracy-bar-chart.png"
date: "2024-10-04T08:00:00.000Z"
authors:
  - name: Graham Neubig
    picture: "/assets/blog/authors/graham.jpg"
    link: https://www.phontron.com/
  - name: Xingyao Wang
    picture: "/assets/blog/authors/xingyao.webp"
    link: https://xwang.dev
ogImage:
  url: "/assets/blog/20241004-evaluation-of-llms-as-coding-agents/accuracy-bar-chart.png"
---

## Introduction

Coding agents hold great promise, but they're still far from perfect. Because of this, to make iterative improvements, we need to evaluate them rigorously.

However, due to the incremental nature of agents and necessity to safely execute the code they produce, evaluation can be slow! Fixing a single example from [SWE-bench Lite](https://www.swebench.com/lite.html) can take 10 minutes, so to run the entire dataset with 300 instances can take two full days! In addition, because each agent runs in its own environment, it is necessary to create many environments, which requires hundreds of gigabytes of space. This is a **major impediment to iterating and improving** these agents.

To fix this, we built a cloud-based solution, allowing for speed ups of 30x or more on evaluation of AI coding agents, and used this to benchmark 10 popular language models on the SWE-Bench lite benchmark.

Which LLM came out as the winner? Are there any good open-source models for AI coding agents? Read on to find out!

## What we built: A remote sandboxing environment for parallel processing of software engineering agents

At All Hands AI, we are developing [OpenHands](https://github.com/OpenHands/OpenHands), an open-source framework that anyone can use to build with, and also evaluate software engineering agents.

One important element of OpenHands is sandboxing, where we allow the agent to write, run, and test code within an environment that is cordoned off from the rest of the machine. We do sandboxing because we don't want to damage the computer that the agent is running on – but at the same time the agent should be able to use actions available to human developers, such as running arbitrary code. To do this sandboxing, OpenHands implements a "runtime" that executes all the actions in a Docker environment to isolate the environment. The agent communicates through the runtime using messages ("actions"), and receives feedback from the environment ("observations"), as in the diagram below.

![Diagram of OpenHands runtime](/assets/blog/20241004-evaluation-of-llms-as-coding-agents/agent-runtime.png)

In order to make evaluation in OpenHands faster, we built a cloud-based solution that makes it possible to spin up many of these runtimes in parallel. This is implemented in the OpenHands remote runtime (for those interested in the technical details, you can dig in to the code [here](https://github.com/OpenHands/OpenHands/blob/b61455042f3aac3e3b874187da6f9133cae068f5/openhands/runtime/remote/runtime.py) and more about how OpenHands runtime works in general [here](https://docs.all-hands.dev/modules/usage/architecture/runtime#how-does-the-runtime-work)).

Why is this good? Now we can use the power of the cloud to run many evaluations in parallel on separate machines, greatly speeding up the process. For instance, we ran evaluation in 32x parallel, and this speeds up the time for running a SWE-Bench Lite eval from several days to several hours.

![Diagram of serial vs parallel evaluation](/assets/blog/20241004-evaluation-of-llms-as-coding-agents/serial-vs-parallel.png)

## What we did with it: Evaluation of LLMs as coding agents

Because slow evaluation on rigorous settings like SWE-Bench had been a bottleneck, we had centered our evaluation around Anthropic's claude-3.5-sonnet and OpenAI's gpt-4o.

Now that we have faster evaluation, we were able to answer two questions that we'd wanted to answer for a while now:

- **What are the best open models for use in coding agents?** Up until now we had mainly been relying on closed-source models, but we believe in open source and want to use open models if we can! We tried out llama-3.1, Qwen2.5, and Deepseek v2.5.
- **How does the new OpenAI o1🍓 model perform?** The recently released OpenAI o1 models are all the rage nowadays, and we wanted to know how they stack up against previous closed models.

The results of our experiments are below, with closed models in blue and open models in red:

![Chart of LLM performance](/assets/blog/20241004-evaluation-of-llms-as-coding-agents/accuracy-bar-chart.png)

A few interesting takeaways here:

- Clauder 3.5 Sonnet is the best by a fair amount, achieving a 27% resolve rate with the default agent in OpenHands.
- GPT-4o lags behind, and o1-mini actually performed somewhat worse than GPT-4o. We went in and analyzed the results a little, and briefly it seemed like o1 was sometimes "overthinking" things, performing extra environment configuration tasks when it could just go ahead and finish the task.
- Finally, the strongest open models were Llama 3.1 405 B and deepseek-v2.5, and they performed reasonably, even besting some of the closed models.

Another aspect that is of interest, given that running agents can be relatively expensive, is the price/accuracy tradeoff, we've plotted this below:

![Chart of price/accuracy tradeoff](/assets/blog/20241004-evaluation-of-llms-as-coding-agents/accuracy-vs-cost.png)

Here there were two clear winners: Claude with a high resolve rate of 27 and a modest cost of $0.3 per issue, and deepseek with an amazing cost of $0.003 (yes, 0.3 cents!). Notably, both of [Anthropic](https://www.anthropic.com/news/prompt-caching) and [Deepseek](https://platform.deepseek.com/api-docs/news/news0802/) have recently introduced prompt caching, which greatly reduced their cost in agentic settings, making these results possible.

## What's next?

We'd love to roll out this environment to anyone who is interested in efficient evaluation of coding agents! Currently the environment is in beta, so if you want to get started with it, please follow instructions at [https://runtime.all-hands.dev/](https://runtime.all-hands.dev/).

We're also interested in using the environment to evaluation of more language models, and also existing models on more tasks. So if you have any requests for this, please get in contact as well.

## Acknowledgement

We would like to thank Jiseung Hong and Alex Liu for helping run some of the experiments, and all of the other beta testers of the OpenHands remote runtime.
