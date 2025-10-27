---
title: "Automating Massive Refactors with Parallel Agents"
excerpt: "Discover how AI-powered coding agents can tackle large-scale refactoring projects in days instead of months, using parallel workflows and the refactor-sdk toolkit."
coverImage: "/assets/blog/20251009-automating-refactors/cover.png"
date: "2025-10-09T12:00:00.000Z"
authors:
  - name: Robert Brennan
    picture: "/assets/blog/authors/robert.jpg"
ogImage:
  url: "/assets/blog/20251009-automating-refactors/cover.png"
---

Today's coding agents are great for small, atomic coding tasks—the sort of things that can be done in a single commit. But that's just a small part of software development: a ton of effort still goes into planning, decomposition, operations, QA, architecture…the idea of an LLM-powered agent *replacing* a software engineer still feels pretty farfetched.

But there are some coding tasks that seem extremely automatable, but remain out of reach for today's agents. Things like rewriting a program from C or Cobol to Java, migrating from VueJS to React, or refactoring a monolith into something more modular.

Fortunately, thanks to both advances in LLMs, and in developer-facing interfaces, we're getting better at tackling these sorts of large-scale tasks. Agents might not be able to one-shot them, but with a human in the loop we can shrink a months-long project to days.

## A Brief History of AI-Driven Development

Only a few years ago n November 2022, ChatGPT 3.5 launched, and much to my surprise it was able to generate meaningfully helpful code snippets. It could regurgitate every famous sorting and graph traversal algorithm in a variety of languages. It could tell me how to use popular libraries in Python and JavaScript. I could even tell it a bit about my Postgres database, and it'd generate a perfect SQL statement to get the data I needed. But the context was limited to my chat window—I had to explicitly tell ChatGPT about my code and what I needed.

The next year, GitHub Copilot went mainstream (though it had already been in GA for a while). Having an LLM right there in neovim felt like magic—Copilot was able to predict what I was going to type before my hands even hit the keyboard. It had at least a small window into my codebase—no more copy/pasting back and forth into the ChatGPT window.

Then, in 2024, Cognition released their demo video of an autonomous coding agent—an AI that didn't just *write* code! It could run the code, Google error messages, add debug statements, and keep iterating until it solved the task at hand. The next day, OpenDevin—now [OpenHands](https://github.com/OpenHands/OpenHands)—was born.

This was a massive leap forward in AI-driven development. Agents were able to take on the entire inner loop of software development, making incremental changes, testing them, and constructing entire PRs on their own. But, of course, the code is rarely perfect—we still need a human in the loop to review and QA the agent's output.

Now in 2025, we're starting to see the next wave. Engineers are setting off fleets of agents to tackle larger tasks than a single agent could take down on its own. But this is even trickier to get right—you need regular oversight from a human in order to keep the agents on track.

![Historical perspective](/assets/blog/20251009-automating-refactors/historical-perspective.png)

## Managing Fleets of Agents

Say you want to port your codebase from an older version of Java to a newer version. This is obviously very automatable—most of the work is just rote copying of logic. There will be some tricky pieces, like updating non-compatible deprecated functions. But 90% of the work is just line-by-line translation.

The first step is to decompose this task. If you just tell an agent, "port this codebase to Java 25", it'll probably spin its wheels for several hours before delivering a woefully incomplete solution.

We need to pare off small tasks that can be one-shotted (or maybe two/three-shotted) by a coding agent. Ideally each agent will contribute a single commit or pull request to the end solution. And ideally each agent's contribution can be easily validated as correct by a human reviewer.

Once each agent is finished, we'll collate the output together, and get our final change merged.

## Git Workflow

I like to start by creating a new branch, like `v1-refactor`. This will be a rolling implementation, gathering more and more logic as we move towards the full solution.

You may want to start by adding some scaffolding into the `v1-refactor` branch—especially any context you want each agent to have. You could put a description of the refactor into `AGENTS.md`. If you're working with OpenHands, you can create a microagent in `.openhands/microagents/refactor.md`.

Once the scaffolding is ready, each agent should start its own branch off of `v1-refactor`, like `v1-refactor/component-a`, `v1-refactor/component-b`, etc.

Once an agent is finished with its work, it should create a PR into the `v1-refactor` branch—not in `main`! This is where you, as a human, can review the work. Make sure CI/CD is passing, and maybe run the code manually to ensure things are working as expected. And of course, look at the code to make sure the agent hasn't taken any shortcuts!

