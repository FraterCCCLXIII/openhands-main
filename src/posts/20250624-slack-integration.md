---
title: "OpenHands Meets Slack: AI-Powered Development in Your Workspace"
excerpt: "Bring the power of OpenHands AI development agents directly into your Slack workspace. Start conversations, get code assistance, and collaborate with AI seamlessly within your team's communication hub."
coverImage: "/assets/blog/20250624-slack-integration/cover.png"
date: "2025-06-24T12:00:00.000Z"
authors:
  - name: Rohit Malhotra
    picture: "/assets/blog/authors/rohit.png"
  - name: Tim O'Farrell
    picture: "/assets/blog/authors/tim.png"
ogImage:
  url: "/assets/blog/20250624-slack-integration/cover.png"
---

As AI agents like [OpenHands](https://github.com/OpenHands/OpenHands) incorporate more and more into software development, we expect that developers will want to interact with AI in the same places where they interact with other co-workers.
And today, much of that interaction happens in Slack.
Today we're excited to announce the beta release of OpenHands Slack integration, bringing AI-powered software development directly into your Slack workspace.

<iframe width="560" height="315" src="https://www.youtube.com/embed/hbloGmfZsJ4" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>

## How It Works

**Start conversations instantly**: Simply mention `@openhands` in any Slack channel to activate your AI development assistant. Specify which repository you want to work with using natural language -- OpenHands supports both simple repo names ("my-repo") and full GitHub paths ("All-Hands-AI/OpenHands").

![Starting a conversation with OpenHands](/assets/blog/20250624-slack-integration/slack-create-convo.png)

**Continue in organized threads**: Follow up by mentioning `@openhands` in thread replies, keeping discussions focused while allowing your entire team to follow the AI's assistance and contribute their expertise.

![Following up in a thread](/assets/blog/20250624-slack-integration/slack-results-and-follow-up.png)

**Smart repository matching**: When your repo name matches multiple repositories, OpenHands prompts you to select from a filtered list, ensuring you're always working with the right codebase.

![Repository selection](/assets/blog/20250624-slack-integration/slack-pro-tip.png)

## Getting Started

Setting up OpenHands in your Slack workspace requires two simple steps:

**For Slack Admins**: [Install the OpenHands Slack App](https://slack.com/oauth/v2/authorize?client_id=7477886716822.8729519890534&scope=app_mentions:read,chat:write,users:read,channels:history,groups:history,mpim:history,im:history&user_scope=channels:history,groups:history,im:history,mpim:history) to your workspace and review the permissions.

**For Team Members**: Sign in to the [OpenHands Cloud](https://app.all-hands.dev) then visit your [OpenHands Cloud integrations settings](https://app.all-hands.dev/settings/integrations), click "Install Slack App," and authorize the integration.

*Note: Depending on your workspace settings, you may need admin approval for the authorization step.*


## Some Starting Prompts

Once you have it installed, here are some great ways to get started:

**Creating Issues**: When you are in a discussion about a new feature, you can mention `@openhands create an issue for this using the Github API` and it will create an issue in the repository you are working in.

**Asking Questions**: If you're uncertain about how a particular feature works, you can mention `@openhands how is this functionality implemented?` and it will provide a detailed explanation of the code.

**Adding Features**: If you're discussing a new feature, you can mention `@openhands add this feature` and it will create a PR to add the feature.

One other thing that we've found convenient was to create a channel `#openhands-slack` and have it be a place where you can send random queries to avoid cluttering up other channels.

## We Welcome Feedback

This is a new release, so we're eager to hear your feedback.
Share your experience and suggestions on [Slack](https://join.slack.com/t/openhands-ai/shared_invite/zt-2ngejmfw6-9gW4APWOC9XUp1n~SiQ6iw) (of course!), [Discord](https://discord.gg/ESHStjSjD4), or [GitHub Issues](https://github.com/OpenHands/OpenHands/issues).
