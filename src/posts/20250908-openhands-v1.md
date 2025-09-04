---
title: "The Path to OpenHands v1"
excerpt: "A look at how we’re stabilizing the OpenHands platform for a v1: a lightweight SDK, a streamlined CLI, and a server architecture built on a synchronous conversation model."
coverImage: "/assets/blog/20250908-openhands-v1/image.png"
date: "2025-09-04T12:00:00.000Z"
authors:
  - name: Robert Brennan
    picture: "/assets/blog/authors/robert.webp"
ogImage:
  url: "/assets/blog/20250908-openhands-v1/image.png"
---

The [OpenHands GitHub repository](https://github.com/All-Hands-AI/OpenHands) has grown organically over the last 18 months. We’re averaging about 60 commits per week (!) with contributions from nearly 400 unique developers.

As you can imagine, the codebase has gotten a bit out of hand.

To start, we’ve got a huge amount of functionality co‑mingled in the same repository. There’s our core agent, two CLIs, a web server, a React frontend, logic for five different runtime providers, and a ton of configuration.

Worse, a lot of this was built on top of an architecture we designed in the first few weeks of OpenHands—before things like tool use and MCP were even invented!

We’re due for a major overhaul. So we’ve sketched out our wish list for a v1, which will create a stable API and give us a sturdy foundation to build on for years to come.

## OpenHands SDK v1

First off, we want a flavor of OpenHands that’s *extremely* light-weight. We’re tracking this in [GitHub](https://github.com/All-Hands-AI/OpenHands/issues/10577).

Our current docker image is close to 10GB, and our CLI takes several minutes to install due to a wild list of transitive dependencies (including a YouTube API client for some reason??)

We’re going to factor out an OpenHands [Agent SDK](https://github.com/All-Hands-AI/agent-sdk)—a tiny library that allows you to run a general‑purpose agent with any set of tools you like. Here’s some sample code:

```python
from openhands.core import (
    LLM,
    CodeActAgent,
    Conversation,
    ConversationEventType,
    Tool,
)

llm = LLM(
    model="anthropic/claude-sonnet-4-20250514",
    api_key=os.getenv("ANTHROPIC_API_KEY"),
)

def hello_tool(name):
  print("hello, " + name)

tools = [
  Tool(
    name="hello",
    description="Says hello",
    callback=hello_tool,
    inputSchema={'type': 'string', 'description': 'name to greet'}
  ),
]

agent = CodeActAgent(llm=llm, tools=tools)

conversation = Conversation(agent=agent)
conversation.send_text("Say hello!")
conversation.run()

print("Conversation finished with status:", conversation.state.status)
```

There are some major changes here!

The biggest change is that conversations run synchronously. Currently we have an architecture where events were passed around via an EventStream—a pub/sub model that allows agents, users, and bash runtimes to communicate with one another safely. But using the EventStream is very confusing, causes all sorts of thread/async issues, and there are few guarantees on the order of messages.

(I take full responsibility for this one—OpenHands went viral while I was on a beach in Aruba. Some design decisions were made with a piña colada in one hand 🫠)

Since conversations can take minutes—even hours—to run, we’ll also provide pathways for folks to run them in threads or using asyncio. This will be important for the webserver.

The SDK will live in its own Python package, alongside some common tools for working with files, running bash commands, and browsing the web.

You can read the [full SDK proposal on GitHub](https://github.com/All-Hands-AI/OpenHands/issues/10577).

## OpenHands CLI v1

The next step will be to migrate our CLI to leverage the new SDK. The CLI will be the first major consumer of the SDK.

This should be fairly straightforward—we’ve already built a terminal interface (TUI), and will just need to migrate it from using our current code architecture to using the SDK.

We’ll ship the CLI so that it runs directly on your workstation—rather than inside a Docker container—by default. This will help us keep the dependencies very minimal. But we’ll also offer a way to run the CLI via Docker, so that you can continue to run OpenHands safely in a sandbox.

![OpenHands CLI](/assets/blog/20250908-openhands-v1/Screenshot_2025-08-28_at_12.00.19_PM.png)

## OpenHands Server v1

OpenHands started as a web application, where you can chat with a coding agent. Much of our codebase is dedicated to a FastAPI backend which manages agents and drives them forward.

The main changes to the backend will be under the hood—we’ll swap out our current `AgentController` for something that uses the new SDK. The end‑user experience—including existing API endpoints—should be unaffected.

![OpenHands v1 overview](/assets/blog/20250908-openhands-v1/image.png)

Separately, we’ve been maintaining a closed‑source extension to OpenHands Server, which we call OpenHands Cloud. This is a variant of OpenHands which adds authentication and scalability for cloud‑based deployments. We’re going to move this code into the open source repo, under a commercial license. Teams will be able to install and try OpenHands Cloud in their own VPC, but will need a commercial license for long‑term use.

## Timeline

Our team is going to start implementing v1 this week.

Things will be a bit sticky while we migrate. We’ll slow down unrelated pull requests in order to keep the code stable, with exceptions for bug fixes and security issues.

The plan is for everything to be finished and in place before the end of September. Engineering estimates are always tricky—especially when you’re rewriting your whole codebase!—but we feel confident that we can move quickly, especially given that we have OpenHands to help us! 🙌
