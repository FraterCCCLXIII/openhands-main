---
title: "Levels of Autonomy in AI-enhanced Software Engineering"
excerpt: "What are some different levels of autonomy in software development agents, and how do they relate to existing tools? Read on to learn more!"
coverImage: "/assets/blog/20240801-levels-of-autonomy/levels-of-autonomy.png"
date: "2024-08-01T08:00:00.000Z"
author:
  name: Graham Neubig
  picture: "/assets/blog/authors/graham.jpg"
ogImage:
  url: "/assets/blog/20240801-levels-of-autonomy/levels-of-autonomy.png"
---

AI holds great promise for software development, and already many or even most developers are already using AI in their everyday development cycles. These include code-completion tools such as [Github CoPilot](https://github.com/features/copilot) or [Cursor](https://www.cursor.com/), frameworks designed to solve end-to-end varieties of software development tasks such as [DiffBlue](https://www.diffblue.com/) for unit test generation or [TransCoder](https://github.com/facebookresearch/TransCoder) for code porting, as well as general-purpose software development agents such as [Devin](https://www.cognition.ai/blog/introducing-devin) or [OpenDevin](https://github.com/OpenDevin/OpenDevin/). What are some different levels of autonomy in software development agents, and how do they relate to existing tools? Read on to learn more!

![Levels of Autonomy in AI-enhanced Software Engineering](/assets/blog/20240801-levels-of-autonomy/levels-of-autonomy.png)

## Some Inspiration in Self-Driving

One field where we have thought about autonomy for a long time is self-driving cars. Self-driving cars are categorized into six levels of autonomy, as [defined by](https://www.sae.org/standards/content/j3016_202104/) the Society of Automotive Engineers (SAE). These levels range from no automation at all (Level 0) to full automation (Level 5).

- **Level 0 (No Automation)**: The driver is in complete control of the vehicle at all times without any assistance from the car.

- **Level 1 (Driver Assistance)**: The vehicle can assist with either steering or acceleration/deceleration using features like adaptive cruise control or lane-keeping assist, but not both simultaneously.

- **Level 2 (Partial Automation)**: The car can control both steering and acceleration/deceleration under certain conditions, but the driver must remain engaged and monitor the environment constantly.

- **Level 3 (Conditional Automation)**: The vehicle can handle all aspects of driving in specific scenarios, such as highway driving, but the driver must be ready to take over when the system requests.

- **Level 4 (High Automation)**: The vehicle can perform all driving tasks and does not require human intervention in most conditions. However, it operates within a restricted area or specific use cases, such as urban ridesharing services or automated trucking routes.

- **Level 5 (Full Automation)**: The vehicle can operate independently in all environments and conditions without any human input.

## Levels of Autonomy in Software Engineering

So what does this look like from the point of view of software development? We tried to develop a similar categorization.

- **Level 0 (No Automation)**: The developer is in complete control of the development process at all times without any assistance from AI-related tools.

- **Level 1 (Code Completion)**: AI can assist the developer's development process by completing the next code that the developer would write.

- **Level 2 (Partial Automation)**: In addition to completing the developer's next code, the AI also performs edits on existing code using AI-based functionality.

- **Level 3 (Conditional Automation)**: The AI system can handle all aspects of software engineering in specific scenarios, such as writing tests, creating documentation, or porting code from one language to another.

- **Level 4 (High Automation)**: The AI system can perform all software development tasks. However, due to imperfections in the outputs, close human operator supervision of the final product and careful access control are crucial.

- **Level 5 (Full Automation)**: The AI software developer can perform tasks largely independently in all environments and conditions without any human input.

## Existing Level-1 Code Completion Systems

Code completion has been around for a long time, even before the advent of AI-driven features. However, with the development of strong large language models, these systems have progressed rapidly. Early entrants to the space included [Kite](https://github.com/kiteco/vscode-plugin) and [TabNine](https://www.tabnine.com/ai-coding-assistant/).

Recently, [Github Copilot](https://github.com/features/copilot) and [Cursor](https://www.cursor.com/) have been popular methods for performing this sort of code completion. The below video shows an example of Github completing some code.

![An example of Github Copilot](/assets/blog/20240801-levels-of-autonomy/copilot.gif)

This sort of code completion can be quite beneficial in improving developers' actual and perceived productivity. For more details on this you can see this [interesting research study](https://cacm.acm.org/research/measuring-github-copilots-impact-on-productivity/) by folks at GitHub.

One thing to note is that this always completes the programmer's next action at the exact cursor position that the user indicates. This is good because it gives the programmer a high level of control over the next action, but completing existing code is just a small part of what programmers do. This leads us to the next level of autonomy.

## Existing Level-2 Partial Autonomy Systems

The next level up the autonomy ladder is systems that can work together with programmers to handle more complex editing tasks. There are a number of examples of this, including closed-source solutions such as Github [Copilot Chat](https://docs.github.com/en/copilot/using-github-copilot/asking-github-copilot-questions-in-your-ide), Cursor's [speculative editing](https://www.cursor.com/blog/instant-apply) functionality, and [Codium](https://www.codium.ai/), as well as some open-source tools such as [Agentless](https://github.com/OpenAutoCoder/Agentless) or [Aider](https://aider.chat/). The below video shows an example from Github Copilot chat.

![An example of Github Copilot Chat](/assets/blog/20240801-levels-of-autonomy/copilot-chat.gif)

In this video, you can see that the author presses a keyboard shortcut, types an explanation of what they would like to have done, and the assistant edits the entire document. This allows for more flexible editing, such as introducing libraries at the top of the file, refactoring, etc. But at the same time, it is significantly slower than simple completion and increases the possibility of error.

It also requires full-time human attention to the editing process, a shortcoming that brings us to the next level of autonomy.

## Existing Level-3 Conditional Autonomy Systems

Conditionally autonomous systems are ones that can perform full software engineering tasks with little to no human supervision. Some existing examples include:

- **Unit Test Generation:** Generates unit tests for existing code. Examples include commercial products such as [DiffBlue Cover](https://www.diffblue.com/) or [Sapient](https://www.sapient.ai/), as well as open-source such as [TestPilot](https://github.com/githubnext/testpilot).

- **Documentation Writing:** Writes documentation for files that are not yet documented. Examples include commercial products such as [DocuWriter.ai](http://docuwriter.ai) or [Swimm](https://swimm.io/), and open-source projects include [autodoc](https://github.com/context-labs/autodoc).

- **Code Review:** Performs pull request reviews to check committed code. A commercial example includes [CodeRabbit](https://coderabbit.ai/), and an open-source option includes [pr-agent](https://github.com/Codium-ai/pr-agent).

- **Commit Message Generation:** Attempts to automatically write commit messages summarizing pull requests. Examples include the [ClipMove PR summarizer](https://www.clipmove.com/tools/pull-request-summarizer) or [GitHub's PR summarizer](https://docs.github.com/en/enterprise-cloud@latest/copilot/using-github-copilot/creating-a-pull-request-summary-with-github-copilot), and there is an open-source [gpt-commit-summarizer](https://github.com/KanHarI/gpt-commit-summarizer).

- **Code Migration:** Migrates codebases from one programming language or library to another. An open-source example includes [gpt-migrate](https://github.com/joshpxyne/gpt-migrate).

These systems are quite helpful in solving individual problems related to software development, and due to their specialized nature, they can hone in on solving individual problems very well. The downside to them is that there are a wide variety of diverse tasks in software development, and incorporating and managing individual tools for each of these tasks can be a somewhat onerous process. This brings us to the next level of software development.

## Existing Level-4 High Autonomy Systems

There are also systems that aim to achieve very high levels of autonomy, being able to solve a wide variety of software development tasks. One important thing to think about with respect to these systems is that software development is not just code writing or editing! It also involves understanding requirements, examining documentation to understand how to implement things, setting up environments, writing code, testing out the developed software, sending pull requests, responding to feedback, etc. etc. Because of this, a highly autonomous agent must be very versatile.

There are a number of products or open-source projects that attempt to achieve this level of autonomy, with Cognition's [Devin](https://www.cognition.ai/blog/introducing-devin) being a representative closed-source offering, and All Hands AI's [OpenDevin](https://github.com/OpenDevin/OpenDevin/) being an open-source example. Below is an example of OpenDevin solving a software engineering task end-to-end, including:

1. setting up the environment by cloning the github repo
2. fixing the specified issue
3. testing whether the code runs properly
4. sending a pull request for review

![An example of OpenDevin's end-to-end Software Engineering](/assets/blog/20240801-levels-of-autonomy/opendevin.gif)

These methods are promising in that they can potentially act as another player in the programmer's team, being dispatched to take care of issues that the programmer needs to tackle but doesn't have time or interest to do themselves.

On the other hand, because the level of tasks that agents are performing rises, it is important to appropriately sandbox them so they cannot inadvertently cause damage to the user's system, and also carefully monitor their work for mistakes. For instance, in OpenDevin, all code is run in docker containers separated from the user's system, and the software development agent is only given access to files and credentials provided in this container. And it is still important to check AI agents' work through careful code review, as is the standard for collaborations between human programmers.

## Existing Level-5 Full Autonomy Systems

Finally, we get to the last level of autonomy, fully autonomous software development. At the moment, there are no systems (to our knowledge) that have achieved, or even aspire to achieve this level of autonomy in software development. In general, complex software systems require rigorous testing, validation, and many eyes on the code to ensure that it is safe and implements what it set out to implement.

As code generation agents get better, we may move towards solving more complex tasks. For example, there may come a day when we could safely ask an AI system to "go launch a reddit clone" and it buys a domain name, builds the infra, writes the code, launches it, monitors it, fixes it when it crashes, and responds to user feedback. But before automatic systems can be given this level of authority and power, it is necessary to both improve their overall accuracy, and ensure that we have safety guardrails in place that can ensure the safe operation of AI agents given this level of access.

## Conclusion

In this article, we explained several levels of autonomy in software development, with analogies back to levels of autonomy in self-driving. We, All Hands AI, are currently developing OpenDevin, an open-source system for software development at the highest current level of autonomy, with the goal of making software development more efficient and enjoyable for everyone. If you'd be interested in joining the journey, please [try OpenDevin out](https://github.com/OpenDevin/OpenDevin/?tab=readme-ov-file#-getting-started), [join the open source community](https://github.com/OpenDevin/OpenDevin/?tab=readme-ov-file#-how-to-contribute), or [apply to join us](https://allhandsai.applytojob.com/apply/) at All Hands AI!