![Git branching strategy for parallel agent workflow](/assets/blog/20251009-automating-refactors/merging.png)

As you merge things into your running branch, agents should pull in the most recent changes. Don't worry about merge conflicts—agents can usually work through those easily.

Finally, once you're satisfied that all the work is done, go ahead and open a PR from `v1-refactor` into the `main` branch!

## Introducing the Refactor SDK

The process above works really well for smaller refactoring tasks. But as the size of your codebase and the complexity of the refactor grows, it can become unwieldy to manage all the moving pieces.
To make managing these large-scale refactoring projects easier, we at OpenHands have also developed the Refactor SDK. This SDK toolkit specifically designed for automating refactoring tasks at scale using AI agents.

The refactor-sdk provides:

- **Task decomposition tools** to break down large refactoring projects into agent-sized chunks
- **Fixing and verifying** tools to specify how the code should be fixed, and how to check that the fix was successful
- **Progress tracking** to monitor the status of each agent's work

![Refactoring process](/assets/blog/20251009-automating-refactors/refactoring-process.png)

The Refactor SDK is still in private beta, but if you are faced with a large refactoring task, please [contact](https://www.all-hands.dev/contact) us and we'd be happy to learn more about your use case.

### Task Decomposition

The hardest part of this process is decomposing the project into individually achievable tasks—things that you can trust a single agent to tackle autonomously.

The naive solution is to move through your codebase directory by directory, file by file, or class by class, porting each one over individually.
This can work well if you've got a task that can be done incrementally. A good example would be adding type annotations to a Python application—you can add types to a single function, and maybe any clients of that function, and the rest of the codebase will still build and run properly.
But for larger tasks, where it's hard to ship changes incrementally, you'll probably want a bit more sophistication.

The Refactor SDK includes **dependency analysis tools**. These tools can automatically identify independent parts of your codebase and make it easier to plan your refactoring strategy.
Specifically, it provides a number of strategies to break down your codebase into smaller, more manageable pieces based on directory boundaries and the various dependencies between them.

### Fixing and Verifying

The Refactor SDK also provides tools to help you specify how the code should be fixed, and how to check that the fix was successful.

For example, if you're porting from Java 8 to Java 25, a fixer would include a prompt that tells the agent how to perform the port.
For a verifier, you would typically use a program to make sure that the code compiles with JDK 25 and has no deprecation warnings.

These fixers and verifiers can be customized for your specific use case, and are defined as either LLM-based prompts or executable scripts.

### Progress Tracking

The Refactor SDK also includes tools to help send off agents and parallel, and allows you track the progress of your refactoring project.
You can see which tasks have been completed, are in progress, and are yet to be started.
This makes it easy to keep track of the overall status of your project, and to identify any bottlenecks or issues that may arise.

## Human in the Loop

Using agents thoughtfully for large-scale tasks can be a huge lift. You can shorten project timelines literally from months to days by getting a fleet of agents working on a properly decomposed task. With a bright engineer at the helm, you can still learn as you go, and redirect agents as necessary.

But don't expect 100% automation! These tasks are often only 80-90% automatable—you'll still need a human who understands the full context of the project. People who have empathy for the end-user, understanding of the business-level context, or intuition for the existing codebase.

![Incremental process](/assets/blog/20251009-automating-refactors/incremental-process.png)

Managing fleets of agents is wildly fun once you've got a good workflow down. I currently max out at around 5 agents, up from 3 a few months ago. With the right tools in place, I'm hoping I'll be able to scale to dozens. Some of those agent are actively working on OpenHands and the refactor-sdk!

## Getting Started

If you're interested in operating fleets of agents for large-scale refactoring projects, here's how to get started:

1. **Try OpenHands**: Check out [OpenHands](https://github.com/OpenHands/OpenHands) to run coding agents locally or in the cloud
2. **Explore the refactor-sdk**: [Contact us](https://www.all-hands.dev/contact) to join the beta of the refactor sdk, a toolkit for managing large-scale refactoring projects with AI agents
3. **Join the community**: Connect with other developers tackling similar challenges in our [Slack community](https://join.slack.com/t/openhands-ai/shared_invite/zt-2tom0er4z-RiNl7RbPZaIW60cMFm1Q1A)

I believe the future of software development isn't about precisely this sort of thing, it's about augmenting engineers with powerful tools that handle the tedious work, freeing them to focus on the creative, strategic aspects of building great software.

Happy refactoring! 🚀
