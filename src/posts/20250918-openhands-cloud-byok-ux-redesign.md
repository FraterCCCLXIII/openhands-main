---
title: "All New OpenHands Cloud: More Model Choice, Lower Prices, Slicker Design"
excerpt: "We're introducing a new subscription model with bring-your-own-key support, expanded model choices at API pricing, and a completely redesigned GUI experience that makes OpenHands more accessible and cost-effective than ever."
coverImage: "/assets/blog/20250918-openhands-cloud-byok-ux-redesign/image4.png"
date: "2025-09-18T12:00:00.000Z"
authors:
  - name: Graham Neubig
    picture: "/assets/blog/authors/graham.jpg"
  - name: Joe Pelletier
    picture: "/assets/blog/authors/joe.png"
ogImage:
  url: "/assets/blog/20250918-openhands-cloud-byok-ux-redesign/image4.png"
---

At OpenHands, our number one mission is to build a highly autonomous and accessible coding agent that can be used for any software development task, any time. One of our flagship ways to provide this is through the [OpenHands Cloud](https://app.all-hands.dev/) where users can interact with agents through a [GUI](https://docs.all-hands.dev/usage/cloud/cloud-ui), [API](https://docs.all-hands.dev/usage/cloud/cloud-api), or integrations into [Slack](https://docs.all-hands.dev/usage/cloud/slack-installation), [GitHub](https://docs.all-hands.dev/usage/cloud/github-installation), [GitLab](https://docs.all-hands.dev/usage/cloud/gitlab-installation), and [BitBucket](https://docs.all-hands.dev/usage/cloud/bitbucket-installation).

We are constantly listening to feedback from the cloud users, and this month worked hard to fix two major requests that we got from users:

1. **Cost of the Agents**
2. **Usability of the GUI Experience**

We thought hard about how to deliver these, and here's our best try for both.

## Model Choice + BYOK on the Cloud

Up until this point, the cloud version of OpenHands was mainly powered by Claude Sonnet, and in order to cover the cost of developing and serving the OpenHands Cloud, we were charging 2x the API costs of Claude itself. This had two issues:

- **Cost:** While Claude Sonnet is a great model, it is also a relatively expensive one, and that meant at 2x cost, it was even more expensive! This was a major barrier for people using the cloud.
- **Lack of Choice:** There are now many models out there that work well with OpenHands, and some are better in some cases than others. For instance, we have gotten great results with GPT-5 (but it can be a little slow), and Qwen-3-Coder is also a formidable open model that can be served at a fraction of the cost of the others.

In order to make this possible, we are introducing a new subscription model, where you can subscribe for **$20/month** which unlocks a number of nice features:

- **Model Choice:** You can choose from the [list of OpenHands provider models](https://docs.all-hands.dev/usage/llms/openhands-llms) with *no markup*, which means you'll pay the same price as hitting an API directly.
- **Bring-your-own-key:** If you'd prefer to use your own LLM key, you can do that too!

We hope this will greatly improve the economics of using OpenHands for users, and also allow you to choose between your favorite models without lock-in to a single provider.

## OpenHands GUI Redesign

One other major change that we made is a complete GUI refresh designed to make the OpenHands conversation experience more smooth, reliable, and fun!

A number of quality of life improvements have been made, such as:

![OpenHands Cloud New Interface](/assets/blog/20250918-openhands-cloud-byok-ux-redesign/image2.gif)

**A cleaner start page:** Key actions like starting new conversations, opening repositories, or revisiting recent conversations are better organized and accessible.

**Full screen conversations:** Easily hide the Action Panel, enabling a full screen conversation experience.

![Full Screen Experience](/assets/blog/20250918-openhands-cloud-byok-ux-redesign/image3.png)

**Expandable input area:** Easily drag and expand the input area, giving you a bigger canvas to write prompts.

**Status area:** Easily see runtime status (on the left) and agent status (on the right).

**Git controls:** Easily push, pull, or create PRs. Clicking these buttons will trigger a prompt for OpenHands to perform the git action.

![Enhanced Git Controls](/assets/blog/20250918-openhands-cloud-byok-ux-redesign/image4.png)

These are just some of the changes you'll see in the latest release from the OpenHands V1 initiative.

## What This Means for You

With these updates, OpenHands Cloud becomes significantly more accessible and cost-effective:

- **Lower costs:** Pay API pricing directly instead of marked-up rates
- **More flexibility:** Choose the right model for your specific use case
- **Better experience:** Enjoy a streamlined, intuitive interface designed for productivity
- **Greater control:** Use your own API keys when you prefer

Whether you're working on a quick bug fix, implementing a complex feature, or maintaining an open-source project, these improvements make OpenHands Cloud a more powerful and economical choice for AI-assisted development.

## Get Started Today

Ready to experience the new OpenHands Cloud? [Sign up today](https://app.all-hands.dev/) and take advantage of our new subscription model with expanded model choices and the redesigned interface.

Please let us know what you think of these improvements by joining the [Slack](https://dub.sh/openhands) or [emailing us](mailto:contact@all-hands.dev) directly!
