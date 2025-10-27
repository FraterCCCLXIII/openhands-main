---
title: "The OpenHands CLI: AI-Powered Development in Your Terminal"
excerpt: "Experience the full power of OpenHands development agents directly from your command line. No Docker required, just install and start coding with AI assistance in seconds."
coverImage: "/assets/blog/20250617-introducing-openhands-cli/cover.png"
date: "2025-06-17T14:00:00.000Z"
authors:
  - name: Graham Neubig
    picture: "/assets/blog/authors/graham.png"
ogImage:
  url: "/assets/blog/20250617-introducing-openhands-cli/cover.png"
---

Today we're announcing the OpenHands CLI, a new way to use software development agents directly from your terminal.

Getting started is easy (with Python 3.12 or 3.13):

```bash
pip install openhands-ai
openhands
```

Or if you prefer not to manage your own Python environment, you can use [uvx](https://docs.astral.sh/uv/getting-started/installation/):

```bash
uvx --python 3.12 --from openhands-ai openhands
```

That's it, no need for Docker, no need for a web interface, and you can immediately access OpenHands' top-performing coding agents.
And unlike other options, it's fully open source, with no model lock-in.

No need to wait for us, go ahead and get started! (or read on for more details)

<iframe width="560" height="315" src="https://www.youtube.com/embed/PfvIx4y8h7w" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

## Why a CLI?

OpenHands has been around for a while, and there are several convenient ways to use it:

- **GUI**: This gives good visibility into agents' work, and is easy to use through the [OpenHands Cloud](https://app.all-hands.dev) and [local web interface](https://docs.all-hands.dev/usage/how-to/gui-mode).
- **GitHub/GitLab Resolver**: The [Cloud GitHub Resolver](https://docs.all-hands.dev/usage/cloud/github-installation) and [GitLab Integration](https://docs.all-hands.dev/usage/cloud/gitlab-installation) allow you to call OpenHands by adding a `@openhands` comment to your code.
- **API**: The [OpenHands Cloud API](https://docs.all-hands.dev/modules/usage/cloud/cloud-api) allows for programmatic access.

But we've also heard from developers who prefer to work directly in their terminal, or found the installation process for the GUI too cumbersome.
The CLI delivers:

- **Easy install**: In contrast to the GUI, installation is easy and no Docker is required -- commands are run directly in your dev environment.
- **Native terminal experience**: Work where you're already comfortable, including on remote servers or in your IDE.
- **Convenient commands and features**: Use slash commands to get started with common tasks, and increase safety with confirmation mode.
- **Full performance**: Same strong performance as agents in the GUI.

## What can you do with it?

If you want some examples of things to get started with, you can ask it to:

- **Add a new feature**: `add a user data validation function to user_data.py`
- **Fix a bug**: `do RCA on the bug causing new users to be unable to login`
- **Add tests**: `increase test coverage of the mapping service`
- **Refactor code**: `refactor the process_user_data function to be more readable`
- **Document code**: `document the database schema`
- **Explain code**: `explain to me how the location service works`

## Features

The CLI includes several convenient features.

**Slash commands**:
The CLI has a number of commands that make it easy to navigate around.
For instancce, one of our favorites: the `/init` command to initialize repository exploration and create project documentation to help agents understand your project.

**Confirmation mode**: For security, the CLI includes a confirmation mode that prompts before executing potentially sensitive operations.

**Model agnostic**:
OpenHands is model agnostic, so you can use it with any LLM provider, especially those on our [recommended models list](https://docs.all-hands.dev/usage/llms/llms#model-recommendations).
This includes both cloud-based models like Claude (4 sonnet provides the best performance at the moment) and local models like [Devstral](https://www.all-hands.dev/blog/devstral-a-new-state-of-the-art-open-model-for-coding-agents).

**Open source**:
The CLI is fully open source, included in the MIT-licensed [OpenHands repository](https://github.com/OpenHands/OpenHands).
It's available for you to build with or build on.

**Top-performing agents**:
OpenHands is one of the top-performing agents in the world (e.g. on [SWE-Bench Verified](https://swebench.com)), and the CLI uses the same agents that are supported via any of the other modalities.

## Join the community

If that entices you, just `pip install openhands-ai` and `openhands` to get started!
As always, we love to have people join our community to give feedback or send in pull requests.
Join the community: on [Slack](https://join.slack.com/t/openhands-ai/shared_invite/zt-2ngejmfw6-9gW4APWOC9XUp1n~SiQ6iw), [Discord](https://discord.gg/ESHStjSjD4), or [GitHub Issues](https://github.com/OpenHands/OpenHands/issues)
