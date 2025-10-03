---
title: "A Practical Guide to Choosing the Right Language Model for Coding Agents"
excerpt: "Coding agents are powered by large language models, but which one should you choose? We share our experiences with Claude Sonnet 4, GPT-5, and Qwen3 Coder to help you make the right decision for your specific use case."
coverImage: "/assets/blog/20251002-when-to-pick-language-models/cover.png"
date: "2025-10-02T12:00:00.000Z"
authors:
  - name: Graham Neubig
    picture: "/assets/blog/authors/graham.jpg"
ogImage:
  url: "/assets/blog/20251002-when-to-pick-language-models/cover.png"
---

There are currently a plethora of large language models available to be used with coding agents, and which one you choose has a significant impact on your experience using them.
In this blog I'm going to share a bit of my personal experience with coding models, and give some recommendations on when to pick each one.
Of course, these recommendations are based on what is available today, are a bit subjective, and your mileage may vary. But I hope this will be a useful starting point for you to make your own decisions!

I'll introduce 4 types of models I typically use in my coding tasks:

## Claude Sonnet 4

**Pros:**

- [Claude Sonnet 4.5](https://www.anthropic.com/news/claude-sonnet-4-5) by Anthropic is a *fast*, *strong*, and *moderately priced* model that is good at a wide variety of coding tasks.
- It excels at understanding user queries, breaking down the task into manageable steps, executing those steps, and trying alternatives when it gets stuck.

**Cons:**

- Even when it has not achieved a task, it will often say that it has finished implementing something, leading to multiple corrections by the human user.
- It tends to do silly mocks or workarounds when something is not working instead of properly debugging the issue.

**Pricing:**

- Overall cost is moderate, with a price of $1-7 per session for a median-sized chunk of work.

## GPT-5

**Pros:**

- [GPT-5](https://openai.com/index/introducing-gpt-5/) by OpenAI is a *strong reasoning* model that is particularly good at more difficult tasks, such as complex data analysis and implementing tricky features.
- It tends to be quite careful, often stopping to ask for clarification when things are not going well.

**Cons:**

- It is typically used with high reasoning effort, which means that it takes more time to finish tasks than Claude Sonnet.

**Pricing:**

- Overall cost is moderate, comparable to Claude Sonnet.

## Large Open-weights Models (e.g., Qwen3 Coder 480B, Kimi-K2)

**Pros:**

- Models like [Qwen3 Coder 480B](https://github.com/QwenLM/Qwen3-Coder) and [Kimi-K2](https://moonshotai.github.io/Kimi-K2/) are *open models* that can be deployed on your own hardware, providing privacy and security benefits.
- They are *very affordable* compared to proprietary alternatives, making them a good choice for cost-sensitive applications.

**Cons:**

- The current best coding agent models text/code only (no vision).
- They are a bit less versatile than the other models above, and may struggle with more complex tasks.
- These models are still a bit big to run on consumer hardware, so you may need to use a cloud provider to deploy them.

**Pricing:**

- Overall cost is low, with a price of $0.25-$2 per session.

## Medium-sized Open-weights Models (e.g., Qwen3 Coder 30B)

**Pros:**

- Medium-sized models like [Qwen3 Coder 30B](https://github.com/QwenLM/Qwen3-Coder) can run on consumer hardware, meaning that anyone can deploy them privately, possibly even on your own desktop!
- They are *very affordable* as a result.

**Cons:**

- They are less capable than larger models, and may struggle with more complex tasks.
- Again, the current best coding agent models text/code only (no vision).

**Pricing:**

- If you can run it on your own hardware, the cost is essentially free (beyond electricity and hardware costs).

## Using Different Language Models for Coding Agents: A Practical Guide

We develop [OpenHands](https://www.all-hands.dev/), an LM agnostic coding agents, which means that we try to create our agents to be usable with any language model.

We recently upgraded the OpenHands Cloud to support model choice, which means you can select from a broad set of supported models (or bring your own key for your preferred provider): [https://www.all-hands.dev/blog/all-new-openhands-cloud-more-model-choice-lower-prices-slicker-design](https://www.all-hands.dev/blog/all-new-openhands-cloud-more-model-choice-lower-prices-slicker-design)

If you'd like to try different models for yourself? [Sign up for OpenHands Cloud](https://app.all-hands.dev/) today and experiment with all three models to see which works best for your specific use cases. Or [download OpenHands](https://github.com/All-Hands-AI/OpenHands) to run locally with your preferred model.

Have questions about model selection or want to share your own experiences? Join our [Slack community](https://all-hands.dev/joinslack) or [email us directly](mailto:contact@all-hands.dev). We are always excited to hear how different models perform in real-world scenarios.
