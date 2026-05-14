---
title: 'The OpenHands CLI: AI-Powered Development in Your Terminal'
slug: the-openhands-cli-ai-powered-development-in-your-terminal
excerpt: 'Experience the full power of OpenHands development agents directly from your command line. No Docker required, just install and start coding with AI assistance in seconds.'
coverImage: /assets/webflow/blog/agent-control-plane/cover.png
coverAlt: Image from blog post
date: '2025-06-17T12:00:00.000Z'
authors:
  - name: Graham Neubig
ogImage:
  url: /assets/webflow/blog/agent-control-plane/cover.png
seoTitleDate: 'Nov 12, 2025'
---
Today we're announcing the OpenHands CLI, a new way to use software development agents directly from your terminal.

Getting started is easy (with Python 3.12 or 3.13):

```javascript
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

<iframe src="https://www.youtube.com/embed/PfvIx4y8h7w" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" title="YouTube video player" width="560" height="315" frameborder="0" allowfullscreen=""></iframe>

## Why a CLI?

OpenHands has been around for a while, and there are several convenient ways to use it:

But we've also heard from developers who prefer to work directly in their terminal, or found the installation process for the GUI too cumbersome.
The CLI delivers:

## What can you do with it?

If you want some examples of things to get started with, you can ask it to:

## Features

The CLI includes several convenient features.

:
The CLI has a number of commands that make it easy to navigate around.
For instancce, one of our favorites: the

**Confirmation mode**: For security, the CLI includes a confirmation mode that prompts before executing potentially sensitive operations.

:
OpenHands is model agnostic, so you can use it with any LLM provider, especially those on our
.
This includes both cloud-based models like Claude (4 sonnet provides the best performance at the moment) and local models like

:
The CLI is fully open source, included in the MIT-licensed
.
It's available for you to build with or build on.

:
OpenHands is one of the top-performing agents in the world (e.g. on

## Join the community

to get started!
As always, we love to have people join our community to give feedback or send in pull requests.
Join the community: on
