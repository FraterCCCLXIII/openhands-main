---
title: 'Don''t Sleep on Single-agent Systems'
slug: dont-sleep-on-single-agent-systems
excerpt: 'This post discusses some of the benefits of single-agent systems, and contrasts them with multi-agent systems.'
coverImage: /assets/webflow/misc/6914f599fd4d8499f96fd1e4_6914f598fe6b36e9c3bf5e4c_single-agent-systems.png
coverAlt: 'Cover image'
date: '2024-09-26T12:00:00.000+00:00'
authors:
  - name: Graham Neubig
ogImage:
  url: /assets/webflow/misc/6914f599fd4d8499f96fd1e4_6914f598fe6b36e9c3bf5e4c_single-agent-systems.png
seoTitleDate: 'Nov 12, 2025'
---
Recently "**multi-agent system**" is one of the hottest buzzwords in AI, the focus of popular open-source frameworks like [MetaGPT](https://github.com/geekan/MetaGPT) and [Autogen](https://microsoft.github.io/autogen/), as well as [hackathons](https://medium.com/@kyeg/announcing-the-sthe-first-multi-agent-hackathon-ever-b5e76f534b0d), and many research papers. But in this post, I'd like to take a look at this trend and argue that there are some strong arguments to be made for **single-agent systems**. In doing so, I'll draw on our experience building [OpenHands](https://github.com/OpenHands/OpenHands), a framework for software development agents.

In the summary, we'll discuss:

## What makes an LLM-based Agent?

Recently most practical agents are based on large language models like [Claude](https://www.anthropic.com/claude) by Anthropic or the [OpenAI language models](https://platform.openai.com/docs/models). But a language model is not enough to build an agent, you need at least three components

In general, when we talk about multi-agent systems, we're varying at least one of these three components.

## A Multi-agent Example

For instance, let's say we're building an AI software developer. We could look at [CodeR](https://arxiv.org/abs/2406.01304), a multi-agent framework for AI software development. It includes several agents, all using the same underlying LM but varying the prompt and action space:

This is a very intuitive structure for building a system, but there are a number of difficulties in building such systems.

## Some Issues with Multi-agent Systems

When building a multi-agent system, you can encounter a number of difficulties:

Interestingly, a lot of these challenges map onto human organizations as well! I think we have all had experience of being on teams that were poorly organized, had poor communication, or had issues with maintaining the necessary skill sets when one of the members left, for instance.

## How can we make Excellent Single-agent Systems

It is important to note that there's a reason why people make multi-agent systems – specialized agents work well on specific tasks when you are able to give each agent the structure and tools that they need to do a good job! Will a single agent be able to compete? I believe that this may be easier than we think – we already have created a good prototype for this in the [CodeActAgent implemented in OpenHands](https://github.com/OpenHands/OpenHands/tree/main/openhands/agenthub/codeact_agent). Let's take a look at what is necessary to have a good single LLM, single action space, and single prompting technique.

**Single LLM:** This is the relatively easy part. Recently, we have excellent general-purpose LLMs, including closed ones such as Claude and GPT-4o, and open ones such as [llama-3.1](https://ai.meta.com/blog/meta-llama-3-1/) or [Qwen-2.5](https://qwenlm.github.io/blog/qwen2.5/). While these models cannot do everything, they have a very broad variety of capabilities. If they are lacking a particular capability, they can be [continually trained](https://arxiv.org/abs/2402.01364) to add that ability without major decreases in other abilities.

**Single Action Space:** This is also not so hard. If we have multiple agents with disparate tools at their disposal, we can (1) provide models with relatively general tools that can solve problems, and (2) in the case that different agents have different toolboxes we can concatenate them together. For instance, in OpenHands we provide tools that allow agents to (a) write code, (b) run code, and (c) perform web browsing. This general approach makes it possible to take advantage of software tools that have already been created for human developers, making them remarkably versatile, and subsuming most of the things that other multi-agent systems are able to do.

**Single Prompting Technique:** This is the place where things are tricky! We need to make sure that the agent gets the appropriate directions on how to solve its task, as well as the appropriate information from its environment.

There are a couple options here:

Finding the best method for this is still an active research question, but one that I believe is surmountable. If you'd be interested in tackling it together with us, [jump on the OpenHands slack](https://join.slack.com/t/openhands-ai/shared_invite/zt-34zm4j0gj-Qz5kRHoca8DFCbqXPS~f_A) and we'd be happy to discuss more!

## Conclusion

None of this is to say that multi-agent systems don't have their place. For instance, in situations where one agent has access to privileged information, or in a situation where different agents are acting on behalf of different people then multi-agent systems are certainly the way to go!

The purpose of this post is just to get us to think critically about the trend of adding complexity to our systems. Sometimes simple is best, and with powerful models, powerful tools, and versatile prompts, we are already well on our path there.

If any of this resonates with you, you can try out strong open-source software developers based on a single generalist AI agent through our [open-source](https://github.com/OpenHands/OpenHands) or [online](https://app.all-hands.dev/) versions, or [join our community](https://github.com/OpenHands/OpenHands?tab=readme-ov-file#-join-our-community) and [contribute](https://github.com/OpenHands/OpenHands/blob/main/CONTRIBUTING.md)!
