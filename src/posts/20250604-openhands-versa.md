---
title: "Building a Provably Versatile Agent"
excerpt: "OpenHands Versa is a versatile agent that excels across multiple benchmarks, from software engineering to web browsing and frontend development."
coverImage: "/assets/blog/20250604-openhands-versa/image2.png"
date: "2025-06-04T09:00:00.000Z"
authors:
  - name: Juan Michelini
    picture: "/assets/blog/authors/juan.jpg"
  - name: Xingyao Wang
    picture: "/assets/blog/authors/xingyao.webp"
  - name: Graham Neubig
    picture: "/assets/blog/authors/graham.jpg"
ogImage:
  url: "/assets/blog/20250604-openhands-versa/image2.png"
---

There's a lot of news in agents nowadays, ones that code, ones that browse the web, ones that perform customer service, ones that wash your socks. However, while there is a lot of excitement around agents, there is also a lot of disappointment. When you actually try them out, they often make simple mistakes, get stuck in loops, and don't get the job done.

<iframe width="560" height="315" src="https://www.youtube.com/embed/uc2P-7E0ZwE" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

At [OpenHands](https://github.com/OpenHands/OpenHands), we have been working hard at making agents that actually work, and doing it in the open so you can actually understand why they work too. And how have we proven that they work? We have consistently been on or near the top of the industry-standard [SWE-Bench leaderboard](https://www.swebench.com/), which measures the ability of agents to solve software bugs in Python.

However, there's a lot more to life than solving bugs on Python repos. If you're a software developer, you might do frontend development, build apps from scratch, do software maintenance, gather information from internal documents, communicate with your team, and do administrative work as well. Our aspirations for building agents are much higher, we want an agent where you can **delegate any task, and have a pretty good idea that the agent will deliver for you**.

Today, we're announcing two first steps towards this goal:

* First, **VersaBench**, a new broad-coverage benchmark for evaluating agents on many different tasks from software development to more general business-relevant tasks.
* Second, **OpenHands Versa**, an agent that can not only capably solve software engineering tasks, but cover a much broader spectrum of use cases.

OpenHands Versa is quite capable, delivering performance that exceeds the state of the art on 5/8 benchmarks on VersaBench and is competitive on the others. This is the first time that a single agent has been demonstrated to be so broadly capable, and we think that you'll like it if you try it out.

OpenHands Versa is enabled by default in the most recent version of OpenHands, so you can use it in the [OpenHands Cloud](https://app.all-hands.dev) today, [download OpenHands](https://github.com/OpenHands/OpenHands) 0.41 or higher, and read on to learn more.

## VersaBench: A Diverse Benchmark for Software Engineering

Based on our experience and feedback from OpenHands users, [we have identified a number of things that people want to use software development agents for](https://www.all-hands.dev/blog/8-use-cases-for-generalist-software-development-agents). Based on these categories, we gathered 10 existing public benchmarks, and used them to construct VersaBench, which measures agent capabilities beyond just bug fixing. It measures the ability of agents in 5 broad categories.

**Improving existing codebases:** Much of software engineering is improving large, existing code bases to fix bugs or add features. We measure this ability on 3 datasets [SWE-bench Verified](https://openai.com/index/introducing-swe-bench-verified/) (for fixing Python bugs), [SWE-bench Multimodal](https://www.swebench.com/multimodal.html) (for performing frontend development in JavaScript), [Multi-SWE-bench](https://multi-swe-bench.github.io/#/) (for fixing bugs in a variety of languages).

**Building apps from scratch**: Many users of coding agents like OpenHands also use them to build greenfield apps, such as building a new script or web application, which we evaluate on [commit0](https://github.com/commit-0/commit0).

**Smoothing the development process**: In developing software, there are many "chores" that software developers have to do, like writing tests, making tests pass, or fixing linting failures. As a representative of this. We add two benchmarks [SWT-Bench](https://swtbench.com/) and the [JetBrains CI Repair Benchmark](https://huggingface.co/spaces/JetBrains-Research/long-code-arena).

**Accessing information**: Another important task that software engineers must do is gather information from relevant sources such as documentation, existing files, etc. So we also evaluate on [GAIA](https://huggingface.co/datasets/gaia-benchmark/GAIA), an industry-standard benchmark for general purpose assistants that help out with answering questions, processing data, and other related tasks.

**Navigating business situations**: Finally, and most ambitiously, we evaluate on [TheAgentCompany](https://the-agent-company.com/), a benchmark on the ability of agents to perform a variety of tasks within a fictional software company. These span software development, data science, human resources, project management, financial analysis, and general administration.

## New Research - OpenHands-Versa

![OpenHands Versa Methodology](/assets/blog/20250604-openhands-versa/image2.png)

Based on this benchmark, together with other researchers at Carnegie Mellon University, we investigated how to build a truly versatile agent that works across diverse tasks. Our research built on OpenHands, our strong software development agent that was nonetheless constrained due to its limited toolset of only using a textual browser, a file editor, and code execution.

We identified three essential capabilities that enable solving a much broader swath of real-world tasks: multimodal file reading (allowing for processing of document files and spoken data), multimodal web browsing (navigating websites with visual understanding), and information access (searching the web for more data). Together, this allowed us to build a more versatile agent, OpenHands-Versa. Notably, this is a quite small set of additional tools that we provide to the agent, but each one solves a core problem, greatly improving the overall agent's versatility.

The details of the approach have been explained in our [paper](https://arxiv.org/abs/2506.03011), and the core techniques are all available by default today in the most recent version of OpenHands.

## The Proof – Benchmark Results

The results of OpenHands-Versa are impressive. Across the 10 diverse benchmarks in VersaBench, we achieve state-of-the-art accuracy in 8, sometimes improving the state-of-the-art by up to 30 points. Even where OpenHands-Versa does not quite achieve the results of more specialized agents, it is close, demonstrating that a single generalist agent can be used with confidence in these situations as well.

![OpenHands Versa Results](/assets/blog/20250604-openhands-versa/image1.png)

Overall, the takeaway is simple: OpenHands is an agent that actually delivers across a wide variety of tasks, and now we have proof of this in the numbers. All of the benchmarking code is publicly available, so we welcome you to download it, run it, and scrutinize the results yourself as well!

## Get Started Today

Getting started with this new version of OpenHands is easy. You can:

* Immediately access it through the [OpenHands Cloud](https://app.all-hands.dev), where new users can get started right away with $20 in free credits.
* [Download OpenHands](https://github.com/OpenHands/OpenHands) and run locally, selecting a version 0.41.0 or higher.

We also encourage you to join the community – connect with us on [Slack](https://join.slack.com/t/openhands-ai/shared_invite/zt-34zm4j0gj-Qz5kRHoca8DFCbqXPS~f_A), read our [documentation](https://docs.all-hands.dev/), and stay updated on our latest developments. Looking forward to what you all do with the world's most versatile agent!
