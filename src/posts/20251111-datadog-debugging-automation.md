---
title: "Debugging Production Issues with AI Agents: Automating Datadog Error Analysis"
excerpt: "This video demonstrates how to transform production errors into actionable insights automatically. Learn how the OpenHands SDK enables AI agents to debug Datadog errors, analyze code across multiple repositories, and post detailed findings—all through a simple GitHub Actions workflow."
coverImage: "/assets/blog/20251111-datadog-debugging-automation/cover.png"
date: "2025-11-11T14:00:00.000Z"
authors:
  - name: Graham Neubig
    picture: "/assets/blog/authors/graham.png"
ogImage:
  url: "/assets/blog/20251111-datadog-debugging-automation/cover.png"
---

Running a production service is **hard**.
Errors and bugs crop up due to product updates, infrastructure changes, or unexpected user behavior.
When these issues arise, it's critical to identify and fix them quickly to minimize downtime and maintain user trust, but this is challenging especially at scale.

What if AI agents could handle the initial investigation automatically?
This allows engineers to start out with a detailed report of the issue, including root cause analysis and specific recommendations for fixes, dramatically speeding up the debugging process.

In this post, we'll demonstrate how you can greatly speed up the debugging process by automating error analysis using AI agents built with the [OpenHands Software Agent SDK](https://github.com/OpenHands/software-agent-sdk).
The code for this example is available as a ready-to-use [GitHub Actions workflow](https://github.com/OpenHands/software-agent-sdk/tree/main/examples/03_github_workflows/04_datadog_debugging) that integrates with DataDog, but we'll show an example of it in action before diving into the code.

## Error Tracking with Datadog

[Datadog](https://www.datadoghq.com/) is a popular monitoring and analytics platform that provides comprehensive error tracking capabilities.
It aggregates logs, metrics, and traces from your applications, making it easier to identify and investigate issues in production.

One feature that we particularly like is [Datadog's Error Tracking](https://www.datadoghq.com/error-tracking/), which groups similar errors together and provides detailed insights into their occurrences, stack traces, and affected services.
You can see a screenshot example of a single datadog error below:

<img src="/assets/blog/20251111-datadog-debugging-automation/datadog_error_tracking.png" alt="Datadog Error Tracking Screenshot" style="display:block; margin:0 auto; max-width:80%; height:auto;"/>

This is an example of an error where we can see on the surface that it's an issue decoding JSON somewhere, but we're not exactly sure where.
Typically an SRE who is investigating this error would need to dig into the logs, search through the codebase, and try to figure out where this error is originating from.

## Kicking Off Automated Debugging

Next, we can switch over to our GitHub repository where we have set up a GitHub Actions workflow that automates the debugging process using an OpenHands agent.
Our GitHub Actions workflow can be triggered in two ways:

1. **Search Query**: You can provide a search query (e.g., "JSONDecodeError") to find all recent errors matching that pattern. This is useful for investigating categories of errors.
2. **Specific Error ID**: You can provide a specific Datadog error tracking ID to deep-dive into a known issue.

In this example, we can try the second one by clicking on the "Actions" button in DataDog's error tracking UI and copy the error ID to use as input to the workflow:

<img src="/assets/blog/20251111-datadog-debugging-automation/datadog_error_id.png" alt="Datadog Error ID" style="display:block; margin:0 auto; max-width:50%; height:auto;"/>

And then we travel to the GitHub Actions tab in our repository and manually trigger the workflow by providing the error ID as input:

<img src="/assets/blog/20251111-datadog-debugging-automation/github_actions_trigger.png" alt="GitHub Actions Trigger Workflow Screenshot" style="display:block; margin:0 auto; max-width:50%; height:auto;"/>

## Checking The Results

When the workflow runs, it automatically performs the following steps:

1. Get detailed info from the DataDog API
2. Create or find an existing GitHub issue to track the error
3. Clone all relevant repositories to get full code context
4. Run an OpenHands agent to analyze the error and investigate the code
5. Post the findings as a comment on the GitHub issue

As the workflow progresses, we can see comments on the issue being added by the agent with its findings.
In this particular case of the JSONDecodeError, the agent was able to identify the exact file and line number where the error originated, determine the root cause, and provide specific recommendations for fixing it.

<img src="/assets/blog/20251111-datadog-debugging-automation/github_issue_comment.png" alt="GitHub Issue Comment Screenshot" style="display:block; margin:0 auto; max-width:80%; height:auto;"/>

Noteably, we don't actually ask the agent to send a pull request to the codebase with the fix; we'd like a human engineer to review the findings first.
But if we did want it to create a fix, we can follow up on GitHub using the [OpenHands GitHub integration](https://docs.openhands.dev/openhands/usage/cloud/github-installation#github-integration) and say `@openhands go ahead and create a pull request to fix this issue based on your analysis`, and it will do so automatically.

## The Nitty-gritty Details

The complete Datadog debugging workflow is available in the OpenHands SDK repository as a ready-to-use example. You can find the [full implementation on GitHub](https://github.com/OpenHands/software-agent-sdk/tree/main/examples/03_github_workflows/04_datadog_debugging), including the workflow YAML file, Python script, and prompt template.

To set it up in your own repository:

1. Copy the workflow file to `.github/workflows/` in your repository
2. Configure the required secrets (Datadog API keys, LLM API key)
3. Customize the default queries and repository lists for your needs
4. Run the workflow manually or set up scheduled runs

The workflow is designed to work out of the box but is fully customizable. You can modify the prompts to focus on specific types of analysis, adjust the agent's tools to fit your workflow, or extend it to integrate with other services beyond GitHub and Datadog.
And if you'd like more details about the SDK and additional examples, visit the [OpenHands SDK repository](https://github.com/OpenHands/software-agent-sdk) and check out our [docs](https://docs.openhands.dev/sdk) to learn more.

We're excited to see what you build, and we welcome you to share your experiences in our community on [Slack](https://dub.sh/openhands).
