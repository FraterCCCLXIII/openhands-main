---
title: "Introducing the OpenHands Software Agent SDK"
excerpt: "Open-source, simple to use, powerful, and highly customizable. The OpenHands software agent SDK makes it possible to build plug-and-play coding agents for any workflow."
coverImage: "/assets/blog/20251105-openhands-sdk-plug-and-play-coding-agents/cover.png"
date: "2025-11-05T14:00:00.000Z"
authors:
  - name: Graham Neubig
    picture: "/assets/blog/authors/graham.png"
ogImage:
  url: "/assets/blog/20251105-openhands-sdk-plug-and-play-coding-agents/cover.png"
---

Today we're introducing the OpenHands SDK, our new open-sourced, MIT licensed tool, that makes it easy to build powerful coding agents that can be spun up in a few lines of code, but customized to fit any developer workflow.

## From "Build With" to "Build On"

More and more, software engineers are turning to AI agents to help with coding tasks, whether through a command line interface like Claude Code or the [OpenHands CLI](https://docs.openhands.dev/openhands/usage/run-openhands/cli-mode), through integrations in IDEs like VS Code or Cursor, or embedded into developer workflows like the [OpenHands GitHub Actions](https://docs.openhands.dev/openhands/usage/cloud/github-installation) or [Slack Integration](https://docs.openhands.dev/openhands/usage/cloud/slack-installation).

At OpenHands, we're calling this the *build with* use case, where a developer builds software *with* the help of AI agents that can understand code, reason about software tasks, and take actions like editing files, running tests, and creating pull requests.
However, more and more it's been clear that for agents that create software, there is a powerful *build on* use case, where developers and organizations want to build *on* top of AI agents by creating their own unique workflows that utilize the power of coding agents.

Some examples where people already are using OpenHands include:

- **Custom debugging agents** that can analyze application logs and suggest fixes
- **Automated code review bots** that can understand the full code context and provide detailed feedback
- **Data ingestion agents** that take in a folder of unstructured data from a user and upload it to a database
- **Security auditing agents** that investigate software for vulnerabilities and create pull requests to fix them

## What is Necessary to Build On?

Based on the lessons that we've learned watching thousands of developers use OpenHands, we realized that to truly enable the *build on* use case, we needed to build a completely new experience for developers building on top of coding agents.

Based on this, we designed and built the OpenHands Software Agent SDK from the ground up with a few things in mind:

1. **Simplicity**: It should be easy to get started with the SDK, with minimal setup and configuration required to get an agent that works seamlessly with many workflows.
2. **Performance**: The SDK should provide production-ready performance out of the box, without requiring extensive prompt engineering or optimization.
3. **Flexibility**: The SDK should be model-agnostic, allowing developers to use any LLM provider they choose, without being locked into a specific vendor.
4. **Customizability**: The SDK should allow developers to easily create custom tools and integrate them into their agents if (and only if) necessary.
5. **Production Readiness**: The SDK should be designed with enterprise needs in mind, including type-safe APIs, error handling, conversation serialization, and logging.
6. **Run Anywhere**: The SDK should be able to run locally on a developers computer, and then with minimal changes be able to spin up thousands of instances on the cloud.

## Hello OpenHands SDK

You only need a few lines of code to get started with the OpenHands SDK.
Here's a simple example that creates an agent with three built-in tools: a bash execution tool, a file editor tool, and a task tracker tool.

```python
import os

from openhands.sdk import LLM, Conversation, Tool, Agent
from openhands.tools.execute_bash import TerminalTool
from openhands.tools.file_editor import FileEditorTool
from openhands.tools.task_tracker import TaskTrackerTool

llm = LLM(
    model="anthropic/claude-sonnet-4-5-20250929",
    api_key=os.getenv("LLM_API_KEY"),
)

agent = Agent(
    llm=llm,
    tools=[
       Tool(name=TerminalTool.name),
       Tool(name=FileEditorTool.name),
       Tool(name=TaskTrackerTool.name),
    ],
)

conversation = Conversation(agent=agent, workspace=os.getcwd())

conversation.send_message("Write 3 facts about the current project into FACTS.txt.")
conversation.run()
```

Despite its simplicity, this agent is essentially the same as the ones we use to get scores near the top of competitive leaderboards like [SWE-Bench Verified](https://www.swebench.com/).

## Customizing Workflows

The SDK provides extensive customization options to tailor agents to your specific needs:

**Custom Tools** ([example](https://github.com/OpenHands/software-agent-sdk/blob/main/examples/01_standalone_sdk/02_custom_tools.py)): Extend agent capabilities with your own tools using standard action/observation patterns:

```python
from openhands.sdk import Action, Observation, ToolDefinition

class GrepAction(Action):
    pattern: str
    path: str = "."

class GrepTool(ToolDefinition[GrepAction, GrepObservation]):
    @classmethod
    def create(cls, conv_state, bash_executor=None):
        # Define your custom tool logic
        return [cls(action_type=GrepAction, ...)]
```

**Skills and Context** ([example](https://github.com/OpenHands/software-agent-sdk/blob/main/examples/01_standalone_sdk/03_activate_skill.py)): Inject domain-specific knowledge that activates based on keywords or conditions:

```python
from openhands.sdk import AgentContext, Skill
from openhands.sdk.context import KeywordTrigger

agent_context = AgentContext(
    skills=[
        Skill(
            name="api-docs",
            content="Follow REST API best practices...",
            trigger=KeywordTrigger(keywords=["api", "endpoint"])
        )
    ]
)
```

**Conversation Persistence** ([example](https://github.com/OpenHands/software-agent-sdk/blob/main/examples/01_standalone_sdk/10_persistence.py)): Save and restore agent conversations for long-running workflows:

```python
conversation = Conversation(
    agent=agent,
    workspace=cwd,
    persistence_dir="./.conversations",
    conversation_id=conversation_id
)
# Later, restore with the same conversation_id
```

**Docker Workspaces** ([example](https://github.com/OpenHands/software-agent-sdk/blob/main/examples/02_remote_agent_server/02_convo_with_docker_sandboxed_server.py)): Run agents in isolated Docker containers for enhanced security and scalability:

```python
from openhands.workspace import DockerWorkspace

with DockerWorkspace(
    base_image="nikolaik/python-nodejs:python3.12-nodejs22",
    host_port=8010,
) as workspace:
    conversation = Conversation(agent=agent, workspace=workspace)
    # Agent runs in isolated Docker environment
```

## Real-World Applications

To demonstrate the versatility of the OpenHands Software Agent SDK, we'd like to highlight three workflows that we created and are using daily in our own processes.

### Automated Debugging of Datadog Issues

We built a GitHub Actions workflow ([code](https://github.com/OpenHands/software-agent-sdk/tree/main/examples/03_github_workflows/04_datadog_debugging)) that automatically debugs production errors from Datadog. The workflow fetches errors based on configurable queries, creates or finds existing GitHub issues to track them, clones relevant repositories for comprehensive analysis, and uses OpenHands agents to identify root causes and post detailed debugging insights as issue comments.

For example, when investigating a `ClientDisconnect` error that occurred over 1,500 times, our agent analyzed the codebase across multiple repositories, identified the exact locations in `github.py` and `gitlab.py` where the error originated, determined the root cause was unhandled client disconnections, and recommended specific error handling improvements—all automatically.

### Automated Code Reviews

With a simple label on any pull request, OpenHands provides comprehensive code reviews ([code](https://github.com/OpenHands/software-agent-sdk/tree/main/examples/03_github_workflows/02_pr_review)) that analyze changes in the full context of the repository. The agent examines code quality, best practices, potential security concerns, and provides both constructive feedback and positive reinforcement for good practices.

The workflow triggers when a `review-this` label is added to a PR, runs the analysis, and posts detailed review comments directly to the pull request—providing teams with an always-available code reviewer that understands your entire codebase.

### Customizable GitHub Workflows

For routine maintenance tasks, we created a flexible GitHub Actions workflow ([code](https://github.com/OpenHands/software-agent-sdk/tree/main/examples/03_github_workflows/01_basic_action)) that can run any custom prompt on a schedule or manual trigger. This enables automated documentation updates, dependency management, and other recurring tasks.

Teams can provide prompts either as direct text or from URLs, making it easy to maintain shared prompt libraries and run consistent maintenance across multiple repositories.


## Get Started Today

The OpenHands Agent SDK is available now on [GitHub](https://github.com/OpenHands/software-agent-sdk). Whether you're building internal developer tools, automating code maintenance, or using software as a tool to achieve other goals, the SDK provides the foundation you need. We also have written an extensive technical report where we do a deep-dive into the technical details behind the SDK and how we built it, which you can find [here](https://arxiv.org/abs/2511.03690).

And if you'd like to join our community on [Slack](https://dub.sh/openhands) we welcome any questions or would like to see people share what they're up to. We're lookig forward to seeing what everyone builds!
