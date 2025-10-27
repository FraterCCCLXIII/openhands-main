---
title: "Open-source Coding Agents in your GitHub, Fixing your Issues"
excerpt: "We introduce the OpenHands resolver, an open-source coding agent that can automatically fix issues in your GitHub repositories."
coverImage: "/assets/blog/20241010-open-source-coding-agents-in-your-github/fixed-issues.png"
date: "2024-10-10T08:00:00.000Z"
authors:
  - name: Graham Neubig
    picture: "/assets/blog/authors/graham.jpg"
    link: https://www.phontron.com/
ogImage:
  url: "/assets/blog/20241010-open-source-coding-agents-in-your-github/fixed-issues.png"
---

The backlog. It's the long list of issues that you haven't been able to get to (and possibly never will). Every developer knows and fears it.

Today, we're excited to introduce a tool that we've developed that can help automatically bring down your backlog a bit, and also work as a pair programmer to help you fix newly created issues as well. It's called the [OpenHands GitHub Resolver](https://github.com/OpenHands/OpenHands/tree/main/openhands/resolver), it's an open source tool that uses AI to automatically fix github issues and send pull requests.

## How Does It Work?

The OpenHands resolver is based on [OpenHands](https://github.com/OpenHands/openhands), which is a framework for building open-source coding agents. If you're interested in the details about how the agents are implemented, you can read the [docs](https://docs.all-hands.dev/) or our [paper](https://arxiv.org/abs/2407.16741).

Normally you use OpenHands through a UI where you dynamically interact with the agents, but in order to resolve individual issues you need to spin up the interface, copy-paste in the issue description, and wait a few minutes for the agent to propose a fix, which takes a bit of work.

Instead for the OpenHands resolver, you can run it as a GitHub action, and it will automatically fix any issues in your repository that you tag with the `fix-me` label. You can also run the resolver locally, where it can even attempt to solve *all* the issues in your repository with one fell swoop.

## What can the Resolver Do?

One of the most exciting aspects of the OpenHands GitHub resolver is its ability to contribute to its own development. 37% of the recent commits to the resolver's codebase have been written by the AI itself, and we expect this to only grow as the underlying agent becomes more sophisticated. Don't believe us? Check out the [commits page](https://github.com/OpenHands/openhands-resolver/commits/main) to see the contributions made by this AI-powered tool on its own repo, or go to the user page of [OpenHands-agent](https://github.com/OpenHands-agent) to see all the contributions made by the agent across various repositories. You'll find numerous commits where the resolver has fixed bugs, implemented new features, and improved its own functionality.

In general, AI agents do well with tasks that are [reasonably sized and reasonably well defined](https://docs.all-hands.dev/modules/usage/prompting-best-practices), so if you can write your issue descriptions in this way, there is a good chance that it will be able to solve them for you.

Here are a few examples where the resolver fixed them with no further human input:

**Fixing bugs:**

```md
I am attempting to call openhands-resolver.yml from an external repo using the following
code:

name: Resolve Issues with OpenHands Resolver

on:
  issues:
    types: [labeled]

jobs:
  call-openhands-resolver:
    uses: All-Hands-AI/openhands-resolver/.github/workflows/openhands-resolver.yml@main
    if: github.event.label.name == 'fix-me'
    secrets: inherit

However, when I do this, I get the following error: "workflow_call key is not defined in
the referenced workflow"
```

**Adding tests:**

```md
Currently, there are no tests to make sure that argument parsing, etc. are working
properly in `openhands_resolver/send_pull_request.py`.

In order to fix this, we can do the following:
1. Move the entirety of the content after `if __name__ == "__main__":` to a new `main()`
   function.
2. Add tests to `tests/test_send_pull_request.py` that make sure that given a certain
   set of command line arguments, this `main()` function runs correctly
```

**Refactoring:**

```md
Currently, the github resolver workflow in `.github/workflows/openhands-resolver.yml`
pulls `openhands-resolver` from the main branch of the repo. However, we have recently
created a pypi package, so this resolver should transition to pulling from the most
recent pypi package. We should:

1. Make a copy of `.github/workflows/openhands-resolver.yml` to
   `.github/workflows/openhands-resolver-experimental.yml`
2. Modify `.github/workflows/openhands-resolver.yml` to make it pip install from pypi
   `openhands-resolver`, not the main branch.
3. Modify `.github/workflows/openhands-resolver-experimental.yml` so it is triggered
   on the tag `fix-me-experimental` instead of `fix-me`.
```

## How can I Use It?

Are you interested? It's pretty easy to set it up on your own repos, so try it out!

1. Open up [openhands-resolver.yml](https://github.com/OpenHands/openhands-resolver/blob/main/examples/openhands-resolver.yml) and copy it into the `.github/workflows` folder in your repository.
2. Create a personal access token for github and an LLM API key and set them as secrets in your repository. (more details [here](https://github.com/OpenHands/openhands-resolver?tab=readme-ov-file#using-the-github-actions-workflow))
3. Run the resolver on an issue by adding the `fix-me` label to the issue. The resolver will immediately start working, and in a few minutes you'll either see a pull request, or a message that the resolver wasn't able to fix the issue (and a branch with its intermediate progress).

## Build with AI and Build with Us

We believe that this could be a pretty useful tool for developers, and it could be even better with your help and involvement!

We invite you to:

1. Try out the [OpenHands resolver](https://github.com/OpenHands/openhands-resolver) on your own repositories.
2. Contribute to its development by submitting pull requests, reporting bugs, or discussing on our [slack](https://join.slack.com/t/openhands-ai/shared_invite/zt-34zm4j0gj-Qz5kRHoca8DFCbqXPS~f_A).
3. Star the repository and spread the word to fellow developers.

Together, we can build a more efficient, collaborative, and innovative future for open-source development.
