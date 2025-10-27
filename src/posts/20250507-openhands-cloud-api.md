---
title: "Programmatically Access Coding Agents with the OpenHands Cloud API"
excerpt: "The new OpenHands Cloud API allows you to start coding tasks with a single funciton call."
coverImage: "/assets/blog/20250507-openhands-cloud-api/openhands-cloud-api.png"
date: "2025-05-07T09:00:00.000Z"
authors:
  - name: Graham Neubig
    picture: "/assets/blog/authors/graham.jpg"
ogImage:
  url: "/assets/blog/20250507-openhands-cloud-api/openhands-cloud-api.png"
---

Today, we're excited to announce the launch of the **OpenHands Cloud API** – a powerful new way to programmatically interact with AI software development agents. This greatly improves flexibility, making it easy to add OpenHands into your existing development workflows.

## Why a Cloud API?

While our [OpenHands Cloud](https://app.all-hands.dev) web interface provides an excellent experience if you want to manually boot up and interact with agents, we have gotten feedback from many teams and developers that they would like to:

- **Automate repetitive tasks** across multiple repositories
- **Integrate AI capabilities** directly into their CI/CD pipelines
- **Scale their development processes** by running multiple AI-assisted tasks in parallel
- **Build custom tools and interfaces** on top of OpenHands' capabilities

The OpenHands Cloud API addresses these needs by providing a simple, RESTful interface to AI agents.

## Key Features

### Simple REST API

Our API follows RESTful principles, making it easy to integrate with any programming language or framework. With just a few lines of code, you can:

- Start new conversations with specific instructions
- Check the status of ongoing tasks
- Retrieve results and logs

Here is an example from Python:

```python
import requests

api_key = "YOUR_API_KEY"
url = "https://app.all-hands.dev/api/conversations"

headers = {
    "Authorization": f"Bearer {api_key}",
    "Content-Type": "application/json"
}

data = {
    "initial_user_msg": "Check for the authentication module to make sure that it follows the coding best practices for this repo.",
    "repository": "https://github.com/yourusername/your-repo"
}

response = requests.post(url, headers=headers, json=data)
conversation = response.json()

print(f"Conversation Link: https://app.all-hands.dev/conversations/{conversation['conversation_id']}")
```

### Repository Context

Just like our web interface, the API allows you to provide repository context, ensuring that the AI has all the information it needs to complete your tasks effectively. Simply include the repository URL in your request, and OpenHands will automatically clone and analyze the codebase.

### Asynchronous Processing

The API is designed for asynchronous operation, allowing you to kick off long-running tasks without blocking your application. After you start a conversation, you can check the status of a conversation at any time, making it perfect for integration with background jobs and event-driven architectures.

## Use Cases

### 1. Scheduled Maintenance Tasks

Set up scheduled jobs to perform regular maintenance tasks across your repositories, such as updating dependencies, fixing deprecation warnings, or improving test coverage.

```python
# Example scheduled job
def weekly_maintenance():
    repos = get_all_repositories()

    for repo in repos:
        # Start an OpenHands conversation for each repo
        response = requests.post(
            "https://app.all-hands.dev/api/conversations",
            headers={
                "Authorization": f"Bearer {os.environ['OPENHANDS_API_KEY']}",
                "Content-Type": "application/json"
            },
            json={
                "initial_user_msg": (
                  "Update all dependencies to their latest compatible versions and fix "
                  "any deprecation warnings"
                ),
                "repository": repo.url
            }
        )

        # Log the conversation ID for monitoring
        conversation = response.json()
        logger.info(f"Maintenance started for {repo.name}: {conversation['conversation_id']}")
```

### 2. Custom Developer Tools

Build custom developer tools that leverage OpenHands' capabilities, such as IDE plugins, CLI tools, or internal dashboards.
As an example of this, we built a [simple Chrome extension](https://github.com/OpenHands/openhands-chrome-extension) that allows you to add a button to GitHub allowing for one-click start of conversations in OpenHands (using OpenHands, of course!).

![OpenHands Chrome Extension](/assets/blog/20250507-openhands-cloud-api/openhands-chrome-extension.png)

You can see an example of the JS code that powers it at this [link](https://github.com/xingyaoww/openhands-chrome-extension/blob/0c082ce2e7d55c1d7d07a649115e9ba37b178e63/background.js#L18-L78).

### 3. Automated Code Reviews

Integrate OpenHands into your pull request workflow to automatically review code changes. When a new PR is opened, your system can call the API to start a code review conversation, with the results posted back to the PR as comments.

```typescript
// Example webhook handler for new PRs
app.post('/webhook/new-pr', async (req, res) => {
  const { repository, pull_request } = req.body;

  // Start an OpenHands conversation for code review
  const response = await fetch('https://app.all-hands.dev/api/conversations', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENHANDS_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      initial_user_msg: (
        `Review this pull request and provide feedback: ${pull_request.html_url}\n\n`
        `The PR is against the branch: ${pull_request.head.ref}`
      ),
      repository: repository.html_url
    })
  });

  // Store the conversation ID for later status checks
  const { conversation_id } = await response.json();
  saveConversationForPR(pull_request.number, conversation_id);

  res.status(200).send('Code review initiated');
});
```

## Getting Started

To start using the OpenHands Cloud API:

1. Log in to your [OpenHands Cloud](https://app.all-hands.dev) account
2. Navigate to the [Settings page](https://app.all-hands.dev/settings)
3. Generate an API key in the "API Keys" section
4. Use the key in your API requests with the Authorization header

We have a few more details in the [getting started](https://docs.all-hands.dev/modules/usage/cloud/cloud-api) docs.
And for detailed documentation, including all available endpoints and parameters, visit our [API Reference](https://docs.all-hands.dev/swagger-ui/).

## Sign Up Today

If this sound exciting to you, [sign up for OpenHands Cloud](https://app.all-hands.dev) today and start exploring the API.
Of course, the Cloud API is just one of several ways to interact with OpenHands:

- **Web Interface**: The [OpenHands Cloud](https://app.all-hands.dev) web app provides a full-featured interactive experience
- **GitHub Resolver**: Use the [Cloud GitHub Resolver](https://docs.all-hands.dev/modules/usage/cloud/cloud-github-resolver) to integrate OpenHands with your GitHub workflows
- **Run Locally**: As always, OpenHands is [open source](https://github.com/OpenHands/OpenHands) and you can download, run, and modify away!

And as always, if you have any questions or feature requests, come join us on [Slack](https://join.slack.com/t/openhands-ai/shared_invite/zt-2ngejmfw6-9gW4APWOC9XUp1n~SiQ6iw) or [Discord](https://discord.gg/ESHStjSjD4), or open issues on [GitHub](https://github.com/OpenHands/openhands-cloud).
