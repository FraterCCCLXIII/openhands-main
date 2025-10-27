---
title: "Devstral: A new state-of-the-art open model for coding agents"
excerpt: "Devstral is an agentic LLM for software engineering tasks that outperforms all open-source models on SWE-Bench Verified by a large margin."
coverImage: "/assets/blog/20250520-devstral-web-post/image2.png"
date: "2025-05-20T09:00:00.000Z"
authors:
  - name: Xingyao Wang
    picture: "/assets/blog/authors/xingyao.webp"
  - name: Graham Neubig
    picture: "/assets/blog/authors/graham.jpg"
ogImage:
  url: "/assets/blog/20250520-devstral-web-post/image2.png"
---

Today we introduce Devstral, an agentic LLM for software engineering tasks. Devstral is built under a collaboration between [Mistral AI](https://mistral.ai/) and All Hands AI, and outperforms all open-source models on SWE-Bench Verified by a large margin. We release Devstral under the Apache 2.0 license.

![Devstral Performance](/assets/blog/20250520-devstral-web-post/image2.png)



## Agentic LLMs for software development

While typical LLMs are excellent at atomic coding tasks such as writing standalone functions or code completion, they currently struggle to solve real-world software engineering problems. Real-world development requires contextualising code within a large codebase, identifying relationships between disparate components, and identifying subtle bugs in intricate functions.

Devstral is an attempt at tackling this problem. Devstral is trained to solve real GitHub issues; it was trained to be compatible with the [OpenHands](https://github.com/OpenHands/OpenHands),  coding agent. Here, we show Devstral's performance on the popular SWE-Bench Verified benchmark, a dataset of 500 real-world GitHub issues which have been manually screened for correctness.

OpenHands+Devstral achieves a score of 46.8% on SWE-Bench Verified, outperforming prior open-source SoTA by more than 6% points. Compared to OpenHands with larger models such as Deepseek-V3-0324 (671B) and Qwen3 232B-A22B, Devstral achieves much more accurate results.

In the table below, we also compare Devstral to closed and open models evaluated within other agent frameworks (including ones custom for the model). Here, we find that Devstral achieves substantially better performance than a number of closed-source alternatives. For example, Devstral surpasses the recent GPT-4.1-mini by over 20%.

![DevStral Performance Comparison](/assets/blog/20250520-devstral-web-post/image1.png)

## Getting Started

Devstral is light enough to run on a single RTX 4090 GPU or a Mac with 32GB RAM, making it an ideal choice for local deployment and on-device use. To learn more about how to deploy it, check out the [local model instructions](https://docs.all-hands.dev/modules/usage/llms/local-llms) for OpenHands, and the following tutorial video.

<iframe width="504" height="378" src="https://www.youtube.com/embed/oV9tAkS2Xic" title="DevStral: Introducing the best open-source model for coding agents" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

Alternatively, if you would like to try out OpenHands without going through the local setup process, the [OpenHands cloud](https://app.all-hands.dev/) allows you to get started right away.

## Availability

We are releasing this model for free under an Apache 2.0 license for the community to build on, customize, and accelerate autonomous software development.

The model is also available on the [Mistral API](https://docs.mistral.ai/api/) under the name `devstral-small-2505` at the same price as Mistral Small 3.1: \$0.1/M input tokens and \$0.3/M output tokens.

For comparison, Claude 3.7 Sonnet is 30x more expensive per input token and 50x per output token.

You can download the model on [Hugging Face](https://huggingface.co/mistralai/Devstral-Small-2505), [Ollama](https://ollama.com/library/devstral), [Kaggle](https://www.kaggle.com/models/mistral-ai/devstral-small-2505), [Unsloth](https://docs.unsloth.ai/basics/devstral) starting today.

The performance of the model also makes it a suitable choice for agentic coding on privacy-sensitive repositories in enterprises, especially ones subject to stringent security and compliance requirements. For enterprise deployments that require deployment in private settings, or higher-fidelity customization such as continued pre-training or distilling Devstral's capabilities into other models, please [contact us](mailto:contact@all-hands.dev).

## Get in touch!

We'd love to hear what you think of this new model release. We're excited about it and we hope that you are too. If you'd like to join the community:

* [Join our Slack workspace](https://join.slack.com/t/openhands-ai/shared_invite/zt-34zm4j0gj-Qz5kRHoca8DFCbqXPS~f_A) - Here we talk about research, architecture, and future development.
* [Join our Discord server](https://discord.gg/ESHStjSjD4) - This is a community-run server for general discussion, questions, and feedback.
