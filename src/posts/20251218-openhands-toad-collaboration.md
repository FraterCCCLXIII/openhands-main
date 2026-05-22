---
title: 'OpenHands Partners with Toad: A Universal Terminal Interface for AI Agents'
slug: 20251218-openhands-toad-collaboration
excerpt: 'OpenHands is sponsoring the development of Toad, a universal terminal interface for AI agents. Toad provides a polished, consistent experience for agentic coding tools, and OpenHands is one of its recommended agents.'
coverImage: /assets/webflow/blog/694412959429f7fe869af4ce_cover-1.png
date: '2025-12-18T12:00:00.000+00:00'
authors:
  - name: OpenHands Team
ogImage:
  url: /assets/webflow/blog/694412959429f7fe869af4ce_cover-1.png
seoTitleDate: 'Dec 18, 2025'
---
Terminal-based AI coding assistants have grown rapidly in popularity. Tools like Claude Code, Gemini CLI, and OpenHands CLI give developers the ability to interact with AI agents directly in the terminal—the environment where many of us spend most of our working day.

But each tool comes with its own interface, its own quirks, and its own limitations. What if there was a universal interface that could work with any AI agent?

That's the vision behind [Toad](https://openhands.dev/), a project by [Will McGugan](https://openhands.dev/), the creator of the popular Python libraries [Rich](https://openhands.dev/) and [Textual](https://openhands.dev/). OpenHands is proud to be a sponsor of Toad's development and one of its recommended agents.

# What is Toad?

Toad is a universal terminal interface for AI agents. The name comes from "**t**extual c**ode**"—combining the Textual framework with coding assistance. Built on the Textual library, Toad provides a modern terminal user experience that goes beyond what traditional command-line tools offer.

Toad addresses several limitations common to existing terminal-based AI tools:

**No flickering or visual artifacts.** Many terminal AI tools suffer from flickering as they update content. Toad can update partial regions of the screen—down to a single character—without redrawing everything.

**Scrollback that works.** You can scroll back through your conversation history and interact with previous outputs, including copying text without garbled formatting.

**A unified experience.** Instead of learning different interfaces for different AI agents, Toad provides a consistent experience across all supported agents through the [Agent Client Protocol](https://openhands.dev/) (ACP).

# The Agent Client Protocol

Toad uses the [Agent Client Protocol](https://openhands.dev/) (ACP) to communicate with AI agents. ACP is a standardized protocol—similar in concept to the Language Server Protocol (LSP)—that allows editors and interfaces to communicate with any compatible AI agent. We previously wrote about [how to use OpenHands in your favorite editor through ACP](https://openhands.dev/).

With ACP support, Toad can act as a front-end for multiple agents. Users can switch between Claude Code, Gemini, OpenHands, and other compatible agents from within the same interface.

# OpenHands in Toad

OpenHands is included as a recommended agent in Toad's agent store. When users browse available agents in Toad, they'll find OpenHands listed alongside other options, with easy installation and configuration.

The integration uses the OpenHands CLI's ACP mode. After installing OpenHands, users can launch it directly from Toad's interface:

1. Open Toad's agent store

1. Find OpenHands in the list of recommended agents

1. Click "Install" to set up OpenHands via `uv tool install openhands --python 3.12 && openhands login`

1. Select OpenHands and start a conversation

Toad handles the ACP communication layer, so users get the same polished terminal experience whether they're using OpenHands or any other supported agent.

# Why This Partnership?

At OpenHands, we believe the future of software development should be open and community-driven. Will McGugan shares that commitment—Rich and Textual are both open source projects used by millions of developers.

Toad represents an important step toward making AI coding tools more accessible. Rather than being locked into a single vendor's interface, developers can choose the agent that best fits their needs while enjoying a consistent, high-quality terminal experience.

By sponsoring Toad's development, OpenHands is helping to build open infrastructure that benefits the entire developer community. And as a recommended agent in Toad, OpenHands becomes more accessible to developers who prefer terminal-based workflows.

# Get Started

To try Toad with OpenHands, install it using [uv](https://openhands.dev/):

`uvx batrachian-toad‍`

For more installation options and documentation, visit [batrachian.ai](https://openhands.dev/).

From there, you can browse Toad's agent store and install OpenHands with a single click. To learn more about OpenHands, visit our [documentation](https://openhands.dev/), try [OpenHands Cloud](https://openhands.dev/), or join our [Slack community](https://openhands.dev/).
