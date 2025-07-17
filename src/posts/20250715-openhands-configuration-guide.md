---
title: "Access State-of-the-Art LLM models at cost via OpenHands GUI and CLI"
excerpt: "Announcing a new OpenHands LLM provider that enables access to state-of-the-art (SOTA) agentic coding models like Claude Sonnet 4, Devstral Small, Devstral Medium, Gemini 2.5 Pro, and o4-mini at cost – without any additional pricing markup."
coverImage: "/assets/blog/20250715-openhands-provider/ai-routing-llms.png"
date: "2025-07-15T12:00:00.000Z"
authors:
  - name: Joe Pelletier
    picture: "/assets/blog/authors/joe.png"
ogImage:
  url: "/assets/blog/20250715-openhands-provider/cover.png"
---

One of our most important objectives at OpenHands is to make state-of-the-art software development agents accessible to any developer no matter what your circumstances. As an open source AI coding agent, developers often use OpenHands locally through a [GUI](https://docs.all-hands.dev/usage/how-to/gui-mode) or [CLI](https://docs.all-hands.dev/usage/how-to/cli-mode) with an API key to their LLM provider of choice. However, many OpenHands users find managing API keys for multiple LLM providers a nuisance, and low rate limits leading to a sub-optimal experience.

This is why we are announcing a new OpenHands LLM provider that enables access to state-of-the-art (SOTA) agentic coding models like Claude Sonnet 4, Devstral Small, Devstral Medium, Gemini 2.5 Pro, and o4-mini at cost – without any additional pricing markup.  With this announcement, OpenHands Cloud users can enjoy a high rate limit and easily switch between different recommended model providers – without having to enter a separate API key for each provider. 

This new OpenHands provider option can be found in the latest versions of the locally runnable OpenHands GUI and OpenHands CLI. Users can find their OpenHands provider LLM Key in their OpenHands Cloud account. For a limited time, new users of OpenHands Cloud will receive \$20 in free credits - you can sign up here at [app.all-hands.dev](https://app.all-hands.dev). Both the OpenHands LLM provider and OpenHands Cloud share the same credit balance, which you can refill anytime for as low as $10.

Here is the full list of models provided, as well as their price points – all of these models are [recommended models](https://docs.all-hands.dev/usage/llms/llms) that we have validated to work well with OpenHands:

| Model | Pricing |
| :---- | :---- |
| [Claude Sonnet 4](https://www.anthropic.com/pricing#api) | Input: \$3.00 / MTok <br> Cache write: \$3.75 / MTok <br> Cache read: \$0.30 / MTok <br> Output: \$15.00 / MTok |
| [Claude Opus 4](https://www.anthropic.com/pricing#api) | Input: \$15 / MTok <br> Cache write: \$18.75 / MTok <br> Cache read: \$1.50 / MTok <br> Output: \$75 / MTok |
| [Devstral Small 2507](https://mistral.ai/pricing#api-pricing) | Input: \$0.10 / MTok <br> Output: \$0.30 / MTok |
| [Devstral Medium 2507](https://mistral.ai/pricing#api-pricing) | Input: \$0.40 / MTok <br> Output: \$2.00 / MTok |
| [Gemini 2.5 Pro](https://cloud.google.com/vertex-ai/generative-ai/pricing) | Input: \$1.25 / MTok, prompts \<=200k tokens; \$2.50 / MTok, prompts \>200k tokens <br> Output: \$10 / MTok prompts \<=200k tokens; \$15 / MTok, prompts \>200k tokens \*\>200k tokens are very unlikely in OpenHands due to [context condensation](https://www.all-hands.dev/blog/openhands-context-condensensation-for-more-efficient-ai-agents) |
|  [o4-mini](https://openai.com/api/pricing/) | Input: \$1.10 / MTok <br> Cached input: \$0.275 / MTok <br> Output: \$4.40 / MTok |

Below are screenshots illustrating the new experience. We'll be sharing more about new features in OpenHands and OpenHands Cloud very soon, so keep an eye out for those announcements in the coming weeks!

![LLM Key](/assets/blog/20250715-openhands-provider/llm-api-key.png)
*Access your LLM API Key directly from the [OpenHands Cloud API keys page](https://app.all-hands.dev/settings/api-keys).*

![CLI](/assets/blog/20250715-openhands-provider/cli-llm.png)
*Select your desired OpenHands model from the convenience of the OpenHands CLI.*

![GUI Models](/assets/blog/20250715-openhands-provider/llm-options.png)
*Within the locally run OpenHands GUI, you can select the new OpenHands LLM provider, select a model, and plug in your OpenHands LLM API key.*