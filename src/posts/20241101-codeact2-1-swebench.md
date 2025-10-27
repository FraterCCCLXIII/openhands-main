---
title: "OpenHands CodeAct 2.1: An Open, State-of-the-Art Software Development Agent"
excerpt: "We introduce CodeAct 2.1, achieving state-of-the-art 53% resolve rate on SWE-Bench Verified."
coverImage: "/assets/blog/20241101-codeact2-1-swebench/swebench-leaderboard.jpg"
date: "2024-11-01T08:00:00.000Z"
authors:
  - name: Graham Neubig
    picture: "/assets/blog/authors/graham.jpg"
    link: https://www.phontron.com/
  - name: Xingyao Wang
    picture: "/assets/blog/authors/xingyao.jpg"
    link: https://xingyaoww.github.io/
ogImage:
  url: "/assets/blog/20241101-codeact2-1-swebench/swebench-leaderboard.jpg"
---

OpenHands just released the strongest AI software developer to date, and it is open source, reproducible, and available for anyone to use.

Based on our new agent, CodeAct 2.1 (powered by the new Claude Sonnet 3.5), we achieved:

- 🥇 53% resolve rate on SWE-Bench Verified
- 🥇 41.7% resolve rate on SWE-Bench Lite

These numbers demonstrate the strength of our agents, and the difference in user experience using them is palpable - they resolve more issues more autonomously than ever before. Read on more for details, or jump right in to:

- [Run OpenHands locally](https://docs.all-hands.dev/modules/usage/installation)
- [Run OpenHands in github actions](https://github.com/OpenHands/OpenHands-resolver/)
- [Try OpenHands Cloud](https://app.all-hands.dev)

## What is SWE-Bench?

[SWE-bench](https://www.swebench.com/) is a benchmark designed to evaluate large language models' (LLMs) capabilities in addressing real-world software engineering challenges. It consists of issues and corresponding pull requests from 12 popular Python repositories on GitHub, tasking models with generating code patches to resolve specified issues. Due to its realism and the potential vast benefits of AI agents that could autonomously solve real-world software development challenges, it is used widely throughout academia and industry as a gold-standard for measuring the abilities of AI software developers.

## What did we do?

We released a new agent, OpenHands CodeAct 2.1. CodeAct is a strong [single agent](https://www.all-hands.dev/blog/dont-sleep-on-single-agent-systems) that can solve a wide variety of tasks by executing Python and bash commands, powered by a language model base (see [the paper](https://arxiv.org/abs/2402.01030) for more details).

CodeAct was already a competitive agent for SWE-Bench, but for CodeAct 2.1, we made a number of further improvements:

- Switched to use function calling, a method used by language models to more precisely specify the functions available to them
- We switched to Anthropic's new claude-3.5 model, released in October
- Made a number of fixes to make it easier for agents to traverse directories

## Why is this important?

From a **user experience** perspective, the difference is palpable. We use OpenHands every day in our development through the UI and github issue resolver, and things are smoother – more issues get resolved without human intervention, bigger issues can be tackled, agents don't get stuck in circles as much.

Further, at All Hands AI we believe strongly that **AI agents are going to be transformative for software development**. Because this software that will touch every developer's workflow, it is also software that should be developed in the open so all developers can see it, use it, and contribute to its development. Having the best software developers be open source is a step towards this mission.

If this mission resonates with you, we would love to have you start out by using OpenHands through the links above, and further:

- [Contribute to the open source](https://github.com/OpenHands/OpenHands?tab=readme-ov-file#-how-to-contribute)
- [Apply to work with us at All Hands AI](https://allhandsai.applytojob.com/apply/)
