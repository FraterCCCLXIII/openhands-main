# AI-Assisted Frontend Development: How I Used OpenHands to Create a GitHub PR Viewer

*Published on September 16, 2024*

As a seasoned backend and machine learning programmer, I've always found myself in a peculiar situation. While I can architect complex systems and train sophisticated models, there's been a persistent barrier in my professional journey: creating appealing frontends to showcase my work. It's not that I can't do it, but rather that frontend development has never been my strong suit, often leaving my projects without the polished user interfaces they deserve.

That is, until I discovered the power of open-source AI agents, specifically OpenHands. In this blog post, I'll walk you through how I leveraged OpenHands to create a frontend for a GitHub Pull Request viewer, almost entirely automatically. This experience not only resulted in a functional app but also opened my eyes to the potential of AI-assisted development in bridging skill gaps.

## The Challenge: A GitHub PR Viewer

The task at hand was to create a React application that could display all open pull requests across my team's GitHub repositories. As someone more comfortable with backend systems, the prospect of setting up a React app, handling GitHub API interactions, and implementing a user-friendly interface seemed daunting. However, with OpenHands by my side, the process became surprisingly manageable.

## Step 1: Setting the Foundation

I began by providing OpenHands with a detailed prompt, outlining the specific requirements for the app:

```
I want to create a React app to view all of the open pull requests that exist on all of my team's github repos. Here are some details:

1. Please initialize the app using vite and react-ts. You will not be able to interactively enter content, so you can use "yes | npm …" to pipe in confirmations to the npm functions.
2. You can test the app on the https://github.com/OpenDevin/ github org
3. I have provided a github token in the .env file (the variable name is GITHUB_TOKEN)
4. It should have a dropdown that allows me to select a single repo within the org.
5. There should be tests written using vitest. You can add the --run argument to npm test to avoid interactive commands.

When things are working, initialize a github repo, create a .gitignore file, and commit the changes.
```

This prompt was intentionally detailed. While AI agents have come a long way, they can sometimes make suboptimal implementation decisions. By breaking down the requirements, I ensured that OpenHands would choose the right path for our project.

[Insert screenshot of initial app setup here]

## Step 2: Debugging with AI

After the initial setup, I encountered an error when trying to run the app locally. The Chrome developer console revealed:

```
PullRequestViewer.tsx:8
Uncaught ReferenceError: process is not defined
at PullRequestViewer.tsx:8:37
```

I promptly reported this issue back to OpenHands, asking for a fix. This highlights an important aspect of working with AI agents: while they're incredibly capable, they're not infallible. Human oversight and the ability to provide feedback are crucial for successful outcomes.

## Step 3: Enhancing Functionality

With the basic app up and running, I noticed a limitation in the number of pull requests being displayed. It seemed that the viewer was only showing about 10 PRs, likely due to pagination in the GitHub API response. I asked OpenHands to modify the backend to retrieve all pull requests by default, enhancing the app's utility.

[Insert screenshot of app displaying all PRs here]

## Step 4: Adding Dark Mode

To improve the user experience and demonstrate the flexibility of AI-assisted development, I decided to add a dark mode feature. The prompt to OpenHands was straightforward:

```
It'd be nice if this app could also support dark mode, we can add a toggle that can turn on dark mode.

This would require adding a toggle that switches between the different modes to JS, and modifying the css file.
```

OpenHands swiftly implemented the feature, showcasing its ability to handle both functional and aesthetic enhancements.

[Insert screenshot of app in dark mode here]

## Step 5: Open-Sourcing the Project

As a firm believer in the power of open-source software, I wanted to ensure our project was properly licensed. A simple prompt to OpenHands took care of this:

```
We can license this repo under the MIT license.
```

The AI agent added the appropriate license file, completing our journey from concept to a fully functional, open-source GitHub PR viewer.

## Conclusion

This experience with OpenHands has been eye-opening. As a backend developer, I've always seen frontend development as a necessary but challenging aspect of showcasing my work. With AI-assisted development, that barrier has significantly lowered. 

The process wasn't without its hiccups – we encountered errors and limitations that required human intervention. However, the speed at which we moved from a basic concept to a functional, feature-rich application was remarkable.

What's particularly exciting is the potential this holds for developers across all specializations. AI agents like OpenHands can help bridge skill gaps, allowing developers to venture into areas outside their comfort zones with greater confidence.

As we continue to explore the possibilities of AI-assisted development, it's clear that tools like OpenHands are not replacing developers, but rather augmenting our capabilities. They're enabling us to work more efficiently, tackle a broader range of tasks, and ultimately, bring our ideas to life more quickly and effectively than ever before.

The future of software development is collaborative – humans and AI working together to push the boundaries of what's possible. And if my experience with this GitHub PR viewer is any indication, that future is incredibly bright.
