---
title: "OpenHands Cloud Self-hosted: Secure, Convenient Deployment of AI Software Development Agents"
excerpt: "OpenHands Cloud is now available as a self-hosted solution, providing secure, convenient deployment of AI software development agents. It features a 30-day free trial and is available as a source-available Helm Chart."
coverImage: "/assets/blog/20250618-openhands-self-hosted/cover.png"
date: "2025-06-18T15:00:00.000Z"
authors:
  - name: Robert Brennan
    picture: "/assets/blog/authors/robert.jpg"
ogImage:
  url: "/assets/blog/20250618-openhands-self-hosted/cover.png"
---

[OpenHands](https://github.com/OpenHands/OpenHands) is an MIT-licensed open source platform for AI agents for software development.
On top of OpenHands, we have built [OpenHands Cloud](https://app.all-hands.dev/), a centralized, multi-tenant OpenHands server that can scale to thousands of coding agents and includes convenient features like integrations into github and slack, API access, and more.
Today, we're announcing **OpenHands Cloud Self-hosted**, a new way to deploy OpenHands Cloud in your own isolated VPC for security-sensitive enterprises.

## Comparing the Use Pathways for OpenHands

To go a little bit deeper into the different ways to use OpenHands and know which is best for you,
let's make a comparison.

|                          | Open Source   | Cloud | Cloud Self-hosted |
|--------------------------|---------------|-------|-------------------|
| Suitable for Individuals | ✅            | ✅     | ❌                |
| Suitable for Teams       | ❌            | ✅     | ✅                |
| State-of-the-art Agents  | ✅            | ✅     | ✅                |
| [GUI Access](https://docs.all-hands.dev/usage/how-to/gui-mode)               | ✅            | ✅     | ✅                |
| [CLI Access](https://docs.all-hands.dev/usage/how-to/cli-mode)               | ✅            | ❌     | ❌                |
| Seamless [GitHub](https://docs.all-hands.dev/usage/cloud/github-installation)/[Gitlab](https://docs.all-hands.dev/usage/cloud/gitlab-installation) Integration | ❌  | ✅     | ✅                |
| [Slack Integration](https://docs.all-hands.dev/usage/cloud/slack-installation)        | ❌            | ✅     | ✅                |
| [API Access](https://docs.all-hands.dev/usage/cloud/cloud-api)               | ❌            | ✅     | ✅                |
| Parallel Agent Serving   | ❌            | ✅     | ✅                |
| Privacy/Security         | See API provider | [Privacy Policy](https://all-hands.dev/privacy) | Data stays on your VPC |
| [Pricing](https://all-hands.dev/pricing) | Bring-your-own Key | [$20 free trial + pay-as-you-go](https://app.all-hands.dev/pricing) | [30-day Trial + contact us](https://docs.google.com/forms/d/e/1FAIpQLScygK76gSmjRfqkC1XzogU89X4vNVaiITdDVkmdEP_Qh2b4gg/viewform) |

In short, all versions of OpenHands have state-of-the-art accuracy, the OpenHands open source is good for individual developers working independently, while the cloud versions are more suited for teams.
The cloud versions have more integrations and API access, and can serve up to thousands of agents in parallel, with each working in the cloud.
The self-hosted cloud allows for cloud delivery and the security of keeping your data on your VPC.

## Delivery of OpenHands Cloud: Source-available Helm Chart

While the core OpenHands project remains MIT-licensed for individual developers, OpenHands Cloud has mainly been available through our [online app](https://app.all-hands.dev).

For the self-hosted cloud, we are [releasing a source-available Helm Chart](https://github.com/OpenHands/OpenHands-cloud) for installing OpenHands Cloud in your own Kubernetes cluster, including a 30-day free trial.
This bridges the gap between our open-source individual developer experience and our commercial team-focused platform, helping organizations get started with OpenHands more easily.
The license of the helm chart is the [Polyform Free Trial license](https://polyformproject.org/licenses/). This allows anyone to use the code for 30 days per year.
If you try it out and like it, [contact us](https://docs.google.com/forms/d/e/1FAIpQLScygK76gSmjRfqkC1XzogU89X4vNVaiITdDVkmdEP_Qh2b4gg/viewform) to get a license for your organization.

Why are we taking this method of making our proprietary code public? It's for several reasons:

1. Most importantly, we realize that developers and platform engineers like to read and try things. They don't want to talk with a sales team to get started (we're the same!).
2. If there are any issues that the cloud subscribers encounter while using the chart, they can modify and fix it to contribute back.
3. We believe in our user community, and largely trust them to do the right thing -- we're hopeful that we will not need to do any enforcement against people who violate the terms.

## How do we get started?

If you want to try out OpenHands Cloud in your own Kubernetes cluster, you can [follow the instructions here](https://github.com/OpenHands/OpenHands-Cloud/tree/main/charts/openhands).
It's still a work in progress, and there are a few gotchas listed in that README.
But we'd love to get your feedback and iterate towards a simpler install!

And feel free to [reach out to us](https://docs.google.com/forms/d/e/1FAIpQLScygK76gSmjRfqkC1XzogU89X4vNVaiITdDVkmdEP_Qh2b4gg/viewform) for more help or details.
